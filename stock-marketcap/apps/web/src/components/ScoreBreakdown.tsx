import Link from "next/link";
import type { StockScoreBreakdown } from "@stockmc/shared";
import { ScoreBadge } from "./ScoreBadge";

function Bar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-gray-400">no data</span>;
  const color = value >= 75 ? "bg-green-500" : value >= 45 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="h-2 w-full rounded bg-gray-100">
      <div className={`h-2 rounded ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export function ScoreBreakdown({
  score,
  confidence,
  summary,
  breakdown,
  gated,
}: {
  score: number | null;
  confidence?: string;
  summary?: string;
  breakdown: StockScoreBreakdown | null;
  gated?: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Stock Marketcap Score</h2>
        <ScoreBadge score={score} confidence={confidence} size="md" />
      </div>

      {summary && <p className="mt-2 text-sm text-gray-600">{summary}</p>}

      {confidence && confidence !== "insufficient" && (
        <div className="mt-2 text-xs text-gray-500">
          Confidence: <span className="font-medium capitalize">{confidence}</span>
          {breakdown && <> · {Math.round(breakdown.dataCompleteness * 100)}% data completeness</>}
          {" · "}method {breakdown?.methodVersion ?? "v1"}
        </div>
      )}

      {/* Full breakdown (Pro entitlement) */}
      {breakdown ? (
        <div className="mt-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Why this score?</h3>
          {breakdown.pillars.map((p) => (
            <div key={p.pillar} className="rounded-md border border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {p.label}{" "}
                  <span className="text-xs text-gray-400">(weight {Math.round(p.weight * 100)}%)</span>
                </span>
                <span className="text-sm font-semibold">{p.score ?? "—"}</span>
              </div>
              <div className="mt-2 space-y-2">
                {p.metrics.map((m) => (
                  <div key={m.key}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">
                        {m.label}
                        {m.rawValue !== null && (
                          <span className="ml-1 text-gray-400">
                            ({m.rawValue}
                            {m.unit})
                          </span>
                        )}
                      </span>
                      <span className="tabular-nums text-gray-500">{m.normalized ?? "—"}</span>
                    </div>
                    <Bar value={m.normalized} />
                    <p className="mt-0.5 text-[11px] text-gray-400">{m.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-[11px] text-gray-400">
            Scores reflect selected fundamental metrics only and are not buy/sell
            recommendations.
          </p>
        </div>
      ) : gated && score !== null ? (
        <div className="mt-4 rounded-md border border-dashed border-brand/40 bg-brand/5 p-4 text-sm">
          <p className="font-medium text-brand">See the full “Why this score?” breakdown</p>
          <p className="mt-1 text-gray-600">
            The per-metric breakdown (valuation, profitability, financial health) is a
            Pro feature.
          </p>
          <Link href="/pricing" className="mt-2 inline-block font-semibold text-brand hover:underline">
            Upgrade to Pro →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
