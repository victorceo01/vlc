import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { SubscriptionTier, TokenType, User } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { AuthUserDto } from "@stockmc/shared";
import { PrismaService } from "../prisma/prisma.service";
import { EntitlementsService } from "../entitlements/entitlements.service";
import { MailService } from "./mail.service";
import { JwtPayload } from "./strategies/jwt.strategy";

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30d
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TTL_MS = 60 * 60 * 1000; // 1h

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly entitlements: EntitlementsService,
  ) {}

  private sha256(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }

  private randomToken(): string {
    return randomBytes(32).toString("hex");
  }

  async register(email: string, password: string, displayName?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException("An account with this email already exists");
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: displayName ?? null,
        subscription: { create: { tier: SubscriptionTier.FREE, provider: "stub" } },
      },
    });
    await this.issueVerificationToken(user.id, user.email);
    return user;
  }

  private async issueVerificationToken(userId: string, email: string) {
    const token = this.randomToken();
    await this.prisma.authToken.create({
      data: {
        userId,
        type: TokenType.email_verification,
        tokenHash: this.sha256(token),
        expiresAt: new Date(Date.now() + VERIFY_TTL_MS),
      },
    });
    this.mail.sendVerificationEmail(email, token);
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Do not reveal whether the account exists.
    if (!user || user.emailVerified) return;
    await this.issueVerificationToken(user.id, user.email);
  }

  async verifyEmail(token: string): Promise<void> {
    const tokenHash = this.sha256(token);
    const record = await this.prisma.authToken.findUnique({ where: { tokenHash } });
    if (
      !record ||
      record.type !== TokenType.email_verification ||
      record.usedAt ||
      record.expiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException("Invalid or expired verification token");
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      }),
      this.prisma.authToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
  }

  async validateCredentials(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid email or password");
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid email or password");
    return user;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // don't reveal account existence
    const token = this.randomToken();
    await this.prisma.authToken.create({
      data: {
        userId: user.id,
        type: TokenType.password_reset,
        tokenHash: this.sha256(token),
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      },
    });
    this.mail.sendPasswordResetEmail(user.email, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = this.sha256(token);
    const record = await this.prisma.authToken.findUnique({ where: { tokenHash } });
    if (
      !record ||
      record.type !== TokenType.password_reset ||
      record.usedAt ||
      record.expiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException("Invalid or expired reset token");
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.authToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all refresh tokens on password reset.
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  /** Find-or-create a user from a verified Google profile. */
  async upsertGoogleUser(params: {
    googleId: string;
    email: string;
    displayName?: string;
  }): Promise<User> {
    const byGoogle = await this.prisma.user.findUnique({
      where: { googleId: params.googleId },
    });
    if (byGoogle) return byGoogle;

    const byEmail = await this.prisma.user.findUnique({
      where: { email: params.email },
    });
    if (byEmail) {
      return this.prisma.user.update({
        where: { id: byEmail.id },
        data: { googleId: params.googleId, emailVerified: true },
      });
    }
    return this.prisma.user.create({
      data: {
        email: params.email,
        googleId: params.googleId,
        displayName: params.displayName ?? null,
        emailVerified: true,
        subscription: { create: { tier: SubscriptionTier.FREE, provider: "stub" } },
      },
    });
  }

  async issueTokens(user: User): Promise<IssuedTokens> {
    const tier = await this.entitlements.getUserTier(user.id);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      tier,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret-change-me",
      expiresIn: process.env.JWT_ACCESS_TTL ?? "900s",
    });

    const refreshToken = this.randomToken();
    const refreshExpiresAt = new Date(Date.now() + REFRESH_TTL_MS);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.sha256(refreshToken),
        expiresAt: refreshExpiresAt,
      },
    });
    return { accessToken, refreshToken, refreshExpiresAt };
  }

  /** Rotate a refresh token: verify, revoke old, issue new pair. */
  async rotateRefreshToken(oldToken: string): Promise<IssuedTokens> {
    const tokenHash = this.sha256(oldToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!record || record.revokedAt || record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException("Invalid session");
    }
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(record.user);
  }

  async revokeRefreshToken(token: string): Promise<void> {
    if (!token) return;
    const tokenHash = this.sha256(token);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getProfile(userId: string): Promise<AuthUserDto> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const tier = await this.entitlements.getUserTier(userId);
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      tier: tier as unknown as AuthUserDto["tier"],
      isAdmin: user.isAdmin,
    };
  }
}
