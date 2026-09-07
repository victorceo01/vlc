"use client";

import { useMemo, useState } from "react";
import type { PaginatedDto, StockSummaryDto } from "@stockmc/shared";
import { useApi } from "@/lib/useApi";
import { StockTable } from "@/components/StockTable";

const SECTORS = [
  "Banking", "Industrial Goods", "Consumer Goods", "Oil & Gas",
  "Telecommunications", "Agriculture", "Conglomerates", "Services",
];

export default function StocksDirectoryPage() {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("");
  const [sortBy, setSortBy] = useState("marketCapNgn");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (sector) p.set("sector", sector);
    p.set("sortBy", sortBy);
    p.set("sortDir", sortDir);
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    return p.toString();
  }, [search, sector, sortBy, sortDir, page]);

  const { data, loading, error } = useApi<PaginatedDto<StockSummaryDto>>(
    `/stocks?${qs}`,
    [qs],
  );

  const onSort = (key: string) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Stock Directory</h1>
        <p className="text-sm text-gray-500">All NGX-listed companies (demo data)</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by symbol or name…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none sm:max-w-xs"
        />
        <select
          value={sector}
          onChange={(e) => { setSector(e.target.value); setPage(1); }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
        >
          <option value="">All sectors</option>
          {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-down">{error}</div>}

      {data && (
        <>
          <StockTable rows={data.data} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {data.total} companies · page {data.page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
