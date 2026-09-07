"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useAuth } from "@/lib/auth";
import { formatNaira } from "@/lib/format";

interface Entitlements {
  maxWatchlists: number;
  maxWatchlistItems: number;
  scoreBreakdown: boolean;
  screenerFilters: string[];
  screenerMaxResults: number;
}
interface Plan {
  tier: "FREE" | "PRO";
  displayName: string;
  priceMonthlyNgn: number;
  priceYearlyNgn: number;
  entitlements: Entitlements;
}

export default function PricingPage() {
  const { user, refresh } = useAuth();
  const { data: plans } = useApi<Plan[]>("/subscriptions/plans");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const change = async (tier: "FREE" | "PRO") => {
    setBusy(tier); setMsg("");
    try {
      await api.post("/subscriptions/change", { tier });
      // Rotate the session so the JWT carries the new tier immediately.
      await api.post("/auth/refresh");
      await refresh();
      setMsg(`You are now on the ${tier} plan (demo toggle — no real billing).`);
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Could not change plan");
    } finally { setBusy(""); }
  };

  const feature = (label: string, on: boolean | string) => (
    <li className="flex items-start gap-2 text-sm">
      <span className={typeof on === "boolean" ? (on ? "text-up" : "text-gray-300") : "text-up"}>
        {typeof on === "boolean" ? (on ? "✓" : "✕") : "✓"}
      </span>
      <span className="text-gray-600">{label}{typeof on === "string" && <>: <b>{on}</b></>}</span>
    </li>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Plans</h1>
        <p className="text-sm text-gray-500">
          Pricing is configurable server-side. Billing is stubbed in the MVP — the
          upgrade button is a demo toggle.
        </p>
      </div>

      {msg && <div className="rounded-md border border-brand/30 bg-brand/5 p-3 text-sm text-brand">{msg}</div>}
      {!user && (
        <div className="rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-500">
          <Link href="/login" className="font-medium text-brand hover:underline">Log in</Link> to change your plan.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {plans?.map((p) => {
          const current = user?.tier === p.tier;
          const e = p.entitlements;
          return (
            <div key={p.tier} className={`rounded-lg border bg-white p-5 ${current ? "border-brand ring-1 ring-brand" : "border-gray-200"}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{p.displayName}</h2>
                {current && <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">Current</span>}
              </div>
              <div className="mt-1 text-2xl font-bold">
                {p.priceMonthlyNgn === 0 ? "Free" : <>{formatNaira(p.priceMonthlyNgn)}<span className="text-sm font-normal text-gray-400">/mo</span></>}
              </div>
              {p.priceYearlyNgn > 0 && <p className="text-xs text-gray-400">or {formatNaira(p.priceYearlyNgn)}/yr</p>}

              <ul className="mt-4 space-y-2">
                {feature("Watchlists", String(e.maxWatchlists))}
                {feature("Stocks per watchlist", String(e.maxWatchlistItems))}
                {feature("Full “Why this score?” breakdown", e.scoreBreakdown)}
                {feature(`Screener filters (${e.screenerFilters.length})`, e.screenerFilters.join(", "))}
                {feature("Max screener results", String(e.screenerMaxResults))}
              </ul>

              {user && !current && (
                <button onClick={() => change(p.tier)} disabled={busy === p.tier} className="mt-5 w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
                  {busy === p.tier ? "Switching…" : p.tier === "PRO" ? "Upgrade to Pro (demo)" : "Switch to Free"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
