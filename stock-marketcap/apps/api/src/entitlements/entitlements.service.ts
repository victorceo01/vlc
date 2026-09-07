import { Injectable } from "@nestjs/common";
import { SubscriptionTier } from "@prisma/client";
import {
  DEFAULT_ENTITLEMENTS,
  TierEntitlements,
  SubscriptionTier as SharedTier,
} from "@stockmc/shared";
import { PrismaService } from "../prisma/prisma.service";
import { CacheService } from "../common/cache/cache.service";

/**
 * Central authority for what a tier may do. Values come from the configurable
 * `plan_settings` table (falling back to shared defaults). ALL entitlement
 * checks in the app must go through this service — never trust the client.
 */
@Injectable()
export class EntitlementsService {
  private static CACHE_KEY = (t: string) => `entitlements:${t}`;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async getEntitlements(tier: SubscriptionTier): Promise<TierEntitlements> {
    const cached = await this.cache.get<TierEntitlements>(
      EntitlementsService.CACHE_KEY(tier),
    );
    if (cached) return cached;

    const plan = await this.prisma.planSetting.findUnique({ where: { tier } });
    const fallback = DEFAULT_ENTITLEMENTS[tier as unknown as SharedTier];
    const entitlements =
      (plan?.entitlements as TierEntitlements | undefined) ?? fallback;

    await this.cache.set(EntitlementsService.CACHE_KEY(tier), entitlements, 120);
    return entitlements;
  }

  /** Invalidate cache after an admin edits plan settings. */
  async invalidate(): Promise<void> {
    await this.cache.del("entitlements:*");
  }

  async getUserTier(userId: string): Promise<SubscriptionTier> {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { tier: true, currentPeriodEnd: true },
    });
    if (!sub) return SubscriptionTier.FREE;
    // Expired paid period falls back to FREE.
    if (
      sub.tier !== SubscriptionTier.FREE &&
      sub.currentPeriodEnd &&
      sub.currentPeriodEnd.getTime() < Date.now()
    ) {
      return SubscriptionTier.FREE;
    }
    return sub.tier;
  }
}
