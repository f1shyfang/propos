# Component Tree

> **Hackathon MVP** — 48 hours, 3 developers
> **Stack:** Next.js 16 App Router + React 19 + TypeScript + Tailwind v4 + shadcn/ui
> **Two SPAs:** Agent Dashboard (`/dashboard`, `/briefs`, `/properties`, `/matches`, `/shortlists`) + Client Portal (`/portal`)
> **Auth:** Supabase, protected routes via single `src/middleware.ts` (queries `profiles` table for role)

---

## 1. File Structure

All components live under `src/components/`, organised by domain:

```
src/
├── components/
│   ├── ui/           # shadcn/ui primitives (button, card, input, badge, dialog, select, table, tabs, skeleton)
│   ├── layout/       # Shell, Sidebar, Header, DashboardLayout, PortalLayout
│   ├── properties/   # PropertyCard, PropertyList, PropertyDetail, CMAWidget, RiskBadge
│   ├── briefs/       # BriefWizard, BriefForm, BriefList, BriefCard
│   ├── matches/      # MatchFeed, MatchCard, ScoreBadge
│   ├── shortlists/   # ShortlistView, ShortlistItem, FeedbackPanel
│   ├── shared/       # EmptyState, LoadingSkeleton, ErrorBoundary, SearchBar, FilterPanel
│   └── comparison/   # ComparisonView, ComparisonRow
```

shadcn/ui primitives are added via `npx shadcn@latest add` on demand. The `src/lib/utils.ts` helper (`cn()`) is used for conditional class merging.

---

## 2. Component Hierarchy Per Page

### 2a. Landing Page (`/`)

```
LandingPage                              (RSC — static)
├── HeroSection                          (platform value prop, 30s demo script copy)
├── DemoScenario                         (brief description of the unified platform)
└── QuickLoginButtons
    ├── LoginAsAgentButton               (POSTs agent@demo.com / password123 via Server Action)
    └── LoginAsClientButton              (POSTs sarah@demo.com / password123 via Server Action)
```

**Data flow:** Fully static RSC. Quick-login buttons are Client Components that call the login Server Action with hardcoded demo credentials.

---

### 2b. Login / Signup

```
LoginPage                                (Client Component)
├── LoginForm (email, password, Server Action)
│   └── SubmitButton
└── SignUpLink → /signup

SignupPage                               (Client Component)
└── SignupForm (email, password, name, role select, Server Action)
    └── SubmitButton
```

**Data flow:** Client Components with Server Actions for Supabase `signInWithPassword()` / `signUp()`. On success, redirect to `/dashboard` (agent) or `/portal` (client).

---

### 2c. Agent Dashboard (`/dashboard`)

```
DashboardLayout
├── Sidebar (nav: Dashboard, Clients, Briefs, Properties, Matches, Shortlists)
├── Header (agent name, notifications bell, logout)
└── DashboardPage                        (Client Component + React Query)
    ├── StatsRow                         (Active Clients, Properties Under Review, Match Score Avg)
    │   └── Data: GET /api/dashboard/stats
    ├── RecentMatchesList (MatchCard[])
    │   └── Data: GET /api/matches?limit=5
    └── ClientActivityFeed (ActivityItem[])
        └── Data: GET /api/feedback/poll (brief_id omitted → global activity, refetchInterval: 3000)
```

**Data flow:** Dashboard page is a Client Component using React Query to fetch `GET /api/dashboard/stats` for aggregate stats, recent matches, and polling the feedback endpoint for live client activity. The activity feed polls every 3 seconds with a manual Refresh button fallback.

---

### 2d. Briefs List (`/briefs`)

```
BriefsPage                               (RSC)
├── FilterBar (status filter chips: draft|active|paused|fulfilled|archived)
└── BriefsTable
    └── BriefRow[] (client name, budget range, suburbs, status badge, match count, created date)
        └── Click → /briefs/[id]
```

**Data flow:** Server Component fetching from Supabase server client. Status filter uses URL search params for shareable state.

---

### 2g. Buyer Brief Wizard (`/briefs/new`)

```
BriefWizardLayout                        (Client Component)
├── StepIndicator (Step 1–6, progress bar with clickable segments)
├── Step1ClientInfo (client_name)
├── Step2Budget (budget_min, budget_max)
├── Step3PropertyRequirements (property_types, min_bedrooms, min_bathrooms)
├── Step4Location (preferred_suburbs multi-select)
├── Step5ParkingMustHaves (parking, must_haves checkboxes)
└── Step6DealBreakers (deal_breakers text list)
```

**State:** Wizard state managed via `useState` in the parent layout. The `StepIndicator` highlights completed, current, and upcoming steps.

**Submission:** A single `POST` to the create brief Server Action on the final step. There is **no auto-save** and **no PATCH for drafts**. All fields map directly to `CreateBriefRequest` in the API spec:

| Wizard Step | API Field | Type |
|---|---|---|
| Step 1 | `client_name` | `string` (required) |
| Step 2 | `budget_min`, `budget_max` | `number` (required) |
| Step 3 | `property_types` | `string[]` (required) |
| Step 3 | `min_bedrooms` | `number?` |
| Step 3 | `min_bathrooms` | `number?` |
| Step 4 | `preferred_suburbs` | `string[]` (required) |
| Step 5 | `parking` | `"required" \| "nice_to_have" \| "not_needed"` |
| Step 5 | `must_haves` | `string[]` |
| Step 6 | `deal_breakers` | `string[]` |

Fields that appeared in earlier drafts but do NOT exist in the API: `engagement_type`, `pre_approval_amount`, `purchase_timeline`, `strategy_notes`. These are omitted from the wizard.

---

### 2h. Brief Detail (`/briefs/[id]`)

```
BriefDetailPage                          (RSC)
├── BriefHeader (client name, status badge, created/updated dates)
├── BriefSummary
│   ├── BudgetRange (budget_min – budget_max)
│   ├── PreferredSuburbs (suburb chips)
│   ├── PropertyTypes (type chips)
│   ├── Requirements (beds, baths, parking)
│   ├── MustHaves (checklist)
│   └── DealBreakers (warning list)
├── MatchesPreview
│   └── Top 3 MatchCard[]
├── ShortlistPreview (count + recent item thumbnails)
└── ActionBar (Edit Brief → inline edit, View All Matches → /briefs/[id]/matches)
```

**Data flow:** Server Component fetching from Supabase server client (`GET /api/briefs/[id]`). Inline editing uses Server Actions.

---

### 2i. Brief Matches (`/briefs/[id]/matches`)

```
BriefMatchesPage                         (Client Component + React Query)
├── BriefContextHeader (client name, brief summary, match count, Back → /briefs/[id])
├── MatchSortControls (sort by: matchScore, price, newest)
└── MatchFeedList
    └── MatchCard[] (property thumbnail, address, price, matchScore, scoreBreakdown)
        ├── PropertyThumbnail
        ├── PropertyAddress + Price
        ├── ScoreBadge (matchScore: 0–100, color-coded)
        ├── ScoreBreakdown
        │   ├── BudgetFit ({ score, detail })
        │   ├── SuburbMatch ({ score, detail })
        │   ├── PropertyTypeMatch ({ score, detail })
        │   ├── MustHavesPass (boolean)
        │   └── DealBreakersTriggered (string[] — red if non-empty)
        ├── AddToShortlistButton (Server Action)
        └── Click → /properties/[id]
```

**Data flow:** Client Component using React Query to fetch `GET /api/briefs/[id]/matches`. Supports sort controls (matchScore asc/desc, price, newest). Add-to-shortlist triggers a Server Action and invalidates the shortlist query cache. This is the page users land on after creating a brief — the most important page in the demo flow.

---

### 2j. Property List & Search (`/properties`)

```
PropertiesPage                           (Client Component + React Query)
├── Suspense fallback={<LoadingSkeleton variant="card" />}
│   └── PropertySearchClient            (Client Component + React Query)
│       ├── SearchBar (suburb, price range, property type, beds)
│       ├── FilterPanel (advanced filters — clearable chips)
│       └── PropertyList
│           └── PropertyCard[] (thumbnail, address, price, beds/baths/car, matchScore badge)
└── PropertyDetail                       (slide-out drawer on desktop, full-page on mobile)
    ├── PropertyImages
    ├── PropertyInfo (address, price, features)
    ├── CMATable (CMAComparable[])
    ├── RiskBadges (PropertyRisk[])
    └── ActionBar (Add to Shortlist via Server Action, Share)
```

**Data flow:** Page shell is RSC. Search/filter card grid is a wrapped Client Component in `<Suspense>`, using React Query against `GET /api/properties` with URL search params for shareable filter state. `PropertyDetail` opens as a slide-out drawer on desktop, full-page push on mobile.

---

### 2k. Property Detail (`/properties/[id]`)

```
PropertyDetailPage                       (Client Component + React Query)
├── PropertyImages (gallery)
├── PropertyInfo (address, price guide, beds/baths/car, land size, floor area, description, features)
├── CMATable (CMAComparable[] — address, sale price, sale date, price/sqm, beds/baths, notes)
├── RiskBadges
│   └── RiskBadge[] (risk_type: flood|bushfire|heritage|zoning, risk_level: low|medium|high)
├── MatchScoreCard (per-brief match scores for this property)
└── ActionBar (Add to Shortlist, Share, View Comparison)
```

**Data flow:** Client Component fetching property detail + CMA + risk via React Query from `GET /api/properties/[id]`. Interactive actions: add-to-shortlist (Route Handler), compare.

---

### 2l. Property Comparison (`/properties/compare`)

```
ComparisonPage                           (Client Component + React Query)
├── PropertySelector (select 2–3 properties via checkboxes/chips, stored in URL query params)
└── ComparisonGrid
    └── ComparisonRow[]
        ├── Price (listing price)
        ├── Beds / Baths / Car Spaces
        ├── Land Size (sqm)
        ├── Price per Sqm
        ├── MatchScore (per brief)
        ├── CMA Range (from CMAComparable[])
        └── RiskBadges
```

**Data flow:** Client Component. Property IDs stored in URL query params (`?id=a&id=b&id=c`). Data fetched via **2–3 parallel `GET /api/properties/[id]` calls** through React Query (`useQueries`). Each call returns full detail including `CMAComparable[]` and `PropertyRisk[]`. All types use `CMAComparable` (not `CMA`).

---

### 2m. Match Feed (`/matches`)

```
MatchesPage                              (Client Component + React Query)
├── BriefSelector (dropdown: which client brief to view matches for)
├── MatchSortControls (sort by: matchScore, date)
└── MatchFeedList
    └── MatchCard[] (property thumbnail, address, price, matchScore, scoreBreakdown, add to shortlist)
```

**Data flow:** Client Component. `BriefSelector` triggers `GET /api/matches?brief_id=xxx` via React Query on selection change. Sort controls reorder client-side or re-fetch with sort param.

---

### 2n. Shortlist Management (`/shortlists`)

```
ShortlistsPage                           (Client Component)
├── ShortlistTabs (one tab per brief, uses searchParams prop from Next.js)
└── ShortlistItems
    └── ShortlistItem[] (property card, feedback status badge, remove button, share toggle)
        └── FeedbackStatus (approve|reject|comment|null — color-coded)
```

**Data flow:** Client Component using the `searchParams` prop (passed by Next.js to page components) for tab selection, enabling deep-linking with no `useSearchParams` hook needed. Data fetched via React Query from `GET /api/shortlists?brief_id=xxx`. Add/remove/share mutations via Server Actions.

> **Why Client Component, not RSC:** Tab selection needs URL reactivity. Using `searchParams` prop (RSC-to-CC bridge) avoids the `useSearchParams` hook requirement while keeping full client-side interactivity for add/remove/share actions.

---

### 2o. Client Portal Login (`/portal/login`)

```
PortalLoginPage                          (Client Component)
└── PortalLoginForm (email, password, Server Action)
```

Supabase auth handles session creation. On success, redirects to `/portal`.

---

### 2p. Client Portal Dashboard (`/portal`)

```
PortalLayout
├── Header (agent branding, client name, logout)
└── PortalDashboard                      (Client Component + React Query)
    ├── ShortlistGallery
    │   └── PropertyCard[] (click → /portal/properties/[id])
    └── ActivityFeed (recent share/comment events)
```

**Data flow:** Client Component using React Query with `refetchInterval: 3000` to poll `GET /api/portal/shortlists`. The shortlist is dynamic — the agent adds properties during the demo, and the client sees updates in near real-time. Each property card is clickable, navigating to the dedicated `/portal/properties/[id]` page for feedback.

**NO modal.** Property detail is a dedicated page at `/portal/properties/[id]`, not a modal. This simplifies navigation and avoids overlay z-index issues in the demo.

---

### 2q. Client Portal Property Detail (`/portal/properties/[id]`)

```
PortalPropertyDetail                     (Client Component + React Query)
├── PropertyImages (gallery)
├── PropertyInfo (address, price guide, beds/baths/car, description, features)
├── CMAWidget (simplified CMAComparable table — 2–3 comparables)
├── RiskBadges (PropertyRisk[])
└── FeedbackPanel
    ├── ButtonGroup
    │   ├── InterestedButton        → POST { status: "interested" }
    │   ├── NeedMoreInfoButton      → POST { status: "need_more_info" }
    │   └── NotForMeButton          → POST { status: "not_for_me" }
    └── CommentBox (optional feedback_text)
```

**Label-to-API mapping:**

| Button Label | API `status` Value |
|---|---|
| "Interested" | `"interested"` |
| "Need More Info" | `"need_more_info"` |
| "Not For Me" | `"not_for_me"` |

**Data flow:** Client Component fetching `GET /api/properties/[id]` via React Query. Feedback submission is a Server Action (`POST /api/feedback`) with body `{ shortlist_item_id, status, feedback_text? }`. The `shortlist_item_id` is passed implicitly in the page context. After submission, the React Query cache for portal shortlists is invalidated so the gallery updates on return.

---

## 3. Shared / Reusable Components

Each component below has a single responsibility and is used across both SPAs.

### PropertyCard

```ts
interface PropertyCardProps {
  property: Property;
  matchScore?: number;
  showFeedback?: boolean;
  onAddToShortlist?: (propertyId: string) => void;
  variant?: "grid" | "list";
}
```

Renders property thumbnail, address, price guide, bed/bath/car stats, and optional match score badge. Click navigates to detail view. Variant controls grid-card vs list-row layout.

### MatchCard

```ts
interface MatchCardProps {
  property: Property;
  matchScore: number;
  matchReasons: {
    budget_fit: { score: number; detail: string };
    suburb_match: { score: number; detail: string };
    property_type_match: { score: number; detail: string };
    must_haves_pass: boolean;
    deal_breakers_triggered: string[];
  };
  onAddToShortlist: (propertyId: string) => void;
}
```

Extends `PropertyCard` with a match score breakdown showing budget fit, suburb match, property type match, must-haves status, and triggered deal-breakers. The `matchReasons` shape matches the `match_reasons` JSONB column from the `matches` table (see API-SPEC `MatchSummary`).

### CMATable

```ts
interface CMATableProps {
  comparables: CMAComparable[];
}
```

Displays a table of comparable sales: address, sale date, sale price, beds/baths, price per sqm, and notes. Uses the `CMAComparable` type from API-SPEC (not `CMA`).

### RiskBadge

```ts
interface RiskBadgeProps {
  type: "flood" | "bushfire" | "heritage" | "zoning";
  level: "low" | "medium" | "high";
  description?: string;
}
```

A colour-coded badge with icon. `low` = green, `medium` = amber, `high` = red. Includes accessible text label. Values match the `risk_type` and `risk_level` columns from the `risk_overlays` table (see DATA-MODEL).

### ScoreBadge

```ts
interface ScoreBadgeProps {
  matchScore: number; // 0–100
}
```

Circular or pill badge. Colour: 80+ = green, 50–79 = amber, <50 = grey. Used across PropertyCard and MatchCard to display match scores consistently.

### EmptyState

```ts
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
}
```

Used when lists have no content. Renders an illustration area, heading, description, and optional CTA button.

### LoadingSkeleton

```ts
interface LoadingSkeletonProps {
  variant: "card" | "table" | "form";
}
```

Animated placeholder shapes matching the layout of the content being loaded. Uses shadcn/ui `Skeleton` primitive.

### ErrorBoundary

```ts
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
```

Wraps a subtree. On error, renders the fallback (or a default message with a retry button). Implemented as a Client Component using React's `componentDidCatch`.

### SearchBar

```ts
interface SearchBarProps {
  onSearch: (query: string) => void;
  filters?: Filter[];
}
```

Text input with search icon, clear button, and keyboard shortcut hint (`Cmd+K`). Debounces input at 300ms before calling `onSearch`.

### FilterPanel

```ts
interface FilterPanelProps {
  filters: Filter[];
  onChange: (filters: Filter[]) => void;
}
```

Renders a horizontal row of active filter chips with "Clear All." Each chip shows filter name and value with an X to remove. Adding new filters opens dropdown inputs.

### FeedbackPanel (implicit props — used in PortalPropertyDetail)

```ts
// Called from PortalPropertyDetail with these contextual props:
{
  shortlistItemId: string;                    // The shortlist_item.id — required for feedback POST
  property: Property;                         // Display data
  onSubmitFeedback: (payload: {               // Server Action
    shortlist_item_id: string;
    status: "interested" | "need_more_info" | "not_for_me";
    feedback_text?: string;
  }) => Promise<void>;
}
```

The `shortlistItemId` is derived from the route/props context and passed to FeedbackPanel. It MUST be included in the Server Action call to target the correct shortlist item.

---

## 4. State Management Per Component

| Component Type | State Strategy |
|---|---|
| **Server Components** | Fetch data directly via `fetch()` inside `async` component body. No client state. |
| **Client Components** | React Query (`@tanstack/react-query`) for server state. `useState` for UI state (modal open, active tab, form values). |
| **Forms** | `useState` for controlled inputs + Server Actions for submission. Form validation via HTML5 constraints + custom `onSubmit` checks. |
| **Polling (activity feed, portal)** | `useQuery({ queryKey, queryFn, refetchInterval: 3000 })`. A manual "Refresh" button serves as fallback. |
| **URL-bound state** | Search params stored via `useSearchParams()` for shareable filter/search/compare state. Tab selection in ShortlistsPage uses `searchParams` prop (passed by Next.js). |
| **Wizard (brief creation)** | `useState` in parent layout manages multi-step form. Single `POST` on final step — no auto-save, no draft PATCH. |

---

## 5. Shared Types Appendix

All TypeScript interfaces shared across components, derived from API-SPEC response types:

```ts
interface Property {
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
  floor_area_sqm: number | null;
  description: string;
  features: string[];
  listing_source: string;
  listing_url: string | null;
  days_on_market: number;
}

interface MatchScore {
  id: string;
  brief_id: string;
  property: Property;
  match_score: number;
  match_reasons: {
    budget_fit: { score: number; detail: string };
    suburb_match: { score: number; detail: string };
    property_type_match: { score: number; detail: string };
    must_haves_pass: boolean;
    deal_breakers_triggered: string[];
  };
  status: "new" | "dismissed" | "shortlisted" | "flagged";
}

interface CMAComparable {
  id: string;
  address: string;
  sale_price: number;
  sale_date: string;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  price_per_sqm: number;
  days_on_market: number;
  notes: string | null;
}

interface PropertyRisk {
  risk_type: "flood" | "bushfire" | "heritage_overlay" | "zoning_restriction" | "easement" | "contamination" | "aircraft_noise" | "overland_flow";
  risk_level: "low" | "moderate" | "high" | "extreme";
  description: string;
}

interface Filter {
  field: string;
  value: string | number;
  label: string;
}
```

---

## 6. Responsive Design Notes

- **Desktop-first** — agents work primarily on desktop. Layouts designed for ≥1280px first.
- **Sidebar** collapses to hamburger menu on <768px.
- **PropertyCard grid**: 3 columns on desktop (≥1280px), 2 on tablet (768–1279px), 1 on mobile (<768px).
- **PropertyDetail**: slide-out drawer on desktop, full-page push on mobile.
- **ComparisonGrid**: 3 properties side-by-side on desktop, stacked vertically on mobile with horizontal scroll.
- **Modals and drawers** convert to full-screen bottom sheets on mobile.
- **Touch targets** ≥44×44 CSS pixels on mobile.

---

## Revision History

| Version | Date | Changes |
|---|---|---|
| 1.0 | May 2026 | Initial version |
| 2.0 | May 2026 | Adversarial review fixes: removed `/app/` URL prefix, resolved route group collision (explicit `/dashboard`, `/portal` routes), removed modal for `/portal/properties/[id]` (now dedicated PortalPropertyDetail page), added 10+ missing component tree sections (landing, login, signup, clients list, clients/[id], briefs list, briefs/[id], briefs/[id]/matches, portal/properties/[id], /matches standalone), updated MatchCardProps to match API `match_reasons` shape, updated RiskBadgeProps to standardized risk_type/risk_level values, updated BriefWizard fields to match CreateBriefRequest API, removed auto-save/PATCH claims (single POST on submit), standardized CMA→CMAComparable, documented ShortlistsPage searchParams prop approach, documented PropertiesPage RSC/CC split, added FeedbackPanel label mapping and shortlistItemId, standardized ScoreBadge on `matchScore` naming, made brief_id optional for ClientActivityFeed, added Shared Types appendix with Property/MatchScore/CMAComparable/PropertyRisk/Filter interfaces, updated portal to Client Component + React Query, documented comparison page parallel fetch strategy |
