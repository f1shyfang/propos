# Product Requirements Document — Propos MVP

**Hackathon:** 48-hour build | **Team:** 3 full-stack developers | **Market:** Australia

---

## 1. Executive Summary

We are building a unified platform that replaces the 6–8 disconnected tools Australian buyer's agents currently juggle to serve a single client. In 48 hours, the MVP proves the core value loop: an agent captures a buyer's brief, the system matches properties against it, the agent shortlists and shares with the client via a branded portal, and the client provides structured feedback — all in one place. This demonstrates the platform's core thesis: workflow unification saves measurable time over portal-hopping, spreadsheet wrangling, and fragmented communication channels.

---

## 2. Problem

A typical Australian buyer's agent works across 6–8 disconnected tools per transaction (per Doc 01 §1): CRM, Domain/REA portals, CoreLogic/Pricefinder for valuations, spreadsheets for analysis, DocuSign for contracts, and WhatsApp/email/SMS for communication. Research on knowledge workers indicates context-switching consumes approximately 20% of productive time (Doc 01 §1.4). For a BA working 50 hours per week, that is roughly 10 hours lost to tool-switching. The manual coordination overhead lengthens deal cycles and caps concurrent clients per agent.

---

## 3. Solution

A single platform built during the 48-hour hackathon that delivers the essential workflow: **Brief -> Match -> Shortlist -> Share -> Feedback -> Refresh**. The agent creates a structured buyer brief, browses pre-scored property matches, compares properties side-by-side with CMA and risk data, shortlists and shares with the client, and receives structured feedback (Interested / Need More Info / Not For Me plus optional comments) via polling. No live API integrations, no AI/ML - all data is pre-seeded and all matching scores are pre-computed. This proves the unified-platform value proposition without the integration complexity.

---

## 4. Target Users

**Primary:** Australian buyer's agents — sole operators managing 1–3 active clients and small agencies of 2–10 agents (per Doc 01 §2). The demo persona is a sole operator managing multiple briefs simultaneously.

**Secondary (for demo):** Property buyers accessing the client portal — investors, home buyers, and upsizers who engage a BA and need visibility into the search process.

**Demo personas:** One agent account and one client account (Sarah, from the Young Professional Couple brief — Budget $800K–$1.1M, 2+ bed apartment in Surry Hills/Newtown/Pyrmont).

---

## 5. Core User Stories

| # | As a... | I want to... | So that... |
|---|---------|-------------|-----------|
| 1 | Buyer's agent | Create a structured buyer brief with budget, suburbs, property type, beds/baths, parking, must-haves, and deal-breakers | I capture every client requirement in one place instead of scattered notes |
| 2 | Buyer's agent | View properties scored and filtered against a specific brief | I see the best matches first without cross-referencing multiple portals |
| 3 | Buyer's agent | Expand a property card to see listing details, CMA (comparable sales), and risk overlays | I perform due diligence without opening CoreLogic and council websites in separate tabs |
| 4 | Buyer's agent | Compare 2–3 properties side-by-side with match scores, CMA ranges, and risk badges | I evaluate options analytically instead of flipping between tabs and spreadsheets |
| 5 | Buyer's agent | Add properties to a shortlist and share with the client | The client sees a curated selection in a branded portal instead of random links |
| 6 | Buyer client | Log in, view shared properties, and provide structured feedback (Interested / Need More Info / Not For Me plus optional comments) | My agent knows exactly how I feel about each property without messy WhatsApp threads |
| 7 | Buyer's agent | See client feedback appear in the dashboard via polling | I act on client decisions immediately without waiting for forwarded emails |

---

## 6. MVP Feature Scope

### IN SCOPE

| Feature | Rationale |
|---|---|
| Agent login (email/password via Supabase Auth) | Low-friction entry point for the demo. |
| Buyer brief creation form (single-page) | Proves structured needs capture — the platform's input signal (per Doc 10 §1.1) |
| Property listing page with search/filter (suburb, price, beds, type) | Proves unified browsing without portal-hopping across 25 seed properties |
| Property detail card with CMA + risk badges | Proves due-diligence-in-one-place — 2–3 comparable sales + flood/heritage/bushfire tags |
| Property comparison view (2–3 side-by-side) | Proves analysis capability beyond spreadsheets — match scores, CMA, risk in one glance |
| Shortlist (add/remove, share with client) | Proves agent-client curation workflow |
| Client login (email/password) | Enables the client persona demo |
| Client portal - view shared shortlist + structured feedback | Proves structured feedback loop with Interested / Need More Info / Not For Me and optional comments (per Doc 08 §4.3) |
| Agent dashboard — polling for client feedback (3s interval + manual Refresh) | Proves real-time visibility into client decisions (via `@tanstack/react-query` `refetchInterval`) |
| User action event logging (`user_actions` table) | Foundation for future analytics/ML — ~30 min investment (per Doc 10 §3.3) |

### OUT OF SCOPE

| Feature | Why |
|---|---|
| Live API integrations (Domain, REA, CoreLogic) | API keys, rate limits, and parsing would consume the entire hackathon (per Doc 10 §1.4) |
| Real AI/ML matching | Requires training data and validation — pre-computed rule-based scores prove the concept |
| Off-market hub, offer letters, auction tracker | Phases 2/5 — not core to the demo narrative |
| Document upload/storage | Requires object store, virus scanning, file management UI |
| Milestone tracking | Phase 6 — meaningful only after a property is selected |
| Email/SMS notifications | Requires third-party gateway setup |
| Payment/subscription | Not relevant to a single-agent demo |
| Full multi-tenancy / admin RBAC | MVP uses one agent role and one client role only |
| Map view | Geocoding + map component is 4+ hours for marginal demo value |
| Kanban/pipeline board | Shared/unshared state and feedback status on shortlist rows are enough for MVP |
| WebSockets | Polling via `@tanstack/react-query` is one line vs. WebSocket infrastructure |
| Rich text / PDF generation | Plain text for all fields; browser print if needed |
| Swipe-based feedback (Tinder-style) | Intentionally avoided — property decisions are high-stakes, not rapid-fire entertainment (per Doc 08 §4.3 design rationale) |

---

## 7. Demo Flow

**Scene 1 — The Buyer Brief (45s):** Agent logs in, clicks "New Buyer Brief," fills out the form for Sarah & Tom (budget $800K–$1.1M, Surry Hills/Newtown/Pyrmont, 2+ bed apartment). Submit. Confirmation toast.

**Scene 2 — Smart Matching (45s):** Navigate to the brief's matches page (`/briefs/[id]/matches`). Pre-filtered to matches for Sarah & Tom's brief, sorted by match score (89, 76, 68, etc.). "25 properties in the system. The matching engine filtered and scored them. No tab-switching."

**Scene 3 — Property Comparison (45s):** Select top 3 matches. Open side-by-side comparison view — match scores, photos, bed/bath/price, CMA estimated value ranges, risk badges. "This is what you can't do in a spreadsheet."

**Scene 4 — Property Deep-Dive (30s):** Click top match (42 Union Street, Surry Hills, score 89/100). Listing details, CMA with two comparable sales ($920K, $985K), estimated value $930K–$980K, risk: heritage overlay (medium), flood (low). "CMA, risk data, listing — all in one view."

**Scene 5 — Shortlist & Share (30s):** Add 3 properties to shortlist. Click "Share with Client." "Now let's switch to the client's experience."

**Scene 6 - Client Portal & Feedback Loop (75s):** Incognito window - Sarah logs in. Sees 3 shared properties. Marks Union Street as Interested ("Love the balcony - inspect this weekend?"), marks another as Not For Me ("Ground floor - no go"), and marks the third as Need More Info. Switch back to agent dashboard - feedback loaded via polling. "One platform, one workflow."

**Demo setup:** Agent dashboard and client portal visible side-by-side on screen throughout.

---

## 8. Success Criteria

- [ ] Agent can log in and create a buyer brief with all required fields
- [ ] Property list loads with search/filter (suburb, price, beds, type) and displays match scores
- [ ] Property detail card shows CMA data (2–3 comparables) and risk badges
- [ ] 2–3 properties can be compared side-by-side with match scores, CMA, and risk
- [ ] Agent can add/remove properties from a shortlist and share it with a client
- [ ] Client can log in, view the shared shortlist, and submit Interested / Need More Info / Not For Me feedback with optional comments
- [ ] Agent dashboard polls for and displays client feedback within 3 seconds
- [ ] Full demo flow completes end-to-end with no console errors or visible bugs
- [ ] Demo works locally on the presenter's machine (`npm run dev`)

---

## 9. Out of Scope (for Hackathon)

All features beyond the core brief→match→shortlist→feedback loop are deferred. Per the long-term roadmap (Doc 11):

- **Post-Hackathon:** Live portal integration (Domain API), AI-powered matching, off-market hub, email/SMS notifications, PDF report generation
- **Phase 3:** Full due diligence suite — automated CMA generation, risk overlay maps, investment calculators, property report generator (per Doc 08 §3)
- **Phase 4+:** Complete client portal with document vault, activity feed, co-buyer workflows, calendar integration (per Doc 08 §4)
- **Phase 5–6:** Offer management, auction tracker, transaction & settlement milestones (per Doc 08 §5–6)

---

## 10. Key Design Decisions

| Decision | Rationale |
|---|---|
| **Button feedback over swipe UI** | Property decisions are high-stakes financial commitments, not rapid-fire entertainment. Three explicit buttons (Interested / Need More Info / Not For Me) plus an optional comment field force considered decisions (per Doc 08 §4.3). |
| **Single pipeline, no kanban** | Shared/unshared state and client feedback status communicate the workflow without building a drag-and-drop kanban component in 48 hours. |
| **Pre-computed match scores, no live matching engine** | Rule-based scoring exists in code for demo walkthrough but all scores are stored in seed data. Avoids runtime bugs and ensures deterministic demo behaviour (per Doc 10 §2.6). |
| **Polling, not WebSockets** | `@tanstack/react-query` `refetchInterval: 3000` + manual Refresh button achieves the same UX with zero infrastructure. WebSockets add deployment complexity for no demo gain (per Doc 10 §1.4). |
| **Supabase over SQLite** | Supabase gives the MVP hosted Postgres, Auth, RLS, and Storage in one stack. SQLite/Prisma would require rebuilding auth, security boundaries, and deployment assumptions for no demo gain. |
| **25 seed properties, Sydney-only** | Diverse enough for meaningful filtering, small enough for fast seed loading. Sydney offers globally recognisable suburbs and a wide price spectrum ($500K–$4M+) for varied demo scenarios (per Doc 10 §2.1). |
| **Two hardcoded users, no registration flow** | Eliminates account creation friction during the demo. The login form exists solely as a demo entry point. |
| **Local-only demo (`npm run dev`)** | No deployment dependency. Eliminates risk of Vercel cold starts, network latency, and API failures during the live demo (per Doc 10 §5.2). |

---

## Document Status

- **Version:** 1.2
- **Last Updated:** May 24, 2026
- **References:** Blueprint Doc 01 (Vision), Doc 08 (Features), Doc 10 (Hackathon MVP Spec), Doc 11 (Roadmap)
- **Revision:** Canonical MVP language aligned to Supabase, unversioned APIs, and structured feedback states.
