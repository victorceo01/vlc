"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Always report success (no account enumeration).
    try { await api.post("/auth/forgot-password", { email }); } catch { /* ignore */ }
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">Reset password</h1>
      {sent ? (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          If an account exists for {email}, a reset link has been sent (logged to the API console in dev).
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
          </div>
          <button className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            Send reset link
          </button>
        </form>
      )}
      <p className="mt-4 text-sm"><Link href="/login" className="text-brand hover:underline">← Back to login</Link></p>
    </div>
  );
}
