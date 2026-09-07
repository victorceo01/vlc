"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const { register, user } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) router.replace("/"); }, [user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await register(email, password, displayName || undefined);
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">Create account</h1>
      <p className="mt-1 text-sm text-gray-500">Free tier — no card required.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {error && <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-down">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700">Name (optional)</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          <p className="mt-1 text-xs text-gray-400">At least 8 characters. A verification link is logged to the API console in dev.</p>
        </div>
        <button disabled={busy} className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-500">
        Already have an account? <Link href="/login" className="font-medium text-brand hover:underline">Log in</Link>
      </p>
    </div>
  );
}
