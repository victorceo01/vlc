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
pnpm --filter @stockmc/shared build
pnpm db:migrate                 # create schema
pnpm --filter @stockmc/api seed:all   # load mock NGX data + compute scores

pnpm dev                        # runs web (:3000) + api (:4000) in parallel
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1/health

### Demo accounts (seeded)

| Role  | Email                        | Password   |
|-------|------------------------------|------------|
| Admin | admin@stockmarketcap.local   | admin1234  |
| User  | demo@stockmarketcap.local    | demo1234   |

Email verification / password-reset links are printed to the API console in dev
(`MAIL_TRANSPORT=console`). Use the **Pricing** page's demo toggle to switch a
logged-in account between Free and Pro (no real billing in the MVP).

## View it on your phone (temporary public link)

The app calls its API **same-origin** (the Next server proxies `/api/*` to the
API), so a single tunnel to the web port works for everything — pages, data,
and login — with no CORS or cookie setup.

1. Start the stack on your computer (see "Getting started" above), then run
   `pnpm dev` (or `pnpm --filter @stockmc/web start` after a build).
2. In another terminal, expose the **web** port with a free tunnel:

   ```bash
   # Cloudflare (no signup):
   npx cloudflared tunnel --url http://localhost:3000
   # …or ngrok:
   ngrok http 3000
   ```

3. Open the printed `https://…` URL on your phone. Log in with a demo account.

Notes:
- Tunnel **port 3000 only** (the web app) — not 4000. The API is reached
  internally via the proxy.
- The public URL changes each run (fine for demos). For a permanent URL, deploy
  properly (web + API + managed Postgres/Redis).
- Google OAuth stays disabled unless you configure it; email/password works.

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
