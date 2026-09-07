import { Injectable } from "@nestjs/common";
import { SubscriptionTier } from "@prisma/client";
import {
  MARKET_CAP_BANDS,
  ScreenerFilterField,
  ScreenerQueryDto,
  StockSummaryDto,
} from "@stockmc/shared";
import { StocksService } from "../stocks/stocks.service";
import { EntitlementsService } from "../entitlements/entitlements.service";

@Injectable()
export class ScreenerService {
  constructor(
    private readonly stocks: StocksService,
    private readonly entitlements: EntitlementsService,
  ) {}

  async screen(query: ScreenerQueryDto, tier: SubscriptionTier) {
    const ent = await this.entitlements.getEntitlements(tier);
    const allowed = new Set<ScreenerFilterField>(ent.screenerFilters);

    // Track which requested filters the plan does NOT permit — enforced server-side.
    const ignoredFilters: ScreenerFilterField[] = [];
    const wants = (field: ScreenerFilterField, provided: boolean) => {
      if (!provided) return false;
      if (allowed.has(field)) return true;
      ignoredFilters.push(field);
      return false;
    };

    const usePrice = wants(
      "priceRange",
      query.minPrice !== undefined || query.maxPrice !== undefined,
    );
    const useCap = wants("marketCapBand", query.marketCapBand !== undefined);
    const useSector = wants("sector", query.sector !== undefined);
    const usePe = wants("peRange", query.minPe !== undefined || query.maxPe !== undefined);
    const useDiv = wants("dividendYield", query.minDividendYield !== undefined);

    let rows: StockSummaryDto[] = await this.stocks.getAllSummaries();

    if (usePrice) {
      rows = rows.filter(
        (r) =>
          (query.minPrice === undefined || r.priceNgn >= query.minPrice) &&
          (query.maxPrice === undefined || r.priceNgn <= query.maxPrice),
      );
    }
    if (useCap) {
      const band = MARKET_CAP_BANDS.find((b) => b.key === query.marketCapBand);
      if (band) {
        rows = rows.filter(
          (r) =>
            r.marketCapNgn >= band.minNgn &&
            (band.maxNgn === null || r.marketCapNgn < band.maxNgn),
        );
      }
    }
    if (useSector && query.sector) {
      rows = rows.filter((r) => r.sector === query.sector);
    }
    if (usePe) {
      rows = rows.filter(
        (r) =>
          r.peRatio !== null &&
          (query.minPe === undefined || r.peRatio >= query.minPe) &&
          (query.maxPe === undefined || r.peRatio <= query.maxPe),
      );
    }
    if (useDiv && query.minDividendYield !== undefined) {
      rows = rows.filter(
        (r) => r.dividendYieldPct !== null && r.dividendYieldPct >= query.minDividendYield!,
      );
    }

    // Sorting
    const sortBy = (query.sortBy ?? "marketCapNgn") as keyof StockSummaryDto;
    const dir = query.sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

    const total = rows.length;
    // Server-side cap by tier.
    const capped = rows.slice(0, ent.screenerMaxResults);

    return {
      total,
      returned: capped.length,
      maxResults: ent.screenerMaxResults,
      truncatedByPlan: total > ent.screenerMaxResults,
      availableFilters: ent.screenerFilters,
      ignoredFilters,
      data: capped,
    };
  }
}
