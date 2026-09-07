# Stock Marketcap (MVP)

Nigerian equity research & portfolio-intelligence platform — "Simply Wall St for
the Nigerian Exchange." This is the **MVP build only**; Phase 2+ features
(AI assistant, portfolio tracker, valuation models, mobile apps) are out of scope.

> ⚠️ **All market & financial data in this build is mock/seed data**
> (`source = 'mock'` in the DB). Nothing here is live market data or investment
> advice. No buy/sell recommendations are produced anywhere.

## Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS — `apps/web`
- **Backend:** NestJS, API under `/api/v1` — `apps/api`
- **Shared types:** `packages/shared`
- **DB:** PostgreSQL + Prisma (migrations from day one)
- **Cache:** Redis
- **Infra (local only):** Docker Compose for Postgres + Redis. No CI/CD or cloud yet.

## Prerequisites

- Node.js >= 20, pnpm >= 10
- Docker (for Postgres + Redis)

## Getting started

```bash
cd stock-marketcap
cp .env.example .env
cp .env.example apps/api/.env   # api reads its own .env too

pnpm install
pnpm infra:up                   # start Postgres + Redis
pnpm --filter @stockmc/api prisma:generate
pnpm db:migrate                 # create schema
pnpm db:seed                    # load mock NGX companies

pnpm dev                        # runs web (:3000) + api (:4000) in parallel
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1/health

## Layout

```
stock-marketcap/
├── apps/
│   ├── api/          # NestJS API (/api/v1)
│   │   └── prisma/   # schema + migrations + seed
│   └── web/          # Next.js frontend
├── packages/
│   └── shared/       # shared TS types, enums, entitlements, score contracts
├── docker-compose.yml
└── .env.example
```

## Guardrails (non-negotiable)

- No fabricated financial data — mock data is labeled `source = 'mock'` in the DB.
- No unrestricted buy/sell language — neutral, metric-based phrasing only.
- Every derived metric (score, ratio) is traceable: method + inputs stored.
- Subscription entitlement checks are enforced **server-side** only.
