"use client";

import Link from "next/link";
import type { StockSummaryDto } from "@stockmc/shared";
import { changeColor, compactNumber, formatNumber, formatPct } from "@/lib/format";
import { ScoreBadge } from "./ScoreBadge";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

const COLUMNS: Column[] = [
  { key: "symbol", label: "Symbol", sortable: true },
  { key: "priceNgn", label: "Price (₦)", sortable: true },
  { key: "changePct", label: "Change", sortable: true },
  { key: "marketCapNgn", label: "Mkt Cap", sortable: true },
  { key: "peRatio", label: "P/E", sortable: true },
  { key: "eps", label: "EPS", sortable: false },
  { key: "dividendYieldPct", label: "Div Yield", sortable: true },
  { key: "score", label: "Score", sortable: true },
];

export function StockTable({
  rows,
  sortBy,
  sortDir,
  onSort,
}: {
  rows: StockSummaryDto[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
}) {
  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.key} className="px-3 py-2 whitespace-nowrap">
                  {c.sortable && onSort ? (
                    <button
                      onClick={() => onSort(c.key)}
                      className="inline-flex items-center gap-1 hover:text-gray-900"
                    >
                      {c.label}
                      {sortBy === c.key && <span>{sortDir === "asc" ? "▲" : "▼"}</span>}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.symbol} className="hover:bg-gray-50">
                <td className="px-3 py-2">
                  <Link href={`/stocks/${r.symbol}`} className="font-semibold text-brand hover:underline">
                    {r.symbol}
                  </Link>
                  <div className="text-xs text-gray-400 max-w-[180px] truncate">{r.name}</div>
                </td>
                <td className="px-3 py-2 tabular-nums">{formatNumber(r.priceNgn)}</td>
                <td className={`px-3 py-2 tabular-nums ${changeColor(r.changePct)}`}>{formatPct(r.changePct)}</td>
                <td className="px-3 py-2 tabular-nums">₦{compactNumber(r.marketCapNgn)}</td>
                <td className="px-3 py-2 tabular-nums">{formatNumber(r.peRatio)}</td>
                <td className="px-3 py-2 tabular-nums">{formatNumber(r.eps)}</td>
                <td className="px-3 py-2 tabular-nums">{formatPct(r.dividendYieldPct)}</td>
                <td className="px-3 py-2"><ScoreBadge score={r.score} size="sm" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {rows.map((r) => (
          <Link
            key={r.symbol}
            href={`/stocks/${r.symbol}`}
            className="block rounded-lg border border-gray-200 bg-white p-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-brand">{r.symbol}</div>
                <div className="text-xs text-gray-400 max-w-[200px] truncate">{r.name}</div>
              </div>
              <ScoreBadge score={r.score} size="sm" />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Price</span>
                <span className="tabular-nums">{formatNumber(r.priceNgn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Change</span>
                <span className={`tabular-nums ${changeColor(r.changePct)}`}>{formatPct(r.changePct)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Mkt Cap</span>
                <span className="tabular-nums">₦{compactNumber(r.marketCapNgn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">P/E</span>
                <span className="tabular-nums">{formatNumber(r.peRatio)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Div Yield</span>
                <span className="tabular-nums">{formatPct(r.dividendYieldPct)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {rows.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          No stocks match your filters.
        </div>
      )}
    </>
  );
}
