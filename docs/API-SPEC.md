# API Specification — Hackathon MVP

**Stack:** Next.js 16 App Router, Supabase (PostgreSQL), Supabase Auth
**Patterns:** Route Handlers (`app/api/**/route.ts`) for all data endpoints; Supabase SDK for auth

> References the Supabase data model: `properties`, `buyer_briefs`, `match_scores`, `shortlists` (flat table, grouped by `buyer_brief_id`), `cma_records` (CMA comparables), `risk_overlays` (risk data), `profiles`. See `DATA-MODEL.md` for full column definitions.

---

## 1. Auth Endpoints (Supabase SDK — Client-Side Only)

Auth is handled entirely by Supabase Auth via the Supabase client SDK. These are NOT Route Handlers — they are Supabase SDK method calls from client components. The `/auth/*` paths are conceptual; the actual calls use `supabase.auth.signUp()`, etc. Middleware (`middleware.ts`) protects all `/dashboard` and `/api/` routes, requiring a valid agent session.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/signup` | Supabase `signUp()` — email + password (client-side SDK call) |
| `POST` | `/auth/login` | Supabase `signInWithPassword()` — returns session (client-side SDK call) |
| `POST` | `/auth/logout` | Supabase `signOut()` — invalidates session (client-side SDK call) |
| `GET` | `/auth/session` | Supabase `getSession()` — current user session (client-side SDK call) |

Auth client and server utilities are centralised in `lib/supabase/`. Route handlers call `createClient()` to get the server-side Supabase client. User role (`agent` | `client`) is read from the session's `user_metadata.role`.

---

## 2. Properties API

### 2a — `GET /api/properties`

Search and list properties. Used by the agent dashboard property grid.

**Auth:** agent session required

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `ids` | `string` | — | Comma-separated property UUIDs for comparison view (e.g. `?ids=a,b,c`). Overrides other filters. |
| `suburb` | `string` | — | Filter by suburb (ILIKE match) |
| `property_type` | `string` | — | `house`, `apartment`, `townhouse`, `unit`, `villa`, `duplex` |
| `min_price` | `number` | — | Minimum `listing_price` |
| `max_price` | `number` | — | Maximum `listing_price` |
| `min_beds` | `number` | — | Minimum `bedrooms` |
| `min_baths` | `number` | — | Minimum `bathrooms` |
| `page` | `number` | `1` | Page number (1-indexed) |
| `limit` | `number` | `25` | Page size (max 100) |

**Response `200`:**

```ts
type PropertiesListResponse = {
  data: PropertySummary[];
  meta: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
};

type PropertySummary = {
  id: string;
  canonical_address: string;
  suburb: string;
  state: string;
  postcode: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  car_spaces: number;
  listing_price: number | null;
  listing_price_text: string | null;
  main_image_url: string;
  listed_date: string | null;
  land_size_sqm: number | null;
};
```

---

### 2b — `GET /api/properties/[id]`

Full property detail, including CMA records, risk overlays, and pre-computed match scores for all briefs belonging to the authenticated agent.

**Auth:** agent session required

**Response `200`:**

```ts
type PropertyDetailResponse = {
  data: {
    property: PropertySummary & {
      floor_area_sqm: number | null;
      description: string;       // extracted from raw_data->>'description'
      features: string[];         // extracted from raw_data->'features'
      listing_source: string;
      listing_url: string | null;
      days_on_market: number;     // extracted from raw_data->'days_on_market'
    };
    cma_records: CMAComparable[];
    risks: PropertyRisk[];
    match_scores: BriefMatchScore[];
  };
};

type CMAComparable = {
  id: string;
  comparable_address: string;
  sale_price: number;
  sale_date: string;
  bedrooms: number;
  bathrooms: number;
  land_size_sqm: number | null;
  distance_km: number | null;
  price_per_sqm: number | null;
  notes: string | null;
};

type PropertyRisk = {
  risk_type: "flood" | "bushfire" | "heritage" | "zoning";
  risk_level: "low" | "medium" | "high";
  description: string;
};

type BriefMatchScore = {
  brief_id: string;
  client_name: string; // requires JOIN: match_scores → buyer_briefs → profiles
  match_score: number; // 0-100
};
```

**Errors:**
- `404` — Property not found

---

### 2c — `GET /api/properties/[id]/comparables`

Returns CMA records (from `cma_records`) for this property. Used by the comparison view.

**Auth:** agent session required

**Response `200`:**

```ts
type CMAComparablesResponse = {
  data: CMAComparable[];
};
```

---

## 3. Buyer Briefs API

### 3a — `GET /api/briefs`

Returns all briefs for the authenticated agent's agency.

**Auth:** agent session required

**Response `200`:**

```ts
type BriefsListResponse = {
  data: BriefSummary[];
};

type BriefSummary = {
  id: string;
  client_name: string;
  budget_min: number;
  budget_max: number;
  preferred_suburbs: string[];
  property_types: string[];
  status: "draft" | "active" | "paused" | "fulfilled" | "archived";
  created_at: string;
  match_count: number; // count of matches with score > 0
};
```

---

### 3b — `POST /api/briefs`

Creates a new buyer brief. Route Handler at `app/api/briefs/route.ts`.

**Auth:** agent session required

**Request Body:**

```ts
type CreateBriefRequest = {
  client_name: string;
  client_id?: string; // optional, if client account already exists
  budget_min: number;
  budget_max: number;
  property_types: string[];
  preferred_suburbs: string[];
  min_bedrooms?: number;
  min_bathrooms?: number;
  parking?: "required" | "nice_to_have" | "not_needed";
  must_haves: string[];
  deal_breakers: string[];
};
```

**Response `201`:**

```ts
type CreateBriefResponse = {
  data: BriefSummary & {
    must_haves: string[];
    deal_breakers: string[];
    min_bedrooms: number | null;
    min_bathrooms: number | null;
    parking: string | null;
  };
};
```

**Errors:**
- `400` — Validation error (e.g., `budget_min > budget_max`, empty `preferred_suburbs`)

---

### 3c — `GET /api/briefs/[id]`

Full brief detail with all matching properties and their scores.

**Auth:** agent session required

**Response `200`:**

```ts
type BriefDetailResponse = {
  data: BriefSummary & {
    client_id: string | null;
    must_haves: string[];
    deal_breakers: string[];
    min_bedrooms: number | null;
    min_bathrooms: number | null;
    parking: string | null;
    created_at: string;
    updated_at: string;
    matches: MatchSummary[];
  };
};
```

---

### 3d — `GET /api/briefs/[id]/matches`

Properties matching this brief, sorted by `match_score` descending.

**Auth:** agent session required

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `min_score` | `number` | `50` | Minimum match score (0-100) |
| `limit` | `number` | `25` | Max results |

**Response `200`:**

```ts
type BriefMatchesResponse = {
  data: MatchSummary[];
  meta: { total: number };
};

type MatchSummary = {
  id: string;
  brief_id: string;
  property: PropertySummary;
  match_score: number; // 0-100
  match_reasons: {
    budget_fit: { score: number; detail: string };
    suburb_match: { score: number; detail: string };
    property_type_match: { score: number; detail: string };
    must_haves_pass: boolean;
    deal_breakers_triggered: string[];
  };
};
```

Match scores are pre-computed (rule-based engine, see blueprint §3.4). For the MVP, scores are seeded — this endpoint reads from the `match_scores` table. `match_reasons` is a JSONB column; `match_score` comes from the `match_score` integer column.

---

## 4. Shortlists API

### 4a — `GET /api/shortlists`

Returns shortlist items for a brief, including property details and client feedback.

**Auth:** agent session required

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `brief_id` | `string` | Yes | Buyer brief UUID |

**Response `200`:**

```ts
type ShortlistsResponse = {
  data: ShortlistItem[];
};

type ShortlistItem = {
  id: string;
  buyer_brief_id: string;
  property_id: string;
  property: PropertySummary;
  status: "interested" | "need_more_info" | "not_for_me";
  feedback_text: string | null;
  feedback_at: string | null;
  shared_at: string | null;
  created_at: string;
};
```

---

### 4b — `POST /api/shortlists`

Add a property to a brief's shortlist. Route Handler at `app/api/shortlists/route.ts`.

**Auth:** agent session required

**Request Body:**

```ts
type AddToShortlistRequest = {
  brief_id: string;
  property_id: string;
  client_id?: string;
  shared?: boolean; // default false; set to true to share with client on creation
};
```

**Response `201`:**

```ts
type AddToShortlistResponse = {
  data: ShortlistItem;
};
```

The `shared_at` timestamp is set automatically when `shared` is `true`. Sharing is set at create time; there is no separate PATCH endpoint to toggle sharing. There is no parent `shortlist_groups` table — all shortlist items are stored flat in `shortlists` and grouped by `buyer_brief_id`.

---

### 4c — `DELETE /api/shortlists/[id]`

Remove a property from a shortlist.

**Auth:** agent session required

**Response `204`** — No content.

---

## 5. Feedback API

### 5a — `POST /api/feedback`

Client submits feedback on a shortlisted property. Route Handler at `app/api/feedback/route.ts`.

**Auth:** client session required

**Request Body:**

```ts
type SubmitFeedbackRequest = {
  shortlist_id: string;  // UUID of the shortlist entry being rated
  status: "interested" | "need_more_info" | "not_for_me";
  feedback_text?: string;
};
```

**Response `200`:**

```ts
type SubmitFeedbackResponse = {
  data: ShortlistItem; // updated record with feedback fields populated
};
```

---

### 5b — `GET /api/feedback/poll`

Polling endpoint for the agent dashboard. Returns feedback changes on a brief's shortlist since the given timestamp. Called every 3 seconds by `@tanstack/react-query` (`refetchInterval: 3000`).

**Auth:** agent session required

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `brief_id` | `string` | No | Filter to a specific brief. Omit to return recent activity across ALL briefs. |
| `since` | `string` | No | ISO 8601 timestamp — return changes after this |

**Response `200`:**

```ts
type FeedbackPollResponse = {
  data: {
    items: ShortlistItem[];
    last_updated: string; // ISO 8601 — use as next `since` value
  };
};
```

Returns only shortlist items whose `feedback_at` > `since`. Empty `items` array if no changes.

---

## 6. Client Portal API

### 6a — `GET /api/portal/shortlists`

Returns shortlists shared with the authenticated client. Used by the client portal at `/portal`.

**Auth:** client session required

**Response `200`:**

```ts
type ClientPortalResponse = {
  data: {
    brief: {
      id: string;
      client_name: string;
      created_at: string;
    };
    items: (ShortlistItem & {
      feedback_submitted: boolean;
    })[];
  }[];
};
```

Groups shortlist items by `buyer_brief_id`. Each item includes the property details and whether the client has already submitted feedback.

---

## 7. Conventions

### Response Envelope

Every response wraps data in a consistent envelope:

```ts
type ApiResponse<T> = {
  data: T;
  error?: {
    message: string;
    code: string;
    details?: { field: string; issue: string }[];
  };
};
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| `200` | Successful GET, feedback POST, polling |
| `201` | Resource created (brief, shortlist item) |
| `204` | Resource deleted (shortlist item) |
| `400` | Validation error — field-level details in error payload |
| `401` | Missing or expired auth session |
| `404` | Resource not found |
| `409` | Conflict — duplicate shortlist item (UNIQUE constraint on `buyer_brief_id` + `property_id`) |

### Error Handling

- **Auth errors (401):** Middleware intercepts unauthenticated requests and returns `{ error: { message: "Authentication required", code: "UNAUTHORIZED" } }`.
- **Validation errors (400):** Route handlers validate with Zod. Invalid input returns `{ error: { message: "Validation failed", code: "INVALID_INPUT", details: [...] } }`.
- **Not found (404):** Unknown resource IDs return `{ error: { message: "Not found", code: "NOT_FOUND" } }`.

### File Convention

All API endpoints are standard Next.js Route Handlers.

| Pattern | Filesystem Location | Purpose |
|---------|---------------------|---------|
| Route Handler | `app/api/properties/route.ts` | Data endpoints (GET list, etc.) |
| Route Handler (dynamic) | `app/api/properties/[id]/route.ts` | Single-resource endpoints |
| Route Handler (nested) | `app/api/briefs/[id]/matches/route.ts` | Nested resource endpoints |

Route handlers return `NextResponse.json(...)`.

---

*Version: 1.1 | Last Updated: 2026-05-23*

**Revision 1.1** — Adversarial review fixes: corrected preamble table names to match DATA-MODEL (`match_scores`, `shortlists`, `cma_records`, `risk_overlays`, `profiles`); all endpoints are Route Handlers (removed Server Action language); removed standalone GET /api/matches; POST /api/feedback/[shortlist_id] uses URL param; ShortlistItem uses `buyer_brief_id` and `status` (no `shortlist_id`/`client_action`); PropertyRisk types standardized to 4 types + low/medium/high; CMAComparable fields aligned with cma_records; added `ids` query param to GET /api/properties; added 409 Conflict; clarified auth endpoints are Supabase SDK calls; documented JOIN for BriefMatchScore.client_name and JSONB extraction for PropertyDetail.
