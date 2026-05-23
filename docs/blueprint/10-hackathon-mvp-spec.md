# 10 — Hackathon MVP Spec

**Target:** 24-48 hours | **Team:** 3 full-stack developers | **Goal:** Working demo that proves the core value loop

---

## PRE-HACKATHON PREPARATION

### Critical: Seed Data Must Be Ready Before Hour 0

**Person C takes ownership of all seed data before the hackathon begins.** Writing seed data from scratch during the event will consume 8-12 hours and derail the timeline. The following must be prepared and committed to the repo in advance:

- **seed.json:** 25 properties with realistic descriptions (see Section 2.2 schema), 75 CMA records (3 comparable sales per property), risk data for 8+ suburbs, and 3 buyer briefs. This is Person C's pre-hackathon deliverable. At Hour 0, seed.json loads via the seed script — no writing, no editing, no on-the-fly data fabrication.

- **Property Photos:** Source 25 free Unsplash photos of Australian architecture (houses, apartments, streetscapes). Save as `/public/images/properties/prop-001.jpg` through `prop-025.jpg`. Use placeholder colours/patterns as fallback if exact matches aren't found. Do NOT download or use images from Domain, REA, or any commercial property portal — this is copyright infringement and could disqualify the project. Document Unsplash attribution if required by the license.

- **Geo Data (Optional Buffer):** Pre-download G-NAF subset and GeoJSON overlays for Sydney LGA boundaries. Not used in the MVP demo flow, but having the data ready avoids a scramble if the team finishes early and wants to add a map thumbnail.

- **Seed Data Verification:** Run the seed script before Hour 0 to verify all 25 properties load, all CMA records associate correctly, and all 3 buyer briefs produce non-empty match results. Fix any data issues before the clock starts.

---

## 1. MVP Scope

### 1.1 What We're Proving

The hackathon MVP demonstrates a single compelling workflow: **an agent captures a buyer's needs, the system matches properties against those needs, the agent shortlists and shares with the client, and the client provides feedback — all in one platform.** Each feature exists to prove one part of the unified-platform value prop. Nothing else ships.

### 1.2 Core Demo Flow

```
Agent Dashboard                              Client Portal
─────────────                               ─────────────
1. Create buyer brief (budget, suburbs,
   property type, must-haves)
       │
2. View matched properties ◄──────── Rule-based scoring (pre-computed, loaded from seed)
   (list with search/filter)
       │
3. Expand property card ───────────────► CMA (2-3 comps) + risk overlays
   (seed data, pre-loaded)
       │
4. Compare properties side-by-side       Match scores, CMA ranges, risk badges
   (2-3 properties in comparison view)
       │
5. Add to shortlist ───────────────────► "Share with client"
       │                                      │
       │                              6. Client logs in, sees shortlist
       │                                      │
       │                              7. Client approves/rejects/comments
       │                                      │
8. Agent dashboard refreshes ◄────────────── Client feedback appears
   (polling every 3s + manual "Refresh" button)

DEMO TIP: Keep both browser windows (agent dashboard + client incognito) visible
side-by-side on screen. This eliminates the polling visibility problem and
demonstrates the platform's unified nature in a single glance.
```

### 1.3 In Scope

| Feature | Why It Ships |
|---|---|
| Agent login (email + password) | Enables demo as the agent persona |
| Buyer brief form (single-page) | Proves structured needs capture — the platform's input signal |
| Property listing page (20-30 demo properties) | Proves unified property browsing without tab-switching |
| Property search/filter (suburb, price, beds, type) | Proves faster discovery than portal-hopping |
| Property detail card with mock CMA + risk data | Proves due-diligence-in-one-place value prop |
| Property comparison view (2-3 side-by-side) | Proves analysis capability beyond spreadsheets — match scores, CMA, risk in one glance |
| Shortlist (add/remove, share) | Proves agent-client curation workflow |
| Client login (magic link or email + password) | Enables demo as the client persona |
| Client portal — view shared shortlist | Proves transparency and client experience |
| Client portal — approve/reject/comment on properties | Proves structured feedback loop |
| Agent dashboard — polling for client feedback | Proves real-time visibility into client decisions |
| User action event logging (user_actions table) | Foundation for future analytics/ML — 30 min investment |

### 1.4 Deliberately Out of Scope

| Feature | Why It Ships Later |
|---|---|
| Live API integrations (Domain, REA, CoreLogic) | Requires API keys, rate limits, parsing — entire hackathon would be wasted on ingestion |
| Real AI/ML matching | Requires training data, model selection, validation — rule-based scoring proves the concept |
| Off-market hub | Separate data pipeline and workflow — not core to the demo narrative |
| Offer letters, auction tracker | Phase 5 — requires negotiation workflow that depends on prior phases |
| Document upload/storage | Requires object store, virus scanning, file management UI |
| Milestone tracking | Phase 6 — meaningful only after a property is selected |
| Email/SMS notifications | Requires 3rd-party gateway setup, templating, delivery handling |
| Payment/subscription | Not relevant to a single-agent demo |
| Multi-tenancy (multiple agencies, RBAC) | Two hardcoded users: one agent, one client |
| Map view | Geocoding all demo properties + map component is 4+ hours for marginal demo value |
| Kanban/pipeline board | Status column on the shortlist table suffices |
| WebSockets | Polling every 3 seconds via `@tanstack/react-query` is 1 line of code vs. WebSocket infrastructure |
| Rich text inputs | Plain text for all fields |
| PDF generation | Browser print + system dialog if needed for demo |

---

## 2. Demo Data Strategy

### 2.1 Location

**Sydney, NSW.** Rationale: Australia's largest property market, globally recognisable suburb names, wide price spectrum ($600K apartments to $4M+ houses) that enables diverse demo scenarios.

### 2.2 Property Corpus (25 properties)

Select suburbs with varied profiles:

| Suburb Profile | Suburbs | Count |
|---|---|---|
| Premium (houses $2.5M-$4M+) | Mosman, Paddington, Manly | 6 |
| Mid-range family (houses $1.5M-$2.5M) | Randwick, Marrickville, Lane Cove | 6 |
| Inner-ring apartments ($700K-$1.3M) | Surry Hills, Newtown, Pyrmont | 6 |
| Growth corridor ($600K-$950K) | Parramatta, Homebush, Ryde | 4 |
| Entry-level units ($500K-$750K) | Canterbury, Liverpool | 3 |

Each property record includes:

```json
{
  "id": "prop-001",
  "address": "42 Union Street, Surry Hills NSW 2010",
  "suburb": "Surry Hills",
  "postcode": "2010",
  "property_type": "apartment",
  "bedrooms": 2,
  "bathrooms": 1,
  "car_spaces": 0,
  "land_size_sqm": null,
  "floor_area_sqm": 78,
  "price_guide": 950000,
  "listing_url": "https://demo.example.com/listing/prop-001",
  "main_image_url": "/images/properties/prop-001.jpg",
  "description": "Renovated two-bedroom apartment in a quiet tree-lined street. Open-plan living with polished timber floors, gas kitchen, and a sunny north-facing balcony. Walk to cafes and light rail.",
  "features": ["balcony", "timber_floors", "gas_cooking", "internal_laundry"],
  "listing_status": "active",
  "days_on_market": 7
}
```

### 2.3 CMA Data (per property)

Each property has 2-3 comparable sales stored as:

```json
{
  "property_id": "prop-001",
  "comparables": [
    {
      "address": "18A Hutchinson Street, Surry Hills NSW 2010",
      "sale_price": 920000,
      "sale_date": "2026-02-15",
      "bedrooms": 2,
      "bathrooms": 1,
      "property_type": "apartment",
      "price_per_sqm": 11795,
      "days_on_market": 21,
      "notes": "Similar condition, no balcony"
    },
    {
      "address": "7/245 Devonshire Street, Surry Hills NSW 2010",
      "sale_price": 985000,
      "sale_date": "2026-03-08",
      "bedrooms": 2,
      "bathrooms": 1,
      "property_type": "apartment",
      "price_per_sqm": 12628,
      "days_on_market": 14,
      "notes": "Renovated, parking included"
    }
  ],
  "estimated_value_range": [930000, 980000],
  "confidence": "medium"
}
```

### 2.4 Risk Overlay Data (per suburb)

Pre-loaded risk indicators as simple tags:

```json
{
  "suburb": "Surry Hills",
  "risks": [
    { "type": "heritage_overlay", "severity": "medium", "description": "Portions of the suburb are heritage-listed. Check council DCP for the specific address." },
    { "type": "flood", "severity": "low", "description": "Minor overland flow risk in low-lying streets near South Dowling Street." }
  ]
}
```

Add bushfire (mosman, manly outskirts), flooding (marrickville, parramatta), heritage (paddington, surry hills), and airport noise (newtown, marrickville) risks distributed across suburbs.

### 2.5 Sample Buyer Briefs (3)

**Brief 1 — Young Professional Couple**
- Client: Sarah Chen & Tom Williams
- Budget: $800,000 – $1,100,000
- Suburbs: Surry Hills, Newtown, Pyrmont, Redfern
- Property type: Apartment
- Beds: 2+, Baths: 1+, Parking: nice-to-have
- Must-haves: natural light, walk to public transport, internal laundry
- Deal-breakers: ground floor, no balcony, on a main road

**Brief 2 — Upgrading Family**
- Client: James & Priya Fernando
- Budget: $1,600,000 – $2,400,000
- Suburbs: Randwick, Lane Cove, Marrickville, Dulwich Hill
- Property type: House
- Beds: 3+, Baths: 2+, Parking: required
- Must-haves: backyard, within 1km of primary school, quiet street
- Deal-breakers: on a main road, heritage restrictions preventing renovations

**Brief 3 — First-Home Investor**
- Client: Michael Tran
- Budget: $550,000 – $800,000
- Suburbs: Parramatta, Homebush, Ryde, Canterbury
- Property type: Apartment, Townhouse
- Beds: 1+, Baths: 1+, Parking: required
- Must-haves: rental yield above 4%, low strata fees, near transport
- Deal-breakers: cladding issues, high-density complexes with >50 units

### 2.6 Pre-Computed Match Scores

For each brief, pre-compute and seed a matching score (0-100) for each property using the rule-based engine. This avoids running matching logic at runtime during the demo. The demo simply loads pre-scored matches. **There is no live matching engine in the MVP — all match scores are stored in the seed data.** The scoring algorithm is implemented in code (Section 3.4) and can be demonstrated by walking through the scoring of a single property, but it is not called from API endpoints during the demo.

### 2.7 Seed Data Format

All demo data lives in a single `seed.json` file (or `seed.sql` if SQLite) committed to the repo. The backend reads and hydrates the database on first startup. No separate import step, no manual data entry for demos.

---

## 3. Architecture for MVP

### 3.1 Principle: Monolith, Single Process, Zero Infrastructure

One codebase. One process. One deployment. The entire app — API, database, static assets — runs in a single process. No Docker Compose, no separate database server, no reverse proxy.

### 3.2 Component Map

```
Browser
  │
  ├─ / → Agent Dashboard SPA
  ├─ /portal → Client Portal SPA
  │
  ▼
Single Server Process
  ├─ Static file serving (HTML, JS, CSS, images)
  ├─ REST API handlers (/api/v1/*)
  │   ├─ POST /api/v1/auth/login
  │   ├─ GET/POST /api/v1/briefs
  │   ├─ GET /api/v1/properties?suburb=&type=&min_price=&max_price=&beds=
  │   ├─ GET /api/v1/properties/:id
  │   ├─ GET /api/v1/properties/:id/cma
  │   ├─ GET /api/v1/properties/:id/risks
  │   ├─ GET/POST /api/v1/shortlists (create, add/remove properties, share)
  │   ├─ GET /api/v1/shortlists/:id
  │   ├─ POST /api/v1/shortlists/:id/feedback
  │   └─ GET /api/v1/shortlists/:id/feedback
  ├─ SQLite database (file on disk)
  └─ Seed data loader (runs once on first startup)
```

### 3.3 Data Model (6 tables)

```
users
  id, email, password_hash, name, role (agent|client), created_at

buyer_briefs
  id, user_id (FK), client_name, budget_min, budget_max,
  suburbs (JSON array), property_types (JSON array),
  min_beds, min_baths, parking (required|nice_to_have|not_needed),
  must_haves (JSON array), deal_breakers (JSON array),
  created_at, updated_at

properties
  id, address, suburb, postcode, property_type, bedrooms,
  bathrooms, car_spaces, land_size_sqm, floor_area_sqm,
  price_guide, listing_url, main_image_url, description,
  features (JSON array), listing_status, days_on_market

cma_records
  id, property_id (FK), address, sale_price, sale_date,
  bedrooms, bathrooms, property_type, price_per_sqm,
  days_on_market, notes

risk_overlays
  id, suburb (text), type, severity, description

shortlists
  id, buyer_brief_id (FK), property_id (FK), client_id (FK),
  status (shortlisted|shared|approved|rejected),
  feedback_text, shared_at, feedback_at, created_at

user_actions
  id, user_id (FK), action_type (shortlist_add|shortlist_remove|approve|
  reject|comment|brief_create|brief_view|property_view),
  entity_type (brief|property|shortlist), entity_id, metadata (JSON),
  created_at
```

The `user_actions` table is a lightweight event log that costs ~30 minutes to implement and provides a foundation for future analytics and ML training data. Every user action (add to shortlist, approve, reject, comment, create brief, view property) writes one row. No complex event pipeline — just insert and forget.

### 3.4 Rule-Based Matching Engine

Simple weighted scoring algorithm (not AI, not ML). **For the MVP, all scores are pre-computed and stored in the seed data.** The engine code exists and is implemented so it can be shown during the demo (walk through how a property scored 89 vs. 45), but it is not called live from API endpoints:

1. **Hard filters** (property excluded if any fail): outside budget range, wrong suburb list, wrong property type, insufficient bedrooms/bathrooms, violates deal-breakers.
2. **Soft scoring** (remaining properties scored 0-100): proximity to budget midpoint (30pts), count of matched must-haves (25pts), matched features from wish list (20pts), days on market recency (10pts), parking match (10pts), low risk profile (5pts).

### 3.5 Auth

Simple JWT-based auth. Two hardcoded demo users seeded with the data:
- Agent: `agent@demo.com` / `password123`
- Client (Sarah & Tom's brief): `sarah@demo.com` / `password123`

No registration flow. No password reset. No OAuth. The login form exists solely as a demo entry point.

---

## 4. Hackathon Work Division

### 4.1 Person A: Backend Core (8-12 hours)

**Skills:** API design, database, data modelling.

**Focus:** Core backend APIs only. No seed data, no matching engine runtime, no static data endpoints.

**Deliverables by hour:**

| Hour | Deliverable |
|---|---|
| 0-2 | Set up project scaffold, SQLite schema (Prisma migration), seed script (reads seed.json, not writes it). Create tables. |
| 2-4 | Auth endpoints (login, JWT issue/verify middleware). Properties CRUD API (list with filters, detail). |
| 4-8 | Buyer briefs CRUD API. Shortlists CRUD API (create, add/remove properties, share). Feedback endpoints (submit, query). |
| 8+ | Bug fixes, edge cases, support Persons B and C with API integration issues. Add pagination, sorting, error responses. |

**Critical checkpoint (Hour 8):** All core API endpoints working and returning realistic data from the seed database. The backend is the critical path — B and C are blocked until endpoints exist.

### 4.2 Person B: Agent Dashboard Frontend (12-16 hours)

**Skills:** Frontend components, forms, lists, detail views, API integration.

**Deliverables by hour:**

| Hour | Deliverable |
|---|---|
| 0-2 | Project scaffold (Next.js App Router), routing, shared component library (header, sidebar, card, table, form inputs), API client utilities, `@tanstack/react-query` setup. |
| 2-8 | Login page. Dashboard layout with navigation. Buyer brief creation form (form validation, submit, feedback toast). |
| 8-16 | Property listing page (card grid with suburb/price/beds/type filters). Property detail card (listing info + CMA table + risk badges). Property comparison view (2-3 properties side-by-side with match scores, CMA data, risk badges). Shortlist management (add/remove, share button, status column). Client feedback view (polling widget at 3s interval via `refetchInterval`, approval/rejection/comments display). Manual "Refresh" button as fallback. |
| 16+ | Polish, responsive design, loading states, error handling, demo-ready styling. Side-by-side browser window presentation setup. |

### 4.3 Person C: Client Portal + Seed Data + Static APIs (16-20 hours)

**Skills:** Frontend components, data authorship, UX polish, responsive design.

**All seed data is Person C's responsibility.** Written before the hackathon (see Pre-Hackathon Preparation section). During the event, Person C loads, verifies, and extends it.

**Deliverables by hour:**

| Hour | Deliverable |
|---|---|
| 0-4 | Client portal project scaffold, routing, shared component library (collaborate with B on shared primitives). Verify seed data loads correctly. Load and verify property images. |
| 4-8 | Client login page. Client portal layout. Shortlist view (property cards with approve/reject/comment actions). CMA static endpoint (serve JSON from cma_records table). Risk data static endpoint (serve JSON from risk_overlays table). |
| 8-14 | Approve/reject/comment submission with confirmation UI. Empty states, loading states, error states. Seed data polish — refine property descriptions, verify CMA data consistency, ensure all risk tags are correctly mapped. |
| 14-24 | Polish, responsive/mobile design, micro-interactions, demo-ready presentation quality. From ~Hour 18: help Person A with API integration — Person C has frontend skills and can pair on remaining API work or integration debugging. |
| 24+ | Final seed data verification. Cross-browser testing. Demo script rehearsal collaboration. |

### 4.4 Integration Checkpoints

| Hour | What Must Work |
|---|---|
| **Hour 0-2** | Project scaffolded (Person A: schema, seed loader). Person B and C: project setup, routing, component library skeleton. Person C verifies seed data loads cleanly. |
| **Hour 8** | Person A: Auth working + basic property endpoints returning seed data. Person B: Login page authenticates, brief form UI exists. Person C: Seed data 50% verified, client portal scaffolded. |
| **Hour 16** | Person A: All CRUD APIs (briefs, properties, shortlists, feedback). Person B: Property list with search/filter + property detail card with CMA/risks + comparison view started. Person C: Client portal login + shortlist view + static CMA/risk endpoints. |
| **Hour 24** | Person A: All endpoints complete with error handling. Person B: Shortlist management + feedback views + comparison view working. Person C: All seed data done, static endpoints verified, continuing API integration support. |
| **Hour 30** | **END-TO-END INTEGRATION BEGINS.** All three merge branches. Full demo flow tested: brief → match → shortlist → share → client feedback → agent refresh. |
| **Hour 36** | Core demo flow works end-to-end with all 3 briefs. 3+ properties shortlisted per brief, feedback loop functional. Comparison view implemented. Side-by-side browser window setup verified. |
| **Hour 42** | **Feature freeze.** No new features. Bug fixes only. All known issues triaged — fix what breaks the demo, leave cosmetic issues. |
| **Hour 44-48** | Demo rehearsal. 3 full dry runs of the script with real timings. Polish visual details. Pitch deck finalised. Backup contingency planned (what if WiFi drops, what if API is slow — have screenshots ready). |

### 4.5 Communication Protocol

- **Shared channel:** Discord or WhatsApp group open throughout.
- **API contract:** Person A publishes endpoints with expected request/response shapes (TypeScript interfaces or OpenAPI spec) by Hour 2. Persons B and C develop against mocks until live API is ready.
- **Merge strategy:** Single `main` branch. Deploy on push. Everyone commits frequently. No long-lived branches.
- **Blocker rule:** If anyone is blocked for >15 minutes, escalate immediately in the shared channel.

---

## 5. Recommended Tech Stack

### 5.1 Evaluation Criteria

| Criterion | Weight | Why It Matters in a Hackathon |
|---|---|---|
| Setup speed (zero to API/UI in <30 min) | Critical | Every minute spent on config is a minute not building features |
| Hot reload (sub-second on code change) | Critical | Fast iteration loop is the single biggest productivity multiplier |
| Full-stack language (one language across team) | High | 3 devs who can all read and contribute to any part of the codebase |
| Ecosystem (libraries, components, templates) | High | Pre-built UI components and backend libraries reduce custom code |
| Deployment simplicity (one command) | High | No CI/CD pipeline, no Docker, no environment variables labyrinth |
| Database integration ergonomics | Medium | Migrations, seeding, type-safe queries |
| Team familiarity (generalist full-stack devs) | Medium | Assume JavaScript/TypeScript as baseline competency |

### 5.2 Recommendation: Full-Stack TypeScript

**Next.js (App Router) + Prisma + SQLite + Vercel**

| Layer | Choice | Rationale |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Single codebase for API + frontend. File-based routing. Server Components for data fetching. API route handlers for REST. Built-in static file serving. |
| **Language** | TypeScript | Shared types between API handlers and UI components. Catches bugs at compile time. |
| **Database** | SQLite (via `better-sqlite3` + Prisma) | Zero setup — single file. No server process. Prisma provides type-safe queries, migrations, and seed scripts. Trivially swappable to PostgreSQL post-hackathon by changing the Prisma datasource URL. |
| **ORM** | Prisma | Auto-generated types from schema. Declarative migrations. Built-in seed runner. Excellent DX for rapid iteration. |
| **Auth** | `jose` (lightweight JWT library) | Avoid NextAuth complexity for a hackathon. Stateless JWTs with a simple login endpoint and middleware to verify. |
| **UI Library** | Tailwind CSS + shadcn/ui | Utility CSS eliminates context-switching between files. shadcn/ui provides copy-paste component primitives (form inputs, cards, tables, buttons) that are themeable and accessible. |
| **State/Data Fetching** | `@tanstack/react-query` | Handles polling trivially (`refetchInterval: 3000`), cache invalidation, loading/error states out of the box. Prevents hours of debugging around stale data and manual refetch logic. |
| **Hosting** | Vercel (free tier) | `git push` → deployed. Zero config for Next.js. |
| **Alternative Hosting** | Railway or Render | If SQLite on Vercel proves problematic, Railway's `nixpacks` auto-detects Next.js and provides a persistent volume for the SQLite file. |

**IMPORTANT: SQLite on Vercel is fragile.** The primary demo strategy is **LOCAL development** (`npm run dev` on the presenter's machine). Vercel deployment is OPTIONAL, attempted only if time permits and the local demo already works flawlessly.

Known issues and fallbacks:
- **`better-sqlite3`** is a native C++ addon. It may fail to compile on Apple Silicon without specific flags (`CXXFLAGS="-std=c++17"`).
- **Fallback A:** Use **`sql.js`** (WASM build of SQLite) — pure JavaScript, zero native compilation, compatible with all platforms. Works with Prisma via a custom adapter.
- **Fallback B:** Use **Bun** (`bun install && bun run dev`). Bun has built-in SQLite support (`bun:sqlite`) with no native compilation needed and significantly faster startup than Node.js + better-sqlite3.

**The absolute rule**: If SQLite doesn't work within 30 minutes of Hour 0, switch to sql.js or Bun. Do not waste hackathon time debugging native modules.

### 5.3 Why Not Alternatives

| Rejected Option | Why |
|---|---|
| **Python (FastAPI)** | Excellent framework, but forces the team into two languages (Python backend + JS frontend). Shared types require code generation or manual sync. Three generalist devs probably share JS competency; Python may exclude one. |
| **Go** | Exceptionally fast to build and run, but lack of ORM ecosystem, no hot reload without extra tooling, and lower familiarity among generalist devs. Wrong trade-off for a hackathon. |
| **Vue / Nuxt** | Excellent frameworks. If the team has a strong Vue preference, Nuxt is a valid Next.js alternative with near-identical capabilities. Recommendation assumes React is the safer bet for generalist devs. |
| **Svelte / SvelteKit** | Fantastic DX but smaller ecosystem and fewer pre-built components. Higher risk if a team member needs a component that doesn't exist yet. |
| **PostgreSQL** | Requires a running database server (local install or cloud). SQLite removes this dependency entirely. The Prisma schema is identical — swap the datasource in 5 minutes when leaving the hackathon. |
| **Supabase (hosted)** | Great product but requires account setup, API key management, and network latency. SQLite is local, instant, and free. |
| **Docker Compose** | Over-engineering for a 3-person demo. A single `npm run dev` should start the entire application. |

### 5.4 Project Bootstrapping Commands

```bash
npx create-next-app@latest buyers-agent --typescript --tailwind --eslint --app --src-dir
cd buyers-agent
npm install prisma @prisma/client better-sqlite3 jose @tanstack/react-query
npm install -D tsx
npx prisma init --datasource-provider sqlite
npx shadcn@latest init
npx shadcn@latest add button card input select table badge dialog
```

**Note on @tanstack/react-query:** The `refetchInterval` option handles client feedback polling in one line: `useQuery({ queryKey, queryFn, refetchInterval: 3000 })`. Combined with a manual "Refresh" button as fallback, this eliminates all the complexity of managing setInterval, cleanup, and stale data — an easy 2-3 hours saved.

From zero to a running app with auth, API, and styled UI: approximately 30 minutes.

---

## 6. Demo Script

### 6.1 Opening (30 seconds)

> "Buyer's agents in Australia juggle 6 to 8 different tools for every single client — CRM, property portals, spreadsheets, email, WhatsApp, and document storage. That's 10 hours a week lost to tool-switching. We built the single operating system that replaces all of them. Let me show you."

### 6.2 Live Demo (3-4 minutes)

**Scene 1 — The Buyer Brief (45 seconds)**

- Log in as agent (pre-filled credentials, 2 seconds).
- Dashboard loads. Click "New Buyer Brief."
- Fill out the brief for Sarah & Tom: budget $800K–$1.1M, Surry Hills/Newtown/Pyrmont, 2+ bed apartment, must-haves: natural light, near transport, internal laundry.
- Submit. Confirmation toast.

**Scene 2 — Smart Matching (45 seconds)**

- Navigate to "Properties" tab. Pre-filtered to matches for Sarah & Tom's brief, sorted by match score.
- "This is where the platform earns its keep. 25 properties in the system. The matching engine filtered and scored them against the brief. The agent sees the best matches first — no tab-switching, no manual cross-referencing."

**Scene 3 — Property Comparison (The "Wow" Moment) (45 seconds)**

- Select 2-3 top matches and open the **side-by-side comparison view**.
- Three property cards displayed next to each other with: match scores (89, 76, 68), listing photos, key stats (beds, baths, price guide), CMA estimated value ranges, and risk badges (heritage, flood, etc.).
- "This is what you can't do in a spreadsheet. The platform scores, compares, and surfaces due diligence data for multiple properties simultaneously. An agent would need a Domain tab, a CoreLogic tab, and a council overlay tab open — and they'd still be doing the comparison by hand."

**Scene 4 — Property Deep-Dive (30 seconds)**

- Click the top match: 42 Union Street, Surry Hills. Score: 89/100.
- Property card expands with listing details, photos, and features.
- Scroll to CMA section: two comparable sales at $920K and $985K. Estimated value $930K–$980K.
- Risk section: heritage overlay (medium), flood risk (low).
- "CMA, risk data, listing details — all in one view. The agent isn't opening CoreLogic in one tab and a council website in another."

**Scene 5 — Shortlist & Share (30 seconds)**

- Click "Add to Shortlist." Add two more properties.
- Open the shortlist. Click "Share with Client."
- "Client gets notified. Now let's switch to the client's experience."

**Scene 6 — Client Portal (45 seconds)**

- Open incognito window. Log in as Sarah.
- Shortlist loads: 3 properties with images, addresses, and "Approve" / "Reject" buttons.
- Approve 42 Union Street: "Love the balcony and the natural light. Can we inspect this weekend?"
- Reject another: "Ground floor — no go for us."
- Comment on the third: "Interesting but worried about strata fees."

**Scene 7 — Agent Feedback Loop (30 seconds)**

- Switch back to agent dashboard. Feedback has loaded (polling in action).
- 1 approved, 1 rejected, 1 with comment.
- "The agent sees exactly what the client thinks, in real time. No forwarding emails, no WhatsApp threads getting lost. One platform, one workflow."

**DEMO SETUP:** Keep both browser windows (agent dashboard + client incognito) visible side-by-side on screen throughout. This eliminates polling delay visibility and makes the unified-platform message obvious at a glance.

### 6.3 Closing (30 seconds)

> "This is Phase 1 — the core loop. Brief, match, shortlist, feedback. Post-hackathon, we layer on live data integrations with Domain and CoreLogic, AI-powered matching, due diligence automation, offer management, and transaction tracking through to settlement. The vision is an end-to-end operating system for every buyer's agent in Australia. Thank you."

---

## 7. Risk Register (MVP)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Person A's API is late, blocking B and C | Medium | High | Publish API contract by Hour 2. Persons B and C mock API responses and develop UIs independently. Merge only when live API is ready. |
| SQLite native module fails (better-sqlite3 on Apple Silicon) | Medium | High | Test SQLite setup in Hour 0. If better-sqlite3 fails to compile: switch immediately to sql.js (WASM, zero native deps) or Bun (bun:sqlite). Do not spend more than 30 minutes debugging native modules. |
| Vercel deployment fails or is unreliable | Medium | Medium | Primary strategy is LOCAL development (`npm run dev`). Vercel deployment is OPTIONAL, attempted only after local demo works. Have Railway as fallback hosting. |
| Seed data has errors (wrong addresses, inconsistent CMA prices) | Medium | High | Person C verifies seed data before Hour 0. Run the seed loader and check all associations at least once before the event starts. |
| Demo data feels fake or unconvincing | Medium | Medium | Use real Sydney addresses, realistic price guides, and plausible CMA data. Write property descriptions that read like genuine listings. |
| 25 properties is not enough for search/filter to feel useful | Low | Low | Auto-generate 25 more properties (same suburbs, slight variations) if needed. The matching engine is the headline, not search breadth. |
| Client portal looks amateur compared to fintech apps | Medium | Medium | Person C focuses exclusively on polish from Hour 14. shadcn/ui gives a clean baseline. Invest in one "wow" interaction — smooth approve/reject animation or a polished empty state. |
| Polling fails under demo conditions (network lag, stale state) | Low | Medium | `@tanstack/react-query`'s `refetchInterval: 3000` handles polling. Add a manual "Refresh" button as fallback. Keep both browser windows side-by-side to make polling invisible. |
| Property images missing or broken during demo | Medium | High | Source and test all 25 Unsplash images during pre-hackathon prep. Have solid-colour placeholder images ready as fallback. |
| Demo doesn't clearly communicate the problem | Low | High | Practice the opening 30-second problem statement. It must land in one sentence. If the audience doesn't understand the pain, nothing else matters. |
| Presentation machine can't run SQLite or local server | Low | High | Have a backup machine pre-configured. Test `npm run dev` on the actual presentation laptop in Hour 44. |

---

## Document Status

- **Version:** 1.1
- **Last Updated:** May 2026 (revision: work division redistributed across team, realistic integration checkpoints added, SQLite/Vercel warnings with fallback paths, pre-hackathon seed data preparation section, `@tanstack/react-query` added to bootstrapping, polling interval reduced to 3s with manual refresh fallback, property comparison view added to demo script, `user_actions` event log table added to data model, Unsplash photo sourcing plan, side-by-side browser window demo setup)
- **Next:** Implementation plan (`writing-plans` skill), then build
