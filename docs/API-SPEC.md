# API Specification — Hackathon MVP

**Stack:** Next.js App Router Route Handlers + Supabase
**Namespace:** Unversioned `/api/*` for MVP
**Canonical status:** This file is the MVP API contract.


---

## 1. API Rules

- All data endpoints return JSON.
- Auth endpoints are handled by Supabase Auth SDK from UI/server helpers, not custom `/api/auth/*` endpoints.
- Middleware verifies a session for `/api/*`; each route enforces its own role.
- Agent-only routes must reject clients with `403`.
- Client portal routes must reject agents with `403`.
- Route Handlers are the canonical contract. Server Actions may call the same service functions but must not define a divergent API.

## 2. Response Envelope

```ts
type ApiResponse<T> = {
  data?: T;
  meta?: Record<string, unknown>;
  error?: {
    code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INVALID_INPUT" | "CONFLICT" | "INTERNAL";
    message: string;
    details?: { field: string; issue: string }[];
  };
};
```

## 3. Auth

Auth is Supabase email/password.

| UI Action | Supabase call |
|---|---|
| Sign in | `supabase.auth.signInWithPassword()` |
| Sign out | `supabase.auth.signOut()` |
| Current session | `supabase.auth.getSession()` |

Application role is read from `profiles.role`, not auth metadata.

## 4. Properties

### `GET /api/properties`

Agent property search/list endpoint.

**Auth:** agent

Query params:

| Param | Type | Description |
|---|---|---|
| `ids` | string | Comma-separated property UUIDs. If present, ignore other filters. |
| `suburb` | string | Case-insensitive suburb filter. |
| `property_type` | string | `house`, `apartment`, `townhouse`, `unit`, `villa`, `duplex`, `land`. |
| `min_price` | number | Minimum listing price. |
| `max_price` | number | Maximum listing price. |
| `min_beds` | number | Minimum bedrooms. |
| `min_baths` | number | Minimum bathrooms. |
| `page` | number | Default `1`. |
| `limit` | number | Default `25`, max `100`. |

```ts
type PropertiesListResponse = {
  data: PropertySummary[];
  meta: { page: number; limit: number; total: number; has_more: boolean };
};

type PropertySummary = {
  id: string;
  canonical_address: string;
  suburb: string;
  state: string;
  postcode: string;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  car_spaces: number | null;
  listing_price: number | null;
  listing_price_text: string | null;
  main_image_url: string | null;
  listed_date: string | null;
  land_size_sqm: number | null;
};
```

### `GET /api/properties/[id]`

Agent property detail.

**Auth:** agent

```ts
type PropertyDetailResponse = {
  data: {
    property: PropertySummary & {
      floor_area_sqm: number | null;
      description: string;
      features: string[];
      listing_source: string;
      listing_url: string | null;
      days_on_market: number | null;
    };
    cma_records: CMAComparable[];
    risks: PropertyRisk[];
    match_scores: BriefMatchScore[];
  };
};

type CMAComparable = {
  id: string;
  comparable_address: string;
  sale_price: number | null;
  sale_date: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  property_type: string | null;
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
  client_name: string;
  match_score: number;
};
```

### `GET /api/properties/[id]/comparables`

Agent CMA comparable rows only.

**Auth:** agent

```ts
type CMAComparablesResponse = { data: CMAComparable[] };
```

## 5. Briefs And Matches

### `GET /api/briefs`

**Auth:** agent

```ts
type BriefSummary = {
  id: string;
  client_id: string | null;
  client_name: string;
  budget_min: number;
  budget_max: number;
  preferred_suburbs: string[];
  property_types: string[];
  status: "draft" | "active" | "paused" | "fulfilled" | "archived";
  created_at: string;
  match_count: number;
};

type BriefsListResponse = { data: BriefSummary[] };
```

### `POST /api/briefs`

**Auth:** agent

```ts
type CreateBriefRequest = {
  client_name: string;
  client_id?: string;
  budget_min: number;
  budget_max: number;
  property_types: string[];
  preferred_suburbs: string[];
  min_bedrooms?: number;
  min_bathrooms?: number;
  parking?: "required" | "nice_to_have" | "not_needed";
  must_haves?: string[];
  deal_breakers?: string[];
};

type CreateBriefResponse = { data: BriefSummary };
```

Validation:

- `budget_min <= budget_max`
- at least one `property_types`
- at least one `preferred_suburbs`

### `GET /api/briefs/[id]`

**Auth:** agent

```ts
type BriefDetailResponse = {
  data: BriefSummary & {
    min_bedrooms: number;
    min_bathrooms: number;
    parking: "required" | "nice_to_have" | "not_needed";
    must_haves: string[];
    deal_breakers: string[];
    updated_at: string;
    matches: MatchSummary[];
  };
};
```

### `GET /api/briefs/[id]/matches`

Ranked matches for one brief.

**Auth:** agent

Query params:

| Param | Type | Default |
|---|---|---|
| `min_score` | number | `50` |
| `limit` | number | `25` |

```ts
type MatchSummary = {
  id: string;
  brief_id: string;
  property: PropertySummary;
  match_score: number;
  match_reasons: {
    budget_fit: { score: number; detail: string };
    suburb_match: { score: number; detail: string };
    property_type_match: { score: number; detail: string };
    must_haves_pass: boolean;
    deal_breakers_triggered: string[];
  };
};

type BriefMatchesResponse = {
  data: MatchSummary[];
  meta: { total: number };
};
```

### `GET /api/matches`

Cross-brief match feed for dashboard widgets.

**Auth:** agent

Query params:

| Param | Type | Description |
|---|---|---|
| `brief_id` | string | Optional brief filter. |
| `limit` | number | Default `10`. |

Response: same `MatchSummary[]` shape.

## 6. Shortlists

### `GET /api/shortlists`

Agent shortlist rows for a brief.

**Auth:** agent

Query params:

| Param | Required |
|---|---|
| `brief_id` | yes |

```ts
type ShortlistItem = {
  id: string;
  buyer_brief_id: string;
  property_id: string;
  property: PropertySummary;
  agent_note: string | null;
  shared_at: string | null;
  viewed_at: string | null;
  feedback_status: "interested" | "need_more_info" | "not_for_me" | null;
  feedback_text: string | null;
  feedback_at: string | null;
  created_at: string;
};

type ShortlistsResponse = { data: ShortlistItem[] };
```

### `POST /api/shortlists`

Add a property to a brief shortlist without necessarily sharing it.

**Auth:** agent

```ts
type AddToShortlistRequest = {
  brief_id: string;
  property_id: string;
  agent_note?: string;
  share_now?: boolean;
};

type AddToShortlistResponse = { data: ShortlistItem };
```

Rules:

- `client_id` is derived from the brief.
- If the brief has no linked client, return `400`.
- Duplicate `(buyer_brief_id, property_id)` returns `409`.
- If `share_now` is true, set `shared_at`.

### `POST /api/shortlists/share`

Bulk-share existing shortlist rows for a brief.

**Auth:** agent

```ts
type ShareShortlistRequest = {
  brief_id: string;
  shortlist_ids?: string[]; // if omitted, share all rows for the brief
};

type ShareShortlistResponse = {
  data: { shared_count: number; items: ShortlistItem[] };
};
```

### `DELETE /api/shortlists/[id]`

Remove a shortlist row.

**Auth:** agent

Response: `204`.

## 7. Client Portal

### `GET /api/portal/shortlists`

Returns shared shortlist rows grouped by brief for the authenticated client.

**Auth:** client

```ts
type ClientPortalResponse = {
  data: {
    brief: {
      id: string;
      client_name: string;
      created_at: string;
    };
    items: ShortlistItem[];
  }[];
};
```

Only rows with `shared_at IS NOT NULL` are returned.

### `GET /api/portal/shortlists/[id]`

Client-safe property detail for one shared shortlist row. This is the endpoint used by `/portal/shortlists/[id]`.

**Auth:** client

```ts
type ClientShortlistDetailResponse = {
  data: {
    shortlist: ShortlistItem;
    property: PropertySummary & {
      floor_area_sqm: number | null;
      description: string;
      features: string[];
      days_on_market: number | null;
    };
    cma_records: CMAComparable[];
    risks: PropertyRisk[];
  };
};
```

The route must verify:

- `shortlists.id = [id]`
- `shortlists.client_id = auth.uid()`
- `shortlists.shared_at IS NOT NULL`

## 8. Feedback

### `POST /api/feedback`

Client submits or changes feedback on a shared shortlist row.

**Auth:** client

```ts
type SubmitFeedbackRequest = {
  shortlist_id: string;
  feedback_status: "interested" | "need_more_info" | "not_for_me";
  feedback_text?: string;
};

type SubmitFeedbackResponse = { data: ShortlistItem };
```

The route must only update:

- `feedback_status`
- `feedback_text`
- `feedback_at`
- `viewed_at`

Implementation note: this route should use a server-only Supabase admin helper after checking the authenticated user, `profiles.role = 'client'`, ownership of `shortlist_id`, and `shared_at IS NOT NULL`. Do not expose a direct client RLS update policy for the whole `shortlists` row.

### `GET /api/feedback/poll`

Agent polling endpoint for recent client feedback.

**Auth:** agent

Query params:

| Param | Required | Description |
|---|---|---|
| `brief_id` | no | Filter to one brief. |
| `since` | no | ISO timestamp. |

```ts
type FeedbackPollResponse = {
  data: {
    items: ShortlistItem[];
    last_updated: string;
  };
};
```

## 9. Status Codes

| Code | Meaning |
|---|---|
| `200` | Successful read or mutation |
| `201` | Created |
| `204` | Deleted |
| `400` | Validation error |
| `401` | Missing/expired session |
| `403` | Wrong role or resource ownership |
| `404` | Not found |
| `409` | Duplicate/conflict |

---

*Version: 2.0 | Updated: May 24, 2026 — Unversioned Route Handler contract, share API, portal-safe detail endpoint, and feedback field naming resolved.*
