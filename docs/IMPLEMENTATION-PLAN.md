# Implementation Plan — Hackathon MVP

**Team:** 3 full-stack developers
**Duration:** 48 hours
**Canonical status:** This is the execution plan for the clean greenfield MVP direction.

---

## 1. North Star

Ship the smallest polished demo that proves:

`Brief -> Match -> Shortlist -> Share -> Client Feedback -> Agent Refresh`

The work is successful when the scripted demo completes locally with no visible crashes, no broken images, and feedback appearing to the agent within 3 seconds or after manual Refresh.

## 2. Pre-Hackathon Setup

Must be done before Hour 0:

- Create Supabase project.
- Configure `.env.local` and `.env.local.example`.
- Create demo users:
  - `agent@demo.com` / `password123`
  - `sarah@demo.com` / `password123`
- Run the schema from [DATA-MODEL.md](./DATA-MODEL.md).
- Load full seed data:
  - 25 properties
  - 75 CMA records
  - risk overlays
  - 3 buyer briefs
  - 75 match scores
  - at least 3 shared Sarah shortlist rows
- Source license-safe property images under `/public/images/properties/*` or seed safe URLs.
- Install UI primitives needed for the MVP:

```bash
npx shadcn@latest add button card input label textarea select badge table tabs skeleton dialog dropdown-menu sonner
```

Environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it to client components.

## 3. Work Lanes

### Person A — Backend/API/Data

Owns Supabase schema, seed verification, Route Handlers, and auth helpers.

| Priority | Deliverable |
|---|---|
| P0 | Supabase clients: browser, server, and optional admin/service-role server helper. |
| P0 | Middleware: session refresh, agent route guard, client route guard. |
| P0 | `GET /api/properties`, `GET /api/properties/[id]`. |
| P0 | `GET /api/briefs`, `POST /api/briefs`, `GET /api/briefs/[id]/matches`. |
| P0 | `POST /api/shortlists`, `POST /api/shortlists/share`, `GET /api/shortlists`. |
| P0 | `GET /api/portal/shortlists`, `GET /api/portal/shortlists/[id]`. |
| P0 | `POST /api/feedback`, `GET /api/feedback/poll`. |
| P1 | `GET /api/matches` dashboard feed. |
| P2 | `GET /api/properties/[id]/comparables`. |
| Stretch | `user_actions` logging. |

### Person B — Agent Dashboard

Owns all agent-facing pages and Tailwind/shadcn polish.

| Priority | Deliverable |
|---|---|
| P0 | Dashboard shell: sidebar, top bar, responsive layout. |
| P0 | `/briefs/new` single-page brief form. |
| P0 | `/briefs/[id]/matches` ranked matches page. |
| P0 | Add-to-shortlist interactions. |
| P0 | `/shortlists` with Share button and feedback status. |
| P0 | Feedback polling widget with React Query `refetchInterval: 3000` and manual Refresh. |
| P1 | `/properties` search/filter grid. |
| P1 | `/properties/[id]` detail with CMA/risk. |
| P2 | `/properties/compare`. |

### Person C — Client Portal + Demo Polish

Owns client-facing experience, image QA, and final demo polish.

| Priority | Deliverable |
|---|---|
| P0 | `/portal/login`. |
| P0 | `/portal` shared shortlist gallery. |
| P0 | `/portal/shortlists/[id]` property detail. |
| P0 | Feedback panel: Interested / Need More Info / Not For Me + comment. |
| P0 | Client mobile layout and touch states. |
| P1 | Empty/loading/error states. |
| P1 | Demo screenshots fallback. |
| P2 | Help Person A or B if the core loop slips. |

## 4. Hour-By-Hour Plan

| Hour | Goal |
|---|---|
| 0-2 | Supabase env verified, schema/seed verified, app boots, Tailwind/shadcn baseline working. |
| 2-6 | Auth/middleware complete. Property and brief APIs return seed data. Agent shell and portal shell exist. |
| 6-10 | Brief form submits and redirects to `/briefs/[id]/matches`. Matches page renders seed scores. |
| 10-14 | Add-to-shortlist and Share API/UI work. Portal gallery can see shared rows. |
| 14-18 | Portal detail and feedback submit work. Agent feedback polling works. |
| 18-24 | Full core demo flow integrated end-to-end. Fix only blockers on the core loop. |
| 24-30 | Property detail, CMA/risk polish, comparison if time allows. |
| 30-36 | Responsive polish, copy pass, loading/error states, image QA. |
| 36-42 | Feature freeze. Bug fixes only. Presentation machine test. |
| 42-48 | Demo rehearsal, screenshots fallback, pitch integration. |

## 5. Cut Lines

If behind schedule:

1. Cut comparison view.
2. Cut `/matches` standalone feed; use only `/briefs/[id]/matches`.
3. Cut property detail drawer/modal; use full detail pages only.
4. Cut signup; use seeded demo users only.
5. Cut `user_actions`.
6. Cut advanced loading skeletons.

Do **not** cut:

- brief creation
- ranked matches after brief creation
- add to shortlist
- share
- portal shortlist view
- client feedback
- agent refresh/polling

## 6. Integration Gates

| Time | Gate | If Missing |
|---|---|---|
| Hour 2 | App boots, Supabase auth works, seed counts verified. | Stop feature work and fix setup. |
| Hour 10 | Brief -> matches works. | Pair A+B until it works. |
| Hour 18 | Share -> portal -> feedback works. | Cut comparison/detail polish and swarm core loop. |
| Hour 24 | Full demo flow works once. | Stop adding features. |
| Hour 36 | Demo flow works 3 times. | Freeze and rehearse only. |

## 7. Known Risks

| Risk | Mitigation |
|---|---|
| Supabase/RLS blocks feedback writes | Do not add a broad client update policy. Use the server-only admin helper in `POST /api/feedback` after role, ownership, and `shared_at` checks. |
| Portal detail lacks shortlist id | Use `/portal/shortlists/[id]`; never infer feedback target from property id alone. |
| Share state confused with feedback | `shared_at` controls visibility; `feedback_status` controls client decision. |
| Seed data incomplete | Pre-hackathon seed verification is mandatory. |
| Team overbuilds future platform | Blueprint docs are future/reference; top-level docs are canonical. |

## 8. Demo Script

1. Agent logs in.
2. Agent creates Sarah & Tom brief.
3. App redirects to ranked matches.
4. Agent adds 3 properties to shortlist.
5. Agent clicks Share.
6. Sarah logs into portal.
7. Sarah opens a shared property and submits `Interested` with a comment.
8. Agent sees feedback via polling/manual Refresh.

---

*Version: 2.0 | Updated: May 24, 2026 — Execution reset around canonical Supabase MVP and all P0 doc-review blockers.*
