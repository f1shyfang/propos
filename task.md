## Core Logging and Responsive Layouts
- Added `db.insert(userActionsTable)` to portal API routes (`api/feedback/route.ts` and `api/portal/shortlists/[id]/route.ts`).
- Created `api/deals/[id]/activity/route.ts` to fetch user activity for a deal.
- Built "Activity Feed" tab in `deals/[id]/page.tsx` pulling from `user_actions`.
- Added Tailwind responsive classes (`sm:`, `md:`) to `PropertiesView`, `PropertyDrawer`, and `PortalDashboardPage`.
