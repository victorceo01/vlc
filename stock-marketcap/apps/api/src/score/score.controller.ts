import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { SubscriptionTier } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import {
  AuthenticatedUser,
  CurrentUser,
} from "../common/decorators/current-user.decorator";
import { EntitlementsService } from "../entitlements/entitlements.service";
import { ScoreService } from "./score.service";

@Controller()
export class ScoreController {
  constructor(
    private readonly score: ScoreService,
    private readonly entitlements: EntitlementsService,
  ) {}

  // The overall score + confidence + summary are visible to everyone; the full
  // "Why this score?" breakdown is gated (server-side) by tier entitlement.
  @Get("stocks/:symbol/score")
  @UseGuards(OptionalJwtAuthGuard)
  async getScore(
    @Param("symbol") symbol: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ) {
    const tier = (user?.tier ?? SubscriptionTier.FREE) as unknown as SubscriptionTier;
    const ent = await this.entitlements.getEntitlements(tier);
    return this.score.getForSymbol(symbol, ent.scoreBreakdown);
  }

  // Admin: recompute a single score on demand.
  @Post("admin/scores/:symbol/recompute")
  @UseGuards(JwtAuthGuard, AdminGuard)
  recomputeOne(@Param("symbol") symbol: string) {
    return this.score.recomputeForSymbol(symbol);
  }

  // Admin: recompute all scores.
  @Post("admin/scores/recompute")
  @UseGuards(JwtAuthGuard, AdminGuard)
  recomputeAll() {
    return this.score.recomputeAll();
  }
}
