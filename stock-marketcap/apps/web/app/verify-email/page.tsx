"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function VerifyInner() {
  const token = useSearchParams().get("token") ?? "";
  const { refresh } = useAuth();
  const [status, setStatus] = useState<"verifying" | "done" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("Missing verification token."); return; }
    api.post("/auth/verify-email", { token })
      .then(async () => { setStatus("done"); await refresh(); })
      .catch((err) => { setStatus("error"); setMessage(err instanceof ApiError ? err.message : "Verification failed"); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (status === "verifying") return <p className="mt-4 text-sm text-gray-500">Verifying…</p>;
  if (status === "done")
    return (
      <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
        Your email is verified. <Link href="/" className="font-medium underline">Go to dashboard →</Link>
      </div>
    );
  return <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-down">{message}</div>;
}

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">Email verification</h1>
      <Suspense fallback={<p className="mt-4 text-sm text-gray-500">Loading…</p>}>
        <VerifyInner />
      </Suspense>
    </div>
  );
}
