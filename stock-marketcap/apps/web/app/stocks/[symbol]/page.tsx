"use client";

import { use, useState } from "react";
import Link from "next/link";
import type { StockDetailDto, StockScoreBreakdown } from "@stockmc/shared";
import { useApi } from "@/lib/useApi";
import { changeColor, compactNumber, formatNumber, formatPct } from "@/lib/format";
import { PriceChart } from "@/components/PriceChart";
import { FinancialsTabs } from "@/components/FinancialsTabs";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { AddToWatchlist } from "@/components/AddToWatchlist";
import { Provenance } from "@/components/Provenance";

const RANGES = ["1D", "1M", "1Y", "MAX"] as const;

interface ChartResponse { points: { t: string; close: number }[]; source: string }
interface FinancialsResponse { years: Parameters<typeof FinancialsTabs>[0]["years"] }
interface ScoreResponse {
  score: number | null;
  confidence?: string;
  summary?: string;
  breakdown: StockScoreBreakdown | null;
}
interface DividendsResponse {
  dividends: { fiscalYear: number; amountPerShareNgn: number; type: string; declaredDate: string | null; exDate: string | null; paymentDate: string | null }[];
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
      <div className={`font-semibold tabular-nums ${className ?? ""}`}>{value}</div>
    </div>
  );
}

export default function StockDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = use(params);
  const sym = symbol.toUpperCase();
  const [range, setRange] = useState<(typeof RANGES)[number]>("1Y");

  const detail = useApi<StockDetailDto>(`/stocks/${sym}`, [sym]);
  const chart = useApi<ChartResponse>(`/stocks/${sym}/chart?range=${range}`, [sym, range]);
  const fin = useApi<FinancialsResponse>(`/stocks/${sym}/financials`, [sym]);
  const score = useApi<ScoreResponse>(`/stocks/${sym}/score`, [sym]);
  const divs = useApi<DividendsResponse>(`/dividends/${sym}`, [sym]);

  const d = detail.data;

  if (detail.error) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-down">{detail.error}</p>
        <Link href="/stocks" className="mt-2 inline-block text-brand hover:underline">← Back to directory</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/stocks" className="text-sm text-gray-500 hover:text-gray-800">← Directory</Link>

      {d && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{d.symbol}</h1>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{d.sector}</span>
            </div>
            <p className="text-gray-500">{d.name}</p>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl font-bold tabular-nums">{formatNumber(d.priceNgn)}</span>
              <span className="text-sm text-gray-400">₦</span>
              <span className={`text-lg font-medium ${changeColor(d.changePct)}`}>{formatPct(d.changePct)}</span>
            </div>
            <Provenance source={d.provenance.source} timestamp={d.provenance.timestamp} lastUpdated={d.provenance.lastUpdated} />
          </div>
          <AddToWatchlist symbol={sym} />
        </div>
      )}

      {d && (
        <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-3 md:grid-cols-6">
          <Stat label="Mkt Cap" value={`₦${compactNumber(d.marketCapNgn)}`} />
          <Stat label="P/E" value={formatNumber(d.peRatio)} />
          <Stat label="EPS (₦)" value={formatNumber(d.eps)} />
          <Stat label="Div Yield" value={formatPct(d.dividendYieldPct)} />
          <Stat label="Shares" value={compactNumber(d.listedShares)} />
          <Stat label="Score" value={d.score !== null ? String(d.score) : "—"} />
        </div>
      )}

      {/* Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Price history</h2>
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded px-2.5 py-1 text-xs font-medium ${
                  range === r ? "bg-brand text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        {chart.loading ? (
          <div className="flex h-56 items-center justify-center text-sm text-gray-400">Loading…</div>
        ) : (
          <PriceChart points={chart.data?.points ?? []} />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Company profile */}
          {d && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-2 font-semibold">Company profile</h2>
              <p className="text-sm text-gray-600">{d.description}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {d.ceo && (<><dt className="text-gray-400">CEO</dt><dd>{d.ceo}</dd></>)}
                {d.headquarters && (<><dt className="text-gray-400">HQ</dt><dd>{d.headquarters}</dd></>)}
                {d.website && (
                  <>
                    <dt className="text-gray-400">Website</dt>
                    <dd><a href={d.website} target="_blank" rel="noreferrer" className="text-brand hover:underline">{d.website}</a></dd>
                  </>
                )}
              </dl>
            </div>
          )}

          {/* Financials */}
          {fin.data && <FinancialsTabs years={fin.data.years} />}

          {/* Dividends */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-4 py-2.5 font-semibold">Dividend history</div>
            {divs.data && divs.data.dividends.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2 text-left">FY</th>
                      <th className="px-3 py-2 text-right">Per share (₦)</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Ex-date</th>
                      <th className="px-3 py-2 text-left">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {divs.data.dividends.map((dv, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">{dv.fiscalYear}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatNumber(dv.amountPerShareNgn)}</td>
                        <td className="px-3 py-2 capitalize">{dv.type}</td>
                        <td className="px-3 py-2">{dv.exDate ?? "—"}</td>
                        <td className="px-3 py-2">{dv.paymentDate ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-gray-400">No declared dividends on record.</p>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="lg:col-span-1">
          {score.data && (
            <ScoreBreakdown
              score={score.data.score}
              confidence={score.data.confidence}
              summary={score.data.summary}
              breakdown={score.data.breakdown}
              gated={score.data.breakdown === null}
            />
          )}
        </div>
      </div>
    </div>
  );
}
