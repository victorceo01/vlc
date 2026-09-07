"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useAuth } from "@/lib/auth";
import { changeColor, compactNumber, formatNumber, formatPct } from "@/lib/format";

interface WlItem {
  symbol: string; name: string; sector: string;
  priceNgn: number | null; changePct: number | null; marketCapNgn: number | null; source: string;
}
interface Wl { id: string; name: string; items: WlItem[] }
interface WlResponse { limits: { maxWatchlists: number; maxWatchlistItems: number }; watchlists: Wl[] }

export default function WatchlistPage() {
  const { user, loading: authLoading } = useAuth();
  const { data, loading, reload } = useApi<WlResponse>(user ? "/watchlists" : null, [user?.id]);
  const [newName, setNewName] = useState("");
  const [symbolInputs, setSymbolInputs] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");

  if (authLoading) return <div className="text-sm text-gray-500">Loading…</div>;
  if (!user) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">Log in to create and manage watchlists.</p>
        <Link href="/login" className="mt-2 inline-block font-semibold text-brand hover:underline">Log in →</Link>
      </div>
    );
  }

  const run = async (fn: () => Promise<unknown>) => {
    setErr("");
    try { await fn(); await reload(); }
    catch (e) { setErr(e instanceof ApiError ? e.message : "Something went wrong"); }
  };

  const atListLimit = data ? data.watchlists.length >= data.limits.maxWatchlists : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Watchlists</h1>
          <p className="text-sm text-gray-500">
            {data && `${data.watchlists.length}/${data.limits.maxWatchlists} lists · up to ${data.limits.maxWatchlistItems} stocks each`}
          </p>
        </div>
      </div>

      {err && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-down">{err}</div>}

      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New watchlist name"
          className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
        <button
          disabled={!newName || atListLimit}
          onClick={() => run(async () => { await api.post("/watchlists", { name: newName }); setNewName(""); })}
          className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          Create
        </button>
      </div>
      {atListLimit && (
        <p className="text-xs text-amber-700">
          Plan limit reached. <Link href="/pricing" className="underline">Upgrade to Pro</Link> for more watchlists.
        </p>
      )}

      {loading && <div className="text-sm text-gray-500">Loading…</div>}

      {data?.watchlists.map((wl) => (
        <div key={wl.id} className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
            <span className="font-semibold">{wl.name}</span>
            <button onClick={() => run(() => api.del(`/watchlists/${wl.id}`))} className="text-xs text-gray-400 hover:text-down">
              Delete list
            </button>
          </div>

          <div className="flex gap-2 px-4 py-2">
            <input
              value={symbolInputs[wl.id] ?? ""}
              onChange={(e) => setSymbolInputs((s) => ({ ...s, [wl.id]: e.target.value.toUpperCase() }))}
              placeholder="Add symbol e.g. DANGCEM"
              className="w-full max-w-xs rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand focus:outline-none"
            />
            <button
              onClick={() => run(async () => {
                await api.post(`/watchlists/${wl.id}/items`, { symbol: symbolInputs[wl.id] });
                setSymbolInputs((s) => ({ ...s, [wl.id]: "" }));
              })}
              className="rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand/5"
            >
              Add
            </button>
          </div>

          {wl.items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">No stocks yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Symbol</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Change</th>
                    <th className="px-3 py-2 text-right">Mkt Cap</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {wl.items.map((it) => (
                    <tr key={it.symbol}>
                      <td className="px-3 py-2">
                        <Link href={`/stocks/${it.symbol}`} className="font-medium text-brand hover:underline">{it.symbol}</Link>
                        <div className="text-xs text-gray-400">{it.name}</div>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatNumber(it.priceNgn)}</td>
                      <td className={`px-3 py-2 text-right tabular-nums ${changeColor(it.changePct)}`}>{formatPct(it.changePct)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">₦{compactNumber(it.marketCapNgn ?? 0)}</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => run(() => api.del(`/watchlists/${wl.id}/items/${it.symbol}`))} className="text-xs text-gray-400 hover:text-down">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
