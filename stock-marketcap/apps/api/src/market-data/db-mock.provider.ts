import { Injectable } from "@nestjs/common";
import { DataSource, Prisma } from "@prisma/client";
import { PriceChartRange } from "@stockmc/shared";
import { PrismaService } from "../prisma/prisma.service";
import {
  HistoricalPoint,
  MarketBreadth,
  MarketDataProvider,
  QuoteData,
} from "./market-data.types";

/**
 * Reads market data from the seeded mock dataset in Postgres. Everything it
 * returns is labeled source='mock' — it never invents live prices.
 */
@Injectable()
export class DbMockMarketDataProvider implements MarketDataProvider {
  readonly sourceLabel = DataSource.mock;

  constructor(private readonly prisma: PrismaService) {}

  private toQuote(row: {
    symbol: string;
    listedShares: bigint;
    currentPrice: {
      priceNgn: Prisma.Decimal;
      changePct: Prisma.Decimal;
      volume: bigint;
      source: DataSource;
      timestamp: Date;
      lastUpdated: Date;
    } | null;
  }): QuoteData | null {
    if (!row.currentPrice) return null;
    const price = row.currentPrice.priceNgn.toNumber();
    const listedShares = Number(row.listedShares);
    return {
      symbol: row.symbol,
      priceNgn: price,
      changePct: row.currentPrice.changePct.toNumber(),
      volume: Number(row.currentPrice.volume),
      listedShares,
      marketCapNgn: Math.round(price * listedShares),
      source: row.currentPrice.source,
      timestamp: row.currentPrice.timestamp.toISOString(),
      lastUpdated: row.currentPrice.lastUpdated.toISOString(),
    };
  }

  async getQuote(symbol: string): Promise<QuoteData | null> {
    const row = await this.prisma.security.findUnique({
      where: { symbol },
      select: { symbol: true, listedShares: true, currentPrice: true },
    });
    return row ? this.toQuote(row) : null;
  }

  async getQuotes(symbols?: string[]): Promise<QuoteData[]> {
    const rows = await this.prisma.security.findMany({
      where: symbols ? { symbol: { in: symbols } } : undefined,
      select: { symbol: true, listedShares: true, currentPrice: true },
    });
    return rows
      .map((r) => this.toQuote(r))
      .filter((q): q is QuoteData => q !== null);
  }

  private rangeStart(range: PriceChartRange): Date | null {
    const now = new Date();
    switch (range) {
      case PriceChartRange.ONE_DAY:
        return new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // last few sessions
      case PriceChartRange.ONE_MONTH:
        return new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
      case PriceChartRange.ONE_YEAR:
        return new Date(now.getTime() - 366 * 24 * 60 * 60 * 1000);
      case PriceChartRange.MAX:
      default:
        return null;
    }
  }

  async getHistorical(symbol: string, range: PriceChartRange): Promise<HistoricalPoint[]> {
    const security = await this.prisma.security.findUnique({
      where: { symbol },
      select: { id: true },
    });
    if (!security) return [];
    const start = this.rangeStart(range);
    const rows = await this.prisma.historicalPrice.findMany({
      where: {
        securityId: security.id,
        ...(start ? { date: { gte: start } } : {}),
      },
      orderBy: { date: "asc" },
      select: { date: true, closeNgn: true },
    });
    return rows.map((r) => ({ t: r.date.toISOString().slice(0, 10), close: r.closeNgn.toNumber() }));
  }

  async getMarketBreadth(): Promise<MarketBreadth> {
    const quotes = await this.getQuotes();
    let advancers = 0;
    let decliners = 0;
    let unchanged = 0;
    let totalVolume = 0;
    let totalMarketCapNgn = 0;
    let weightedChange = 0;
    let latest = 0;

    for (const q of quotes) {
      if (q.changePct > 0) advancers++;
      else if (q.changePct < 0) decliners++;
      else unchanged++;
      totalVolume += q.volume;
      totalMarketCapNgn += q.marketCapNgn;
      weightedChange += q.changePct * q.marketCapNgn;
      latest = Math.max(latest, new Date(q.timestamp).getTime());
    }

    const allShareIndexChangePct =
      totalMarketCapNgn > 0 ? weightedChange / totalMarketCapNgn : 0;
    // Mock ASI proxy derived transparently from total market cap.
    const allShareIndex = Math.round(totalMarketCapNgn / 1_000_000_000);
    const asOf = latest ? new Date(latest).toISOString() : new Date().toISOString();

    return {
      asOf,
      allShareIndex,
      allShareIndexChangePct: Math.round(allShareIndexChangePct * 100) / 100,
      totalMarketCapNgn,
      totalVolume,
      advancers,
      decliners,
      unchanged,
      source: DataSource.mock,
      timestamp: asOf,
      lastUpdated: new Date().toISOString(),
    };
  }
}
