# Route Map — Propos Hackathon MVP

**Stack:** Next.js App Router + TypeScript + Tailwind CSS
**Auth:** Supabase Auth, role from `profiles.role`
**Canonical status:** This is the MVP route contract.

---

## 1. Route Rules

- Route groups do not add URL segments.
- Dashboard URLs live under explicit folders such as `(dashboard)/dashboard/page.tsx`.
- Portal URLs live under explicit folders such as `(portal)/portal/page.tsx`.
- `/portal/login` must be implemented as `(portal)/portal/login/page.tsx`, not `(portal)/login/page.tsx`.
- API routes are unversioned under `/api/*`.
- Client property feedback uses the shared shortlist row route: `/portal/shortlists/[id]`.

## 2. Route Tree

```text
src/app/
├── layout.tsx
├── page.tsx                              # / — landing + quick demo login buttons
├── globals.css                           # Tailwind v4 + fixed MVP design tokens
│
├── (auth)/
│   ├── login/
│   │   └── page.tsx                      # /login — agent login
│   └── signup/
│       └── page.tsx                      # /signup — optional/stretched
│
├── (dashboard)/
│   ├── layout.tsx                        # Agent shell
│   ├── dashboard/
│   │   └── page.tsx                      # /dashboard
│   ├── briefs/
│   │   ├── page.tsx                      # /briefs
│   │   ├── new/
│   │   │   └── page.tsx                  # /briefs/new
│   │   └── [id]/
│   │       ├── page.tsx                  # /briefs/[id]
│   │       └── matches/
│   │           └── page.tsx              # /briefs/[id]/matches
│   ├── properties/
│   │   ├── page.tsx                      # /properties
│   │   ├── [id]/
│   │   │   └── page.tsx                  # /properties/[id]
│   │   └── compare/
│   │       └── page.tsx                  # /properties/compare?ids=a,b,c
│   ├── matches/
│   │   └── page.tsx                      # /matches
│   └── shortlists/
│       └── page.tsx                      # /shortlists?brief_id=...
│
├── (portal)/
│   ├── layout.tsx                        # Client shell
│   └── portal/
│       ├── login/
│       │   └── page.tsx                  # /portal/login
│       ├── page.tsx                      # /portal
│       └── shortlists/
│           └── [id]/
│               └── page.tsx              # /portal/shortlists/[id]
│
└── api/
    ├── properties/
    │   ├── route.ts                      # GET /api/properties
    │   └── [id]/
    │       ├── route.ts                  # GET /api/properties/[id]
    │       └── comparables/
    │           └── route.ts              # GET /api/properties/[id]/comparables
    ├── briefs/
    │   ├── route.ts                      # GET/POST /api/briefs
    │   └── [id]/
    │       ├── route.ts                  # GET /api/briefs/[id]
    │       └── matches/
    │           └── route.ts              # GET /api/briefs/[id]/matches
    ├── matches/
    │   └── route.ts                      # GET /api/matches
    ├── shortlists/
    │   ├── route.ts                      # GET/POST /api/shortlists
    │   ├── share/
    │   │   └── route.ts                  # POST /api/shortlists/share
    │   └── [id]/
    │       └── route.ts                  # DELETE /api/shortlists/[id]
    ├── portal/
    │   └── shortlists/
    │       ├── route.ts                  # GET /api/portal/shortlists
    │       └── [id]/
    │           └── route.ts              # GET /api/portal/shortlists/[id]
    └── feedback/
        ├── route.ts                      # POST /api/feedback
        └── poll/
            └── route.ts                  # GET /api/feedback/poll
```

## 3. Middleware

`src/middleware.ts` handles:

1. Supabase session refresh.
2. Public access to `/`, `/login`, `/signup`, and `/portal/login`.
3. Agent-only access to dashboard routes.
4. Client-only access to `/portal` and `/portal/*`.
5. Session requirement for `/api/*`; role checks remain inside Route Handlers.

Matcher:

```ts
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/briefs/:path*",
    "/properties/:path*",
    "/matches/:path*",
    "/shortlists/:path*",
    "/portal/:path*",
    "/login",
    "/signup",
    "/api/:path*",
  ],
};
```

## 4. Route Protection Matrix

| Route | Auth | Role |
|---|---|---|
| `/` | No | Public |
| `/login`, `/signup` | No | Public |
| `/portal/login` | No | Public |
| `/dashboard`, `/briefs`, `/briefs/*`, `/properties`, `/properties/*`, `/matches`, `/shortlists` | Yes | `agent` |
| `/portal`, `/portal/shortlists/*` | Yes | `client` |
| `/api/properties`, `/api/properties/*`, `/api/briefs`, `/api/briefs/*`, `/api/matches`, `/api/shortlists`, `/api/shortlists/*`, `/api/feedback/poll` | Yes | `agent` |
| `/api/portal/*`, `/api/feedback` | Yes | `client` |

## 5. Demo Flow

1. Agent logs in at `/login`.
2. Agent creates a brief at `/briefs/new`.
3. Submit redirects to `/briefs/[id]/matches`.
4. Agent selects 2-3 matches and optionally opens `/properties/compare?ids=a,b,c`.
5. Agent adds properties to shortlist.
6. Agent clicks Share, calling `POST /api/shortlists/share`.
7. Client logs in at `/portal/login`.
8. Client views shared rows at `/portal`.
9. Client opens one row at `/portal/shortlists/[id]`.
10. Client submits feedback via `POST /api/feedback`.
11. Agent dashboard/shortlists view polls `GET /api/feedback/poll`.

---

*Version: 3.0 | Updated: May 24, 2026 — Portal route collision fixed and shortlist-row feedback route made canonical.*
