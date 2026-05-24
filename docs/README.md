# Docs Index

This folder contains both the hackathon MVP source of truth and longer-range blueprint notes.

## Implement From These

Read these first and treat them as canonical:

| Document | Purpose |
|---|---|
| [PRD.md](PRD.md) | Product scope, demo story, success criteria |
| [TECH-SPEC.md](TECH-SPEC.md) | Stack, architecture, implementation rules |
| [DATA-MODEL.md](DATA-MODEL.md) | Supabase schema, RLS, seed requirements |
| [API-SPEC.md](API-SPEC.md) | Route Handler contracts |
| [ROUTE-MAP.md](ROUTE-MAP.md) | App routes, API routes, middleware behavior |
| [COMPONENT-TREE.md](COMPONENT-TREE.md) | Frontend page/component structure |
| [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) | Execution order, ownership lanes, cut lines |

## Canonical Decisions

- Build the MVP as a Next.js App Router app.
- Use Tailwind CSS v4 and shadcn/ui for the interface.
- Use Supabase Auth, Postgres, RLS, and Storage.
- Use unversioned `/api/*` Route Handlers.
- Read application role from `profiles.role`.
- Use deterministic seed data for properties, CMA, risks, match scores, and shortlists.
- Use polling for client feedback; do not add WebSockets for the MVP.
- Use three client feedback states: `interested`, `need_more_info`, and `not_for_me`.

## Reference Only

The `blueprint/` folder contains planning material for the broader product. For the hackathon MVP:

- [blueprint/10-hackathon-mvp-spec.md](blueprint/10-hackathon-mvp-spec.md) is only a summary of the canonical top-level docs.
- [blueprint/05-system-architecture.md](blueprint/05-system-architecture.md) through [blueprint/09-ui-ux-and-user-flows.md](blueprint/09-ui-ux-and-user-flows.md) are future/platform references.
- Any blueprint instruction that mentions `/api/v1`, custom JWT auth, live integrations, maps, document vaults, Kanban boards, multi-agency tenancy, or large platform schemas is post-MVP unless it has been copied into the canonical top-level docs.
