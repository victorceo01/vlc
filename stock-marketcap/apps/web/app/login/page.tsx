"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    api.get<{ enabled: boolean }>("/auth/google/status").then((r) => setGoogleEnabled(r.enabled)).catch(() => {});
  }, []);
  useEffect(() => { if (user) router.replace("/"); }, [user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await login(email, password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">Log in</h1>
      <p className="mt-1 text-sm text-gray-500">Welcome back to Stock Marketcap.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {error && <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-down">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        </div>
        <button disabled={busy} className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
          {busy ? "Logging in…" : "Log in"}
        </button>
      </form>

      {googleEnabled && (
        <a href={`${API_BASE}/auth/google`} className="mt-3 block w-full rounded-md border border-gray-300 px-4 py-2 text-center text-sm font-medium hover:bg-gray-50">
          Continue with Google
        </a>
      )}

      <div className="mt-4 flex justify-between text-sm">
        <Link href="/forgot-password" className="text-gray-500 hover:text-brand">Forgot password?</Link>
        <Link href="/register" className="font-medium text-brand hover:underline">Create account</Link>
      </div>

      <p className="mt-6 rounded-md bg-gray-100 p-3 text-xs text-gray-500">
        Demo accounts — admin@stockmarketcap.local / admin1234 · demo@stockmarketcap.local / demo1234
      </p>
    </div>
  );
}
