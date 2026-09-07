/**
 * Idempotent seed script. Loads mock NGX data for the MVP.
 *
 * Guardrails:
 *  - Every price/financial/dividend/news record is written with source = 'mock'.
 *  - Figures are plausible-magnitude MOCK data, never presented as real.
 *  - Stock scores are NOT seeded here — they are computed by the score engine.
 */
import { PrismaClient, DataSource, FinancialStatementType, FinancialPeriod, SubscriptionTier } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { DEFAULT_ENTITLEMENTS } from "@stockmc/shared";
import { SEED_COMPANIES, deriveYear, SeedFinancialsYear } from "./seed-data";
import { SEED_NEWS } from "./seed-news";

const prisma = new PrismaClient();

// Fixed "as-of" date so mock data is stable across runs.
const AS_OF = new Date("2026-09-04T16:00:00Z");
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Deterministic PRNG (mulberry32) seeded from a string. */
function seededRng(seedStr: string): () => number {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isWeekday(d: Date): boolean {
  const day = d.getUTCDay();
  return day !== 0 && day !== 6;
}

/** Build ~5y of weekday closes ending at AS_OF with last close = currentPrice. */
function buildHistoricalCloses(symbol: string, currentPrice: number) {
  const rng = seededRng(symbol);
  const years = 5;
  const dates: Date[] = [];
  for (let i = 0; i < years * 365; i++) {
    const d = new Date(AS_OF.getTime() - i * MS_PER_DAY);
    if (isWeekday(d)) dates.push(d);
  }
  dates.reverse(); // oldest -> newest
  // Walk backwards from currentPrice so the newest close equals currentPrice.
  const closes: number[] = new Array(dates.length);
  let price = currentPrice;
  for (let i = dates.length - 1; i >= 0; i--) {
    closes[i] = Math.max(0.5, Math.round(price * 100) / 100);
    const drift = -0.0002; // slight downward as we go back in time
    const shock = (rng() - 0.5) * 0.04; // +/-2% daily
    price = price / (1 + drift + shock);
  }
  return dates.map((date, i) => ({ date, close: closes[i] }));
}

async function seedPlans() {
  const plans = [
    {
      tier: SubscriptionTier.FREE,
      displayName: "Free",
      priceMonthlyNgn: 0,
      priceYearlyNgn: 0,
      entitlements: DEFAULT_ENTITLEMENTS.FREE as object,
    },
    {
      tier: SubscriptionTier.PRO,
      displayName: "Pro",
      priceMonthlyNgn: 5000,
      priceYearlyNgn: 50000,
      entitlements: DEFAULT_ENTITLEMENTS.PRO as object,
    },
  ];
  for (const p of plans) {
    await prisma.planSetting.upsert({
      where: { tier: p.tier },
      create: p,
      update: {
        displayName: p.displayName,
        priceMonthlyNgn: p.priceMonthlyNgn,
        priceYearlyNgn: p.priceYearlyNgn,
        entitlements: p.entitlements,
      },
    });
  }
  console.log(`  ✓ plan settings (FREE, PRO)`);
}

async function seedUsers() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@stockmarketcap.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      displayName: "Admin",
      emailVerified: true,
      isAdmin: true,
      subscription: { create: { tier: SubscriptionTier.PRO, provider: "stub" } },
    },
    update: { isAdmin: true, emailVerified: true },
  });

  const demoEmail = "demo@stockmarketcap.local";
  const demoHash = await bcrypt.hash("demo1234", 10);
  await prisma.user.upsert({
    where: { email: demoEmail },
    create: {
      email: demoEmail,
      passwordHash: demoHash,
      displayName: "Demo User",
      emailVerified: true,
      subscription: { create: { tier: SubscriptionTier.FREE, provider: "stub" } },
    },
    update: {},
  });

  console.log(`  ✓ users: ${adminEmail} (admin/PRO), ${demoEmail} (FREE)`);
  return admin;
}

async function seedCompany(c: (typeof SEED_COMPANIES)[number]) {
  const company = await prisma.company.upsert({
    where: { id: `seed_${c.symbol}` },
    create: {
      id: `seed_${c.symbol}`,
      name: c.name,
      sector: c.sector,
      description: c.description,
      ceo: c.ceo,
      headquarters: c.headquarters,
      website: c.website,
    },
    update: {
      name: c.name,
      sector: c.sector,
      description: c.description,
      ceo: c.ceo,
      headquarters: c.headquarters,
      website: c.website,
    },
  });

  const security = await prisma.security.upsert({
    where: { symbol: c.symbol },
    create: {
      companyId: company.id,
      symbol: c.symbol,
      exchange: "NGX",
      currency: "NGN",
      listedShares: BigInt(c.listedShares),
    },
    update: { listedShares: BigInt(c.listedShares) },
  });

  // Current price snapshot
  await prisma.price.upsert({
    where: { securityId: security.id },
    create: {
      securityId: security.id,
      priceNgn: c.priceNgn,
      changePct: c.changePct,
      volume: BigInt(c.volume),
      source: DataSource.mock,
      timestamp: AS_OF,
    },
    update: {
      priceNgn: c.priceNgn,
      changePct: c.changePct,
      volume: BigInt(c.volume),
      source: DataSource.mock,
      timestamp: AS_OF,
    },
  });

  // Historical prices (~5y weekdays)
  const closes = buildHistoricalCloses(c.symbol, c.priceNgn);
  await prisma.historicalPrice.deleteMany({ where: { securityId: security.id } });
  const CHUNK = 500;
  for (let i = 0; i < closes.length; i += CHUNK) {
    const slice = closes.slice(i, i + CHUNK);
    await prisma.historicalPrice.createMany({
      data: slice.map((pt) => ({
        securityId: security.id,
        date: new Date(Date.UTC(pt.date.getUTCFullYear(), pt.date.getUTCMonth(), pt.date.getUTCDate())),
        closeNgn: pt.close,
        volume: BigInt(Math.round(c.volume * (0.6 + (pt.close % 1)))),
        source: DataSource.mock,
      })),
      skipDuplicates: true,
    });
  }

  // Financial statements: 3 fiscal years (2021, 2022, 2023)
  const years: SeedFinancialsYear[] = [
    deriveYear(c.base2023, 2021, 0.82),
    deriveYear(c.base2023, 2022, 0.91),
    c.base2023,
  ];
  for (const yr of years) {
    const yearEnd = new Date(Date.UTC(yr.fiscalYear, 11, 31));
    const rows: Array<{ type: FinancialStatementType; lineItems: object }> = [
      { type: FinancialStatementType.income_statement, lineItems: yr.income },
      { type: FinancialStatementType.balance_sheet, lineItems: yr.balance },
      { type: FinancialStatementType.cash_flow, lineItems: yr.cashflow },
    ];
    for (const r of rows) {
      await prisma.financialStatement.upsert({
        where: {
          companyId_type_period_fiscalYear: {
            companyId: company.id,
            type: r.type,
            period: FinancialPeriod.annual,
            fiscalYear: yr.fiscalYear,
          },
        },
        create: {
          companyId: company.id,
          type: r.type,
          period: FinancialPeriod.annual,
          fiscalYear: yr.fiscalYear,
          currency: "NGN",
          lineItems: r.lineItems,
          source: DataSource.mock,
          timestamp: yearEnd,
        },
        update: { lineItems: r.lineItems, source: DataSource.mock, timestamp: yearEnd },
      });
    }
  }

  // Dividends (declared only)
  await prisma.dividend.deleteMany({ where: { companyId: company.id } });
  for (const d of c.dividends) {
    if (d.amountPerShareNgn <= 0) continue;
    await prisma.dividend.create({
      data: {
        companyId: company.id,
        fiscalYear: d.fiscalYear,
        amountPerShareNgn: d.amountPerShareNgn,
        type: d.type,
        declaredDate: new Date(d.declaredDate),
        exDate: new Date(d.exDate),
        paymentDate: new Date(d.paymentDate),
        source: DataSource.mock,
        timestamp: new Date(d.declaredDate),
      },
    });
  }

  return company.id;
}

async function seedNews(symbolToCompanyId: Record<string, string>) {
  // Clean re-seed of news to keep it idempotent.
  await prisma.newsArticle.deleteMany({});
  for (const a of SEED_NEWS) {
    const companyIds = a.symbols
      .map((s) => symbolToCompanyId[s])
      .filter((id): id is string => Boolean(id));
    await prisma.newsArticle.create({
      data: {
        title: a.title,
        summary: a.summary,
        body: a.body,
        sourceName: a.sourceName,
        publishedAt: new Date(a.publishedAt),
        source: DataSource.mock,
        companies: {
          create: companyIds.map((companyId) => ({ companyId })),
        },
      },
    });
  }
  console.log(`  ✓ news articles: ${SEED_NEWS.length}`);
}

async function main() {
  console.log("Seeding Stock Marketcap mock data (source='mock')...");
  await seedPlans();
  await seedUsers();

  const symbolToCompanyId: Record<string, string> = {};
  for (const c of SEED_COMPANIES) {
    const id = await seedCompany(c);
    symbolToCompanyId[c.symbol] = id;
    console.log(`  ✓ ${c.symbol.padEnd(11)} ${c.name}`);
  }

  await seedNews(symbolToCompanyId);

  const counts = {
    companies: await prisma.company.count(),
    securities: await prisma.security.count(),
    prices: await prisma.price.count(),
    historicalPrices: await prisma.historicalPrice.count(),
    financials: await prisma.financialStatement.count(),
    dividends: await prisma.dividend.count(),
    news: await prisma.newsArticle.count(),
    plans: await prisma.planSetting.count(),
    users: await prisma.user.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
