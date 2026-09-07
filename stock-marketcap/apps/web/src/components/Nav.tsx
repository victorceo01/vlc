"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/stocks", label: "Stocks" },
  { href: "/screener", label: "Screener" },
  { href: "/news", label: "News" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/pricing", label: "Pricing" },
];

export function Nav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-brand">
              <span className="inline-block h-6 w-6 rounded bg-brand text-white text-center text-sm leading-6">
                ₦
              </span>
              <span className="hidden sm:inline">Stock Marketcap</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive(l.href)
                    ? "bg-brand/10 text-brand"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {l.label}
              </Link>
            ))}
            {user?.isAdmin && (
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/admin") ? "bg-brand/10 text-brand" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Admin
              </Link>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm text-gray-500">
                  {user.displayName ?? user.email}
                  <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-600">
                    {user.tier}
                  </span>
                </span>
                <button
                  onClick={() => logout()}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-2">
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive(l.href) ? "bg-brand/10 text-brand" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {l.label}
              </Link>
            ))}
            {user?.isAdmin && (
              <Link href="/admin" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
                Admin
              </Link>
            )}
            <div className="mt-2 border-t border-gray-100 pt-2">
              {user ? (
                <button onClick={() => { setOpen(false); logout(); }} className="px-3 py-2 text-sm text-gray-700">
                  Log out ({user.tier})
                </button>
              ) : (
                <div className="flex gap-2 px-3 py-2">
                  <Link href="/login" onClick={() => setOpen(false)} className="text-sm font-medium text-gray-700">Log in</Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="text-sm font-semibold text-brand">Sign up</Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
