"use client";

import Link from "next/link";
import type { MarketOverviewDto } from "@stockmc/shared";
import { useApi } from "@/lib/useApi";
import { changeColor, compactNumber, formatNumber, formatPct } from "@/lib/format";
import { Provenance } from "@/components/Provenance";

interface Mover {
  symbol: string;
  name: string;
  sector: string;
  priceNgn: number;
  changePct: number;
  volume: number;
}
interface MoversResponse {
  gainers: Mover[];
  losers: Mover[];
  mostActive: Mover[];
  source: string;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-bold sm:text-2xl">{value}</div>
      {sub && <div className="mt-0.5 text-sm">{sub}</div>}
    </div>
  );
}

function MoverList({ title, rows, metric }: { title: string; rows: Mover[]; metric: "change" | "volume" }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-2.5 font-semibold">{title}</div>
      <ul className="divide-y divide-gray-100">
        {rows.map((r) => (
          <li key={r.symbol}>
            <Link href={`/stocks/${r.symbol}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50">
              <div className="min-w-0">
                <div className="font-medium text-brand">{r.symbol}</div>
                <div className="truncate text-xs text-gray-400">{r.name}</div>
              </div>
              <div className="text-right tabular-nums">
                <div>{formatNumber(r.priceNgn)}</div>
                {metric === "change" ? (
                  <div className={`text-xs ${changeColor(r.changePct)}`}>{formatPct(r.changePct)}</div>
                ) : (
                  <div className="text-xs text-gray-500">{compactNumber(r.volume)} vol</div>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DashboardPage() {
  const overview = useApi<MarketOverviewDto>("/market/overview");
  const movers = useApi<MoversResponse>("/market/movers?limit=5");

  const o = overview.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Market Dashboard</h1>
        <p className="text-sm text-gray-500">Nigerian Exchange (NGX) — demo data</p>
      </div>

      {overview.loading && <div className="text-sm text-gray-500">Loading market data…</div>}
      {overview.error && <div className="text-sm text-down">{overview.error}</div>}

      {o && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              label="NGX All-Share Index"
              value={formatNumber(o.allShareIndex, 0)}
              sub={<span className={changeColor(o.allShareIndexChangePct)}>{formatPct(o.allShareIndexChangePct)}</span>}
            />
            <StatCard label="Total Market Cap" value={`₦${compactNumber(o.totalMarketCapNgn)}`} />
            <StatCard label="Volume Traded" value={compactNumber(o.totalVolume)} />
            <StatCard
              label="Breadth"
              value={`${o.advancers} ▲ / ${o.decliners} ▼`}
              sub={<span className="text-gray-500">{o.unchanged} unchanged</span>}
            />
          </div>
          <Provenance source={o.provenance.source} timestamp={o.provenance.timestamp} lastUpdated={o.provenance.lastUpdated} />
        </>
      )}

      {movers.data && (
        <div className="grid gap-4 md:grid-cols-3">
          <MoverList title="Top Gainers" rows={movers.data.gainers} metric="change" />
          <MoverList title="Top Losers" rows={movers.data.losers} metric="change" />
          <MoverList title="Most Active" rows={movers.data.mostActive} metric="volume" />
        </div>
      )}

      <div className="rounded-lg bg-brand/5 p-4 text-sm">
        <Link href="/stocks" className="font-semibold text-brand hover:underline">
          Browse all listed companies →
        </Link>
      </div>
    </div>
  );
}
