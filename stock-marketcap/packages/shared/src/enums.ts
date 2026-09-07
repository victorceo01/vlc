/** Subscription tiers. Premium deferred to a later phase. */
export enum SubscriptionTier {
  FREE = "FREE",
  PRO = "PRO",
}

/** Where a data record came from. `MOCK` is the only source used in the MVP. */
export enum DataSource {
  MOCK = "mock",
  LIVE = "live",
  MANUAL = "manual",
}

/** NGX sectors (a pragmatic subset used for the MVP directory/screener). */
export enum Sector {
  BANKING = "Banking",
  INDUSTRIAL_GOODS = "Industrial Goods",
  CONSUMER_GOODS = "Consumer Goods",
  OIL_AND_GAS = "Oil & Gas",
  TELECOMS = "Telecommunications",
  AGRICULTURE = "Agriculture",
  HEALTHCARE = "Healthcare",
  INSURANCE = "Insurance",
  ICT = "ICT",
  CONGLOMERATES = "Conglomerates",
  SERVICES = "Services",
}

export enum FinancialStatementType {
  INCOME_STATEMENT = "income_statement",
  BALANCE_SHEET = "balance_sheet",
  CASH_FLOW = "cash_flow",
}

export enum FinancialPeriod {
  ANNUAL = "annual",
  // QUARTERLY reserved for a later phase; MVP is annual only.
}

/** Data-quality flag attached to derived metrics such as the Stock Marketcap Score. */
export enum ConfidenceLevel {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  INSUFFICIENT = "insufficient",
}

export enum PriceChartRange {
  ONE_DAY = "1D",
  ONE_MONTH = "1M",
  ONE_YEAR = "1Y",
  MAX = "MAX",
}

export const NGX_CURRENCY = "NGN" as const;
