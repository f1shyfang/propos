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

## UI smoke

Browser checks run automatically after the API flow (`ui` project depends on `api`). IDs are written to `test-results/demo-ids.json`.

Install Chromium once:

```bash
pnpm test:e2e:install
```

Run only UI smoke (after a prior full run or with env vars):

```bash
pnpm test:e2e e2e/demo-flow.ui.spec.ts --project=ui
```
