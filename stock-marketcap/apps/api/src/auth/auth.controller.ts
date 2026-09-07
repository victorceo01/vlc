import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request, Response } from "express";
import { User } from "@prisma/client";
import { AuthService, IssuedTokens } from "./auth.service";
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from "./dto/auth.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser, AuthenticatedUser } from "../common/decorators/current-user.decorator";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
} from "./strategies/jwt.strategy";
import { isGoogleConfigured } from "./strategies/google.strategy";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private isProd = process.env.NODE_ENV === "production";
  private webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";

  private setAuthCookies(res: Response, tokens: IssuedTokens): void {
    const common = {
      httpOnly: true,
      secure: this.isProd,
      sameSite: "lax" as const,
      path: "/",
    };
    res.cookie(ACCESS_COOKIE, tokens.accessToken, {
      ...common,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...common,
      expires: tokens.refreshExpiresAt,
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_COOKIE, { path: "/" });
    res.clearCookie(REFRESH_COOKIE, { path: "/" });
  }

  @Post("register")
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.register(dto.email, dto.password, dto.displayName);
    const tokens = await this.auth.issueTokens(user);
    this.setAuthCookies(res, tokens);
    return this.auth.getProfile(user.id);
  }

  @Post("login")
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.validateCredentials(dto.email, dto.password);
    const tokens = await this.auth.issueTokens(user);
    this.setAuthCookies(res, tokens);
    return this.auth.getProfile(user.id);
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) throw new UnauthorizedException("No session");
    const tokens = await this.auth.rotateRefreshToken(token);
    this.setAuthCookies(res, tokens);
    return { ok: true };
  }

  @Post("logout")
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) await this.auth.revokeRefreshToken(token);
    this.clearAuthCookies(res);
    return { ok: true };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.getProfile(user.id);
  }

  @Post("verify-email")
  @HttpCode(200)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.auth.verifyEmail(dto.token);
    return { ok: true };
  }

  @Post("resend-verification")
  @HttpCode(200)
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.auth.resendVerification(dto.email);
    return { ok: true };
  }

  @Post("forgot-password")
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto.email);
    return { ok: true };
  }

  @Post("reset-password")
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto.token, dto.password);
    return { ok: true };
  }

  @Get("google/status")
  googleStatus() {
    return { enabled: isGoogleConfigured() };
  }

  @Get("google")
  @UseGuards(AuthGuard("google"))
  googleStart() {
    // Passport redirects to Google. Body never reached.
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as User;
    const tokens = await this.auth.issueTokens(user);
    this.setAuthCookies(res, tokens);
    res.redirect(`${this.webOrigin}/dashboard`);
  }
}
