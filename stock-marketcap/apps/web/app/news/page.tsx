"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApi } from "@/lib/useApi";
import { formatDate } from "@/lib/format";

interface Article {
  id: string;
  title: string;
  summary: string;
  sourceName: string;
  publishedAt: string;
  source: string;
  tickers: string[];
}
interface NewsResponse { data: Article[]; total: number }

const SECTORS = ["Banking", "Industrial Goods", "Consumer Goods", "Oil & Gas", "Telecommunications", "Agriculture", "Conglomerates"];

export default function NewsPage() {
  const [sector, setSector] = useState("");
  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (sector) p.set("sector", sector);
    p.set("pageSize", "50");
    return p.toString();
  }, [sector]);
  const { data, loading } = useApi<NewsResponse>(`/news?${qs}`, [qs]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">News</h1>
        <p className="text-sm text-gray-500">Company &amp; sector headlines (demo/seed articles)</p>
      </div>

      <select value={sector} onChange={(e) => setSector(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none">
        <option value="">All sectors</option>
        {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      {loading && <div className="text-sm text-gray-500">Loading…</div>}

      <div className="space-y-3">
        {data?.data.map((a) => (
          <article key={a.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{a.sourceName}</span>·<span>{formatDate(a.publishedAt)}</span>
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">mock</span>
            </div>
            <h2 className="mt-1 font-semibold">{a.title}</h2>
            <p className="mt-1 text-sm text-gray-600">{a.summary}</p>
            {a.tickers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {a.tickers.map((t) => (
                  <Link key={t} href={`/stocks/${t}`} className="rounded bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand hover:bg-brand/20">
                    {t}
                  </Link>
                ))}
              </div>
            )}
          </article>
        ))}
        {data && data.data.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            No articles for this filter.
          </div>
        )}
      </div>
    </div>
  );
}
