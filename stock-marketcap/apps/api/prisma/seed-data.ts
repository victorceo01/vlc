/**
 * Seed dataset for the Stock Marketcap MVP.
 *
 * Company NAMES, SECTORS, SYMBOLS and profile text are real NGX-listed
 * companies. All FINANCIAL FIGURES (prices, revenue, income, balance sheet,
 * cash flow, dividends) are CLEARLY MOCK and must be stored with source='mock'.
 * They are plausible orders of magnitude for demo rendering only — NOT real
 * reported financials and NOT investment advice.
 */

export interface SeedFinancialsYear {
  fiscalYear: number;
  income: {
    revenue: number;
    grossProfit: number;
    operatingIncome: number;
    netIncome: number;
  };
  balance: {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    currentAssets: number;
    currentLiabilities: number;
    totalDebt: number;
    cashAndEquivalents: number;
  };
  cashflow: {
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    capex: number;
    freeCashFlow: number;
  };
}

export interface SeedDividend {
  fiscalYear: number;
  amountPerShareNgn: number;
  type: "interim" | "final" | "special";
  declaredDate: string;
  exDate: string;
  paymentDate: string;
}

export interface SeedCompany {
  symbol: string;
  name: string;
  sector: string;
  description: string;
  ceo: string;
  headquarters: string;
  website: string;
  listedShares: number; // number of shares outstanding
  priceNgn: number;
  changePct: number;
  volume: number;
  /** Latest fiscal-year (2023) key figures; earlier years derived from these. */
  base2023: SeedFinancialsYear;
  dividends: SeedDividend[];
}

const B = 1_000_000_000; // billion
const M = 1_000_000; // million

/**
 * Derive a prior fiscal year from a base year by scaling each figure by
 * `factor` (deterministic, no randomness) so the demo shows a plausible trend.
 */
export function deriveYear(base: SeedFinancialsYear, fiscalYear: number, factor: number): SeedFinancialsYear {
  const s = (n: number) => Math.round(n * factor);
  return {
    fiscalYear,
    income: {
      revenue: s(base.income.revenue),
      grossProfit: s(base.income.grossProfit),
      operatingIncome: s(base.income.operatingIncome),
      netIncome: s(base.income.netIncome),
    },
    balance: {
      totalAssets: s(base.balance.totalAssets),
      totalLiabilities: s(base.balance.totalLiabilities),
      totalEquity: s(base.balance.totalEquity),
      currentAssets: s(base.balance.currentAssets),
      currentLiabilities: s(base.balance.currentLiabilities),
      totalDebt: s(base.balance.totalDebt),
      cashAndEquivalents: s(base.balance.cashAndEquivalents),
    },
    cashflow: {
      operatingCashFlow: s(base.cashflow.operatingCashFlow),
      investingCashFlow: s(base.cashflow.investingCashFlow),
      financingCashFlow: s(base.cashflow.financingCashFlow),
      capex: s(base.cashflow.capex),
      freeCashFlow: s(base.cashflow.freeCashFlow),
    },
  };
}

function fin(
  revenue: number,
  grossProfit: number,
  operatingIncome: number,
  netIncome: number,
  totalAssets: number,
  totalLiabilities: number,
  currentAssets: number,
  currentLiabilities: number,
  totalDebt: number,
  cash: number,
  ocf: number,
  capex: number,
): SeedFinancialsYear {
  return {
    fiscalYear: 2023,
    income: { revenue, grossProfit, operatingIncome, netIncome },
    balance: {
      totalAssets,
      totalLiabilities,
      totalEquity: totalAssets - totalLiabilities,
      currentAssets,
      currentLiabilities,
      totalDebt,
      cashAndEquivalents: cash,
    },
    cashflow: {
      operatingCashFlow: ocf,
      investingCashFlow: -Math.round(capex * 1.1),
      financingCashFlow: -Math.round(ocf * 0.3),
      capex: -capex,
      freeCashFlow: ocf - capex,
    },
  };
}

function divs(perShareByYear: Array<[number, number]>): SeedDividend[] {
  return perShareByYear.map(([fiscalYear, amt]) => ({
    fiscalYear,
    amountPerShareNgn: amt,
    type: "final" as const,
    declaredDate: `${fiscalYear + 1}-02-20`,
    exDate: `${fiscalYear + 1}-04-15`,
    paymentDate: `${fiscalYear + 1}-05-10`,
  }));
}

export const SEED_COMPANIES: SeedCompany[] = [
  {
    symbol: "DANGCEM",
    name: "Dangote Cement Plc",
    sector: "Industrial Goods",
    description:
      "Dangote Cement is the largest cement producer in sub-Saharan Africa, with operations across Nigeria and several other African countries.",
    ceo: "Arvind Pathak",
    headquarters: "Lagos, Nigeria",
    website: "https://www.dangotecement.com",
    listedShares: 16_950 * M,
    priceNgn: 445.0,
    changePct: 1.24,
    volume: 1_250_000,
    base2023: fin(2400 * B, 1080 * B, 720 * B, 455 * B, 3200 * B, 1500 * B, 900 * B, 700 * B, 620 * B, 180 * B, 610 * B, 260 * B),
    dividends: divs([[2021, 20], [2022, 20], [2023, 30]]),
  },
  {
    symbol: "BUACEMENT",
    name: "BUA Cement Plc",
    sector: "Industrial Goods",
    description:
      "BUA Cement is one of Nigeria's largest cement manufacturers, operating plants in the north and south of the country.",
    ceo: "Yusuf Binji",
    headquarters: "Abuja, Nigeria",
    website: "https://www.buacement.com",
    listedShares: 33_860 * M,
    priceNgn: 96.5,
    changePct: -0.51,
    volume: 640_000,
    base2023: fin(460 * B, 190 * B, 120 * B, 88 * B, 900 * B, 520 * B, 240 * B, 300 * B, 380 * B, 40 * B, 130 * B, 90 * B),
    dividends: divs([[2021, 2.6], [2022, 2.9], [2023, 3.5]]),
  },
  {
    symbol: "MTNN",
    name: "MTN Nigeria Communications Plc",
    sector: "Telecommunications",
    description:
      "MTN Nigeria is the largest mobile network operator in Nigeria, offering voice, data and mobile financial services.",
    ceo: "Karl Toriola",
    headquarters: "Lagos, Nigeria",
    website: "https://www.mtn.ng",
    listedShares: 20_350 * M,
    priceNgn: 198.0,
    changePct: 2.06,
    volume: 2_100_000,
    base2023: fin(2470 * B, 1600 * B, 900 * B, 350 * B, 3100 * B, 2600 * B, 700 * B, 1200 * B, 900 * B, 120 * B, 820 * B, 480 * B),
    dividends: divs([[2021, 8.5], [2022, 10.0], [2023, 11.0]]),
  },
  {
    symbol: "AIRTELAFRI",
    name: "Airtel Africa Plc",
    sector: "Telecommunications",
    description:
      "Airtel Africa provides telecommunications and mobile money services across 14 countries in Africa.",
    ceo: "Sunil Taldar",
    headquarters: "Lagos / London",
    website: "https://airtel.africa",
    listedShares: 3_758 * M,
    priceNgn: 1990.0,
    changePct: 0.0,
    volume: 55_000,
    base2023: fin(1900 * B, 900 * B, 560 * B, 260 * B, 4200 * B, 2900 * B, 800 * B, 1000 * B, 1400 * B, 300 * B, 700 * B, 400 * B),
    dividends: divs([[2021, 40], [2022, 48], [2023, 57]]),
  },
  {
    symbol: "GTCO",
    name: "Guaranty Trust Holding Company Plc",
    sector: "Banking",
    description:
      "GTCO is a leading financial services group in Nigeria offering banking, payments, asset management and pension services.",
    ceo: "Segun Agbaje",
    headquarters: "Lagos, Nigeria",
    website: "https://www.gtcoplc.com",
    listedShares: 29_430 * M,
    priceNgn: 44.5,
    changePct: 1.83,
    volume: 3_400_000,
    base2023: fin(1180 * B, 0, 610 * B, 540 * B, 9700 * B, 8300 * B, 5000 * B, 4200 * B, 500 * B, 1500 * B, 620 * B, 30 * B),
    dividends: divs([[2021, 3.0], [2022, 3.1], [2023, 3.2]]),
  },
  {
    symbol: "ZENITHBANK",
    name: "Zenith Bank Plc",
    sector: "Banking",
    description:
      "Zenith Bank is one of the largest banks in Nigeria by tier-1 capital, offering corporate and retail banking services.",
    ceo: "Adaora Umeoji",
    headquarters: "Lagos, Nigeria",
    website: "https://www.zenithbank.com",
    listedShares: 31_400 * M,
    priceNgn: 38.2,
    changePct: -0.78,
    volume: 4_100_000,
    base2023: fin(2130 * B, 0, 900 * B, 680 * B, 20300 * B, 18100 * B, 9000 * B, 8000 * B, 1200 * B, 3000 * B, 900 * B, 40 * B),
    dividends: divs([[2021, 3.1], [2022, 3.2], [2023, 4.0]]),
  },
  {
    symbol: "UBA",
    name: "United Bank for Africa Plc",
    sector: "Banking",
    description:
      "UBA is a pan-African financial institution operating in 20 African countries plus offices in London, Paris and New York.",
    ceo: "Oliver Alawuba",
    headquarters: "Lagos, Nigeria",
    website: "https://www.ubagroup.com",
    listedShares: 34_200 * M,
    priceNgn: 27.4,
    changePct: 0.92,
    volume: 5_600_000,
    base2023: fin(1800 * B, 0, 800 * B, 610 * B, 20600 * B, 18700 * B, 9500 * B, 8600 * B, 1500 * B, 2800 * B, 850 * B, 35 * B),
    dividends: divs([[2021, 1.0], [2022, 1.1], [2023, 2.9]]),
  },
  {
    symbol: "ACCESSCORP",
    name: "Access Holdings Plc",
    sector: "Banking",
    description:
      "Access Holdings is the parent of Access Bank, one of Africa's largest retail banks by customer base.",
    ceo: "Bolaji Agbede",
    headquarters: "Lagos, Nigeria",
    website: "https://www.theaccesscorporation.com",
    listedShares: 35_500 * M,
    priceNgn: 18.9,
    changePct: -1.05,
    volume: 6_200_000,
    base2023: fin(2600 * B, 0, 700 * B, 520 * B, 26700 * B, 24800 * B, 12000 * B, 11500 * B, 2200 * B, 3200 * B, 780 * B, 50 * B),
    dividends: divs([[2021, 1.0], [2022, 1.5], [2023, 1.8]]),
  },
  {
    symbol: "FBNH",
    name: "FBN Holdings Plc",
    sector: "Banking",
    description:
      "FBN Holdings is the parent company of First Bank of Nigeria, one of the oldest banks in West Africa.",
    ceo: "Nnamdi Okonkwo",
    headquarters: "Lagos, Nigeria",
    website: "https://www.fbnholdings.com",
    listedShares: 35_900 * M,
    priceNgn: 26.5,
    changePct: 0.38,
    volume: 4_800_000,
    base2023: fin(1600 * B, 0, 420 * B, 310 * B, 16900 * B, 15400 * B, 8000 * B, 7500 * B, 1800 * B, 2100 * B, 520 * B, 45 * B),
    dividends: divs([[2021, 0.5], [2022, 0.9], [2023, 1.3]]),
  },
  {
    symbol: "NESTLE",
    name: "Nestle Nigeria Plc",
    sector: "Consumer Goods",
    description:
      "Nestle Nigeria manufactures and markets food and beverage products including Maggi, Milo and Golden Morn.",
    ceo: "Wassim Elhusseini",
    headquarters: "Lagos, Nigeria",
    website: "https://www.nestle-cwar.com",
    listedShares: 793 * M,
    priceNgn: 950.0,
    changePct: -0.63,
    volume: 210_000,
    base2023: fin(547 * B, 190 * B, 90 * B, -79 * B, 430 * B, 520 * B, 180 * B, 400 * B, 320 * B, 30 * B, 95 * B, 40 * B),
    dividends: divs([[2021, 25.5], [2022, 36.5], [2023, 0]]),
  },
  {
    symbol: "NB",
    name: "Nigerian Breweries Plc",
    sector: "Consumer Goods",
    description:
      "Nigerian Breweries is the largest brewer in Nigeria, producing brands such as Star, Gulder and Heineken.",
    ceo: "Hans Essaadi",
    headquarters: "Lagos, Nigeria",
    website: "https://www.nbplc.com",
    listedShares: 8_020 * M,
    priceNgn: 31.0,
    changePct: 1.47,
    volume: 900_000,
    base2023: fin(600 * B, 180 * B, 20 * B, -106 * B, 520 * B, 470 * B, 160 * B, 380 * B, 300 * B, 20 * B, 60 * B, 55 * B),
    dividends: divs([[2021, 1.74], [2022, 0.75], [2023, 0]]),
  },
  {
    symbol: "FLOURMILL",
    name: "Flour Mills of Nigeria Plc",
    sector: "Consumer Goods",
    description:
      "Flour Mills of Nigeria is a leading agro-allied and food group, best known for the Golden Penny brand.",
    ceo: "Omoboyede Olusanya",
    headquarters: "Lagos, Nigeria",
    website: "https://www.fmnplc.com",
    listedShares: 4_100 * M,
    priceNgn: 42.0,
    changePct: 0.72,
    volume: 720_000,
    base2023: fin(1540 * B, 180 * B, 70 * B, 30 * B, 1100 * B, 820 * B, 500 * B, 600 * B, 420 * B, 45 * B, 90 * B, 70 * B),
    dividends: divs([[2021, 1.65], [2022, 2.15], [2023, 2.45]]),
  },
  {
    symbol: "DANGSUGAR",
    name: "Dangote Sugar Refinery Plc",
    sector: "Consumer Goods",
    description:
      "Dangote Sugar Refinery is one of the largest sugar refineries in sub-Saharan Africa.",
    ceo: "Ravindra Singhvi",
    headquarters: "Lagos, Nigeria",
    website: "https://www.dangotesugar.com.ng",
    listedShares: 15_150 * M,
    priceNgn: 42.5,
    changePct: -0.35,
    volume: 830_000,
    base2023: fin(440 * B, 70 * B, 40 * B, -27 * B, 380 * B, 300 * B, 220 * B, 250 * B, 190 * B, 25 * B, 35 * B, 30 * B),
    dividends: divs([[2021, 1.5], [2022, 1.0], [2023, 0]]),
  },
  {
    symbol: "SEPLAT",
    name: "Seplat Energy Plc",
    sector: "Oil & Gas",
    description:
      "Seplat Energy is a leading Nigerian independent energy company engaged in oil and gas exploration and production.",
    ceo: "Roger Brown",
    headquarters: "Lagos, Nigeria",
    website: "https://seplatenergy.com",
    listedShares: 588 * M,
    priceNgn: 3800.0,
    changePct: 1.12,
    volume: 45_000,
    base2023: fin(1200 * B, 500 * B, 260 * B, 130 * B, 2600 * B, 1400 * B, 700 * B, 500 * B, 700 * B, 300 * B, 320 * B, 180 * B),
    dividends: divs([[2021, 42], [2022, 52], [2023, 60]]),
  },
  {
    symbol: "TOTAL",
    name: "TotalEnergies Marketing Nigeria Plc",
    sector: "Oil & Gas",
    description:
      "TotalEnergies Marketing Nigeria distributes petroleum products and lubricants across a nationwide retail network.",
    ceo: "Samba Seye",
    headquarters: "Lagos, Nigeria",
    website: "https://totalenergies.ng",
    listedShares: 339 * M,
    priceNgn: 620.0,
    changePct: 0.49,
    volume: 60_000,
    base2023: fin(680 * B, 90 * B, 40 * B, 24 * B, 260 * B, 210 * B, 190 * B, 180 * B, 60 * B, 15 * B, 30 * B, 12 * B),
    dividends: divs([[2021, 21], [2022, 27], [2023, 30]]),
  },
  {
    symbol: "OANDO",
    name: "Oando Plc",
    sector: "Oil & Gas",
    description:
      "Oando is an integrated energy solutions provider with interests in upstream and downstream oil and gas.",
    ceo: "Wale Tinubu",
    headquarters: "Lagos, Nigeria",
    website: "https://www.oandoplc.com",
    listedShares: 12_430 * M,
    priceNgn: 58.0,
    changePct: 3.21,
    volume: 1_900_000,
    base2023: fin(3400 * B, 300 * B, 120 * B, 60 * B, 3800 * B, 3400 * B, 1600 * B, 1900 * B, 1200 * B, 90 * B, 150 * B, 80 * B),
    dividends: divs([[2021, 0], [2022, 0], [2023, 0]]),
  },
  {
    symbol: "OKOMUOIL",
    name: "The Okomu Oil Palm Company Plc",
    sector: "Agriculture",
    description:
      "Okomu Oil Palm is a major Nigerian producer of crude palm oil and rubber.",
    ceo: "Graham Hefer",
    headquarters: "Benin City, Nigeria",
    website: "https://www.okomunigeria.com",
    listedShares: 954 * M,
    priceNgn: 305.0,
    changePct: -0.42,
    volume: 120_000,
    base2023: fin(96 * B, 55 * B, 45 * B, 34 * B, 130 * B, 45 * B, 60 * B, 25 * B, 20 * B, 22 * B, 40 * B, 18 * B),
    dividends: divs([[2021, 7], [2022, 24], [2023, 30]]),
  },
  {
    symbol: "PRESCO",
    name: "Presco Plc",
    sector: "Agriculture",
    description:
      "Presco is a fully integrated agro-industrial establishment specialising in oil palm plantations and refining.",
    ceo: "Felix Nwabuko",
    headquarters: "Benin City, Nigeria",
    website: "https://presco-plc.com",
    listedShares: 1_000 * M,
    priceNgn: 260.0,
    changePct: 0.58,
    volume: 95_000,
    base2023: fin(120 * B, 70 * B, 55 * B, 40 * B, 220 * B, 110 * B, 70 * B, 60 * B, 70 * B, 15 * B, 48 * B, 25 * B),
    dividends: divs([[2021, 2], [2022, 3], [2023, 4]]),
  },
  {
    symbol: "TRANSCORP",
    name: "Transnational Corporation Plc",
    sector: "Conglomerates",
    description:
      "Transcorp is a Nigerian conglomerate with interests in power, hospitality and energy.",
    ceo: "Owen Omogiafo",
    headquarters: "Abuja, Nigeria",
    website: "https://www.transcorpnigeria.com",
    listedShares: 40_700 * M,
    priceNgn: 12.5,
    changePct: 2.88,
    volume: 7_800_000,
    base2023: fin(290 * B, 120 * B, 90 * B, 45 * B, 620 * B, 400 * B, 200 * B, 180 * B, 250 * B, 40 * B, 70 * B, 55 * B),
    dividends: divs([[2021, 0.1], [2022, 0.2], [2023, 0.25]]),
  },
  {
    symbol: "WAPCO",
    name: "Lafarge Africa Plc",
    sector: "Industrial Goods",
    description:
      "Lafarge Africa is a leading cement and building-solutions company and part of the Holcim Group.",
    ceo: "Lolu Alade-Akinyemi",
    headquarters: "Lagos, Nigeria",
    website: "https://www.lafarge.com.ng",
    listedShares: 16_100 * M,
    priceNgn: 34.0,
    changePct: -0.29,
    volume: 1_100_000,
    base2023: fin(400 * B, 140 * B, 80 * B, 55 * B, 560 * B, 250 * B, 200 * B, 190 * B, 90 * B, 60 * B, 95 * B, 45 * B),
    dividends: divs([[2021, 1.0], [2022, 1.9], [2023, 2.1]]),
  },
];
