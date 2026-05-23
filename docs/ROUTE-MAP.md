# Route Map — Propos (Hackathon MVP)

**Stack:** Next.js 16 App Router · TypeScript · Tailwind v4 · Supabase Auth
**Auth:** Supabase email/password + session cookies via `@supabase/ssr`
**Data:** Supabase (Postgres) — `properties`, `buyer_briefs`, `cma_records`, `risk_overlays`, `shortlists`, `user_actions`, `profiles`

---

## 1. Route Groups

The app uses three Next.js route groups to separate concerns without affecting URL paths:

| Group | URL Prefix | Middleware |
|---|---|---|
| `(auth)` | `/login`, `/signup` | None (public, redirect if already authed) |
| `(dashboard)` | `/dashboard`, `/briefs`, `/properties`, `/matches`, `/shortlists` | Agent-only, redirect to `/login` |
| `(portal)` | `/portal`, `/portal/login`, `/portal/properties` | Client-only, redirect to `/portal/login` |

**Key routing rule:** Route groups do NOT add URL segments. Pages inside `(dashboard)` use explicit folders for their URL paths (e.g. `(dashboard)/dashboard/page.tsx` → URL `/dashboard`). Root `src/app/page.tsx` is the sole `/` landing page — no other `page.tsx` may resolve to `/`.

A single `src/middleware.ts` handles both session refresh (Supabase `@supabase/ssr`) and role-based route protection.

---

## 2. Complete Route Tree

```
src/
├── middleware.ts                 # Supabase session refresh + role-based redirect (single file)
│                                #   Queries profiles table: SELECT role FROM profiles WHERE id = auth.uid()
│                                #   agent role → (dashboard) routes, client role → (portal) routes
│
├── app/
│   ├── layout.tsx                # Root — providers, fonts, Supabase listener
│   ├── page.tsx                  # / — Public landing page (demo scenario, quick-login buttons)
│   ├── globals.css               # Tailwind v4 + design tokens
│   ├── error.tsx                 # Root error boundary
│   ├── loading.tsx               # Root loading state
│   │
│   ├── (auth)/                   # PUBLIC — no auth gating
│   │   ├── layout.tsx            # Centered card layout, no sidebar
│   │   ├── login/
│   │   │   ├── page.tsx          # /login — email + password, redirect /dashboard on success
│   │   │   └── actions.ts        # Server Action: loginWithPassword
│   │   ├── signup/
│   │   │   ├── page.tsx          # /signup — email + password + name + role select
│   │   │   └── actions.ts        # Server Action: signUp
│   │   ├── error.tsx             # Auth error boundary
│   │   └── loading.tsx           # Auth loading state
│   │
│   ├── (dashboard)/              # AGENT-ONLY — middleware gated
│   │   ├── layout.tsx            # Sidebar nav + top header + role guard (server component)
│   │   ├── error.tsx             # Dashboard error boundary
│   │   ├── loading.tsx           # Dashboard loading states
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx          # /dashboard — Agent overview (stats, recent briefs, pending feedback)
│   │   │
│   │   ├── briefs/
│   │   │   ├── page.tsx          # /briefs — All buyer briefs table (filter by status/client)
│   │   │   ├── new/
│   │   │   │   └── page.tsx      # /briefs/new — Single-page brief creation wizard (client component)
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # /briefs/[id] — Brief detail, editable fields, match summary
│   │   │       └── matches/
│   │   │           └── page.tsx  # /briefs/[id]/matches — Ranked property matches for this brief
│   │   │
│   │   ├── properties/
│   │   │   ├── page.tsx          # /properties — Search bar + filter chips + card grid
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx      # /properties/[id] — Full detail: listing info, CMA table, risk badges
│   │   │   └── compare/
│   │   │       └── page.tsx      # /properties/compare — Side-by-side (2–3 props) via query params
│   │   │
│   │   ├── matches/
│   │   │   └── page.tsx          # /matches — Cross-brief match feed, sort by score
│   │   │
│   │   └── shortlists/
│   │       └── page.tsx          # /shortlists — Manage shortlists, share/unshare, view client feedback
│   │
│   ├── (portal)/                 # CLIENT-ONLY — middleware gated
│   │   ├── layout.tsx            # Branded client portal layout, no sidebar, minimal header
│   │   ├── error.tsx             # Portal error boundary
│   │   ├── loading.tsx           # Portal loading states
│   │   ├── login/
│   │   │   └── page.tsx          # /portal/login — Client-specific login (email + password)
│   │   ├── portal/
│   │   │   └── page.tsx          # /portal — Client dashboard: shared shortlists + activity feed
│   │   └── properties/
│   │       └── [id]/
│   │           └── page.tsx      # /portal/properties/[id] — Property detail + approve/reject/comment
│   │
│   └── api/                      # Route Handlers (REST-ful, Supabase server client)
│       ├── dashboard/
│       │   └── stats/
│       │       └── route.ts      # GET — Agent dashboard aggregate stats
│       │                         #   Returns: { active_clients, properties_under_review, match_score_avg }
│       │
│       ├── properties/
│       │   ├── route.ts          # GET — List/search with filters: suburb, type, min/max price, beds
│       │   │                     #   Also supports ?ids=a,b,c for batch property fetch
│       │   └── [id]/
│       │       ├── route.ts      # GET — Single property with CMA + risk data
│       │       └── comparables/
│       │           └── route.ts  # GET — CMA records for [id]
│       │
│       ├── briefs/
│       │   ├── route.ts          # GET all briefs · POST create new brief
│       │   └── [id]/
│       │       ├── route.ts      # GET single brief
│       │       └── matches/
│       │           └── route.ts  # GET — Pre-computed matches for this brief (sorted by score)
│       │
│       ├── matches/
│       │   └── route.ts          # GET — All matches across briefs (?brief_id=xxx filter)
│       │
│       ├── shortlists/
│       │   ├── route.ts          # GET all shortlists · POST add property to shortlist
│       │   └── [id]/
│       │       └── route.ts      # DELETE remove from shortlist
│       │
│       ├── feedback/
│       │   ├── route.ts          # POST — Submit approve/reject/comment
│       │   └── poll/
│       │       └── route.ts      # GET — Poll for new/unread feedback (?brief_id optional)
│       │                         #   When brief_id omitted: returns recent activity across ALL briefs
│       │
│       └── portal/
│           └── shortlists/
│               └── route.ts      # GET — Shortlists shared with the authenticated client
```

---

## 3. Middleware Configuration

### 3.1 Single Middleware File

A single `src/middleware.ts` handles:

1. **Session refresh** via `@supabase/ssr` `updateSession()` on every request.
2. **Role-based redirect** by querying the `profiles` table:
   ```ts
   const { data: profile } = await supabase
     .from('profiles')
     .select('role')
     .eq('id', session.user.id)
     .single();
   ```
3. For `(dashboard)` routes: if `profile.role !== 'agent'`, redirect to `/login`.
4. For `(portal)` routes (excluding `/portal/login`): if not authenticated or `profile.role !== 'client'`, redirect to `/portal/login`.
5. For `/login` and `/signup`: if already authenticated, redirect to `/dashboard` (agent) or `/portal` (client).
6. For `/api/*` routes: return `401 JSON` if no valid session.

**Note:** The old `src/lib/supabase/middleware.ts` is folded into `src/middleware.ts`. There is exactly one middleware file.

### 3.2 Matcher Config

```ts
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/briefs/:path*",
    "/properties/:path*",
    "/matches/:path*",
    "/shortlists/:path*",
    "/portal/:path*",
    "/login",
    "/signup",
    "/api/:path*",
  ],
};
```

---

## 4. Route Protection Matrix

| Route Pattern | Auth Required | Role | Unauthenticated Behaviour |
|---|---|---|---|
| `/` | No | — | Public landing, demo quick-login |
| `/login`, `/signup` | No | — | Redirect to `/dashboard` or `/portal` if session exists |
| `/dashboard/*` | Yes | `agent` (from `profiles.role`) | 302 → `/login` |
| `/briefs/*` | Yes | `agent` | 302 → `/login` |
| `/properties/*` | Yes | `agent` | 302 → `/login` |
| `/matches/*` | Yes | `agent` | 302 → `/login` |
| `/shortlists/*` | Yes | `agent` | 302 → `/login` |
| `/portal` | Yes | `client` (from `profiles.role`) | 302 → `/portal/login` |
| `/portal/login` | No | — | Redirect to `/portal` if session exists |
| `/portal/properties/*` | Yes | `client` | 302 → `/portal/login` |
| `/api/*` | Yes (session) | varies | 401 JSON |

---

## 5. Data Fetching Strategy

| Route | Pattern | Data Source | Rationale |
|---|---|---|---|
| `/` Landing | RSC (static) | N/A | No dynamic data; demo copy + quick-login buttons |
| `/login`, `/signup` | Client Component + Server Action | Supabase Auth | Form interactivity + auth mutation |
| `/dashboard` | Client Component + React Query | `GET /api/dashboard/stats` | Stats refreshed via polling for activity feed updates |
| `/briefs` | RSC | Supabase server client | Read-heavy list; no mutations on this page |
| `/briefs/new` | Client Component + Server Action | Single POST on submit | Multi-step form with validation — needs JS interactivity; NO auto-save, NO PATCH drafts |
| `/briefs/[id]` | RSC | Supabase server client | Detail view, editable via inline Server Actions |
| `/briefs/[id]/matches` | Client Component + React Query | `GET /api/briefs/[id]/matches` | Dynamic sorting/filtering; React Query handles caching |
| `/properties` | Hybrid: RSC shell + CC children | `GET /api/properties` | Page shell is RSC; search/filter/card-list are Client Components wrapped in Suspense |
| `/properties/[id]` | Client Component + React Query | `GET /api/properties/[id]` | Full detail including CMA + risks + match scores; consistent with `/properties` list pattern |
| `/properties/compare` | Client Component + React Query | 2–3 parallel `GET /api/properties/[id]` calls | Side-by-side comparison; parallel fetches for each selected property (full detail includes CMA + risks) |
| `/matches` | Client Component + React Query | `GET /api/matches?brief_id=xxx` | Cross-brief feed; sort/filter interactivity |
| `/shortlists` | Client Component + searchParams prop | `GET /api/shortlists?brief_id=xxx` | Uses `searchParams` prop (passed by Next.js to page component) for tab selection; add/remove/share mutations |
| `/portal` | Client Component + React Query | `GET /api/portal/shortlists` + polling | Shortlist is dynamic — agent adds properties during demo, client sees updates via refetchInterval |
| `/portal/properties/[id]` | Client Component + React Query | `GET /api/properties/[id]` | Full property detail; approve/reject/comment via Server Action |
| `/portal/login` | Client Component + Server Action | Supabase Auth | Login form identical pattern to `/login` |
| Feedback polling | React Query | `GET /api/feedback/poll` | `refetchInterval: 3000`; `brief_id` optional — omitted for global activity feed |

**Key decisions:**
- **RSC for read-heavy pages** (clients list, briefs list/detail) — these pages don't need client-side interactivity. Data fetched once server-side.
- **Client Components + React Query for interactive UIs** (property search, match feed, shortlists, feedback, portal dashboard, comparison) — these need debounced search, optimistic updates, polling, or dynamic data.
- **Server Actions for mutations** (brief creation, login/signup, approve/reject) — keeps mutation logic server-side, avoids exposing API routes for simple form submits.
- **API Routes for cross-cutting queries** (property search, match feed, feedback polling, dashboard stats) — used where client components need a REST-like data source with query params.
- **No auto-save.** Brief creation is a single `POST` at the end of the wizard. No `PATCH` for drafts.

---

## 6. Navigation Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Unauthenticated User                                        │
│  /  →  Landing page (demo scenario, "Log in as Agent" btn)  │
│       →  /login  (email + password)                          │
│       →  /signup (email + password + role)                   │
└─────────────────────────────────────────────────────────────┘
                        │
           ┌────────────┴────────────┐
           ▼                         ▼
┌──────────────────┐    ┌──────────────────────────┐
│  Agent Dashboard  │    │  Client Portal            │
│  /dashboard       │    │  /portal                  │
└──────────────────┘    └──────────────────────────┘
           │
           ├─  Create Brief    →  /briefs/new
           │    (on submit)    →  /briefs/[id]/matches
           │
           ├─  Browse Properties →  /properties
           │    (click card)      →  /properties/[id]
           │    (select 2-3)      →  /properties/compare?id=a&id=b&id=c
           │    (add to shortlist)→  stay on page + toast
           │
           ├─  View Matches     →  /briefs/[id]/matches
           │    (add to shortlist)→ stay on page + toast
           │
            ├─  Manage Shortlists →  /shortlists
            │    (share)          →  client sees it in /portal
            │    (poll feedback)  →  real-time updates via React Query
            │
```

### Demo Flow Reference (from PRD)

1. **Scene 1 (Brief):** Agent logs in → `/briefs/new` → fill wizard → submit → **redirect to `/briefs/[id]/matches`**
2. **Scene 2 (Matches):** `/briefs/[id]/matches` — pre-filtered matches sorted by score (89, 76, 68...)
3. **Scene 3 (Compare):** Select top 3 → `/properties/compare?id=a&id=b&id=c`
4. **Scene 4 (Deep-Dive):** Click top match → `/properties/[id]`
5. **Scene 5 (Shortlist):** Add to shortlist → share with client
6. **Scene 6 (Feedback):** Client logs in → `/portal` → approves/rejects/comments → agent sees via polling

> **Note:** PRD Scene 2 originally referenced "navigate to Properties tab" — the correct post-brief navigation is `/briefs/[id]/matches` (ranked matches for that brief), not `/properties` (the general property browser).

---

## 7. Demo-Only Considerations

### 7.1 Pre-Seeded Credentials

| Persona | Email | Password | Role |
|---|---|---|---|
| Agent (demo agent) | `agent@demo.com` | `password123` | `agent` |
| Client (Sarah Chen) | `sarah@demo.com` | `password123` | `client` |

### 7.2 Landing Page Quick Login

The `/` landing page displays:
- The demo scenario (platform value prop, 30-second intro copied from the demo script).
- **"Log in as Demo Agent"** button — pre-fills `agent@demo.com` / `password123`.
- **"Log in as Demo Client"** button — pre-fills `sarah@demo.com` / `password123`.
- Both buttons POST to the login Server Action with hardcoded credentials, skipping the login form entirely.

### 7.3 No Loading States During Demo

All seed data (25 properties, 75 CMA records, 3 buyer briefs, pre-computed match scores) is loaded into Supabase before the demo. Every page renders with data on first paint. React Query components use `staleTime: Infinity` so cached data is never refetched unless explicitly invalidated.

### 7.4 Side-by-Side Browser Windows

The demo is presented with two browser windows visible simultaneously: agent dashboard on the left, client portal (incognito) on the right. This eliminates polling latency from the viewer's perspective and demonstrates the unified-platform value in one glance.

---

## 8. Phase 2 (Post-Hackathon)

Routes and features intentionally excluded from the MVP. These exist as future work — do NOT implement during the hackathon:

| Feature | Future Route |
|---|---|
| Live API integrations (Domain, CoreLogic, REA) | `/api/properties/import`, `/api/cma/live` |
| AI/ML matching engine (currently rule-based, pre-scored) | `/api/matches/score` (live) |
| Off-market hub | `/off-market/*` |
| Document upload/storage | `/documents/*`, `/api/documents/*` |
| Offer letters & auction tracker | `/offers/*`, `/auctions/*` |
| Milestone tracking | `/milestones/*` |
| Email/SMS notifications | Background jobs, not routes |
| Multi-tenancy (agencies, RBAC) | `/settings/team`, `/settings/roles` |
| Map view | `/properties/map` |
| Kanban pipeline | `/pipeline/*` |
| PDF export | `/api/properties/[id]/export` |
| Mobile apps | Native app routing (separate project) |

---

## Revision History

| Version | Date | Changes |
|---|---|---|
| 1.0 | May 2026 | Initial version |
| 2.0 | May 2026 | Adversarial review fixes: route group collision resolved (explicit `dashboard/` and `portal/` folders), middleware consolidated to single `src/middleware.ts`, role check standardized on `profiles` table, data fetching table updated (portal → Client Component + React Query, comparison → parallel fetches, shortlists → searchParams prop), added `GET /api/dashboard/stats`, `brief_id` made optional on feedback poll, added `error.tsx`/`loading.tsx` to route groups, demo flow navigation corrected (`/briefs/[id]/matches` after brief creation), added `?ids` query support to properties API |
| 2.1 | May 2026 | /clients routes removed (out of MVP scope), PATCH routes removed (brief editing/share/unshare deferred), /properties/[id] data fetching changed to Client Component + React Query (consistent with list pattern), navigation flow and protection matrix updated accordingly |
