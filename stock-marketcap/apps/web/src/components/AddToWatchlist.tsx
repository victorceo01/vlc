"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface WatchlistsResponse {
  watchlists: { id: string; name: string }[];
}

export function AddToWatchlist({ symbol }: { symbol: string }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!user) {
    return (
      <Link href="/login" className="rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand/5">
        Log in to add to watchlist
      </Link>
    );
  }

  const add = async () => {
    setStatus("saving");
    setMessage("");
    try {
      const wl = await api.get<WatchlistsResponse>("/watchlists");
      let id = wl.watchlists[0]?.id;
      if (!id) {
        const created = await api.post<{ id: string }>("/watchlists", { name: "My Watchlist" });
        id = created.id;
      }
      await api.post(`/watchlists/${id}/items`, { symbol });
      setStatus("done");
      setMessage("Added to watchlist");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof ApiError ? e.message : "Could not add");
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={add}
        disabled={status === "saving" || status === "done"}
        className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {status === "done" ? "✓ In watchlist" : status === "saving" ? "Adding…" : "+ Watchlist"}
      </button>
      {message && (
        <span className={`text-xs ${status === "error" ? "text-down" : "text-gray-500"}`}>{message}</span>
      )}
    </div>
  );
}
