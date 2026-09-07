import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfidenceLevel as PrismaConfidence, Prisma } from "@prisma/client";
import {
  ConfidenceLevel,
  DEFAULT_PILLAR_WEIGHTS,
  SCORE_METHOD_VERSION,
  ScoreMetricResult,
  ScorePillar,
  ScorePillarResult,
  StockScoreBreakdown,
  scoreBand,
} from "@stockmc/shared";
import { PrismaService } from "../prisma/prisma.service";
import { FinancialsService, DerivedRatios } from "../financials/financials.service";
import {
  MARKET_DATA_PROVIDER,
  MarketDataProvider,
} from "../market-data/market-data.types";
import { Inject } from "@nestjs/common";
import { METRIC_SPECS, explainMetric, normalizeMetric } from "./score-metrics";

const PILLAR_LABELS: Record<ScorePillar, string> = {
  valuation: "Valuation",
  profitability: "Profitability",
  financialHealth: "Financial health",
};

@Injectable()
export class ScoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financials: FinancialsService,
    @Inject(MARKET_DATA_PROVIDER)
    private readonly marketData: MarketDataProvider,
  ) {}

  /**
   * Compute the Stock Marketcap Score v1 for a company. Returns a fully
   * traceable breakdown. NEVER fabricates a score: if too many inputs are
   * missing the result is confidence=insufficient with score=null.
   */
  async computeForCompany(companyId: string, symbol: string): Promise<StockScoreBreakdown> {
    const quote = await this.marketData.getQuote(symbol);
    const latest = await this.financials.getLatest(companyId);
    const dps = await this.financials.getLatestDividendPerShare(companyId);
    const ratios: DerivedRatios = this.financials.computeRatios({
      latest,
      priceNgn: quote?.priceNgn ?? null,
      listedShares: quote?.listedShares ?? null,
      latestDividendPerShare: dps,
    });

    // Evaluate each metric.
    const metricResults: ScoreMetricResult[] = METRIC_SPECS.map((spec) => {
      const raw = ratios[spec.ratioKey];
      const normalized = raw !== null ? normalizeMetric(spec, raw) : null;
      return {
        key: spec.key,
        label: spec.label,
        pillar: spec.pillar,
        rawValue: raw,
        unit: spec.unit,
        normalized,
        explanation: explainMetric(spec, raw, normalized),
      };
    });

    const availableCount = metricResults.filter((m) => m.normalized !== null).length;
    const dataCompleteness = availableCount / METRIC_SPECS.length;

    // Build pillars.
    const pillars: ScorePillarResult[] = (
      ["valuation", "profitability", "financialHealth"] as ScorePillar[]
    ).map((pillar) => {
      const metrics = metricResults.filter((m) => m.pillar === pillar);
      const available = metrics.filter((m) => m.normalized !== null);
      const score =
        available.length > 0
          ? Math.round(
              (available.reduce((acc, m) => acc + (m.normalized as number), 0) /
                available.length) *
                10,
            ) / 10
          : null;
      return {
        pillar,
        label: PILLAR_LABELS[pillar],
        weight: DEFAULT_PILLAR_WEIGHTS[pillar],
        score,
        metrics,
      };
    });

    const pillarsWithData = pillars.filter((p) => p.score !== null);

    // Insufficient-data guard: need at least 2 of 3 pillars AND >=40% metrics.
    const insufficient = pillarsWithData.length < 2 || dataCompleteness < 0.4;

    let overall: number | null = null;
    let confidence: ConfidenceLevel;

    if (insufficient) {
      confidence = ConfidenceLevel.INSUFFICIENT;
    } else {
      // Re-weight across pillars that actually have data.
      const totalWeight = pillarsWithData.reduce((acc, p) => acc + p.weight, 0);
      overall =
        Math.round(
          (pillarsWithData.reduce((acc, p) => acc + (p.score as number) * p.weight, 0) /
            totalWeight) *
            10,
        ) / 10;
      confidence =
        dataCompleteness >= 0.8
          ? ConfidenceLevel.HIGH
          : dataCompleteness >= 0.6
            ? ConfidenceLevel.MEDIUM
            : ConfidenceLevel.LOW;
    }

    const summary = insufficient
      ? "Insufficient data to produce a Stock Marketcap Score for this company."
      : `${scoreBand(overall)}. Score ${overall}/100 based on ${availableCount} of ${METRIC_SPECS.length} metrics (${Math.round(dataCompleteness * 100)}% data completeness).`;

    return {
      methodVersion: SCORE_METHOD_VERSION,
      score: overall,
      confidence,
      dataCompleteness: Math.round(dataCompleteness * 10000) / 10000,
      pillars,
      summary,
      computedAt: new Date().toISOString(),
    };
  }

  private toPrismaConfidence(c: ConfidenceLevel): PrismaConfidence {
    return c as unknown as PrismaConfidence;
  }

  /** Compute and persist the score for one company. */
  async recomputeForSymbol(symbol: string): Promise<StockScoreBreakdown> {
    const security = await this.prisma.security.findUnique({
      where: { symbol: symbol.toUpperCase() },
      select: { companyId: true, symbol: true },
    });
    if (!security) throw new NotFoundException(`Unknown symbol ${symbol}`);
    const breakdown = await this.computeForCompany(security.companyId, security.symbol);
    await this.persist(security.companyId, breakdown);
    return breakdown;
  }

  private async persist(companyId: string, breakdown: StockScoreBreakdown) {
    await this.prisma.stockScore.upsert({
      where: {
        companyId_methodVersion: {
          companyId,
          methodVersion: breakdown.methodVersion,
        },
      },
      create: {
        companyId,
        methodVersion: breakdown.methodVersion,
        score: breakdown.score,
        confidence: this.toPrismaConfidence(breakdown.confidence),
        dataCompleteness: breakdown.dataCompleteness,
        breakdown: breakdown as unknown as Prisma.InputJsonValue,
      },
      update: {
        score: breakdown.score,
        confidence: this.toPrismaConfidence(breakdown.confidence),
        dataCompleteness: breakdown.dataCompleteness,
        breakdown: breakdown as unknown as Prisma.InputJsonValue,
        computedAt: new Date(),
      },
    });
  }

  /** Recompute scores for every company. Returns a small summary. */
  async recomputeAll(): Promise<{ computed: number; insufficient: number }> {
    const securities = await this.prisma.security.findMany({
      select: { companyId: true, symbol: true },
    });
    let insufficient = 0;
    for (const s of securities) {
      const breakdown = await this.computeForCompany(s.companyId, s.symbol);
      if (breakdown.confidence === ConfidenceLevel.INSUFFICIENT) insufficient++;
      await this.persist(s.companyId, breakdown);
    }
    return { computed: securities.length, insufficient };
  }

  async getForSymbol(symbol: string, includeBreakdown: boolean) {
    const security = await this.prisma.security.findUnique({
      where: { symbol: symbol.toUpperCase() },
      select: { companyId: true },
    });
    if (!security) throw new NotFoundException(`Unknown symbol ${symbol}`);
    const row = await this.prisma.stockScore.findFirst({
      where: { companyId: security.companyId },
      orderBy: { computedAt: "desc" },
    });
    if (!row) return { symbol: symbol.toUpperCase(), score: null, confidence: "insufficient", breakdown: null };
    const breakdown = row.breakdown as unknown as StockScoreBreakdown;
    return {
      symbol: symbol.toUpperCase(),
      score: row.score ? (row.score as Prisma.Decimal).toNumber() : null,
      confidence: row.confidence,
      methodVersion: row.methodVersion,
      computedAt: row.computedAt.toISOString(),
      // Full breakdown is a gated entitlement; summary always available.
      summary: breakdown?.summary,
      breakdown: includeBreakdown ? breakdown : null,
    };
  }
}
