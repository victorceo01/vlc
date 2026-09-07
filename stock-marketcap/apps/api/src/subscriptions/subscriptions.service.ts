import { Injectable } from "@nestjs/common";
import { Prisma, SubscriptionTier } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { EntitlementsService } from "../entitlements/entitlements.service";

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
  ) {}

  async getPlans() {
    const plans = await this.prisma.planSetting.findMany({ orderBy: { priceMonthlyNgn: "asc" } });
    return plans.map((p) => ({
      tier: p.tier,
      displayName: p.displayName,
      priceMonthlyNgn: (p.priceMonthlyNgn as Prisma.Decimal).toNumber(),
      priceYearlyNgn: (p.priceYearlyNgn as Prisma.Decimal).toNumber(),
      entitlements: p.entitlements,
    }));
  }

  async getMine(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    const tier = await this.entitlements.getUserTier(userId);
    const ent = await this.entitlements.getEntitlements(tier);
    return {
      tier,
      provider: sub?.provider ?? "stub",
      currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
      entitlements: ent,
    };
  }

  /**
   * FAKE upgrade toggle for testing — no real billing in the MVP. Flips the
   * user's tier and sets a 30-day period. Real Paystack billing is deferred.
   */
  async setTier(userId: string, tier: SubscriptionTier) {
    const currentPeriodEnd =
      tier === SubscriptionTier.FREE
        ? null
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.prisma.subscription.upsert({
      where: { userId },
      create: { userId, tier, provider: "stub", currentPeriodEnd },
      update: { tier, currentPeriodEnd },
    });
    return this.getMine(userId);
  }
}
