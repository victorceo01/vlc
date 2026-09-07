"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/auth/reset-password", { token, password });
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof ApiError ? err.message : "Reset failed");
    }
  };

  if (!token) return <p className="mt-4 text-sm text-down">Missing reset token.</p>;
  if (status === "done")
    return (
      <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
        Password updated. <Link href="/login" className="font-medium underline">Log in →</Link>
      </div>
    );

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      {status === "error" && <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-down">{message}</div>}
      <div>
        <label className="block text-sm font-medium text-gray-700">New password</label>
        <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none" />
      </div>
      <button className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Set new password</button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">Set a new password</h1>
      <Suspense fallback={<p className="mt-4 text-sm text-gray-500">Loading…</p>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
