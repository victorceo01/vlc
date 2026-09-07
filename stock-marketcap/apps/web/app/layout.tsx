import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stock Marketcap — Nigerian Equity Research",
  description:
    "Research NGX-listed companies: prices, financials, dividends, and the transparent Stock Marketcap Score.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
