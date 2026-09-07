import { DataSource, Sector, SubscriptionTier } from "./enums";
import { StockScoreBreakdown } from "./score";

/** Every price-bearing record carries provenance. */
export interface Provenance {
  source: DataSource;
  timestamp: string; // when the observation is for
  lastUpdated: string; // when our record was last written
}

export interface MarketOverviewDto {
  asOf: string;
  allShareIndex: number;
  allShareIndexChangePct: number;
  totalMarketCapNgn: number;
  totalVolume: number;
  advancers: number;
  decliners: number;
  unchanged: number;
  provenance: Provenance;
}

export interface StockSummaryDto {
  symbol: string;
  name: string;
  sector: Sector | string;
  priceNgn: number;
  changePct: number;
  marketCapNgn: number;
  peRatio: number | null;
  eps: number | null;
  dividendYieldPct: number | null;
  score: number | null;
  provenance: Provenance;
}

export interface StockDetailDto extends StockSummaryDto {
  description: string;
  ceo?: string;
  headquarters?: string;
  website?: string;
  listedShares: number;
  scoreBreakdown?: StockScoreBreakdown | null;
}

export interface PricePointDto {
  t: string; // ISO date/time
  close: number;
}

export interface AuthUserDto {
  id: string;
  email: string;
  displayName: string | null;
  emailVerified: boolean;
  tier: SubscriptionTier;
  isAdmin: boolean;
}

export interface PaginatedDto<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ScreenerQueryDto {
  minPrice?: number;
  maxPrice?: number;
  marketCapBand?: string;
  sector?: string;
  minPe?: number;
  maxPe?: number;
  minDividendYield?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}
