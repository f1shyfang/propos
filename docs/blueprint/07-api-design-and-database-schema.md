# 07 — API Design & Database Schema

---

## PART A: API DESIGN

---

### 1. API Philosophy

**RESTful with Targeted Document-Oriented Endpoints**

The platform adopts a **REST-first** approach with JSON as the wire format. GraphQL was considered but rejected for this phase: the platform's read patterns are well-defined and heavily filtered lists (property search, match results, pipeline views). REST keeps caching trivial via CDN and provides clear, debuggable boundaries for integration partners. A future Phase 5 addition may introduce a dedicated GraphQL gateway over stable REST services if consumer-driven UI requirements demand it.

**API Versioning**

Versioning lives in the URL path prefix: `/api/v1/`. Breaking changes increment the version number. Deprecated versions are supported for a minimum of 6 months with sunset headers (`Deprecation: true`, `Sunset: <date>`). Non-breaking additions (new optional fields, new endpoints) do not require a version bump.

**Authentication**

JWT-based with refresh tokens:

- **Access token**: short-lived (15 minutes), carried in the `Authorization: Bearer <token>` header. Contains user ID, role, and agency ID in the payload.
- **Refresh token**: long-lived (30 days), stored as an HTTP-only, Secure, SameSite=Strict cookie. Rotated on each use; previous refresh token and its entire family are invalidated to prevent replay.
- **Role-based access control**: three roles — `agent`, `client`, `admin`. Agents see their own clients and their agency's data. Clients see only their own briefs, shortlists, and deals. Admins have cross-agency visibility and configuration access.
- **Multi-tenancy**: the agency ID claim scopes all queries. Row-level security in the database enforces this as a secondary guard.

**Error Response Format**

All errors return a consistent envelope:

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Budget minimum must be less than budget maximum.",
    "details": [
      {
        "field": "budget_min",
        "issue": "must_be_less_than",
        "constraint": "budget_max"
      }
    ],
    "request_id": "req_abc123"
  }
}
```

Standard error codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `INVALID_INPUT`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL`. The `request_id` matches a server-side request log entry.

**Pagination, Filtering, Sorting**

Cursor-based pagination is the default for large collections (properties, matches). Query parameters:

- `cursor=<opaque_token>` — pagination anchor
- `limit=<int>` — page size (default 25, max 100)
- `sort=<field>` — sort field, prefixed with `-` for descending (e.g., `sort=-match_score`)
- `filter[field]=value` — field-level equality filters
- `filter[field][op]=value` — operator filters where `op` is one of `gt`, `gte`, `lt`, `lte`, `in`, `contains`

Response includes a `meta` block:

```json
{
  "data": [...],
  "meta": {
    "next_cursor": "opq_xyz",
    "has_more": true,
    "total": 1423
  }
}
```

---

### 2. Core API Endpoints

#### a) Authentication

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/auth/register` | Create account (agent or client). Returns tokens. |
| `POST` | `/api/v1/auth/login` | Email + password login. Returns access + refresh tokens. |
| `POST` | `/api/v1/auth/refresh` | Exchange refresh-token cookie for fresh access token. |
| `POST` | `/api/v1/auth/forgot-password` | Sends password-reset email. |
| `POST` | `/api/v1/auth/reset-password` | Consumes reset token, sets new password. |
| `POST` | `/api/v1/auth/logout` | Invalidates refresh token family. |
| `POST` | `/api/v1/auth/magic-link/send` | [Phase 3] Send magic link email for client auth. Body: `{ "email": "..." }`. |
| `GET` | `/api/v1/auth/magic-link/verify` | [Phase 3] Verify magic link token. Query: `?token=xxx`. Returns session JWT. |

**Note on client authentication:** For the hackathon MVP, clients authenticate via email+password login (`POST /auth/login`), matching the agent auth flow for implementation simplicity. Magic link authentication (`POST /auth/magic-link/send`, `GET /auth/magic-link/verify`) is documented here as the intended Phase 3 enhancement, providing a frictionless client experience where buyers do not need to create or remember a password.

**POST /auth/login** request: `{ "email": "...", "password": "..." }`  
Response: `{ "access_token": "...", "user": { "id": "...", "name": "...", "role": "agent", "agency_id": "..." } }` (refresh token in Set-Cookie header)

#### b) Buyer Briefs (CRM — Phase 1)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/buyer-briefs` | List briefs for authenticated user's scope. Supports `filter[status]`, `filter[client_id]`, `sort=-created_at`. |
| `POST` | `/api/v1/buyer-briefs` | Create a buyer brief. |
| `GET` | `/api/v1/buyer-briefs/:brief_id` | Full brief with nested client info. |
| `PATCH` | `/api/v1/buyer-briefs/:brief_id` | Partial update. Status transitions validated server-side. |
| `DELETE` | `/api/v1/buyer-briefs/:brief_id` | Soft-delete (set `status=archived`). |

**POST /buyer-briefs** request body:

```json
{
  "client_id": "uuid",
  "budget_min": 800000,
  "budget_max": 1100000,
  "property_types": ["house", "townhouse"],
  "preferred_suburbs": ["Carlton North", "Fitzroy", "Collingwood"],
  "must_haves": { "bedrooms": 3, "car_spaces": 1, "outdoor_space": true },
  "deal_breakers": { "on_main_road": true, "no_natural_light": true },
  "finance_status": "pre_approved",
  "pre_approval_amount": 1050000,
  "broker_details": { "name": "Jane Broker", "phone": "0400000000", "company": "Aussie Finance" }
}
```

#### c) Properties

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/properties` | Search and filter. Supports `filter[suburb]`, `filter[property_type]`, `filter[bedrooms]`, `filter[price][gte]`/`[lte]`, `filter[land_size_sqm][gte]`, `sort=-listed_date`. Full-text `?q=` delegates to external search engine. |
| `GET` | `/api/v1/properties/:property_id` | Full property card including listing history, risk overlays, and recent comparable sales. |
| `GET` | `/api/v1/properties/:property_id/comparables` | CMA data: recent sales within radius, matched by property type and bedroom count. Query params: `radius_km` (default 2). |
| `GET` | `/api/v1/properties/:property_id/risk-overlays` | Flood, bushfire, heritage, zoning overlays intersecting the property boundary. |

**GET /properties/:property_id** response includes: core property fields + `history` array + `risks` array + `active_listing` object + `comparable_sales_summary`.

#### c.1) CMA Reports (Research Module)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/cma/generate` | Generate a Comparative Market Analysis report. Body: `{ "property_id": "uuid", "title": "CMA for 12 Smith St", "notes": "Client briefing" }`. Enqueues background PDF generation, returns `report_id` immediately. |
| `GET` | `/api/v1/cma/:report_id` | Get CMA report metadata + structured data (comparable sales, suburb stats, risk summary). |
| `GET` | `/api/v1/cma/:report_id/download` | Download generated CMA PDF. Returns pre-signed URL (or streams the PDF directly). |
| `GET` | `/api/v1/cma` | List CMA reports for the authenticated agency. `filter[property_id]`, `filter[status]`. |

**CMA report structure:** A CMA combines:
- Property details and photos
- Comparable sales within radius (sourced from `property_history` via `GET /properties/:id/comparables`)
- Suburb median price and growth trends (from Domain API / ABS data)
- Risk overlay summary (from `property_risks`)
- Agent notes and recommendation text

The report is rendered server-side via HTML-to-PDF and stored in the object store. A `cma_reports` table tracks metadata: `id`, `agency_id`, `property_id`, `agent_id`, `title`, `notes`, `s3_key`, `status` (pending/ready/failed), `report_data JSONB`, `created_at`.

#### d) Matching

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/matches/run` | Trigger a matching run for a buyer brief. Async; returns a `batch_id` immediately. Progress tracked via `GET /matches/batches/:batch_id`. |
| `GET` | `/api/v1/matches` | List match results. `filter[brief_id]` required. Results ordered by `match_score` descending. |
| `GET` | `/api/v1/matches/:match_id` | Single match with scored criteria breakdown. |
| `PATCH` | `/api/v1/matches/:match_id` | Agent action: `{ "action": "dismiss" | "shortlist" | "flag" }`. |
| `POST` | `/api/v1/matches/feedback` | Record agent feedback on match quality to tune scoring: `{ "match_id": "...", "is_relevant": true }`. |

**Match score response shape**:

```json
{
  "match_id": "uuid",
  "brief_id": "uuid",
  "property": { /* abbreviated property object */ },
  "match_score": 87.5,
  "match_reasons": {
    "budget_fit": { "score": 0.95, "detail": "Within budget range" },
    "suburb_match": { "score": 1.0, "detail": "Preferred suburb: Fitzroy" },
    "property_type_match": { "score": 0.8, "detail": "Terrace matches house type" },
    "must_haves_pass": true,
    "deal_breakers_triggered": []
  }
}
```

#### e) Shortlists (Client Portal — Phase 4)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/shortlists` | List shortlists for the authenticated client or agent. |
| `POST` | `/api/v1/shortlists` | Create a named shortlist for a client. |
| `GET` | `/api/v1/shortlists/:shortlist_id` | Shortlist with all items and their properties. |
| `PATCH` | `/api/v1/shortlists/:shortlist_id` | Rename or update metadata. |
| `DELETE` | `/api/v1/shortlists/:shortlist_id` | Delete shortlist (cascades to items). |
| `POST` | `/api/v1/shortlists/:shortlist_id/items` | Add property to shortlist: `{ "property_id": "..." }`. |
| `DELETE` | `/api/v1/shortlists/:shortlist_id/items/:item_id` | Remove property from shortlist. |
| `POST` | `/api/v1/shortlists/:shortlist_id/items/:item_id/feedback` | Client feedback: `{ "action": "approve" | "reject" | "comment", "text": "Love the orientation" }`. |

#### f) Deals / Offers (Phase 5 — Negotiation & Offer Tracking)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/deals` | List deals. `filter[stage]`, `filter[client_id]`, `filter[agent_id]`. Pipeline view. |
| `POST` | `/api/v1/deals` | Create deal from a shortlisted property: `{ "property_id": "...", "client_id": "...", "stage": "suggested" }`. |
| `GET` | `/api/v1/deals/:deal_id` | Full deal with stage history, milestones, documents. |
| `PATCH` | `/api/v1/deals/:deal_id` | Update deal. Stage transitions validated: only certain progressions allowed. |
| `POST` | `/api/v1/deals/:deal_id/submit-offer` | Generate and record an offer. Body includes `offer_amount`, `conditions` (JSONB), `expiry_date`, `deposit_amount`. Triggers webhook `offer.submitted`. |
| `GET` | `/api/v1/deals/:deal_id/offer-letter` | Download generated offer letter PDF. |

#### g) Milestones (Phase 5 — Transaction)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/deals/:deal_id/milestones` | All milestones for a deal, sorted by due date. |
| `POST` | `/api/v1/deals/:deal_id/milestones` | Create milestone: `{ "title": "...", "type": "building_inspection", "due_date": "..." }`. |
| `PATCH` | `/api/v1/milestones/:milestone_id` | Update milestone. Setting `completed_at` triggers `milestone.completed` event. |
| `DELETE` | `/api/v1/milestones/:milestone_id` | Remove milestone. |
| `GET` | `/api/v1/deals/:deal_id/timeline` | Chronological timeline of deal events: stage changes, milestones completed, documents uploaded, notes added. |

#### h) Documents

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/documents/upload-url` | Request a pre-signed S3 upload URL. Body: `{ "name": "...", "mime_type": "...", "category": "contract|report|certificate|other", "deal_id": "..." }`. Returns `{ "upload_url": "...", "document_id": "..." }`. |
| `POST` | `/api/v1/documents/:document_id/confirm` | Confirm upload complete. |
| `GET` | `/api/v1/documents/:document_id/download-url` | Get a pre-signed download URL (expires in 15 min). |
| `GET` | `/api/v1/documents` | List documents. `filter[deal_id]`, `filter[category]`. |
| `DELETE` | `/api/v1/documents/:document_id` | Delete document and S3 object. |

#### i) Selling Agents (Negotiation CRM — Phase 3)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/selling-agents` | List selling agents. `filter[agency]`, `?q=` for name search. |
| `POST` | `/api/v1/selling-agents` | Add selling agent to directory. |
| `GET` | `/api/v1/selling-agents/:agent_id` | Full profile with notes and deal history. |
| `PATCH` | `/api/v1/selling-agents/:agent_id` | Update details or negotiate notes. |
| `POST` | `/api/v1/selling-agents/:agent_id/notes` | Append a note: `{ "text": "Prefers phone calls after 4pm. Responsive." }`. |

---

### 3. Webhook & Event System

**Internal Event Bus**

Services communicate asynchronously via a pub/sub event bus (backed by PostgreSQL `LISTEN/NOTIFY` initially, migrating to Redis Streams or RabbitMQ at scale). Events are fire-and-forget within the cluster.

**Event Schema**

All events carry a standard envelope:

```json
{
  "event_id": "evt_uuid",
  "event_type": "property.new_listing",
  "timestamp": "2026-05-23T07:30:00Z",
  "payload": { /* event-specific data */ },
  "metadata": { "source": "listing-ingestor", "version": "1.0" }
}
```

**Key Domain Events**

| Event Type | Emitted When | Payload Includes |
|------------|--------------|------------------|
| `brief.created` | New buyer brief saved | `brief_id`, `client_id`, `agent_id` |
| `brief.updated` | Brief requirements changed | `brief_id`, changed fields |
| `match.found` | Match score exceeds threshold | `match_id`, `brief_id`, `property_id`, `score` |
| `property.new_listing` | New property ingested | `property_id`, `suburb`, `price`, `type` |
| `property.price_change` | Listed price updated | `property_id`, `old_price`, `new_price` |
| `property.sold` | Property marked as sold | `property_id`, `sale_price`, `sale_date` |
| `shortlist.item_added` | Property added to shortlist | `shortlist_id`, `property_id`, `client_id` |
| `deal.stage_changed` | Deal moves pipeline stage | `deal_id`, `from_stage`, `to_stage` |
| `offer.submitted` | Formal offer submitted | `deal_id`, `offer_amount`, `expiry_date` |
| `milestone.completed` | Milestone marked done | `milestone_id`, `deal_id`, `type` |
| `document.uploaded` | Document upload confirmed | `document_id`, `deal_id`, `category` |

**Webhook Registrations**

Third-party integrations register webhooks via the admin API:

```
POST /api/v1/webhooks
{
  "url": "https://partner.example.com/hooks",
  "events": ["offer.submitted", "milestone.completed"],
  "secret": "whsec_..."
}
```

Outbound webhooks are delivered with a `X-Signature-256` header (HMAC-SHA256 of the payload body using the shared secret). Failed deliveries are retried with exponential backoff (1 min, 5 min, 15 min, 1 hr), then disabled after 20 consecutive failures.

---

## PART B: DATABASE SCHEMA

---

### 4. Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Primary database** | PostgreSQL 16 + PostGIS 3 | Spatial queries are central to the domain (suburb containment, risk-overlay intersection, CMA radius searches). PostgreSQL provides ACID transactions, robust JSONB support for flexible buyer-brief criteria, and `LISTEN/NOTIFY` for the internal event bus. |
| **Full-text search** | Meilisearch (or Typesense) | Property search requires typo-tolerant, instant-as-you-type matching across address, suburb, and description fields. Neither PostgreSQL FTS nor Postgres trigram indexes match this UX requirement. The search engine is a secondary index populated via the event bus. |
| **Object storage** | S3-compatible (AWS S3 or MinIO) | Documents (contracts, reports, certificates) and agent-uploaded media. Pre-signed URLs keep the API layer thin. |
| **Cache** | Redis | Session blacklisting, rate-limiting counters, temporary pre-signed URL tokens, and match-run progress tracking. |

---

### 5. Core Tables

> **Conventions**: All primary keys are `UUID` (v7, time-ordered). All tables include `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`. `updated_at TIMESTAMPTZ` is present on mutable tables and maintained by application logic (or a trigger). Foreign keys use `ON DELETE RESTRICT` unless noted otherwise.

#### a) `users`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK, DEFAULT `gen_random_uuid()` |
| `email` | `TEXT` | NOT NULL, UNIQUE |
| `password_hash` | `TEXT` | NOT NULL |
| `name` | `TEXT` | NOT NULL |
| `role` | `TEXT` | NOT NULL, CHECK (`role` IN ('agent', 'client', 'admin')) |
| `agency_id` | `UUID` | FK → `agencies(id)`, nullable for clients |
| `phone` | `TEXT` | |
| `avatar_s3_key` | `TEXT` | |
| `refresh_token_hash` | `TEXT` | |
| `refresh_token_family_id` | `UUID` | Identifier grouping all tokens in a rotation chain |
| `refresh_token_sequence` | `INTEGER` | Monotonically incrementing counter per rotation |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` |
| `updated_at` | `TIMESTAMPTZ` | |

**Indexes**: `UNIQUE(email)`, `INDEX(agency_id)`, `INDEX(role)`.

**Refresh token family invalidation:** When a refresh token is rotated, the new token gets the same `family_id` with `sequence + 1`. The previous token (same family, sequence - 1) and all ancestors are invalidated. If a stolen/expired token is replayed, the entire family is revoked (fraud detection). This prevents long-lived stolen refresh tokens from being usable after one legitimate rotation. See Doc 05 §5.1 for auth flow details.

#### b) `agencies`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `name` | `TEXT` | NOT NULL |
| `plan_tier` | `TEXT` | NOT NULL DEFAULT 'free', CHECK (`plan_tier` IN ('free', 'pro', 'enterprise')) |
| `settings` | `JSONB` | DEFAULT `'{}'` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` |

#### c) `clients`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `agency_id` | `UUID` | NOT NULL, FK → `agencies(id)` |
| `agent_id` | `UUID` | NOT NULL, FK → `users(id)` |
| `name` | `TEXT` | NOT NULL |
| `email` | `TEXT` | |
| `phone` | `TEXT` | |
| `notes` | `TEXT` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` |
| `updated_at` | `TIMESTAMPTZ` | |

**Indexes**: `INDEX(agency_id)`, `INDEX(agent_id)`, `INDEX(email)`.

#### d) `buyer_briefs`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `agency_id` | `UUID` | NOT NULL, FK → `agencies(id)` |
| `client_id` | `UUID` | NOT NULL, FK → `clients(id)` |
| `agent_id` | `UUID` | NOT NULL, FK → `users(id)` |
| `budget_min` | `INTEGER` | CHECK (`budget_min > 0`) |
| `budget_max` | `INTEGER` | CHECK (`budget_max >= budget_min`) |
| `property_types` | `JSONB` | e.g., `["house", "townhouse", "apartment"]` |
| `preferred_suburbs` | `JSONB` | e.g., `["Carlton North", "Fitzroy"]` |
| `must_haves` | `JSONB` | `{"bedrooms": 3, "bathrooms": 2, ...}` |
| `deal_breakers` | `JSONB` | `{"on_main_road": true, ...}` |
| `finance_status` | `TEXT` | CHECK (`finance_status` IN ('not_started', 'pre_approved', 'approved', 'cash')) |
| `pre_approval_amount` | `INTEGER` | |
| `broker_details` | `JSONB` | `{"name": "...", "phone": "...", "company": "..."}` |
| `status` | `TEXT` | NOT NULL DEFAULT 'active', CHECK (`status` IN ('draft', 'active', 'paused', 'fulfilled', 'archived')) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` |
| `updated_at` | `TIMESTAMPTZ` | |

**Indexes**: `INDEX(agency_id)`, `INDEX(client_id)`, `INDEX(agent_id)`, `INDEX(status)`, `INDEX(budget_min)`, `INDEX(budget_max)`, `GIN (preferred_suburbs)`, `GIN (property_types)`.

#### e) `properties`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `gnaf_pid` | `VARCHAR(14)` | G-NAF persistent identifier (exactly 14 chars) |
| `canonical_address` | `TEXT` | NOT NULL, derived from structured address components |
| `unit_number` | `VARCHAR(20)` | Apartment/unit identifier |
| `street_number` | `VARCHAR(20)` | |
| `street_name` | `VARCHAR(200)` | |
| `street_type` | `VARCHAR(20)` | e.g., 'Street', 'Road', 'Avenue' |
| `suburb` | `TEXT` | NOT NULL |
| `state` | `TEXT` | NOT NULL, CHECK (`state` IN ('VIC', 'NSW', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT')) |
| `postcode` | `VARCHAR(4)` | NOT NULL |
| `location` | `GEOMETRY(Point, 4326)` | NOT NULL, SRID 4326 (WGS 84 lat/lon) |
| `property_type` | `TEXT` | CHECK (`property_type` IN ('house', 'townhouse', 'apartment', 'unit', 'villa', 'duplex', 'land')) |
| `bedrooms` | `SMALLINT` | |
| `bathrooms` | `SMALLINT` | |
| `car_spaces` | `SMALLINT` | |
| `land_size_sqm` | `NUMERIC(10,1)` | |
| `floor_area_sqm` | `NUMERIC(10,1)` | |
| `listing_price` | `INTEGER` | |
| `listing_price_text` | `TEXT` | Original display text (e.g., "Contact Agent", "Auction") |
| `listing_source` | `TEXT` | NOT NULL, e.g., 'domain', 'realestate', 'manual' |
| `listing_url` | `TEXT` | |
| `listed_date` | `DATE` | |
| `sold_date` | `DATE` | |
| `sold_price` | `INTEGER` | |
| `sale_type` | `VARCHAR(30)` | 'auction', 'private_treaty', 'arm''s_length', 'non_arm''s_length' |
| `transfer_type` | `VARCHAR(30)` | 'full', 'partial', 'related_party' |
| `boundary` | `GEOMETRY(MultiPolygon, 4326)` | Cadastral lot boundary polygon |
| `raw_data` | `JSONB` | Source listing data preserved verbatim |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` |
| `updated_at` | `TIMESTAMPTZ` | |

**Indexes**: `UNIQUE(gnaf_pid, unit_number)`, `INDEX(suburb)`, `INDEX(state)`, `INDEX(postcode)`, `INDEX(property_type)`, `INDEX(bedrooms)`, `INDEX(listing_price)`, `INDEX(listed_date)`, `INDEX(sold_date)`; **Spatial**: `GIST(location)`, `GIST(boundary)`.

**Note:** `canonical_address` is derived from the structured components: `unit_number \|\| ' ' \|\| street_number \|\| ' ' \|\| street_name \|\| ' ' \|\| street_type \|\| ', ' \|\| suburb \|\| ' ' \|\| state \|\| ' ' \|\| postcode`. It is stored for display purposes and full-text search convenience.

**Note on G-NAF PID:** G-NAF PIDs are exactly 14 alphanumeric characters. The UNIQUE constraint is on `(gnaf_pid, unit_number)` — not `gnaf_pid` alone — because G-NAF stores addresses at the building/lot level, not the individual unit level. Two apartments in the same building share a G-NAF PID but have different `unit_number` values (see Doc 06 §4.0).

#### f) `property_history`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `property_id` | `UUID` | NOT NULL, FK → `properties(id)` ON DELETE CASCADE |
| `event_type` | `TEXT` | NOT NULL, CHECK (`event_type` IN ('listed', 'price_change', 'sold', 'passed_in', 'withdrawn')) |
| `sale_price` | `INTEGER` | |
| `sale_date` | `DATE` | |
| `sale_type` | `TEXT` | CHECK (`sale_type` IN ('auction', 'private_treaty', 'expression_of_interest')) |
| `source` | `TEXT` | |
| `raw_event` | `JSONB` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` |

**Indexes**: `INDEX(property_id, event_type)`, `INDEX(sale_date)`.

#### g) `property_risks`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `property_id` | `UUID` | NOT NULL, FK → `properties(id)` ON DELETE CASCADE |
| `risk_type` | `TEXT` | NOT NULL, CHECK (`risk_type` IN ('flood', 'bushfire', 'heritage_overlay', 'zoning_restriction', 'easement', 'contamination', 'aircraft_noise', 'overland_flow')) |
| `risk_level` | `TEXT` | NOT NULL, CHECK (`risk_level` IN ('low', 'moderate', 'high', 'extreme')) |
| `description` | `TEXT` | |
| `source_data` | `JSONB` | Original overlay data from state government API |
| `intersection_geometry` | `GEOMETRY(Geometry, 4326)` | The portion of the risk area that overlaps the property |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` |

**Indexes**: `INDEX(property_id)`, `INDEX(risk_type)`, `GIST(intersection_geometry)`.

#### h) `matches`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `agency_id` | `UUID` | NOT NULL, FK → `agencies(id)` |
| `brief_id` | `UUID` | NOT NULL, FK → `buyer_briefs(id)` |
| `property_id` | `UUID` | NOT NULL, FK → `properties(id)` |
| `match_score` | `NUMERIC(5,2)` | NOT NULL, range 0-100 |
| `match_reasons` | `JSONB` | Structured breakdown of score components |
| `status` | `TEXT` | NOT NULL DEFAULT 'new', CHECK (`status` IN ('new', 'dismissed', 'shortlisted', 'flagged')) |
| `agent_feedback` | `JSONB` | `{ "is_relevant": true, "note": "..." }` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` |

**Indexes**: `INDEX(agency_id)`, `INDEX(brief_id, match_score DESC)`, `INDEX(property_id)`, `UNIQUE(brief_id, property_id)` (one match per brief-property pair), `INDEX(status)`.

#### i) `shortlists`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `agency_id` | `UUID` | NOT NULL, FK → `agencies(id)` |
| `client_id` | `UUID` | NOT NULL, FK → `clients(id)` |
| `agent_id` | `UUID` | NOT NULL, FK → `users(id)` |
| `name` | `TEXT` | NOT NULL, e.g., "Inner North Options" |
| `status` | `TEXT` | NOT NULL DEFAULT 'active', CHECK (`status` IN ('active', 'archived')) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` |
| `updated_at` | `TIMESTAMPTZ` | |

**Indexes**: `INDEX(agency_id)`, `INDEX(client_id)`, `INDEX(agent_id)`.

#### j) `shortlist_items`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `shortlist_id` | `UUID` | NOT NULL, FK → `shortlists(id)` ON DELETE CASCADE |
| `property_id` | `UUID` | NOT NULL, FK → `properties(id)` |
| `added_by` | `UUID` | NOT NULL, FK → `users(id)` |
| `client_action` | `TEXT` | CHECK (`client_action` IN ('approve', 'reject', 'comment')) |
| `feedback_text` | `TEXT` | |
| `feedback_at` | `TIMESTAMPTZ` | |
| `sort_order` | `INTEGER` | DEFAULT 0 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` |

**Indexes**: `INDEX(shortlist_id)`, `UNIQUE(shortlist_id, property_id)`.

#### k) `deals`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `agency_id` | `UUID` | NOT NULL, FK → `agencies(id)` |
| `property_id` | `UUID` | NOT NULL, FK → `properties(id)` |
| `client_id` | `UUID` | NOT NULL, FK → `clients(id)` |
| `agent_id` | `UUID` | NOT NULL, FK → `users(id)` |
| `stage` | `TEXT` | NOT NULL DEFAULT 'suggested', CHECK (`stage` IN ('suggested', 'inspected', 'due_diligence', 'offer_made', 'under_contract', 'accepted', 'settled', 'lost')) |
| `offer_amount` | `INTEGER` | |
| `offer_conditions` | `JSONB` | Finance, building, pest clauses |
| `offer_expiry` | `TIMESTAMPTZ` | |
| `deposit_amount` | `INTEGER` | |
| `contract_price` | `INTEGER` | Final agreed price |
| `selling_agent_id` | `UUID` | FK → `selling_agents(id)` |
| `stage_history` | `JSONB` | Array of `{ "stage": "...", "at": "..." }` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` |
| `updated_at` | `TIMESTAMPTZ` | |

**Indexes**: `INDEX(agency_id)`, `INDEX(agent_id)`, `INDEX(client_id)`, `INDEX(property_id)`, `INDEX(stage)`, `INDEX(created_at)`.

#### l) `milestones`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `deal_id` | `UUID` | NOT NULL, FK → `deals(id)` ON DELETE CASCADE |
| `title` | `TEXT` | NOT NULL |
| `description` | `TEXT` | |
| `type` | `TEXT` | NOT NULL, CHECK (`type` IN ('finance_approval', 'building_inspection', 'pest_inspection', 'strata_report', 'conveyancing_review', 'valuation', 'insurance', 'settlement', 'custom')) |
| `due_date` | `DATE` | |
| `completed_at` | `TIMESTAMPTZ` | |
| `assigned_to` | `UUID` | FK → `users(id)` |
| `notes` | `TEXT` | |
| `sort_order` | `INTEGER` | DEFAULT 0 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` |
| `updated_at` | `TIMESTAMPTZ` | |

**Indexes**: `INDEX(deal_id)`, `INDEX(due_date)`, `INDEX(type)`.

#### m) `documents`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `deal_id` | `UUID` | FK → `deals(id)` ON DELETE SET NULL |
| `name` | `TEXT` | NOT NULL |
| `s3_key` | `TEXT` | NOT NULL |
| `mime_type` | `TEXT` | NOT NULL |
| `size_bytes` | `BIGINT` | |
| `uploaded_by` | `UUID` | NOT NULL, FK → `users(id)` |
| `category` | `TEXT` | NOT NULL, CHECK (`category` IN ('contract', 'section32', 'building_report', 'pest_report', 'strata_report', 'title_search', 'certificate', 'photo', 'other')) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` |

**Indexes**: `INDEX(deal_id)`, `INDEX(uploaded_by)`, `INDEX(category)`.

#### n) `selling_agents`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `buyer_agency_id` | `UUID` | NOT NULL, FK → `agencies(id)` — references the BUYER'S agency (not the selling agent's agency) |
| `name` | `TEXT` | NOT NULL |
| `agency_name` | `TEXT` | The real estate agency they work for (selling-side) |
| `phone` | `TEXT` | |
| `email` | `TEXT` | |
| `negotiation_style` | `TEXT` | Free-text annotation, e.g., "aggressive", "straightforward" |
| `notes` | `TEXT` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` |
| `updated_at` | `TIMESTAMPTZ` | |

**Indexes**: `INDEX(buyer_agency_id)`, `INDEX(name)`, `GIN (to_tsvector('english', name \|\| ' ' \|\| agency_name))` (trigram for name search).

#### o) `notifications`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `user_id` | `UUID` | NOT NULL, FK → `users(id)` ON DELETE CASCADE |
| `type` | `TEXT` | NOT NULL, CHECK (`type` IN ('match_found', 'offer_status', 'milestone_due', 'milestone_overdue', 'document_uploaded', 'client_feedback', 'deal_stage_change', 'system')) |
| `title` | `TEXT` | NOT NULL |
| `body` | `TEXT` | |
| `data` | `JSONB` | Contextual payload (e.g., `{ "deal_id": "..." }`) |
| `read_at` | `TIMESTAMPTZ` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` |

**Indexes**: `INDEX(user_id, read_at)`, `INDEX(created_at)`.

#### p) `audit_logs`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `user_id` | `UUID` | FK → `users(id)` |
| `action` | `TEXT` | NOT NULL, e.g., 'brief.created', 'deal.stage_changed', 'document.downloaded' |
| `entity_type` | `TEXT` | NOT NULL, e.g., 'buyer_brief', 'deal', 'property' |
| `entity_id` | `UUID` | NOT NULL |
| `changes` | `JSONB` | Diff of changed fields (`{ "before": {...}, "after": {...} }`) |
| `ip_address` | `INET` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` |

**Indexes**: `INDEX(user_id)`, `INDEX(action)`, `INDEX(entity_type, entity_id)`, `INDEX(created_at)`.

**Purpose:** Privacy Act 1988 compliance. Every mutation to user-owned data (briefs, deals, client records, documents) is recorded. The audit log is append-only and never truncated. Provides an immutable trail for: data access requests (APP 12), breach investigation, and compliance reporting.

#### q) `privacy_consents`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK |
| `user_id` | `UUID` | NOT NULL, FK → `users(id)` ON DELETE CASCADE |
| `consent_type` | `TEXT` | NOT NULL, CHECK (`consent_type` IN ('privacy_policy', 'marketing', 'data_sharing', 'terms_of_service')) |
| `consented_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT `now()` |
| `policy_version` | `TEXT` | NOT NULL, e.g., 'v1.0', 'v2.1' |
| `ip_address` | `INET` | |

**Indexes**: `INDEX(user_id)`, `INDEX(consent_type)`, `UNIQUE(user_id, consent_type, policy_version)`.

**Purpose:** Records explicit consent for Privacy Act compliance (APP 1, APP 3). Each consent type is versioned so that policy updates require re-consent. The `ip_address` serves as an audit trail for the consent event.

#### r) Spatial Source Tables (PostGIS)

These tables hold government open-data geospatial layers loaded during the seed pipeline. They are the source data for `property_risks` spatial joins.

```sql
CREATE TABLE flood_zones (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,                       -- e.g., 'Hawkesbury-Nepean Floodplain'
    risk_level  TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'extreme')),
    source      TEXT NOT NULL,                       -- e.g., 'nsw_flood_data_portal'
    source_id   TEXT,                                -- original feature ID from source
    boundary    GEOMETRY(MultiPolygon, 4326) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_flood_zones_boundary ON flood_zones USING GIST(boundary);
CREATE INDEX idx_flood_zones_risk ON flood_zones(risk_level);
```

```sql
CREATE TABLE bushfire_areas (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,                       -- e.g., 'NSW Bushfire Prone Land'
    category    TEXT,                                -- 'buffer', 'vegetation_buffer', 'vegetation_category_1'
    source      TEXT NOT NULL,                       -- e.g., 'nsw_rfs'
    source_id   TEXT,
    boundary    GEOMETRY(MultiPolygon, 4326) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bushfire_areas_boundary ON bushfire_areas USING GIST(boundary);
```

```sql
CREATE TABLE heritage_overlays (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,                       -- e.g., 'Fitzroy Heritage Overlay HO1'
    type        TEXT NOT NULL CHECK (type IN ('heritage_conservation_area', 'individual_place', 'archaeological')),
    source      TEXT NOT NULL,                       -- e.g., 'nsw_planning_portal', 'vicmap_planning'
    source_id   TEXT,
    boundary    GEOMETRY(MultiPolygon, 4326) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_heritage_overlays_boundary ON heritage_overlays USING GIST(boundary);
```

```sql
CREATE TABLE school_zones (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name TEXT NOT NULL,
    school_type TEXT NOT NULL CHECK (school_type IN ('primary', 'secondary', 'combined')),
    source      TEXT NOT NULL,                       -- e.g., 'nsw_doe', 'vic_findmyschool'
    boundary    GEOMETRY(MultiPolygon, 4326) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_school_zones_boundary ON school_zones USING GIST(boundary);
```

**Populating property_risks from spatial source tables:**

The enrichment pipeline (Doc 06 §3) runs spatial joins to populate `property_risks`:

```sql
-- Flood risk
INSERT INTO property_risks (property_id, risk_type, risk_level, description, source_data, intersection_geometry)
SELECT p.id, 'flood', fz.risk_level, fz.name,
       jsonb_build_object('source', fz.source, 'source_id', fz.source_id),
       ST_Intersection(p.location, fz.boundary)
FROM properties p
JOIN flood_zones fz ON ST_Intersects(p.location, fz.boundary)
ON CONFLICT (property_id, risk_type) DO UPDATE SET risk_level = EXCLUDED.risk_level;

-- Bushfire risk
INSERT INTO property_risks (property_id, risk_type, risk_level, description, source_data, intersection_geometry)
SELECT p.id, 'bushfire', 'moderate', bfa.name,
       jsonb_build_object('source', bfa.source, 'category', bfa.category),
       ST_Intersection(p.location, bfa.boundary)
FROM properties p
JOIN bushfire_areas bfa ON ST_Intersects(p.location, bfa.boundary)
ON CONFLICT (property_id, risk_type) DO NOTHING;

-- Heritage overlay
INSERT INTO property_risks (property_id, risk_type, risk_level, description, source_data, intersection_geometry)
SELECT p.id, 'heritage_overlay', 'high', ho.name,
       jsonb_build_object('source', ho.source, 'type', ho.type),
       ST_Intersection(p.location, ho.boundary)
FROM properties p
JOIN heritage_overlays ho ON ST_Intersects(p.location, ho.boundary)
ON CONFLICT (property_id, risk_type) DO NOTHING;
```

#### s) `gnaf_addresses` (Address Resolution)

| Column | Type | Constraints |
|--------|------|-------------|
| `gnaf_pid` | `VARCHAR(14)` | PK |
| `building_name` | `VARCHAR(200)` | |
| `unit_number` | `VARCHAR(20)` | |
| `street_number` | `VARCHAR(20)` | |
| `street_name` | `VARCHAR(200)` | |
| `street_type` | `VARCHAR(20)` | |
| `locality` | `VARCHAR(100)` | |
| `postcode` | `VARCHAR(4)` | |
| `state` | `VARCHAR(3)` | |
| `location` | `GEOMETRY(Point, 4326)` | |
| | | `UNIQUE(street_number, street_name, street_type, locality, state, postcode)` |

**Indexes**: `GIST(location)`.

#### t) `suburb_demographics`

| Column | Type | Constraints |
|--------|------|-------------|
| `suburb` | `TEXT` | NOT NULL |
| `state` | `TEXT` | NOT NULL |
| `postcode` | `VARCHAR(4)` | NOT NULL |
| `median_household_income` | `INTEGER` | |
| `owner_occupied_pct` | `NUMERIC(5,2)` | |
| `population` | `INTEGER` | |
| `data_source` | `TEXT` | NOT NULL |
| `fetched_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` |
| | | `PRIMARY KEY (suburb, state, postcode)` |

---

### 6. Spatial Schema Details

**Geometry Columns**

Two PostGIS geometry columns live on `properties`:

- `location GEOMETRY(Point, 4326)` — centroid of the property for distance and containment lookups.
- `boundary GEOMETRY(MultiPolygon, 4326)` — cadastral lot boundary imported from state land registry data (e.g., Vicmap Property).

Both use SRID 4326 (WGS 84). Distance calculations use `ST_DistanceSphere` or geography casts for metre-accurate results.

**Spatial Indexes**

```sql
CREATE INDEX idx_properties_location ON properties USING GIST (location);
CREATE INDEX idx_properties_boundary ON properties USING GIST (boundary);
CREATE INDEX idx_property_risks_geometry ON property_risks USING GIST (intersection_geometry);
```

**Example Spatial Queries**

*Find all properties within 2 km of a point, ordered by distance:*

```sql
SELECT id, canonical_address, suburb, listing_price,
       ST_Distance(location::geography, ST_MakePoint(144.98, -37.80)::geography) AS distance_m
FROM properties
WHERE ST_DWithin(location::geography, ST_MakePoint(144.98, -37.80)::geography, 2000)
  AND property_type = 'house'
ORDER BY distance_m;
```

*Find properties whose boundary intersects a flood overlay polygon:*

```sql
SELECT p.id, p.canonical_address, pr.risk_level, pr.description
FROM properties p
JOIN property_risks pr ON pr.property_id = p.id
WHERE pr.risk_type = 'flood'
  AND pr.risk_level IN ('high', 'extreme')
  AND p.id = 'target-property-uuid';
```

*Count properties within a school zone polygon (for CMA filtering):*

```sql
SELECT COUNT(*)
FROM properties p
JOIN school_zones sz ON ST_Intersects(p.location, sz.boundary)
WHERE sz.school_name = 'Fitzroy Primary School'
  AND p.bedrooms >= 3
  AND p.listing_price BETWEEN 800000 AND 1100000;
```

*Find comparable sales: properties sold within 1.5 km in the last 12 months with matching bedroom count:*

```sql
SELECT p.id, p.canonical_address, ph.sale_price, ph.sale_date,
       ST_Distance(p.location::geography, ref.location::geography) AS distance_m
FROM properties p
JOIN property_history ph ON ph.property_id = p.id AND ph.event_type = 'sold'
CROSS JOIN (SELECT location FROM properties WHERE id = 'target-uuid') ref
WHERE ST_DWithin(p.location::geography, ref.location::geography, 1500)
  AND ph.sale_date >= now() - INTERVAL '12 months'
  AND p.bedrooms = (SELECT bedrooms FROM properties WHERE id = 'target-uuid')
  AND p.property_type = (SELECT property_type FROM properties WHERE id = 'target-uuid')
ORDER BY ph.sale_date DESC, distance_m;
```

---

### 7. Indexing Strategy

**B-Tree Indexes (Standard)**

Applied to all foreign key columns (automatic with PostgreSQL unless suppressed), and on every column appearing in `WHERE`, `ORDER BY`, or `GROUP BY` for list endpoints:

- `users(agency_id, role)`
- `clients(agent_id)`
- `buyer_briefs(client_id, status)`, `buyer_briefs(agent_id)`
- `properties(suburb, property_type, bedrooms, listing_price)` — composite for property search filtered by multiple dimensions
- `matches(brief_id, match_score DESC)` — primary access pattern: all matches for a brief ranked by score
- `deals(agent_id, stage)`, `deals(client_id)`
- `milestones(deal_id, due_date)`
- `documents(deal_id, category)`
- `notifications(user_id, read_at, created_at)`

**GIN Indexes (JSONB)**

On JSONB columns that the API filters against:

- `buyer_briefs.preferred_suburbs` — filter briefs by target suburb
- `buyer_briefs.property_types` — filter briefs by property type
- `matches.match_reasons` — debug queries inspecting score breakdowns

**Partial Indexes**

Where a query always includes a specific condition, partial indexes reduce index size:

```sql
CREATE INDEX idx_properties_active_listings
  ON properties (listed_date DESC, listing_price)
  WHERE sold_date IS NULL AND listing_price IS NOT NULL;

CREATE INDEX idx_matches_new
  ON matches (brief_id, match_score DESC)
  WHERE status = 'new';

CREATE INDEX idx_notifications_unread
  ON notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;
```

**Full-Text Search**

Property address and suburb search is delegated to **Meilisearch**. The search index is populated via the event bus: when a property is created or updated, the `property.new_listing` event triggers a sync to the search engine. The API's `GET /properties?q=<query>` endpoint queries Meilisearch, retrieves matching IDs, and hydrates results from PostgreSQL. This avoids the latency and ranking limitations of PostgreSQL's native `tsvector` indexes for user-facing type-ahead search.

**Query Performance Budget**

All API list endpoints must respond within 200 ms p95 under load. Cursor-based pagination ensures consistent performance regardless of table size. `EXPLAIN ANALYZE` output is reviewed during development for every endpoint query.

---

*Version: 1.2 | Last Updated: 2026-05-23*

---

## Revision Notes

| Version | Date | Changes |
|---------|------|---------|
| 1.2 | 2026-05-23 | Schema sync with Doc 06: Added `gnaf_addresses` table (§5s) for address resolution pipeline. Added `suburb_demographics` table (§5t) for demographic cache. |
| 1.1 | 2026-05-23 | Adversarial review fixes: Standardized `gnaf_id TEXT` → `gnaf_pid VARCHAR(14)` on properties (G-NAF PIDs are exactly 14 chars). Replaced `address_line1` with 8 structured address columns (`canonical_address`, `unit_number`, `street_number`, `street_name`, `street_type`, `suburb`, `postcode`, `state`) matching Doc 06 schema. Added `sale_type` and `transfer_type` columns to properties. Changed UNIQUE constraint to `(gnaf_pid, unit_number)` for unit-level resolution. Added `agency_id` to clients, buyer_briefs, matches, shortlists, deals for multi-tenancy. Added `refresh_token_family_id` and `refresh_token_sequence` for token rotation security. Added magic link auth endpoints to API catalog (deferred to Phase 3, with note). Added CMA report generation endpoints. Added spatial source tables (flood_zones, bushfire_areas, heritage_overlays, school_zones) with PostGIS DDL and population queries. Added `audit_logs` table for Privacy Act compliance. Added `privacy_consents` table. Renamed `selling_agents.agency_id` → `buyer_agency_id` with clear comment. Updated all spatial query examples to use `canonical_address`. |
