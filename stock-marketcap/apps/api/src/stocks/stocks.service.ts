import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  DataSource,
  PaginatedDto,
  PriceChartRange,
  StockDetailDto,
  StockSummaryDto,
  StockScoreBreakdown,
} from "@stockmc/shared";
import { PrismaService } from "../prisma/prisma.service";
import { FinancialsService } from "../financials/financials.service";
import {
  MARKET_DATA_PROVIDER,
  MarketDataProvider,
  QuoteData,
} from "../market-data/market-data.types";

export interface StockListQuery {
  search?: string;
  sector?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

const SORTABLE = new Set([
  "symbol",
  "name",
  "priceNgn",
  "changePct",
  "marketCapNgn",
  "peRatio",
  "dividendYieldPct",
  "score",
]);

@Injectable()
export class StocksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financials: FinancialsService,
    @Inject(MARKET_DATA_PROVIDER)
    private readonly marketData: MarketDataProvider,
  ) {}

  /** Build a summary for one company/security using quote + ratios + score. */
  private async buildSummary(company: {
    id: string;
    name: string;
    sector: string;
    securities: { symbol: string; listedShares: bigint }[];
  }): Promise<StockSummaryDto | null> {
    const security = company.securities[0];
    if (!security) return null;
    const quote = await this.marketData.getQuote(security.symbol);
    if (!quote) return null;

    const latest = await this.financials.getLatest(company.id);
    const dps = await this.financials.getLatestDividendPerShare(company.id);
    const ratios = this.financials.computeRatios({
      latest,
      priceNgn: quote.priceNgn,
      listedShares: quote.listedShares,
      latestDividendPerShare: dps,
    });
    const score = await this.getLatestScore(company.id);

    return {
      symbol: quote.symbol,
      name: company.name,
      sector: company.sector,
      priceNgn: quote.priceNgn,
      changePct: quote.changePct,
      marketCapNgn: quote.marketCapNgn,
      peRatio: ratios.peRatio,
      eps: ratios.eps,
      dividendYieldPct: ratios.dividendYieldPct,
      score: score?.score ?? null,
      provenance: {
        source: quote.source as unknown as DataSource,
        timestamp: quote.timestamp,
        lastUpdated: quote.lastUpdated,
      },
    };
  }

  private async getLatestScore(
    companyId: string,
  ): Promise<{ score: number | null; breakdown: StockScoreBreakdown } | null> {
    const row = await this.prisma.stockScore.findFirst({
      where: { companyId },
      orderBy: { computedAt: "desc" },
    });
    if (!row) return null;
    return {
      score: row.score ? (row.score as Prisma.Decimal).toNumber() : null,
      breakdown: row.breakdown as unknown as StockScoreBreakdown,
    };
  }

  /** Build summaries for all (or a filtered set of) companies. */
  async getAllSummaries(where: Prisma.CompanyWhereInput = {}): Promise<StockSummaryDto[]> {
    const companies = await this.prisma.company.findMany({
      where,
      include: { securities: { select: { symbol: true, listedShares: true } } },
    });
    return (await Promise.all(companies.map((c) => this.buildSummary(c)))).filter(
      (s): s is StockSummaryDto => s !== null,
    );
  }

  async list(query: StockListQuery): Promise<PaginatedDto<StockSummaryDto>> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));

    const where: Prisma.CompanyWhereInput = {};
    if (query.sector) where.sector = query.sector;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { securities: { some: { symbol: { contains: query.search, mode: "insensitive" } } } },
      ];
    }

    let summaries = await this.getAllSummaries(where);

    // Sorting (in-memory: derived fields like ratios/score aren't columns).
    const sortBy = SORTABLE.has(query.sortBy ?? "") ? (query.sortBy as keyof StockSummaryDto) : "marketCapNgn";
    const dir = query.sortDir === "asc" ? 1 : -1;
    summaries.sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

    const total = summaries.length;
    const start = (page - 1) * pageSize;
    return {
      data: summaries.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    };
  }

  async getBySymbol(symbol: string, includeScoreBreakdown: boolean): Promise<StockDetailDto> {
    const security = await this.prisma.security.findUnique({
      where: { symbol: symbol.toUpperCase() },
      include: { company: true },
    });
    if (!security) throw new NotFoundException(`Unknown symbol ${symbol}`);

    const summary = await this.buildSummary({
      id: security.company.id,
      name: security.company.name,
      sector: security.company.sector,
      securities: [{ symbol: security.symbol, listedShares: security.listedShares }],
    });
    if (!summary) throw new NotFoundException(`No price data for ${symbol}`);

    const score = await this.getLatestScore(security.company.id);

    return {
      ...summary,
      description: security.company.description,
      ceo: security.company.ceo ?? undefined,
      headquarters: security.company.headquarters ?? undefined,
      website: security.company.website ?? undefined,
      listedShares: Number(security.listedShares),
      scoreBreakdown: includeScoreBreakdown ? score?.breakdown ?? null : undefined,
    };
  }

  async getChart(symbol: string, range: PriceChartRange) {
    const points = await this.marketData.getHistorical(symbol.toUpperCase(), range);
    if (points.length === 0) {
      // Distinguish unknown symbol from empty range.
      const exists = await this.prisma.security.findUnique({
        where: { symbol: symbol.toUpperCase() },
        select: { id: true },
      });
      if (!exists) throw new NotFoundException(`Unknown symbol ${symbol}`);
    }
    return { symbol: symbol.toUpperCase(), range, source: "mock", points };
  }

  async getFinancials(symbol: string) {
    const security = await this.prisma.security.findUnique({
      where: { symbol: symbol.toUpperCase() },
      select: { companyId: true },
    });
    if (!security) throw new NotFoundException(`Unknown symbol ${symbol}`);
    const series = await this.financials.getAnnualSeries(security.companyId);
    return { symbol: symbol.toUpperCase(), period: "annual", source: "mock", years: series };
  }
}
