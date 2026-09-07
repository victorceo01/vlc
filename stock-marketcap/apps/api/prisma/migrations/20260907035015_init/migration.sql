-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('mock', 'live', 'manual');

-- CreateEnum
CREATE TYPE "FinancialStatementType" AS ENUM ('income_statement', 'balance_sheet', 'cash_flow');

-- CreateEnum
CREATE TYPE "FinancialPeriod" AS ENUM ('annual');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('high', 'medium', 'low', 'insufficient');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('email_verification', 'password_reset');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "displayName" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "googleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "ceo" TEXT,
    "headquarters" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "securities" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "exchange" TEXT NOT NULL DEFAULT 'NGX',
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "listedShares" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "securities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prices" (
    "id" TEXT NOT NULL,
    "securityId" TEXT NOT NULL,
    "priceNgn" DECIMAL(18,4) NOT NULL,
    "changePct" DECIMAL(9,4) NOT NULL DEFAULT 0,
    "volume" BIGINT NOT NULL DEFAULT 0,
    "source" "DataSource" NOT NULL DEFAULT 'mock',
    "timestamp" TIMESTAMP(3) NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historical_prices" (
    "id" TEXT NOT NULL,
    "securityId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "closeNgn" DECIMAL(18,4) NOT NULL,
    "volume" BIGINT NOT NULL DEFAULT 0,
    "source" "DataSource" NOT NULL DEFAULT 'mock',

    CONSTRAINT "historical_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_statements" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "FinancialStatementType" NOT NULL,
    "period" "FinancialPeriod" NOT NULL DEFAULT 'annual',
    "fiscalYear" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "lineItems" JSONB NOT NULL,
    "source" "DataSource" NOT NULL DEFAULT 'mock',
    "timestamp" TIMESTAMP(3) NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dividends" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "amountPerShareNgn" DECIMAL(18,4) NOT NULL,
    "declaredDate" DATE,
    "exDate" DATE,
    "paymentDate" DATE,
    "type" TEXT NOT NULL DEFAULT 'final',
    "source" "DataSource" NOT NULL DEFAULT 'mock',
    "timestamp" TIMESTAMP(3) NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dividends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "url" TEXT,
    "sourceName" TEXT NOT NULL DEFAULT 'Seed Newsroom',
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "source" "DataSource" NOT NULL DEFAULT 'mock',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_article_companies" (
    "articleId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "news_article_companies_pkey" PRIMARY KEY ("articleId","companyId")
);

-- CreateTable
CREATE TABLE "watchlists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watchlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlist_items" (
    "id" TEXT NOT NULL,
    "watchlistId" TEXT NOT NULL,
    "securityId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "currentPeriodEnd" TIMESTAMP(3),
    "provider" TEXT NOT NULL DEFAULT 'stub',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_settings" (
    "id" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "displayName" TEXT NOT NULL,
    "priceMonthlyNgn" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "priceYearlyNgn" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "entitlements" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_scores" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "methodVersion" TEXT NOT NULL,
    "score" DECIMAL(6,2),
    "confidence" "ConfidenceLevel" NOT NULL,
    "dataCompleteness" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "breakdown" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_tokens_tokenHash_key" ON "auth_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "auth_tokens_userId_type_idx" ON "auth_tokens"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "companies_sector_idx" ON "companies"("sector");

-- CreateIndex
CREATE UNIQUE INDEX "securities_symbol_key" ON "securities"("symbol");

-- CreateIndex
CREATE INDEX "securities_companyId_idx" ON "securities"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "prices_securityId_key" ON "prices"("securityId");

-- CreateIndex
CREATE INDEX "historical_prices_securityId_date_idx" ON "historical_prices"("securityId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "historical_prices_securityId_date_key" ON "historical_prices"("securityId", "date");

-- CreateIndex
CREATE INDEX "financial_statements_companyId_type_idx" ON "financial_statements"("companyId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "financial_statements_companyId_type_period_fiscalYear_key" ON "financial_statements"("companyId", "type", "period", "fiscalYear");

-- CreateIndex
CREATE INDEX "dividends_companyId_fiscalYear_idx" ON "dividends"("companyId", "fiscalYear");

-- CreateIndex
CREATE INDEX "news_articles_publishedAt_idx" ON "news_articles"("publishedAt");

-- CreateIndex
CREATE INDEX "watchlists_userId_idx" ON "watchlists"("userId");

-- CreateIndex
CREATE INDEX "watchlist_items_watchlistId_idx" ON "watchlist_items"("watchlistId");

-- CreateIndex
CREATE UNIQUE INDEX "watchlist_items_watchlistId_securityId_key" ON "watchlist_items"("watchlistId", "securityId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "plan_settings_tier_key" ON "plan_settings"("tier");

-- CreateIndex
CREATE INDEX "stock_scores_companyId_idx" ON "stock_scores"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_scores_companyId_methodVersion_key" ON "stock_scores"("companyId", "methodVersion");

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "securities" ADD CONSTRAINT "securities_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "securities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_prices" ADD CONSTRAINT "historical_prices_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "securities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_statements" ADD CONSTRAINT "financial_statements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dividends" ADD CONSTRAINT "dividends_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_article_companies" ADD CONSTRAINT "news_article_companies_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "news_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_article_companies" ADD CONSTRAINT "news_article_companies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "watchlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "securities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_scores" ADD CONSTRAINT "stock_scores_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
