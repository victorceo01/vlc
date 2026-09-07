import { SubscriptionTier } from "./enums";

/**
 * Entitlements describe what a tier is allowed to do. These are DEFAULTS only.
 * The authoritative, runtime values live in the `plan_settings` DB table so
 * pricing/limits are configurable without a code deploy. Entitlement checks
 * MUST be enforced server-side — never trust the frontend.
 */
export interface TierEntitlements {
  /** Max watchlists a user can own. */
  maxWatchlists: number;
  /** Max stocks per watchlist. */
  maxWatchlistItems: number;
  /** Can the user see the full "Why this score?" metric breakdown? */
  scoreBreakdown: boolean;
  /** Screener filter fields available to this tier. */
  screenerFilters: ScreenerFilterField[];
  /** Max results returned by the screener. */
  screenerMaxResults: number;
}

export type ScreenerFilterField =
  | "priceRange"
  | "marketCapBand"
  | "sector"
  | "peRange"
  | "dividendYield";

export const ALL_SCREENER_FILTERS: ScreenerFilterField[] = [
  "priceRange",
  "marketCapBand",
  "sector",
  "peRange",
  "dividendYield",
];

/** Fallback defaults if the plan_settings table has no row for a tier. */
export const DEFAULT_ENTITLEMENTS: Record<SubscriptionTier, TierEntitlements> = {
  [SubscriptionTier.FREE]: {
    maxWatchlists: 1,
    maxWatchlistItems: 10,
    scoreBreakdown: false,
    screenerFilters: ["priceRange", "sector"],
    screenerMaxResults: 25,
  },
  [SubscriptionTier.PRO]: {
    maxWatchlists: 25,
    maxWatchlistItems: 200,
    scoreBreakdown: true,
    screenerFilters: ALL_SCREENER_FILTERS,
    screenerMaxResults: 500,
  },
};

/** Market-cap bands (in NGN) used by the screener. */
export interface MarketCapBand {
  key: string;
  label: string;
  minNgn: number;
  maxNgn: number | null;
}

export const MARKET_CAP_BANDS: MarketCapBand[] = [
  { key: "mega", label: "Mega (₦1T+)", minNgn: 1_000_000_000_000, maxNgn: null },
  { key: "large", label: "Large (₦200B–₦1T)", minNgn: 200_000_000_000, maxNgn: 1_000_000_000_000 },
  { key: "mid", label: "Mid (₦50B–₦200B)", minNgn: 50_000_000_000, maxNgn: 200_000_000_000 },
  { key: "small", label: "Small (< ₦50B)", minNgn: 0, maxNgn: 50_000_000_000 },
];
