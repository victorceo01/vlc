import { ConfidenceLevel } from "./enums";

/**
 * Stock Marketcap Score v1.
 *
 * A single transparent 0–100 score built from three weighted pillars. Every
 * score is traceable: we store the method version, the raw inputs used, each
 * metric's normalized contribution, and a confidence flag. If required inputs
 * are missing we return `insufficient` — we NEVER fabricate a score.
 */
export const SCORE_METHOD_VERSION = "v1.0.0";

export type ScorePillar = "valuation" | "profitability" | "financialHealth";

/** Default pillar weights (must sum to 1). Configurable via plan/settings later. */
export const DEFAULT_PILLAR_WEIGHTS: Record<ScorePillar, number> = {
  valuation: 0.4,
  profitability: 0.3,
  financialHealth: 0.3,
};

/** Individual metric that feeds a pillar. */
export interface ScoreMetricInput {
  key: string;
  label: string;
  pillar: ScorePillar;
  /** Raw value pulled from financials (e.g. P/E = 8.2). Null if unavailable. */
  rawValue: number | null;
  /** Unit / short explanation shown in the "Why this score?" breakdown. */
  unit?: string;
}

export interface ScoreMetricResult extends ScoreMetricInput {
  /** 0–100 normalized sub-score for this metric, or null if input missing. */
  normalized: number | null;
  /** Plain-language reason shown to the user. */
  explanation: string;
}

export interface ScorePillarResult {
  pillar: ScorePillar;
  label: string;
  weight: number;
  /** 0–100 pillar score (weighted mean of its available metrics), null if none. */
  score: number | null;
  metrics: ScoreMetricResult[];
}

export interface StockScoreBreakdown {
  methodVersion: string;
  /** 0–100 overall, or null when confidence is INSUFFICIENT. */
  score: number | null;
  confidence: ConfidenceLevel;
  /** Fraction (0–1) of required metrics that had usable inputs. */
  dataCompleteness: number;
  pillars: ScorePillarResult[];
  /** Human-readable summary — uses neutral, non-advisory language. */
  summary: string;
  computedAt: string;
}

/**
 * The band label for a score. Deliberately non-advisory: no buy/sell language.
 */
export function scoreBand(score: number | null): string {
  if (score === null) return "Insufficient data";
  if (score >= 75) return "Strong fundamentals (selected metrics)";
  if (score >= 55) return "Solid fundamentals (selected metrics)";
  if (score >= 40) return "Mixed fundamentals (selected metrics)";
  return "Weak fundamentals (selected metrics)";
}
