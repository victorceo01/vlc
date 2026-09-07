"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useAuth } from "@/lib/auth";
import { formatNumber } from "@/lib/format";

interface AdminUser { id: string; email: string; tier: string; isAdmin: boolean; emailVerified: boolean; createdAt: string }
interface AdminCompany { id: string; name: string; sector: string; symbol: string | null; priceNgn: number | null; source: string | null }

export default function AdminPage() {
  const { user, loading } = useAuth();
  const users = useApi<AdminUser[]>(user?.isAdmin ? "/admin/users" : null, [user?.id]);
  const companies = useApi<AdminCompany[]>(user?.isAdmin ? "/admin/companies" : null, [user?.id]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>;
  if (!user?.isAdmin) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">Admin access required.</p>
        <Link href="/" className="mt-2 inline-block text-brand hover:underline">← Home</Link>
      </div>
    );
  }

  const savePrice = async (symbol: string) => {
    const v = parseFloat(prices[symbol]);
    if (Number.isNaN(v)) return;
    setMsg("");
    try {
      await api.put(`/admin/securities/${symbol}/price`, { priceNgn: v });
      setMsg(`Updated ${symbol} price (stored as source=mock).`);
      await companies.reload();
    } catch (e) { setMsg(e instanceof ApiError ? e.message : "Failed"); }
  };

  const recompute = async () => {
    setBusy(true); setMsg("");
    try {
      const r = await api.post<{ computed: number; insufficient: number }>("/admin/scores/recompute");
      setMsg(`Recomputed ${r.computed} scores (${r.insufficient} insufficient data).`);
    } catch (e) { setMsg(e instanceof ApiError ? e.message : "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin</h1>
        <button onClick={recompute} disabled={busy} className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
          {busy ? "Recomputing…" : "Recompute all scores"}
        </button>
      </div>

      {msg && <div className="rounded-md border border-brand/30 bg-brand/5 p-3 text-sm text-brand">{msg}</div>}

      <section className="space-y-2">
        <h2 className="font-semibold">Companies &amp; mock prices</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Symbol</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Sector</th>
                <th className="px-3 py-2 text-right">Price (₦)</th>
                <th className="px-3 py-2">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {companies.data?.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2 font-medium text-brand">{c.symbol}</td>
                  <td className="px-3 py-2">{c.name}</td>
                  <td className="px-3 py-2 text-gray-500">{c.sector}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNumber(c.priceNgn)}</td>
                  <td className="px-3 py-2">
                    {c.symbol && (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          placeholder="new"
                          value={prices[c.symbol] ?? ""}
                          onChange={(e) => setPrices((p) => ({ ...p, [c.symbol as string]: e.target.value }))}
                          className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                        <button onClick={() => savePrice(c.symbol as string)} className="rounded bg-gray-800 px-2 py-1 text-xs text-white hover:bg-black">
                          Save
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400">Admin-entered prices are still stored with source=&apos;mock&apos; in the MVP.</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Users ({users.data?.length ?? 0})</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Tier</th>
                <th className="px-3 py-2 text-left">Verified</th>
                <th className="px-3 py-2 text-left">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.data?.map((u) => (
                <tr key={u.id}>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.tier}</td>
                  <td className="px-3 py-2">{u.emailVerified ? "✓" : "—"}</td>
                  <td className="px-3 py-2">{u.isAdmin ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
