import { Inject, Injectable } from "@nestjs/common";
import { DataSource, MarketOverviewDto } from "@stockmc/shared";
import { PrismaService } from "../prisma/prisma.service";
import { CacheService } from "../common/cache/cache.service";
import {
  MARKET_DATA_PROVIDER,
  MarketDataProvider,
} from "../market-data/market-data.types";

export interface MoverDto {
  symbol: string;
  name: string;
  sector: string;
  priceNgn: number;
  changePct: number;
  volume: number;
}

@Injectable()
export class MarketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    @Inject(MARKET_DATA_PROVIDER)
    private readonly marketData: MarketDataProvider,
  ) {}

  async getOverview(): Promise<MarketOverviewDto> {
    const cached = await this.cache.get<MarketOverviewDto>("market:overview");
    if (cached) return cached;

    const breadth = await this.marketData.getMarketBreadth();
    const dto: MarketOverviewDto = {
      asOf: breadth.asOf,
      allShareIndex: breadth.allShareIndex,
      allShareIndexChangePct: breadth.allShareIndexChangePct,
      totalMarketCapNgn: breadth.totalMarketCapNgn,
      totalVolume: breadth.totalVolume,
      advancers: breadth.advancers,
      decliners: breadth.decliners,
      unchanged: breadth.unchanged,
      provenance: {
        source: breadth.source as unknown as DataSource,
        timestamp: breadth.timestamp,
        lastUpdated: breadth.lastUpdated,
      },
    };
    await this.cache.set("market:overview", dto, 30);
    return dto;
  }

  async getMovers(limit = 5): Promise<{
    gainers: MoverDto[];
    losers: MoverDto[];
    mostActive: MoverDto[];
    source: string;
  }> {
    const quotes = await this.marketData.getQuotes();
    const companies = await this.prisma.security.findMany({
      select: { symbol: true, company: { select: { name: true, sector: true } } },
    });
    const meta = new Map(
      companies.map((c) => [c.symbol, { name: c.company.name, sector: c.company.sector }]),
    );

    const movers: MoverDto[] = quotes.map((q) => ({
      symbol: q.symbol,
      name: meta.get(q.symbol)?.name ?? q.symbol,
      sector: meta.get(q.symbol)?.sector ?? "",
      priceNgn: q.priceNgn,
      changePct: q.changePct,
      volume: q.volume,
    }));

    const gainers = [...movers].sort((a, b) => b.changePct - a.changePct).slice(0, limit);
    const losers = [...movers].sort((a, b) => a.changePct - b.changePct).slice(0, limit);
    const mostActive = [...movers].sort((a, b) => b.volume - a.volume).slice(0, limit);

    return { gainers, losers, mostActive, source: "mock" };
  }
}
