import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { SubscriptionTier } from "@prisma/client";
import { Request } from "express";
import { AuthenticatedUser } from "../../common/decorators/current-user.decorator";

export const ACCESS_COOKIE = "sm_access";
export const REFRESH_COOKIE = "sm_refresh";

export interface JwtPayload {
  sub: string;
  email: string;
  isAdmin: boolean;
  tier: SubscriptionTier;
}

function cookieExtractor(req: Request): string | null {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  return cookies?.[ACCESS_COOKIE] ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret-change-me",
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (!payload?.sub) throw new UnauthorizedException();
    return {
      id: payload.sub,
      email: payload.email,
      isAdmin: payload.isAdmin,
      tier: payload.tier,
    };
  }
}
