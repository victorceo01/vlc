import { ScorePillar } from "@stockmc/shared";

/**
 * Transparent, documented normalization for each metric that feeds the Stock
 * Marketcap Score v1. Every metric maps a raw ratio to a 0–100 sub-score using
 * fixed, explainable breakpoints. These breakpoints ARE the method — they are
 * stored with each score for traceability.
 */

export type Direction = "lowerBetter" | "higherBetter";

export interface MetricSpec {
  key: string;
  label: string;
  pillar: ScorePillar;
  direction: Direction;
  /** Value at/beyond which the sub-score is 100 (best). */
  best: number;
  /** Value at/beyond which the sub-score is 0 (worst). */
  worst: number;
  unit: string;
  /** Which DerivedRatios field supplies the raw value. */
  ratioKey:
    | "peRatio"
    | "pbRatio"
    | "netMarginPct"
    | "roePct"
    | "debtToEquity"
    | "currentRatio";
}

export const METRIC_SPECS: MetricSpec[] = [
  // Valuation — cheaper is better.
  {
    key: "pe",
    label: "Price / Earnings",
    pillar: "valuation",
    direction: "lowerBetter",
    best: 6,
    worst: 35,
    unit: "x",
    ratioKey: "peRatio",
  },
  {
    key: "pb",
    label: "Price / Book",
    pillar: "valuation",
    direction: "lowerBetter",
    best: 0.5,
    worst: 5,
    unit: "x",
    ratioKey: "pbRatio",
  },
  // Profitability — higher is better.
  {
    key: "netMargin",
    label: "Net profit margin",
    pillar: "profitability",
    direction: "higherBetter",
    best: 25,
    worst: 0,
    unit: "%",
    ratioKey: "netMarginPct",
  },
  {
    key: "roe",
    label: "Return on equity",
    pillar: "profitability",
    direction: "higherBetter",
    best: 30,
    worst: 0,
    unit: "%",
    ratioKey: "roePct",
  },
  // Financial health.
  {
    key: "debtToEquity",
    label: "Debt / Equity",
    pillar: "financialHealth",
    direction: "lowerBetter",
    best: 0.2,
    worst: 2.5,
    unit: "x",
    ratioKey: "debtToEquity",
  },
  {
    key: "currentRatio",
    label: "Current ratio",
    pillar: "financialHealth",
    direction: "higherBetter",
    best: 2.5,
    worst: 0.8,
    unit: "x",
    ratioKey: "currentRatio",
  },
];

/** Map a raw value to 0–100 using the spec's breakpoints (clamped). */
export function normalizeMetric(spec: MetricSpec, raw: number): number {
  const { best, worst } = spec;
  let pct: number;
  if (spec.direction === "lowerBetter") {
    if (raw <= best) pct = 100;
    else if (raw >= worst) pct = 0;
    else pct = ((worst - raw) / (worst - best)) * 100;
  } else {
    if (raw >= best) pct = 100;
    else if (raw <= worst) pct = 0;
    else pct = ((raw - worst) / (best - worst)) * 100;
  }
  return Math.round(Math.max(0, Math.min(100, pct)) * 10) / 10;
}

/** Human-readable explanation for the "Why this score?" breakdown. */
export function explainMetric(
  spec: MetricSpec,
  raw: number | null,
  normalized: number | null,
): string {
  if (raw === null || normalized === null) {
    return `No data available for ${spec.label.toLowerCase()} — excluded from the score.`;
  }
  const quality =
    normalized >= 75 ? "favourable" : normalized >= 45 ? "moderate" : "weak";
  const dir = spec.direction === "lowerBetter" ? "lower is better" : "higher is better";
  return `${spec.label} of ${raw}${spec.unit} scores ${normalized}/100 (${quality}; ${dir}).`;
}
