# Demo end-to-end tests

Exercises the buyer's-agent demo lifecycle over HTTP (brief → matches → shortlist → portal feedback → deal → offer → under contract → due diligence).

## Prerequisites

1. `DATABASE_URL` in `.env.local`
2. Properties in the database (`scripts/populate.ts`)
3. Demo client linked: `pnpm seed:demo` (links `sarah@demo.com` for share + portal)

Optional: `pnpm seed:cma` if the lead property has no suburb comparables.

## Run

```bash
pnpm test:e2e
```

Starts `pnpm dev` automatically unless a server is already on port 3000.

## Optional UI smoke

```bash
pnpm test:e2e:install
PLAYWRIGHT_UI=1 DEMO_E2E_BRIEF_ID=… DEMO_E2E_PROPERTY_ID=… DEMO_E2E_DEAL_ID=… \
  pnpm test:e2e e2e/demo-flow.ui.spec.ts
```

After an API run, copy the JSON line printed by `expose ids for optional UI smoke run`.
