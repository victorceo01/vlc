"use client";

import { useState } from "react";
import { compactNumber } from "@/lib/format";

interface YearRow {
  fiscalYear: number;
  income?: Record<string, number>;
  balance?: Record<string, number>;
  cashflow?: Record<string, number>;
  source: string;
}

const LABELS: Record<string, string> = {
  revenue: "Revenue",
  grossProfit: "Gross profit",
  operatingIncome: "Operating income",
  netIncome: "Net income",
  totalAssets: "Total assets",
  totalLiabilities: "Total liabilities",
  totalEquity: "Total equity",
  currentAssets: "Current assets",
  currentLiabilities: "Current liabilities",
  totalDebt: "Total debt",
  cashAndEquivalents: "Cash & equivalents",
  operatingCashFlow: "Operating cash flow",
  investingCashFlow: "Investing cash flow",
  financingCashFlow: "Financing cash flow",
  capex: "Capital expenditure",
  freeCashFlow: "Free cash flow",
};

const TABS = [
  { key: "income", label: "Income Statement" },
  { key: "balance", label: "Balance Sheet" },
  { key: "cashflow", label: "Cash Flow" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function FinancialsTabs({ years }: { years: YearRow[] }) {
  const [tab, setTab] = useState<TabKey>("income");
  const sorted = [...years].sort((a, b) => b.fiscalYear - a.fiscalYear).slice(0, 4);

  const keys = Array.from(
    new Set(sorted.flatMap((y) => Object.keys(y[tab] ?? {}))),
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex flex-wrap gap-1 border-b border-gray-100 p-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === t.key ? "bg-brand/10 text-brand" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left">₦ (line item)</th>
              {sorted.map((y) => (
                <th key={y.fiscalYear} className="px-3 py-2 text-right">FY{y.fiscalYear}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {keys.map((k) => (
              <tr key={k}>
                <td className="px-3 py-2 text-gray-700">{LABELS[k] ?? k}</td>
                {sorted.map((y) => {
                  const v = (y[tab] as Record<string, number> | undefined)?.[k];
                  return (
                    <td key={y.fiscalYear} className="px-3 py-2 text-right tabular-nums">
                      {v === undefined ? "—" : `₦${compactNumber(v)}`}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-3 py-2 text-[11px] text-gray-400">
        Annual figures · source: mock · not real reported financials.
      </p>
    </div>
  );
}
