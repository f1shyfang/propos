# Implementation Plan — Hackathon MVP

**Team:** 3 full-stack developers | **Duration:** 48 hours | **Target:** Working demo proving the buyer's agent unified-platform value loop

> References: [Hackathon MVP Spec](./blueprint/10-hackathon-mvp-spec.md) (foundational plan), [API-SPEC](./API-SPEC.md) (endpoints), [COMPONENT-TREE](./COMPONENT-TREE.md) (UI structure), [DATA-MODEL](./DATA-MODEL.md) (schema + seed data), [Blueprint Doc 07](./blueprint/07-api-design-and-database-schema.md) (canonical schema).
>
> **Existing codebase:** Next.js 16 App Router + Supabase + Tailwind v4. Auth (login, signup, protected routes via middleware) already built. `src/app/` contains `login/`, `signup/`, `protected/` routes. `src/lib/supabase/` contains Supabase client utilities. No shadcn/ui primitives installed yet. **Early scaffold will migrate `protected/` → `(dashboard)/` route group.**

---

## 1. Pre-Hackathon Preparation (Week Before)

**Owner: All three, with Person C leading seed data quality.**

- [ ] **Write all seed data** (25 properties, 75 CMA records, risk overlays for 8+ suburbs, 3 buyer briefs, 75 match scores). Person C owns the `seed.sql` file. Verify it runs cleanly in Supabase SQL Editor before Hour 0.
- [ ] **Source 25 property photos** from Unsplash (Australian architecture — inner-city apartments, terrace houses, suburban homes). Save as `/public/images/properties/prop-001.jpg` through `prop-025.jpg`. Persons A and B assist with finding high-quality images. Do NOT use photos from Domain, REA, or any commercial listing portal.
- [ ] **Create Supabase project**, note the project ref and API keys. Write the migration SQL (all `CREATE TABLE`, `CREATE POLICY`, `CREATE INDEX`, and `seed.sql` INSERTs from [DATA-MODEL](./DATA-MODEL.md) §§1-4) into a single runnable script. Run it in the SQL Editor. Verify all tables exist and RLS policies are active.
- [ ] **Load seed data and verify.** Run `SELECT count(*) FROM properties` → 25. `SELECT count(*) FROM cma_records` → 75. `SELECT count(*) FROM match_scores` → 75 (25 properties × 3 briefs). Spot-check that at least one brief produces non-empty matches.
- [ ] **Verify auth flow** with demo users. Create `agent@demo.com` and `sarah@demo.com` in Supabase Auth. Test login via the existing `/login` page. Confirm middleware protects `/protected/` routes.
- [ ] **Install shadcn/ui primitives.** Run `npx shadcn@latest add button card input badge dialog select textarea tabs skeleton table sonner dropdown-menu` so they're available in `src/components/ui/` when coding starts.
- [ ] **Install @tanstack/react-query.** `npm install @tanstack/react-query`.
- [ ] **Create `.env.local.example`** with `NEXT_PUBLIC_SUPABASE_URL=` and `NEXT_PUBLIC_SUPABASE_ANON_KEY=` placeholders so new team members know what env vars are needed.
- [ ] **Agree on API contract.** Person A publishes the TypeScript interfaces and endpoint shapes from [API-SPEC](./API-SPEC.md) so Persons B and C can build against mocks if the live API isn't ready.

---

## 2. Person Assignments (Rebalanced from Doc 10)

### Person A — Backend Core (12–16 hours target)

**Focus:** All Route Handlers and Server Actions. No seed data, no matching engine runtime — all match scores are pre-seeded. All Server Actions live under `src/actions/`.

| Deliverable | File Location | Est. Hours |
|---|---|---|
| Route group migration — rename `protected/` → `(dashboard)/`, update middleware matchers, update login redirect from "/protected" to "/dashboard", update TECH-SPEC file structure | `src/app/(dashboard)/`, `src/middleware.ts` | 0.5 |
| **Create** `src/middleware.ts` — imports `updateSession` from `lib/supabase/middleware`, gates `/(dashboard)/*` (agent) and `/(portal)/*` (client) routes | `src/middleware.ts` (new file) | 1 |
| `GET /api/properties` — list with filters (suburb, type, beds, price range, offset-based `page`/`limit` pagination) | `src/app/api/properties/route.ts` | 2 |
| `GET /api/properties/[id]` — detail with CMA, risks, match scores from joined queries. **Note:** `days_on_market`, `description`, `features` are extracted from `raw_data` JSONB column | `src/app/api/properties/[id]/route.ts` | 1.5 |
| `GET /api/properties/[id]/comparables` — CMA records only | `src/app/api/properties/[id]/comparables/route.ts` | 0.5 |
| `GET /api/briefs` — list for agent | `src/app/api/briefs/route.ts` | 1 |
| `POST /api/briefs` — create (Server Action) | `src/actions/briefs.ts` | 2 |
| `GET /api/briefs/[id]` — detail with nested matches | `src/app/api/briefs/[id]/route.ts` | 1 |
| `GET /api/briefs/[id]/matches` — matches ranked by score | `src/app/api/briefs/[id]/matches/route.ts` | 1 |
| `GET /api/matches` — cross-brief match feed, filterable by `?brief_id=xxx` | `src/app/api/matches/route.ts` | 0.5 |
| `GET /api/shortlists` — list for a brief | `src/app/api/shortlists/route.ts` | 1 |
| `POST /api/shortlists` — add property (Server Action) | `src/actions/shortlists.ts` | 1 |
| `DELETE /api/shortlists/[id]` — remove property | `src/app/api/shortlists/[id]/route.ts` | 0.5 |
| `POST /api/feedback` — client feedback (Server Action) | `src/actions/feedback.ts` | 1.5 |
| `GET /api/feedback/poll` — polling endpoint (since timestamp, returns changed items) | `src/app/api/feedback/poll/route.ts` | 1.5 |
| `GET /api/portal/shortlists` — client portal shortlists | `src/app/api/portal/shortlists/route.ts` | 1 |
| Error handling + Zod validation on all Server Actions | — | 2 |

**Critical checkpoint (Hour 8):** `GET /api/properties` and `GET /api/properties/[id]` return seed data. `POST /api/briefs` creates a brief. `GET /api/matches?brief_id=xxx` works. Person B is unblocked.

**Stretch goal:** `user_actions` logging — if time permits, Person A adds `logAction()` calls to Server Actions for future analytics/ML.

### Person B — Agent Dashboard Frontend (16–19 hours target)

**Focus:** All agent-facing UI. Uses React Query for data fetching, Server Actions for mutations, URL search params for shareable filter state. Uses plain async Server Actions with `useTransition` for form submissions (simplest for hackathon). `PropertyDetail` is designed with optional section props (`showCMA`, `showRisks`, `showComparisons`) so Person C can reuse it in the client portal.

| Deliverable | File Location | Est. Hours |
|---|---|---|
| Tailwind v4 + shadcn compatibility fixes (CSS `@layer` adjustments). Person B owns this. | `src/app/globals.css` | 0.5 |
| `QueryClientProvider` — create `src/app/providers.tsx` wrapping children in `<QueryClientProvider>` | `src/app/providers.tsx` (new file) | 0.5 |
| Shared layout: sidebar + header + `DashboardLayout` wrapper | `src/components/layout/Sidebar.tsx`, `Header.tsx`, `DashboardLayout.tsx` | 3 |
| Login page adaption — style the existing `/login` page to match dashboard aesthetic | `src/app/login/page.tsx` (adapt) | 1 |
| Buyer brief creation wizard (6-step form: basic info, budget, property requirements, location, must-haves, strategy) | `src/app/(dashboard)/briefs/new/` + `src/components/briefs/` | 4 |
| Property list page with search bar + filter panel (suburb, type, beds, price range as filter chips) | `src/app/(dashboard)/properties/` + `src/components/properties/PropertyList.tsx`, `PropertyCard.tsx`, `src/components/shared/SearchBar.tsx`, `FilterPanel.tsx` | 3 |
| Property detail page — listing info, CMA table, risk badges, match score breakdown. **Client Component + React Query** fetching `GET /api/properties/[id]`. Designed with optional section props: `showCMA`, `showRisks`, `showComparisons` for Person C reuse. | `src/app/(dashboard)/properties/[id]/` + `src/components/properties/PropertyDetail.tsx`, `CMATable.tsx`, `RiskBadge.tsx` | 3 |
| Property comparison view — select 2–3 properties, side-by-side grid of price/beds/baths/CMA/risks/scores | `src/app/(dashboard)/properties/compare/` + `src/components/comparison/ComparisonView.tsx`, `ComparisonRow.tsx` | 3 |
| Shortlist management — tabs per brief, add/remove, share button, feedback status badges | `src/app/(dashboard)/shortlists/` + `src/components/shortlists/ShortlistView.tsx`, `ShortlistItem.tsx` | 2 |
| Feedback view — polling widget using `refetchInterval: 3000`, manual Refresh button. Uses `FeedbackDisplay` component (agent read-only). | `src/app/(dashboard)/shortlists/` (share page with Person C) + `src/components/shortlists/FeedbackDisplay.tsx` | 2 |
| Dashboard home — stats row, recent matches, client activity feed | `src/app/(dashboard)/page.tsx` | 1.5 |
| React Query hooks — 5 hook files: `use-properties.ts`, `use-briefs.ts`, `use-matches.ts`, `use-shortlists.ts`, `use-feedback.ts`. Set `staleTime: Infinity, gcTime: 30 * 60 * 1000` on all queries. | `src/hooks/use-properties.ts`, `use-briefs.ts`, `use-matches.ts`, `use-shortlists.ts`, `use-feedback.ts` | 3 |
| Loading skeletons, empty states, error boundaries | `src/components/shared/LoadingSkeleton.tsx`, `EmptyState.tsx`, `ErrorBoundary.tsx` | 2 |

**Critical checkpoint (Hour 16):** Brief wizard is functional (creates brief, redirects to matches). Property list with filters displays seed data. Property detail shows CMA + risks. Comparison view started.

### Person C — Client Portal + Seed Data + Polish (16–20 hours target)

**Focus:** Client-facing portal, seed data ownership, and late-stage support for Person A. Person A owns ALL APIs; Person C focuses on the client UI and seed data verification.

**All seed data MUST be written before the hackathon (see §1). During the event, Person C verifies it and handles the Client Portal build.**

| Deliverable | File Location | Est. Hours |
|---|---|---|
| **Pre-hackathon:** Write `seed.sql` (25 properties, 75 CMA records, risk data, 3 briefs, 75 match scores) | Committed to repo root as `seed.sql` | Done before Hour 0 |
| Verify seed data loads correctly, fix any issues | — | 1 |
| Client portal scaffold — `/portal/` route group with its own layout (no sidebar, client branding) | `src/app/(portal)/layout.tsx` | 1.5 |
| Client login page — email + password, redirects to `/portal` on success | `src/app/(portal)/login/page.tsx` (Server Action) | 1.5 |
| Client dashboard — shared shortlist gallery, property cards, feedback status per property | `src/app/(portal)/page.tsx` + `src/components/shared/PropertyCard.tsx` (reuse Person B's) | 3 |
| Property detail — reuses Person B's `PropertyDetail` with `showCMA`/`showRisks`/`showComparisons` prop configuration for client portal needs | `src/components/properties/PropertyDetail.tsx` (reuse Person B's) | 2 |
| Feedback UI — uses `FeedbackForm` component (client write): Interested / Need More Info / Not For Me button group + comment box | `src/components/shortlists/FeedbackForm.tsx` | 2 |
| Empty states — "No properties shared yet" for fresh client accounts | `src/components/shared/EmptyState.tsx` (reuse Person B's) | 0.5 |
| Polish — responsive design (property cards stack on mobile, modals → full-screen sheets), loading states | Across all client portal pages | 2 |
| **From Hour 18:** switch to helping Person A — pair on remaining API endpoints, debug integration issues, handle error cases | — | Balance of time |

**Critical checkpoint (Hour 16):** Client portal login works, shared shortlist renders, feedback submission posts to API. Client portal feedback UI complete. Seed data verified.

---

## 3. Hour-by-Hour Schedule

| Hour | Milestone | Owner |
|------|-----------|-------|
| **0–2** | **Scaffold.** Supabase migration SQL run. Seed data verified (25 props, 75 CMA, 75 scores). shadcn/ui primitives installed (`table sonner dropdown-menu` included). `@tanstack/react-query` provider set up by Person B in `src/app/providers.tsx`. API contract published. **Person A: migrate `protected/` → `(dashboard)/` route group**, rename folder, update middleware matchers and login redirect. Person A **creates** `src/middleware.ts` importing `updateSession` from `lib/supabase/middleware.ts`. Project structure: `src/app/(dashboard)/`, `src/app/(portal)/`, `src/components/`, `src/actions/`, `src/hooks/` directory scaffolding created. | **All** |
| **2–4** | Person A: Auth middleware verified. `GET /api/properties` returns seed data. Person B: `DashboardLayout` + `Sidebar` + login page styled. Person C: Client portal scaffold + verify all seed data associations. | **All** |
| **4–8** | Person A: `GET /api/properties/[id]` (detail + CMA + risks + scores). `POST /api/briefs` + `GET /api/briefs`. Person B: Buyer brief wizard — all 6 steps with form state, validation, submit via Server Action. Person C: Client portal login page + dashboard layout with shortlist gallery (mocked data). | **All** |
| **8–12** | Person A: `GET /api/briefs/[id]/matches`. `GET/POST /api/shortlists`. `DELETE /api/shortlists/[id]`. Person B: Property list page — `PropertyCard` grid, `SearchBar`, `FilterPanel` with URL search param sync. Integration with live `/api/properties`. Person C: Property detail modal in client portal. Feedback UI — button group + comment textarea. | **All** |
| **12–16** | Person A: `POST /api/feedback`. `GET /api/feedback/poll` (since-timestamp polling). `GET /api/portal/shortlists`. Person B: Property detail page — `PropertyDetail`, `CMATable`, `RiskBadge`, `ScoreBadge`. Comparison view — select 2–3 props, side-by-side grid. Person C: Client portal end-to-end: login → see shortlist → submit feedback → confirmation. | **All** |
| **16–20** | Person A: All endpoints complete. Add Zod validation to all Server Actions. Error handling (400/401/404/500 responses). Person B: Shortlist management — tabs per brief, add/remove, share button, feedback status badges. Feedback polling widget with `refetchInterval` + manual Refresh using `FeedbackDisplay` (agent read-only). Person C: Polish mobile UI for client portal. Empty/loading/error states. From Hour 18: help Person A with remaining API work. | **All** |
| **20–24** | **End-to-end integration begins.** All three merge branches to `main`. Full demo flow testing: create brief → see matches → property detail with CMA/risks → add to shortlist → share → client login → client feedback → agent poll. Fix integration bugs as they surface. | **All** |
| **24–30** | Core demo flow works end-to-end with all 3 buyer briefs. 3+ properties shortlisted per brief. Feedback loop verified (submit as client, see as agent within 3s). Comparison view functional (3 properties side-by-side). Side-by-side browser window setup verified (agent dashboard + client incognito). | **All** |
| **30–36** | **Polish.** Responsive design (desktop-first, then tablet/mobile). Loading skeletons on all data-dependent pages. Error boundaries on all route segments. Smooth transitions on approve/reject feedback. Clean up console errors and React warnings. | **B + C** |
| **36–42** | **Bug fixes only. Feature freeze.** No new code. Triage all known issues — fix what breaks the demo, leave cosmetic/nice-to-have issues. Test with the actual presentation machine. | **All** |
| **42–48** | **Demo rehearsal.** 3+ full dry runs with real timings (aim for 4 minutes). Pitch deck finalised. Backup plan: screenshots of every screen in case of network failure. Supabase connection verified on presentation machine. Side-by-side browser window tested on projector resolution. | **All** |

---

## 4. Dependency Order

What blocks what:

```
Supabase tables + seed data → API Route Handlers → React Query hooks → Pages
```

**Critical path (longest chain):**

```
Auth (existing) → GET /api/properties → Property List page → Property Detail page → Shortlist → Feedback loop
```

**Parallel paths:**

```
Person A: briefs API → matches API → shortlists API → feedback API → polling API
Person B: layout + login → brief wizard → property list + filters → property detail + comparison → shortlist UI + feedback UI
Person C: client portal (independent after auth, unblocked by Person A's endpoints — can mock)
```

**Integration dependencies:**

- Person B's brief wizard needs Person A's `POST /api/briefs` (ready by Hour 8)
- Person B's property list needs Person A's `GET /api/properties` (ready by Hour 4)
- Person B's shortlist + feedback views need Person A's shortlist/feedback endpoints (ready by Hour 16)
- Person C's client portal shortlists need `GET /api/portal/shortlists` (ready by Hour 16) — but Person C can develop against mock data until then
- Person C's feedback UI needs `POST /api/feedback` (ready by Hour 16)

---

## 5. Integration Checkpoints (Non-Negotiable)

| Checkpoint | Gate | If Not Met |
|---|---|---|
| **Hour 2** | All three machines running `npm run dev`. Seed data verified in Supabase. Auth works (login as both agent and client). | Stop. Fix infrastructure before writing feature code. |
| **Hour 8** | `GET /api/properties` returns 25 rows with filters. Buyer brief wizard submits successfully. Client portal scaffold renders. | Person A's API is the bottleneck. Person C drops client portal to pair with Person A on the remaining endpoints. Person B's wizard UI can be tested with mock `fetch`. |
| **Hour 16** | All CRUD APIs (briefs, properties, shortlists, feedback) working. Agent frontend shows properties with working search/filter. Client portal login works. | Feature-level triage: cut comparison view, simplify brief wizard to 3 steps (budget + suburbs + type), defer CMA. The demo core loop (brief → match → shortlist) must survive. |
| **Hour 24** | End-to-end demo flow works: create brief → see matches → add to shortlist → share. | 6-hour buffer (Hour 24–30) exists for exactly this. Merge all branches regardless of state. Debug integration issues as a group. |
| **Hour 30** | Full demo flow including client feedback loop (submit as client, poll as agent). Comparison view renders at least 2 properties side-by-side. | Cut comparison view entirely. Demo flow is brief → matches → shortlist → share → feedback. Trim demo script to 5 scenes. |
| **Hour 42** | **Feature freeze.** No new code. All known demo-breaking bugs fixed. Demo script timed at ≤4:30. | Fix only bugs that crash the app or produce visibly wrong data (wrong score, missing CMA, broken image). Everything else ships as-is. |

---

## 6. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Person A (backend) falls behind | Medium | Critical | Person C has full-stack skills and switches to backend support from Hour 18. Critical path endpoints (properties, briefs, shortlists) get priority. Polling and portal endpoints can be simplified (skip `since` filtering, return full shortlist). |
| Seed data not realistic enough | Medium | High | Pre-write seed data before hackathon. Person C owns quality — descriptions must read like genuine Domain/REA listings. Spot-check 25% of CMA records for plausible prices. |
| Supabase connection issues (network, auth) | Low | Critical | All API data is pre-seeded in Supabase — if connection drops, the demo is dead. Test Supabase connectivity on the presentation machine in Hour 0 and again in Hour 42. Have screenshots of every screen as offline fallback. |
| Integration bugs at merge time | High | Medium | 6 hours allocated (Hour 24–30) exclusively for integration. All three devs share a single `main` branch with frequent commits — no 24-hour feature branches. Merge early and often from Hour 20. |
| Demo internet failure | Medium | High | Run locally (`npm run dev` on presenter's machine). Supabase is cloud-hosted — if WiFi is unreliable, present from screenshots. Have the pitch deck include appendix slides with all screens. |
| CORS/auth issues between agent + client SPAs | Medium | Medium | Both SPAs are in the same Next.js app on the same origin (`localhost:3000`). Supabase Auth cookies (HTTP-only, SameSite=Lax) work transparently across `/protected` and `/portal` route groups. Test multi-tab auth early (Hour 4). |
| Person C runs out of work after seed data | Low | Low | Person C has frontend skills. After seed data verification and client portal core, switch to helping Person B with comparison view polish or Person A with remaining API endpoints. |
| `better-sqlite3` native module fails on Apple Silicon | Low | — | **Not applicable.** This project uses Supabase (hosted PostgreSQL), not SQLite. No native module risk. |
| shadcn/ui component conflicts with Tailwind v4 | Medium | Low | Tailwind v4 has breaking changes vs v3. shadcn/ui components may need manual `@layer` directive adjustments. Test `npx shadcn@latest add button card` in Hour 0 and fix any className issues immediately. Person B owns CSS fixes with a 30-min buffer. |
| `sonner` toast compatibility with Tailwind v4 | Low | Low | `sonner` works with Tailwind v4 via its CSS import. Test in Hour 0. |

---

## 7. Demo Script (4 Minutes, 6 Scenes)

**Setup:** Both browser windows (agent dashboard + client incognito) visible side-by-side on screen throughout.

### Scene 1 — Problem (30s)

Show a mock slide or screenshot of 6 different browser tabs open: Domain, REA, CoreLogic, Gmail, WhatsApp, spreadsheet. Narrator: "Buyer's agents juggle 6 to 8 tools per client. We built the single platform that replaces all of them."

### Scene 2 — Create Brief (45s)

Log in as agent (pre-filled credentials). Dashboard loads. Click "New Buyer Brief." Fill out the brief for Sarah & Tom: budget $800K–$1.1M, Surry Hills/Newtown/Pyrmont, 2+ bed apartment, must-haves: natural light, near transport, internal laundry. Submit. Confirmation toast.

### Scene 3 — Discover Matches (45s)

Navigate to "Properties" tab. Pre-filtered matches sorted by score. Click top match (89/100). Property detail shows listing info, CMA table (2 comparable sales), risk badges (heritage medium, flood low). "CMA, risk data, listing details — all in one view."

### Scene 4 — Comparison View (30s)

Select 3 top matches. Side-by-side comparison grid: photos, prices, beds/baths, CMA ranges, risk badges, match scores (89/76/72). "This is what you can't do in a spreadsheet. The platform compares, scores, and surfaces due diligence simultaneously."

### Scene 5 — Client Feedback Loop (60s)

Switch to client incognito window. Log in as Sarah. Shortlist loads with 3 properties. Mark "Interested" on two properties, "Need More Info" on one with comment: "Worried about strata fees." Switch back to agent dashboard. Feedback appears via polling (or manual Refresh). "The agent sees exactly what the client thinks, in real time. One platform, one workflow."

### Scene 6 — Vision (30s)

"This is what we built in 48 hours — the core loop of brief, match, shortlist, feedback. The full platform adds live data integrations with Domain and CoreLogic, AI-powered matching, due diligence automation, offer management, auction tracking, and settlement management — all six phases of the buyer's journey in one operating system."

---

## 8. Environment Setup Checklist (Hour 0)

Run on each team member's machine:

- [ ] `git pull origin main` — latest code
- [ ] `npm install` — install dependencies (including new: `@tanstack/react-query`)
- [ ] Copy `.env.local` with Supabase `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `npx shadcn@latest add button card input badge dialog select textarea tabs skeleton table sonner dropdown-menu` — install UI primitives
- [ ] `npm run dev` — verify app starts on `localhost:3000`
- [ ] Open `/login` — log in as `agent@demo.com`, verify redirect to `/dashboard` (after route group migration)
- [ ] Open Supabase SQL Editor — paste and run the migration + seed SQL script
- [ ] Verify: `curl http://localhost:3000/api/properties` returns 25 rows (once Person A builds the endpoint)
- [ ] Verify: property images load at `/images/properties/prop-001.jpg`
- [ ] Person B creates `QueryClientProvider` in `src/app/providers.tsx` and wraps root layout

---

*Version: 1.1 | Last Updated: 2026-05-23* — Fixes: route group migration to (dashboard), GET /api/matches added to Person A, path conventions standardized, /api/v1 removed, property detail uses Client Component + React Query, shadcn components (table, sonner, dropdown-menu) added, src/middleware.ts creation assigned, Person A hours corrected to 12-16h, React Query hooks assigned to Person B (+3h), QueryClientProvider assigned to Person B, Person C static endpoints removed, FeedbackDisplay/FeedbackForm split, cursor→page/limit pagination, PropertyDetail reuse with optional props, env.local.example added, Tailwind v4 compat note added, Server Actions use plain async + useTransition documented, user_actions marked as stretch goal, staleTime: Infinity / gcTime: 30min on all React Query queries.

---

## Implementation Tasks

Synthesized from this review's findings. Run with Claude Code; checkbox as you ship.

- [ ] **T1 (P0, human: ~30min / CC: ~5min)** — supabase + src/lib/supabase — Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local.example` and create `src/lib/supabase/admin.ts` with `createAdminClient()` using the service role key
  - Surfaced by: Architecture D2 — clients cannot UPDATE shortlists via anon-key RLS; service role bypasses RLS for feedback writes
  - Files: `.env.local.example`, `src/lib/supabase/admin.ts`
  - Verify: `POST /api/feedback` as Sarah's session successfully updates `shortlists.status` and `feedback_text`

- [ ] **T2 (P0, human: ~5min / CC: ~2min)** — supabase/migrations — Add agent SELECT policy on `shortlists`
  - Surfaced by: Architecture D3 — no SELECT policy for agents; agent calls to `GET /api/shortlists` return empty arrays
  - Files: `supabase/migrations/0002_schema.sql`
  - Verify: `SELECT * FROM shortlists` as `agent@demo.com` in Supabase SQL Editor returns rows
  - SQL: `CREATE POLICY "Agents read shortlists for own briefs" ON shortlists FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM buyer_briefs WHERE id = shortlists.buyer_brief_id AND agent_id = auth.uid()));`

- [ ] **T3 (P2, human: ~10min / CC: ~2min)** — src/app/api/shortlists — Guard `POST /api/shortlists`: return 400 if `brief.client_id` is null
  - Surfaced by: Architecture D4 — Briefs 2+3 have `client_id = NULL`; unchecked INSERT throws Postgres NOT NULL violation (500 crash)
  - Files: `src/app/api/shortlists/route.ts`
  - Verify: `POST /api/shortlists` with `buyer_brief_id` = Brief 2 returns `{"error":"Brief has no linked client"}` with status 400

- [ ] **T4 (P3, human: ~5min / CC: ~2min)** — src — Delete `src/proxy.ts`; remove stale `/protected` routing from `src/lib/supabase/middleware.ts`
  - Surfaced by: Code Quality D5 — both files reference `/protected` (migrated to `(dashboard)`); neither is loaded by Next.js middleware
  - Files: `src/proxy.ts` (delete), `src/lib/supabase/middleware.ts` (strip stale routing)
  - Verify: `src/proxy.ts` absent; `src/lib/supabase/middleware.ts` contains no references to `/protected`

- [ ] **T5 (P2, human: ~15min / CC: ~3min)** — src/app/api/properties — Use single nested Supabase select in `GET /api/properties/[id]`
  - Surfaced by: Performance D6 — 4 sequential queries = 200–600ms extra latency; nested select is one round-trip
  - Files: `src/app/api/properties/[id]/route.ts`
  - Pattern: `supabase.from('properties').select('*, cma_records(*), risk_overlays(*), match_scores(*)').eq('id', id).single()`
  - Verify: property detail page loads in < 200ms (measured via browser DevTools Network tab)

- [ ] **T6 (P2, human: ~5min / CC: ~2min)** — docs — Document in TECH-SPEC: `GET /api/portal/shortlists` must NOT join `buyer_briefs` (clients cannot read that table via RLS)
  - Surfaced by: Code Quality finding — `buyer_briefs` RLS is `agent_id = auth.uid()` only; portal join silently returns null brief data
  - Files: `docs/TECH-SPEC.md`
  - Correct portal query: `supabase.from('shortlists').select('*, property:properties(*)').eq('client_id', user.id)`

---

## NOT in Scope

- Live API integrations (Domain, REA, CoreLogic) — deferred (API keys, rate limits)
- Real AI/ML matching engine — pre-computed scores in seed data suffice
- Off-market hub, offer letters, auction tracker — Phase 2/5 features
- Document upload, email/SMS notifications, payment/subscription — deferred
- Multi-tenancy / RBAC beyond two hardcoded demo users
- Map view — 4+ hours for marginal demo value
- WebSockets — polling via React Query is sufficient
- Kanban/pipeline board — status column on shortlist table suffices
- Comparison view test automation — manual demo verification sufficient for hackathon
- `user_actions` event logging — stretch goal only (per Person A's plan)

---

## What Already Exists

| Component | File | Status |
|---|---|---|
| Supabase auth (login/signup/signOut) | `src/app/login/actions.ts` | Complete, working |
| Session refresh middleware | `src/lib/supabase/middleware.ts` | Complete (note: `updateSession` has stale /protected routing — T4) |
| Route protection + role-based redirect | `src/middleware.ts` | Complete |
| Supabase clients (browser, server, middleware) | `src/lib/supabase/` | Complete |
| QueryClientProvider | `src/app/providers.tsx` | Complete (`staleTime: Infinity, gcTime: 30min`) |
| TypeScript types | `src/lib/types.ts` | Complete |
| Root layout with Providers + metadata | `src/app/layout.tsx` | Complete |
| Agent dashboard placeholder | `src/app/(dashboard)/dashboard/page.tsx` | Scaffold only |
| Client portal placeholder | `src/app/(portal)/portal/page.tsx` | Scaffold only |
| Client portal login page | `src/app/(portal)/login/page.tsx` | Complete |
| Database schema + RLS + indexes | `supabase/migrations/0002_schema.sql` | Complete (missing 2 policies — T1, T2) |
| Full seed data (25 props, 75 CMA, 75 scores) | `supabase/migrations/0003_seed.sql` | Complete |

---

## Failure Modes

| Codepath | Realistic Failure | Test | Error Handling | User Experience |
|---|---|---|---|---|
| `POST /api/feedback` (admin client) | `SUPABASE_SERVICE_ROLE_KEY` missing → crash on `createAdminClient()` | None | Needs try/catch returning 500 | Error toast — NOT silent (T1 prevents this) |
| `POST /api/shortlists` (null client_id) | Postgres NOT NULL violation → 500 | None | Guard added via T3 | 400 error message — not silent after T3 |
| `GET /api/properties/[id]` (sequential) | Timeout on 2nd/3rd query after 1st succeeds → partial data | None | Single nested select (T5) fails atomically | Rendering error or partial CMA — T5 prevents |
| Agent shortlists SELECT | Empty array (no RLS policy) → blank shortlist UI | None | T2 adds policy | Silent blank screen — T2 prevents |
| Client feedback UPDATE (without admin client) | RLS rejection → silent 204 with no data change | None | T1 (service role) prevents | Feedback appears submitted but doesn't save — T1 prevents |

No critical gaps remain after T1–T6 are applied.

---

## Worktree Parallelization

The plan already defines parallel lanes matching Person A, B, C assignments. No additional worktree strategy needed — the plan's lanes are:

| Lane | Modules touched | Depends on |
|---|---|---|
| A (backend) | `src/app/api/`, `src/actions/`, `supabase/` | Auth (done) |
| B (frontend, agent) | `src/app/(dashboard)/`, `src/components/`, `src/hooks/` | Lane A (Hour 8 checkpoint) |
| C (frontend, client) | `src/app/(portal)/`, `src/components/shared/` | Lane A (Hour 16), Lane B (PropertyDetail component) |

**Execution:** Launch Lanes A + B in parallel from Hour 0. Lane C starts Hour 2 (after seed verification). All three merge to `main` from Hour 20.

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 5 issues, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **UNRESOLVED:** 0 unresolved decisions
- **VERDICT:** ENG CLEARED — all 5 issues addressed, 0 critical gaps. Ready to implement.
