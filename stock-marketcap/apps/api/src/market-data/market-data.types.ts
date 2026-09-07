import { DataSource } from "@prisma/client";
import { PriceChartRange } from "@stockmc/shared";

export const MARKET_DATA_PROVIDER = "MARKET_DATA_PROVIDER";

export interface QuoteData {
  symbol: string;
  priceNgn: number;
  changePct: number;
  volume: number;
  marketCapNgn: number;
  listedShares: number;
  source: DataSource;
  timestamp: string;
  lastUpdated: string;
}

export interface MarketBreadth {
  asOf: string;
  allShareIndex: number;
  allShareIndexChangePct: number;
  totalMarketCapNgn: number;
  totalVolume: number;
  advancers: number;
  decliners: number;
  unchanged: number;
  source: DataSource;
  timestamp: string;
  lastUpdated: string;
}

export interface HistoricalPoint {
  t: string;
  close: number;
}

/**
 * Abstraction over a market-data source. The MVP ships ONE implementation
 * (DbMockMarketDataProvider) that reads a clearly-labeled mock dataset. A real
 * live provider can be added later behind this same interface.
 */
export interface MarketDataProvider {
  /** The provenance label for data returned by this provider. */
  readonly sourceLabel: DataSource;
  getQuote(symbol: string): Promise<QuoteData | null>;
  /** All quotes, or a subset if symbols provided. */
  getQuotes(symbols?: string[]): Promise<QuoteData[]>;
  getHistorical(symbol: string, range: PriceChartRange): Promise<HistoricalPoint[]>;
  getMarketBreadth(): Promise<MarketBreadth>;
}
