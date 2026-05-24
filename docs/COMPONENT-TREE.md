# Component Tree — Hackathon MVP

**Stack:** Next.js App Router + React + TypeScript + Tailwind CSS + shadcn/ui
**Canonical status:** This file describes the MVP UI only. Future blueprint UX is out of scope.

---

## 1. Component Organization

```text
src/components/
├── ui/                 # shadcn/ui primitives
├── layout/             # DashboardShell, PortalShell, Sidebar, TopBar
├── briefs/             # BriefForm, BriefSummary, BriefTable
├── properties/         # PropertyCard, PropertyList, PropertyDetail, CMATable, RiskBadge
├── matches/            # MatchCard, MatchFeed, ScoreBadge
├── shortlists/         # ShortlistTable, ShareButton, FeedbackStatus, FeedbackPanel
├── portal/             # PortalGallery, PortalShortlistDetail
└── shared/             # EmptyState, LoadingSkeleton, ErrorState, SearchBar, FilterPanel
```

Use Tailwind utility classes and fixed CSS variables in `globals.css`. Do not implement runtime tenant theming in the MVP.

## 2. Pages

### Landing (`/`)

```text
LandingPage
├── HeroSection
├── DemoScenario
└── QuickLoginButtons
    ├── LoginAsAgentButton
    └── LoginAsClientButton
```

Quick login is acceptable for demo speed, but it must still use Supabase Auth.

### Agent Login (`/login`)

```text
LoginPage
└── LoginForm
    ├── EmailInput
    ├── PasswordInput
    └── SubmitButton
```

### Agent Dashboard (`/dashboard`)

```text
DashboardShell
├── Sidebar
├── TopBar
└── DashboardPage
    ├── StatsRow
    ├── RecentMatchesList          # GET /api/matches?limit=5
    └── ClientActivityFeed         # GET /api/feedback/poll every 3s
```

### Briefs (`/briefs`, `/briefs/new`, `/briefs/[id]`)

For the MVP, brief creation is a **single-page sectioned form**, not an autosaving wizard.

```text
BriefForm
├── ClientSection                  # client_name, optional client_id
├── BudgetSection                  # budget_min, budget_max
├── PropertyRequirementsSection    # property_types, beds, baths, parking
├── LocationSection                # preferred_suburbs
├── MustHavesSection
├── DealBreakersSection
└── SubmitButton                   # POST /api/briefs
```

Submit redirects to `/briefs/[id]/matches`.

### Brief Matches (`/briefs/[id]/matches`)

```text
BriefMatchesPage
├── BriefContextHeader
├── MatchSortControls
└── MatchFeed
    └── MatchCard[]
        ├── PropertyCard
        ├── ScoreBadge
        ├── MatchReasons
        ├── AddToShortlistButton   # POST /api/shortlists
        └── CompareCheckbox
```

This page is owned by the agent dashboard frontend lane and is not optional: it is the main post-brief demo surface.

### Properties (`/properties`, `/properties/[id]`, `/properties/compare`)

```text
PropertiesPage
├── SearchBar
├── FilterPanel
└── PropertyList
    └── PropertyCard[]
```

```text
PropertyDetailPage
├── PropertyImages
├── PropertyInfo
├── CMATable
├── RiskBadge[]
├── MatchScoreCard
└── ActionBar
    ├── AddToShortlistButton
    └── CompareButton
```

```text
ComparisonPage
└── ComparisonGrid                 # 2-3 properties from GET /api/properties?ids=...
```

Comparison is useful but cuttable if the core feedback loop is at risk.

### Shortlists (`/shortlists`)

```text
ShortlistsPage
├── BriefSelector
├── ShortlistTable
│   └── ShortlistRow[]
│       ├── PropertySummary
│       ├── SharedAtBadge
│       ├── FeedbackStatus
│       └── RemoveButton
├── ShareButton                    # POST /api/shortlists/share
└── FeedbackActivityPanel          # GET /api/feedback/poll
```

Shortlist row status must distinguish unshared, shared/no feedback, and client feedback.

### Client Login (`/portal/login`)

```text
PortalLoginPage
└── PortalLoginForm
```

### Client Portal (`/portal`)

```text
PortalPage
├── PortalHeader
└── PortalGallery
    └── PortalPropertyCard[]
        ├── PropertySummary
        ├── FeedbackStatus
        └── Link → /portal/shortlists/[id]
```

The card link uses the shortlist row id, not the property id.

### Client Shortlist Detail (`/portal/shortlists/[id]`)

```text
PortalShortlistDetail
├── PropertyImages
├── PropertyInfo
├── CMATable
├── RiskBadge[]
└── FeedbackPanel
    ├── InterestedButton
    ├── NeedMoreInfoButton
    ├── NotForMeButton
    ├── CommentBox
    └── SubmitButton                # POST /api/feedback
```

## 3. Shared Types

```ts
interface PropertyRisk {
  risk_type: "flood" | "bushfire" | "heritage" | "zoning";
  risk_level: "low" | "medium" | "high";
  description: string;
}

interface CMAComparable {
  id: string;
  comparable_address: string;
  sale_price: number | null;
  sale_date: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  property_type: string | null;
  price_per_sqm: number | null;
  distance_km: number | null;
  notes: string | null;
}

interface ShortlistItem {
  id: string;
  buyer_brief_id: string;
  property_id: string;
  shared_at: string | null;
  viewed_at: string | null;
  feedback_status: "interested" | "need_more_info" | "not_for_me" | null;
  feedback_text: string | null;
  feedback_at: string | null;
}
```

## 4. Responsive Notes

- Agents are desktop-first.
- Client portal must work well on mobile.
- Touch targets must be at least 44px.
- Comparison grid can horizontally scroll on small screens.
- Avoid nested cards and marketing-style landing-page bloat; the first screen should be useful.

---

*Version: 3.0 | Updated: May 24, 2026 — Component/API type drift resolved and portal feedback keyed by shortlist row.*
