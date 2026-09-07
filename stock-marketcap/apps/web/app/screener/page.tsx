"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { StockSummaryDto } from "@stockmc/shared";
import { useApi } from "@/lib/useApi";
import { StockTable } from "@/components/StockTable";

interface MarketCapBand { key: string; label: string }
interface ScreenerOptions { marketCapBands: MarketCapBand[] }
interface ScreenerResult {
  total: number;
  returned: number;
  maxResults: number;
  truncatedByPlan: boolean;
  availableFilters: string[];
  ignoredFilters: string[];
  data: StockSummaryDto[];
}

const SECTORS = ["Banking", "Industrial Goods", "Consumer Goods", "Oil & Gas", "Telecommunications", "Agriculture", "Conglomerates", "Services"];

export default function ScreenerPage() {
  const options = useApi<ScreenerOptions>("/screener/options");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [band, setBand] = useState("");
  const [sector, setSector] = useState("");
  const [minPe, setMinPe] = useState("");
  const [maxPe, setMaxPe] = useState("");
  const [minDiv, setMinDiv] = useState("");
  const [applied, setApplied] = useState(0);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (minPrice) p.set("minPrice", minPrice);
    if (maxPrice) p.set("maxPrice", maxPrice);
    if (band) p.set("marketCapBand", band);
    if (sector) p.set("sector", sector);
    if (minPe) p.set("minPe", minPe);
    if (maxPe) p.set("maxPe", maxPe);
    if (minDiv) p.set("minDividendYield", minDiv);
    return p.toString();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  const { data, loading } = useApi<ScreenerResult>(`/screener?${qs}`, [applied]);

  const allowed = (f: string) => !data || data.availableFilters.includes(f);

  const field = (label: string, filterKey: string, node: React.ReactNode) => (
    <div>
      <label className="block text-xs font-medium text-gray-500">
        {label}
        {!allowed(filterKey) && <span className="ml-1 text-amber-600">(Pro)</span>}
      </label>
      {node}
    </div>
  );

  const inputCls = "mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand focus:outline-none disabled:bg-gray-100 disabled:text-gray-400";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Stock Screener</h1>
        <p className="text-sm text-gray-500">Filter NGX companies by fundamentals (demo data)</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {field("Min price (₦)", "priceRange",
            <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} disabled={!allowed("priceRange")} className={inputCls} />)}
          {field("Max price (₦)", "priceRange",
            <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} disabled={!allowed("priceRange")} className={inputCls} />)}
          {field("Market cap band", "marketCapBand",
            <select value={band} onChange={(e) => setBand(e.target.value)} disabled={!allowed("marketCapBand")} className={inputCls}>
              <option value="">Any</option>
              {options.data?.marketCapBands.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
            </select>)}
          {field("Sector", "sector",
            <select value={sector} onChange={(e) => setSector(e.target.value)} disabled={!allowed("sector")} className={inputCls}>
              <option value="">Any</option>
              {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>)}
          {field("Min P/E", "peRange",
            <input type="number" value={minPe} onChange={(e) => setMinPe(e.target.value)} disabled={!allowed("peRange")} className={inputCls} />)}
          {field("Max P/E", "peRange",
            <input type="number" value={maxPe} onChange={(e) => setMaxPe(e.target.value)} disabled={!allowed("peRange")} className={inputCls} />)}
          {field("Min div yield (%)", "dividendYield",
            <input type="number" value={minDiv} onChange={(e) => setMinDiv(e.target.value)} disabled={!allowed("dividendYield")} className={inputCls} />)}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={() => setApplied((a) => a + 1)} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            Apply filters
          </button>
          <Link href="/pricing" className="text-xs text-gray-500 hover:text-brand">
            Some filters are Pro-only — upgrade for full screening →
          </Link>
        </div>
      </div>

      {data && data.ignoredFilters.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Your plan ignored these filters: {data.ignoredFilters.join(", ")}.{" "}
          <Link href="/pricing" className="font-semibold underline">Upgrade to Pro</Link> to use them.
        </div>
      )}
      {data && data.truncatedByPlan && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Showing {data.returned} of {data.total} matches (plan limit {data.maxResults}).
        </div>
      )}

      {loading ? <div className="text-sm text-gray-500">Screening…</div> : data && (
        <>
          <p className="text-sm text-gray-500">{data.total} matches</p>
          <StockTable rows={data.data} />
        </>
      )}
    </div>
  );
}
