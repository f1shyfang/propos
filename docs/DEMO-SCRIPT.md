# Demo Script — Buyer's Agent E2E Presenter Script

**Date:** 2026-05-24  
**Status:** Aligned to current app

Concise presenter script for a live buyer's-agent demo. Automated coverage: `pnpm test:e2e`. See `e2e/README.md`.

---

## Setup

| Window | URL | Role |
|--------|-----|------|
| Agent | `http://localhost:3000` | Agent (dev auth) |
| Client | `http://localhost:3000/portal` (incognito) | Sarah (`pnpm seed:demo`) |

**Before demo:** `DATABASE_URL`, property seed, `pnpm seed:demo`, `pnpm db:push` (new tables). Optional: `pnpm seed:cma`, `pnpm seed:demo-pdfs` for static `/demo_reports/*.pdf` fallbacks.

---

## Phase 0 — Opening pitch (10–15s)

- **UI:** `/dashboard`
- **Say:** "We'll run the buyer's-agent lifecycle in Propos: brief, match, shortlist, valuation, outreach, offer, due diligence, unconditional, and invoice — in one platform."

---

## Phase 1 — Create brief (60s)

- **UI:** `/briefs/new` → **Create brief**
- **Fields:** Sarah & Tom, budget 800k–1.1M, Surry Hills / Newtown / Pyrmont, Apartment, beds ≥ 2, balcony, ground-floor deal-breaker, Pre-Approved
- **Result:** `/briefs/<id>?tab=matches` (legacy `/briefs/<id>/matches` redirects here)

---

## Phase 2 — Matching (60s)

- **UI:** `/briefs/<id>?tab=matches` — top matches, score breakdown (Budget / Location / Features)

---

## Phase 3 — Valuation / CMA (60–90s)

- **Option A:** `/properties/<id>` — comparables + valuation gap
- **Option B:** Deal **CMA** tab → **Generate CMA PDF**
- **Fallback:** `/demo_reports/cma_42_union.pdf` after `pnpm seed:demo-pdfs`

---

## Phase 4 — Contact / outreach (30–60s)

- **UI:** Property detail → **Contact agent** → template **Intro + Anonymised buyer brief** → **Send & log**
- **UI:** **Recent activity** shows logged outreach

---

## Phase 5 — Shortlist & share (30–45s)

- **UI:** **Add to Shortlist** → **Share** (property) or **Mark all shared** (brief shortlist)
- **Client:** `/portal` shortlist

---

## Phase 6 — Client feedback (45–60s)

- **Client:** Interested + comment; another **Not For Me**
- **Agent:** `/dashboard` feedback or brief shortlist tab

---

## Phase 7 — Create deal & offer (60–90s)

- **Create deal:** Brief shortlist (after **interested** feedback) or property detail
- **UI:** Deal **Offer** tab → amount, status, conditions → **Save offer details** → **Generate offer PDF**

---

## Phase 8 — Negotiation (45–90s)

- **UI:** Offer status → counter_offer → accepted; **Offer history** timeline below documents
- **Say:** "Every change is timestamped on the deal record."

---

## Phase 9 — Under contract & milestones (45–60s)

1. Deal status → **Under Contract**
2. **Settlement** tab → exchange + settlement dates → **Generate milestone timeline**

---

## Phase 10 — Due diligence (2–4 min)

- **UI:** **Due Diligence** tab — checklist + upload (S3 required for uploads)
- **Fallback contract PDF:** `/demo_reports/contract_42_union_signed.pdf`

---

## Phase 11 — Unconditional (30–60s)

- **UI:** Deal status → **Unconditional**
- **Say:** "Conditions cleared — ready for settlement and final fee."

---

## Phase 12 — Invoice (30–60s)

- **UI:** Deal **Documents** tab → **Generate invoice PDF** (under_contract / unconditional / settled)
- **Fallback:** `/demo_reports/invoice_42_union.pdf`

---

## Phase 13 — Closing (30s)

- **UI:** Deal **Documents** + `/docs`

---

## E2E mapping

| Phase | `e2e/demo-flow.spec.ts` |
|-------|---------------------------|
| 1–3 | create brief, redirect, matches, CMA |
| 4 | outreach logged |
| 5–6 | shortlist, share, feedback |
| 7–8 | deal, offer, offer history events |
| 9–11 | under_contract, DD, unconditional |
