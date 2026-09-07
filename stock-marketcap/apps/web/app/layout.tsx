import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Nav } from "@/components/Nav";
import { MockDataBanner } from "@/components/MockDataBanner";

export const metadata: Metadata = {
  title: "Stock Marketcap — Nigerian Equity Research",
  description:
    "Research NGX-listed companies: prices, financials, dividends, and the transparent Stock Marketcap Score. Demo data only.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <MockDataBanner />
          <Nav />
          <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
          <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-400">
            Stock Marketcap · MVP · All data is mock/seed data — not investment advice.
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
