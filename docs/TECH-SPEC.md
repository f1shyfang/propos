# Technical Specification — Hackathon MVP

**Project:** Buyers Agent Platform (48-hour hackathon, 3-person team)
**Base:** `hack48-bloomberg/`

---

## 1. Architecture Overview

The entire platform runs as a **Next.js 16 App Router monolith** — a single process serving pages, API routes, and static assets. No separate backend service, no Docker Compose, no message queues. Supabase provides hosted Postgres, auth, and storage. The architecture follows the modular-monolith principle described in `docs/blueprint/05-system-architecture.md` §1.2.

```
Browser ──► Next.js Server (Vercel / localhost:3000)
               ├── Server Components (SSR data-fetching from Supabase)
               ├── Client Components (React Query + Supabase browser client)
               ├── Route Handlers (API routes: /api/*)
               └── Middleware (session refresh, route protection)
                      │
                      ▼
              Supabase (Postgres + Auth + Storage + RLS)
```

All data is pre-seeded via SQL migration files — no live external API calls during the demo (per `docs/blueprint/10-hackathon-mvp-spec.md` §2.6 and `docs/blueprint/06-data-architecture-and-integration.md` §6.3).

---

## 2. Stack Decisions

| Layer | Choice | Rationale |
|---|---|---|
| **Framework** | Next.js 16.2.6 (App Router) | Already scaffolded. File-based routing, Server Components for data-fetching without client waterfalls, Route Handlers as API endpoints. Shared TypeScript types across the full stack. |
| **Database + Auth + Storage** | Supabase (Postgres) | Already integrated. Hosted Postgres with built-in email/password auth, Row-Level Security, and free tier. `src/lib/supabase/` already has `client.ts` (browser), `server.ts` (Server Components), and `middleware.ts` (session refresh). Eliminates managing a database server. |
| **Styling** | Tailwind v4 + shadcn/ui | Already in `package.json` (Tailwind v4, `@tailwindcss/postcss`). shadcn/ui copy-paste primitives (cards, tables, buttons, forms) for instant polished UI. |
| **Type Safety** | TypeScript 5 | Already in `package.json`. Catch bugs at compile time with zero runtime overhead. |
| **Server State + Polling** | `@tanstack/react-query` | One-line polling (`refetchInterval: 3000`) for client feedback loop. Built-in caching, loading/error states, and stale-while-revalidate. |
| **Hosting** | Vercel (free tier) or local dev | `git push` → deployed. Fallback: `npm run dev` on the presenter's machine. |

**Why not:** No PostgreSQL server to manage (Supabase handles it). No separate Express/FastAPI backend (Next.js Route Handlers serve API routes). No Docker (single `npm run dev` starts everything). No WebSockets (React Query polling replaces real-time infrastructure — per MVP spec §1.4).

---

## 3. Data Flow

```
Server Components ──direct SQL──► Supabase
        │                          (via supabase-js server client
        │                           in src/lib/supabase/server.ts)
        ▼
   Rendered HTML ──► Browser

Client Components ──React Query──► Supabase
        │                          (via supabase-js browser client
        │                           in src/lib/supabase/client.ts)
        ▼
   Interactive UI (forms, feedback buttons, side-by-side comparison view)
```

- **Server Components** (property listing pages, detail views) fetch directly from Supabase using `src/lib/supabase/server.ts`. Data is rendered on the server — no loading spinners, sub-200ms page loads.
- **Client Components** (buyer brief form, client feedback buttons, shortlist actions) use React Query + `src/lib/supabase/client.ts`. Polling for client feedback: `useQuery({ refetchInterval: 3000 })`.
- **Auth flow:** Middleware in `src/lib/supabase/middleware.ts` refreshes the Supabase session cookie on every request. `src/middleware.ts` (created by Person A in Hour 0-2) gates protected routes under `/(dashboard)/*` (agent dashboard) and `/(portal)/*` (client portal). Auth pages at `/login` and `/signup` already working e2e.

---

## 4. State Management

| Concern | Tool | Scope |
|---|---|---|
| **Server state** (properties, briefs, shortlists, feedback) | React Query | Caching, background refetch, polling at 3s interval |
| **Client UI state** (form inputs, filter toggles, selection) | `useState` / `useReducer` | Component-local |
| **Auth state** | Supabase session cookie + `updateSession` middleware | Session refreshed on every request via `src/lib/supabase/middleware.ts` |

No global state store (Redux, Zustand) is needed for MVP. Server state flows through React Query; UI state is ephemeral and component-local.

---

## 5. Auth Strategy

The existing Supabase email/password auth stack (at `src/lib/supabase/`) is extended minimally:

- **Agent role:** Default. A `role` column in Supabase `auth.users` metadata (set via raw SQL trigger or manual seed) distinguishes agent vs. client.
- **Client role:** Same Supabase auth, assigned `role: 'client'` via metadata. A client is linked to their buyer brief by `user_id` in the `buyer_briefs` table.
- **Middleware protection:** `src/lib/supabase/middleware.ts` is extended to protect `/(dashboard)/*` (agent-only) and `/(portal)/*` (client-only), redirecting to `/login` if unauthenticated.
- **Demo users:** Two hardcoded accounts seeded via a SQL migration:
  - Agent: `agent@demo.com` — pre-linked to 3 buyer briefs and shortlists
  - Client (Sarah): `sarah@demo.com` — pre-linked to shared shortlists with feedback

Supabase RLS policies at the database level enforce that clients can only see properties shared by their agent.

---

## 6. File Structure Strategy

```
src/
├── middleware.ts                  # Route protection — imports updateSession from lib/supabase/middleware
├── app/                          # App Router pages + Route Handlers
│   ├── layout.tsx                # Root layout (already exists)
│   ├── page.tsx                  # Landing page
│   ├── login/                    # Email/password login (already exists: page.tsx + actions.ts)
│   ├── signup/                   # Sign-up page (already exists)
│   ├── (dashboard)/              # (agent) Agent dashboard route group
│   │   ├── layout.tsx            # Agent shell (sidebar, header)
│   │   ├── page.tsx              # /dashboard — agent overview
│   │   ├── briefs/               # Buyer brief CRUD
│   │   ├── properties/           # Property search, list, detail, comparison
│   │   └── shortlists/           # Shortlist management, client feedback view
│   ├── (portal)/                 # (client) Client portal route group
│   │   ├── layout.tsx            # Client shell
│   │   ├── login/                # Client login
│   │   └── page.tsx              # /portal — client dashboard
│   └── api/                      # REST API Route Handlers (no /v1 prefix — /v1 added post-MVP)
│       ├── briefs/
│       ├── properties/
│       ├── matches/
│       ├── shortlists/
│       ├── feedback/
│       └── portal/
├── actions/                      # Server Actions ("use server")
│   ├── briefs.ts
│   ├── shortlists.ts
│   └── feedback.ts
├── components/                   # Shared React components
│   ├── ui/                       # shadcn/ui primitives (button, card, input, table, badge, dialog, dropdown-menu)
│   ├── layout/                   # Header, sidebar, shell
│   ├── briefs/                   # Brief form, brief card
│   ├── properties/               # Property card, property detail, comparison view
│   └── shortlists/               # Shortlist table, FeedbackDisplay (agent), FeedbackForm (client)
├── lib/                          # Shared libraries
│   ├── supabase/                 # Supabase clients (already exists: client.ts, server.ts, middleware.ts)
│   ├── types.ts                  # Shared TypeScript types (Brief, Property, Shortlist, Feedback)
│   └── utils.ts                  # Formatters, helpers
└── hooks/                        # React Query hooks
    ├── use-briefs.ts             # useBriefs, useCreateBrief, etc.
    ├── use-properties.ts         # useProperties, usePropertyDetail
    ├── use-shortlist.ts          # useShortlist, useShareShortlist
    └── use-feedback.ts           # useFeedback, useSubmitFeedback (with refetchInterval)
```

This layout mirrors existing patterns: route groups (`/(dashboard)/*`, `/(portal)/*`) as sibling `src/app/` directories, each with its own `layout.tsx`. API routes live under `src/app/api/` as Next.js Route Handlers — no `/v1` version prefix until post-MVP. Server Actions live under `src/actions/`.

---

## 7. Key Technical Decisions

1. **Server Components for data-fetching pages where appropriate.** Brief lists, brief detail, and client lists render on the server via `src/lib/supabase/server.ts`. Property list and detail pages use Client Components + React Query against `/api/properties` and `/api/properties/[id]` Route Handlers for consistency with the filter/search/polling UX. Target: sub-200ms page loads with instant HTML delivery.

2. **Client Components where interactivity is needed.** Forms (buyer brief creation), feedback buttons (approve/reject/comment), polling feedback widget, property list (search/filter), property detail, and comparison view are Client Components. Brief lists and dashboards stay server-rendered.

3. **Pre-computed seed data in SQL migration files.** All 25 properties, 75 CMA records, 3 buyer briefs, risk overlays, and match scores are seeded via Supabase migrations. NOT fetched from Domain/REA/CoreLogic APIs during the demo. The matching engine code exists and is unit-testable, but match scores are loaded from the seed database (per `docs/blueprint/10-hackathon-mvp-spec.md` §2.6).

4. **All API routes are Next.js Route Handlers.** `POST /api/briefs`, `GET /api/properties`, `POST /api/feedback`, etc. No separate API server. No `/v1` prefix — versioning deferred to post-MVP.

5. **Polling at 3-second interval for client feedback.** `useQuery({ refetchInterval: 3000 })` with a manual "Refresh" button as fallback. The demo presenter keeps agent dashboard and client incognito window side-by-side, making polling delay invisible.

6. **No ORM.** Direct Supabase JS queries (`supabase.from('properties').select('*')`). Prisma adds migration complexity and an extra layer between the code and the database. Supabase's SDK is already set up and provides typed queries, RLS enforcement, and real-time subscriptions without additional tooling.

7. **Hardcoded demo accounts, no registration flow.** Users are seeded via SQL. The login form at `/login` is a demo entry point only.

---

## 8. Performance Targets

| Metric | Target | How |
|---|---|---|
| **Page load (Server Components)** | <200ms | Server-rendered HTML with direct Supabase queries — no client waterfalls |
| **UI feedback on interaction** | Instant (<50ms) | Optimistic updates via React Query `onMutate` for approve/reject/shortlist actions |
| **Polling freshness** | ≤3 seconds | React Query `refetchInterval: 3000` for client feedback |
| **Loading spinners** | None visible during demo | Server Components render data on the server; demo presenter pre-loads pages |

The overriding rule: the demo must look fast and polished. No visible spinners, no loading skeletons, no client-side waterfalls. Server Components deliver pages pre-rendered with data. Client interactions use optimistic updates so the UI responds before the server confirms.

**Server Actions pattern:** Use plain async Server Actions with `useTransition` for form submissions — simplest approach for a hackathon. No `useActionState` needed.

---

## 9. Setup Notes

### 9.1 package.json
Rename `"name"` from `"hack48-ndis"` to `"buyers-agent"` during scaffold.

### 9.2 Metadata
Update `layout.tsx` metadata `title` and `description` from the default "Create Next App" to "BuyersAgent" and appropriate demo description.

### 9.3 Environment Variables
Create `.env.local.example` with placeholders:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 9.4 Data Flow Note
`days_on_market`, `description`, and `features` are extracted from the `raw_data` JSONB column on `properties` (see DATA-MODEL.md seed examples). API endpoints should parse `raw_data` to surface these fields.

---

## References

- System architecture: `docs/blueprint/05-system-architecture.md`
- Data architecture & seed strategy: `docs/blueprint/06-data-architecture-and-integration.md`
- MVP scope & demo script: `docs/blueprint/10-hackathon-mvp-spec.md`
- Existing Supabase clients: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`
- Current dependencies: `package.json`

*Version: 1.1 | Last Updated: 2026-05-23* — Fixes: route group `src/app/app/` → `src/app/(dashboard)/`, `/api/v1/` → `/api/` (no version prefix), middleware path references updated to `/(dashboard)/*`, Server Actions standardized to `src/actions/`, added `src/middleware.ts` (new file at project root), `FeedbackDisplay`/`FeedbackForm` split, `table sonner dropdown-menu` added to shadcn components, added setup notes (package.json rename, metadata, .env.local.example, JSONB extraction), documented useTransition + plain async Server Actions pattern.
