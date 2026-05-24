# Technical Specification — Hackathon MVP

**Project:** Propos
**Scope:** 48-hour MVP, 3 full-stack developers
**Canonical status:** This document is the technical source of truth for the hackathon MVP. Blueprint docs are future/reference material when they conflict with this file.

---

## 1. Direction

Build a **Next.js App Router modular monolith** backed by **Supabase Auth, Postgres, Storage, and RLS**. The MVP proves one workflow:

`Brief -> Match -> Shortlist -> Share -> Client Feedback -> Agent Refresh`

The MVP deliberately avoids live property integrations, ML, WebSockets, subscriptions, document vaults, maps, multi-agency tenancy, and settlement workflows.

## 2. Stack

| Layer | Choice | Decision |
|---|---|---|
| App framework | Next.js App Router + React + TypeScript | One codebase for pages, API Route Handlers, and static assets. |
| Styling | Tailwind CSS + shadcn/ui | Required project convention. Use fixed MVP design tokens; defer runtime tenant theming. |
| Auth | Supabase Auth | Email/password for both demo users. Magic links are post-MVP. |
| Database | Supabase Postgres | Hosted Postgres with JSONB and RLS. |
| Storage | Supabase Storage | Optional for property images; MVP can use committed static images or trusted seed URLs. |
| Data access | Supabase JS clients | No Prisma/SQLite for the canonical MVP. |
| Server state | `@tanstack/react-query` | Client-side caching, invalidation, and 3s polling. |
| API | Next.js Route Handlers under `/api/*` | Stable fetchable contract for both dashboard and portal. |
| Deployment | Local `npm run dev` primary, Vercel optional | Demo must work locally without relying on deployment timing. |

## 3. Canonical Sources

The implementation team should follow these files in order:

1. [PRD.md](./PRD.md) — product scope and demo story
2. [TECH-SPEC.md](./TECH-SPEC.md) — stack and architecture
3. [DATA-MODEL.md](./DATA-MODEL.md) — tables, RLS, seed requirements
4. [API-SPEC.md](./API-SPEC.md) — MVP endpoint contract
5. [ROUTE-MAP.md](./ROUTE-MAP.md) — Next.js route tree
6. [COMPONENT-TREE.md](./COMPONENT-TREE.md) — UI/component plan
7. [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) — execution schedule

`docs/blueprint/*` describes the long-term platform unless a top-level MVP doc explicitly references it.

## 4. Architecture

```text
Browser
  ├─ Agent Dashboard routes: /dashboard, /briefs, /properties, /matches, /shortlists
  └─ Client Portal routes: /portal, /portal/login, /portal/shortlists/[id]
        |
        v
Next.js App Router
  ├─ Server Components for read-heavy page shells
  ├─ Client Components for forms, filters, compare, feedback, and polling
  ├─ Route Handlers under /api/*
  └─ Middleware for session refresh and route protection
        |
        v
Supabase
  ├─ Auth
  ├─ Postgres + RLS
  └─ Storage/static image URLs
```

## 5. Auth And Roles

Supabase Auth owns identity. The `profiles` table owns application role.

- `auth.users.id` equals `profiles.id`.
- `profiles.role` is the only canonical role source: `agent` or `client`.
- User metadata may store display hints, but never drives authorization.
- Middleware authenticates and redirects route groups.
- API Route Handlers authenticate the session and enforce the route-specific role.

Demo users:

| Persona | Email | Password | Role |
|---|---|---|---|
| Agent | `agent@demo.com` | `password123` | `agent` |
| Client | `sarah@demo.com` | `password123` | `client` |

Sarah represents the Sarah & Tom household brief; Tom does not need a separate MVP login.

## 6. API Rules

- MVP endpoints are **unversioned**: `/api/properties`, not `/api/v1/properties`.
- All MVP data endpoints are **Route Handlers**. Server Actions may wrap forms, but they must call or share the same service logic as the Route Handler contract.
- Middleware only proves a session exists for `/api/*`; each route decides whether `agent` or `client` is allowed.
- Responses use `{ data, meta?, error? }`.
- `GET /api/properties/[id]` is agent-only.
- Client property detail uses `GET /api/portal/shortlists/[id]`, where `[id]` is the shared shortlist row id. A property id alone is not sufficient because the same property can appear in more than one brief.
- Mutations should prefer the authenticated Supabase server client. The exception is client feedback: because RLS cannot restrict updates to specific columns, `POST /api/feedback` must use a server-only admin helper after validating ownership and `shared_at`.

## 7. Share And Feedback Lifecycle

Shortlisting and feedback are separate concepts.

| Concept | Field | Meaning |
|---|---|---|
| Agent curation | row exists in `shortlists` | Agent added the property to a brief. |
| Client visibility | `shared_at IS NOT NULL` | Client can see the row in the portal. |
| Client attention | `viewed_at` | Client opened the shared detail. |
| Client decision | `feedback_status` | `interested`, `need_more_info`, `not_for_me`, or `NULL`. |
| Client note | `feedback_text` | Optional comment. |
| Feedback time | `feedback_at` | Last submitted feedback timestamp. |

New shortlist rows must **not** default to positive feedback. `feedback_status` starts as `NULL`.

## 8. Data Strategy

The hackathon MVP uses deterministic seed data only:

- 25 Sydney properties
- 75 CMA comparable rows
- risk rows for demo properties
- 3 buyer briefs
- precomputed match scores for each brief-property pair
- one agent user and one client user
- at least 3 shared shortlist rows for the Sarah & Tom demo flow

No Domain, REA, CoreLogic, PriceFinder, government GIS, ABS, or scraping calls run during the demo.

Property images may be local files under `/public/images/properties/*` or seed URLs from a license-safe image source. Do not use portal listing images unless licensing is confirmed.

## 9. Performance And Reliability

The demo target is perceived speed, not scale.

| Target | Requirement |
|---|---|
| Page loads | No obvious blank states during the scripted demo. |
| Feedback loop | Agent sees client feedback within 3 seconds via React Query polling plus manual Refresh. |
| Local demo | `npm run dev` works on the presentation machine. |
| Fallback | Screenshots of each scene exist in the pitch deck. |

## 10. Explicit Non-Goals

- No SQLite/Prisma/JWT custom auth path.
- No live listing ingestion.
- No AI/ML matching.
- No WebSockets.
- No map view.
- No Kanban pipeline.
- No payment/subscription flow.
- No document upload.
- No multi-agency RBAC beyond `agent` and `client`.
- No tenant-specific branding or white-label theming.

---

*Version: 2.0 | Updated: May 24, 2026 — Canonical greenfield direction selected and contradictions resolved.*
