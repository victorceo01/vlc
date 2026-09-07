import { Injectable } from "@nestjs/common";
import { FinancialStatementType, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface IncomeLineItems {
  revenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
}
export interface BalanceLineItems {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  currentAssets: number;
  currentLiabilities: number;
  totalDebt: number;
  cashAndEquivalents: number;
}
export interface CashflowLineItems {
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  capex: number;
  freeCashFlow: number;
}

export interface LatestFinancials {
  fiscalYear: number | null;
  income: IncomeLineItems | null;
  balance: BalanceLineItems | null;
  cashflow: CashflowLineItems | null;
}

/** Derived ratios used across the app. Nulls signal missing inputs. */
export interface DerivedRatios {
  eps: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  netMarginPct: number | null;
  roePct: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  dividendYieldPct: number | null;
  latestDividendPerShare: number | null;
}

function n(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

@Injectable()
export class FinancialsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLatest(companyId: string): Promise<LatestFinancials> {
    const rows = await this.prisma.financialStatement.findMany({
      where: { companyId },
      orderBy: { fiscalYear: "desc" },
    });
    if (rows.length === 0) {
      return { fiscalYear: null, income: null, balance: null, cashflow: null };
    }
    const latestYear = rows[0].fiscalYear;
    const forYear = rows.filter((r) => r.fiscalYear === latestYear);
    const pick = <T>(type: FinancialStatementType): T | null => {
      const row = forYear.find((r) => r.type === type);
      return row ? (row.lineItems as unknown as T) : null;
    };
    return {
      fiscalYear: latestYear,
      income: pick<IncomeLineItems>(FinancialStatementType.income_statement),
      balance: pick<BalanceLineItems>(FinancialStatementType.balance_sheet),
      cashflow: pick<CashflowLineItems>(FinancialStatementType.cash_flow),
    };
  }

  async getAnnualSeries(companyId: string) {
    const rows = await this.prisma.financialStatement.findMany({
      where: { companyId },
      orderBy: [{ fiscalYear: "asc" }, { type: "asc" }],
    });
    const byYear = new Map<
      number,
      { fiscalYear: number; income?: unknown; balance?: unknown; cashflow?: unknown; source: string }
    >();
    for (const r of rows) {
      const entry = byYear.get(r.fiscalYear) ?? { fiscalYear: r.fiscalYear, source: r.source };
      if (r.type === FinancialStatementType.income_statement) entry.income = r.lineItems;
      if (r.type === FinancialStatementType.balance_sheet) entry.balance = r.lineItems;
      if (r.type === FinancialStatementType.cash_flow) entry.cashflow = r.lineItems;
      byYear.set(r.fiscalYear, entry);
    }
    return Array.from(byYear.values()).sort((a, b) => b.fiscalYear - a.fiscalYear);
  }

  /**
   * Compute derived ratios from latest financials + market inputs.
   * Every ratio is null when a required input is missing (no fabrication).
   */
  computeRatios(params: {
    latest: LatestFinancials;
    priceNgn: number | null;
    listedShares: number | null;
    latestDividendPerShare: number | null;
  }): DerivedRatios {
    const { latest, priceNgn, listedShares, latestDividendPerShare } = params;
    const income = latest.income;
    const balance = latest.balance;

    const netIncome = income ? n(income.netIncome) : null;
    const revenue = income ? n(income.revenue) : null;
    const equity = balance ? n(balance.totalEquity) : null;
    const totalDebt = balance ? n(balance.totalDebt) : null;
    const currentAssets = balance ? n(balance.currentAssets) : null;
    const currentLiabilities = balance ? n(balance.currentLiabilities) : null;

    const eps =
      netIncome !== null && listedShares && listedShares > 0
        ? netIncome / listedShares
        : null;
    const peRatio =
      eps !== null && eps > 0 && priceNgn !== null ? priceNgn / eps : null;

    const bookValuePerShare =
      equity !== null && listedShares && listedShares > 0
        ? equity / listedShares
        : null;
    const pbRatio =
      bookValuePerShare !== null && bookValuePerShare > 0 && priceNgn !== null
        ? priceNgn / bookValuePerShare
        : null;

    const netMarginPct =
      netIncome !== null && revenue !== null && revenue > 0
        ? (netIncome / revenue) * 100
        : null;
    const roePct =
      netIncome !== null && equity !== null && equity > 0
        ? (netIncome / equity) * 100
        : null;
    const debtToEquity =
      totalDebt !== null && equity !== null && equity > 0 ? totalDebt / equity : null;
    const currentRatio =
      currentAssets !== null && currentLiabilities !== null && currentLiabilities > 0
        ? currentAssets / currentLiabilities
        : null;
    const dividendYieldPct =
      latestDividendPerShare !== null && priceNgn !== null && priceNgn > 0
        ? (latestDividendPerShare / priceNgn) * 100
        : null;

    const round = (v: number | null, dp = 2) =>
      v === null ? null : Math.round(v * 10 ** dp) / 10 ** dp;

    return {
      eps: round(eps),
      peRatio: round(peRatio),
      pbRatio: round(pbRatio),
      netMarginPct: round(netMarginPct),
      roePct: round(roePct),
      debtToEquity: round(debtToEquity),
      currentRatio: round(currentRatio),
      dividendYieldPct: round(dividendYieldPct),
      latestDividendPerShare,
    };
  }

  async getLatestDividendPerShare(companyId: string): Promise<number | null> {
    const rows = await this.prisma.dividend.findMany({
      where: { companyId },
      orderBy: { fiscalYear: "desc" },
    });
    if (rows.length === 0) return null;
    const latestYear = rows[0].fiscalYear;
    const sum = rows
      .filter((r) => r.fiscalYear === latestYear)
      .reduce((acc, r) => acc + (r.amountPerShareNgn as Prisma.Decimal).toNumber(), 0);
    return Math.round(sum * 100) / 100;
  }
}
