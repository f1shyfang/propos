# 10 — Hackathon MVP Spec

> **Canonical status:** This file is a blueprint summary only. The implementation source of truth is [../TECH-SPEC.md](../TECH-SPEC.md), [../DATA-MODEL.md](../DATA-MODEL.md), [../API-SPEC.md](../API-SPEC.md), [../ROUTE-MAP.md](../ROUTE-MAP.md), [../COMPONENT-TREE.md](../COMPONENT-TREE.md), and [../IMPLEMENTATION-PLAN.md](../IMPLEMENTATION-PLAN.md).

**Target:** 24-48 hours
**Team:** 3 full-stack developers
**Goal:** A deterministic local demo that proves the core value loop for an Australian buyer's agent.

---

## 1. MVP Thesis

The MVP demonstrates one workflow:

**Brief -> Match -> Shortlist -> Share -> Feedback -> Refresh**

The agent captures a buyer brief, views seeded properties scored against that brief, compares top options with CMA and risk context, shares selected properties with the client, and sees structured client feedback return in the dashboard. This proves workflow unification without spending the hackathon on live data ingestion, authentication reinvention, or production-scale platform features.

---

## 2. Canonical Technical Direction

Use the same stack everywhere:

| Area | Decision |
|---|---|
| App framework | Next.js App Router |
| Styling | Tailwind CSS v4 plus shadcn/ui |
| Data/auth | Supabase Auth, Postgres, RLS, and Storage |
| API layer | Next.js Route Handlers under unversioned `/api/*` |
| Client data | `@tanstack/react-query` for reads, mutations, and polling |
| Validation | Zod at Route Handler boundaries |
| Demo data | Seeded Sydney property corpus, seeded buyer briefs, seeded match scores |

Do not use SQLite, Prisma, custom JWT auth, `/api/v1`, live portal ingestion, WebSockets, map SDKs, or a separate backend for the hackathon MVP.

---

## 3. Demo Data

Prepare seed data before implementation begins:

| Data | Required Shape |
|---|---|
| Users | One agent profile and one client profile, backed by Supabase Auth users |
| Buyer briefs | Three briefs, including Sarah Chen & Tom Williams |
| Properties | 25 Sydney properties across varied budgets and property types |
| CMA records | Two to three comparable sales per property |
| Risk overlays | Simple seeded flood, bushfire, heritage, and zoning badges |
| Match scores | Precomputed rows for every property/brief pair |
| Shortlists | At least three shared rows for Sarah's demo flow |
| Action events | Log important agent/client interactions in `user_actions` |

Use local public image assets or Supabase Storage assets. Do not scrape Domain, REA, or other commercial listing images.

---

## 4. Core Demo Flow

1. Agent logs in and creates or opens Sarah's buyer brief.
2. Agent opens `/briefs/[id]/matches` and sees scored property matches.
3. Agent compares two or three top properties side-by-side.
4. Agent opens a property detail view with CMA and risk context.
5. Agent adds three properties to a shortlist and shares them with Sarah.
6. Sarah logs into `/portal`, opens `/portal/shortlists/[id]`, and leaves one Interested, one Need More Info, and one Not For Me response.
7. Agent dashboard polls `/api/feedback/poll` and displays the latest feedback within roughly three seconds.

Keep the agent window and the client window visible side-by-side during the live demo.

---

## 5. In Scope

| Feature | Reason |
|---|---|
| Agent email/password login | Demo entry point |
| Client email/password login | Client portal entry point |
| Single-page buyer brief form | Fast structured intake |
| Match list for a brief | Shows scored discovery without portal hopping |
| Property detail with CMA and risks | Shows due diligence in one view |
| Property comparison | Shows analysis beyond spreadsheets |
| Shortlist add/remove/share | Shows curation workflow |
| Client portal list and detail pages | Shows branded client experience |
| Structured feedback buttons | Captures useful client intent |
| Feedback polling | Shows the loop closing without WebSocket complexity |
| `user_actions` logging | Gives future analytics a clean foundation |

---

## 6. Out of Scope

| Feature | Reason |
|---|---|
| Live Domain/REA/CoreLogic integrations | Too risky for a 48-hour demo |
| Real ML ranking | Seeded deterministic scores prove the story |
| Full multi-tenancy | One agent and one client are enough |
| Admin console | Not part of the demo loop |
| Maps/geospatial rendering | Risk badges are enough for MVP due diligence |
| Kanban/pipeline board | Shortlist state and feedback status are enough |
| WebSockets | Polling is simpler and reliable for the demo |
| Document upload and vault | Outside the core loop |
| Notifications/email/SMS | Adds provider setup risk |
| Offer, auction, and settlement tooling | Later lifecycle phases |

---

## 7. Implementation Lanes

| Person | Primary Ownership |
|---|---|
| A | Supabase schema, RLS, seed script, server clients, API Route Handlers |
| B | Agent dashboard, brief form, match list, comparison, shortlist/share, feedback display |
| C | Client portal, responsive polish, seeded images, demo QA, cross-browser rehearsal |

Every lane should follow the canonical docs above. If a detail conflicts, the top-level canonical docs win.

---

## 8. Cut Lines

Cut in this order if time gets tight:

1. Manual refresh can replace 3-second polling.
2. Property comparison can become a read-only side-by-side page.
3. Brief creation can use pre-seeded briefs only.
4. Images can fall back to local placeholders.
5. `user_actions` can log only shortlist share and feedback events.

Do not cut the core loop of shared shortlist plus client feedback. That is the demo.
