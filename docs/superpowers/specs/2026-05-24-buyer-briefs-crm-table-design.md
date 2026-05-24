# Buyer Briefs CRM Table Design

## Goal

Redesign `/briefs` from a simple static list into a polished CRM-style data table for buyer brief management. The view should remain information-dense, clean, and consistent with the current Propos visual system while adding real table controls for searching, filtering, sorting, column visibility, row selection, quick actions, and pagination.

## Current Context

The current page is `src/app/(dashboard)/briefs/page.tsx`. It is a server component that queries `buyerBriefsTable`, renders the shared `TopBar`, and displays a grid-like list with columns for client, budget, suburbs, status, type, and created date.

The existing styling uses global Propos classes in `src/app/globals.css`, including `pg-btn`, `pg-input`, `pg-card-flat`, `pg-badge`, `pg-row`, `pg-mono`, and the warm minimal palette. The redesign should reuse these primitives and add small scoped styles only where necessary.

## Recommended Approach

Use a client-side table component fed by the existing server query.

This is the right level of complexity for the current data volume and demo needs. It avoids API/query plumbing while still making the controls actually work. The server page will normalize database rows into serializable table rows, then pass them into a new client component.

## Component Structure

`src/app/(dashboard)/briefs/page.tsx` remains responsible for:

- Querying buyer briefs from the database.
- Passing normalized row data into the table component.
- Rendering the empty state fallback if needed only through the table component.

New component:

- `src/components/briefs/briefs-crm-table.tsx`

The table component owns:

- Search state.
- Filter state.
- Sort state.
- Column visibility state.
- Selected row state.
- Pagination state.
- Open menu/dropdown state.

## Data Handling

Each row should contain:

- `id`
- `clientName`
- `email`
- `budgetMin`
- `budgetMax`
- `suburbs`
- `status`
- `propertyTypes`
- `createdAt`

Formatting helpers should live in the component unless they become reused elsewhere.

Rows that look like test noise should be excluded from the displayed dataset by default. The filter should catch obvious clutter such as client names or emails containing `E2E`, `test`, or similar generated markers. This should not delete data; it only affects the displayed table. A small muted note can indicate when hidden test rows exist.

If the database returns no usable rows after test-noise filtering, the component should show a realistic built-in demo dataset so the CRM design remains presentable in a demo environment.

## Toolbar

Place a utility toolbar between the `TopBar` and the table.

Left side:

- Search input with icon.
- Placeholder: `Search clients, email, suburbs...`
- Search across client name, email, suburbs, status, and property type.

Right side:

- `Filter` dropdown with at least status and property type controls.
- `Sort` dropdown with client, budget, and created options.
- `View` or `Columns` dropdown to toggle optional columns.

All controls must work client-side.

## Table Header

Add a first column for the master checkbox.

Sortable headers:

- Client
- Budget
- Created

Sortable headers should show subtle arrow indicators. The active sorted column should have stronger text contrast and show direction.

Column order:

1. Selection checkbox
2. Client
3. Budget
4. Suburbs
5. Status
6. Type
7. Created
8. Row actions

## Table Body

Each row should include:

- Checkbox for selection.
- Client name and email stacked.
- Budget range in mono styling.
- Suburbs truncated with `+N` overflow count.
- Status pill with colored dot.
- Property type text.
- Created date.
- Kebab menu for row actions.

Rows should have a clear hover state using the existing warm row hover treatment. The kebab menu may be persistent for clarity or subtly emphasized on hover. The client cell should link to `/briefs/[id]`.

Row actions:

- `Open brief`
- `Edit`
- `Delete`

For this iteration, `Open brief` should navigate to `/briefs/[id]`. `Edit` should navigate to `/briefs/[id]?tab=profile`. `Delete` should be present as a disabled menu item labeled `Delete unavailable` unless an existing safe delete endpoint is discovered during implementation.

## Footer

Add CRM pagination below the table:

- `Showing 1 to 10 of 15 results`
- Previous button
- Next button

Default page size: 10.

Pagination should operate on the filtered and sorted result set.

## Visual Style

Use a modern enterprise SaaS feel while preserving Propos branding:

- Minimal warm background.
- White or near-white table surface.
- Subtle borders.
- Compact row height.
- High-contrast primary text.
- Muted secondary metadata.
- Small uppercase column labels.
- Clean focus and hover states.

Avoid heavy shadows, bright color blocks, or large low-density card layouts.

## Behavior Details

Selection:

- Master checkbox selects all visible rows on the current page.
- Indeterminate state appears when only some current-page rows are selected.
- Selection count should be shown in the toolbar or footer when non-zero.

Search:

- Updates results immediately.
- Resets pagination to page 1.

Filters:

- Status and property type filters work together with search.
- Reset pagination to page 1 when changed.

Sort:

- Header clicks toggle direction for sortable columns.
- Sort dropdown updates the same sort state.

Columns:

- Client must remain visible.
- Other data columns can be toggled.
- Selection and actions remain visible.

## Error And Empty States

Empty after filtering:

- Show a compact empty state inside the table surface: `No briefs match your filters.`
- Include a `Clear filters` action.

No briefs at all:

- Preserve the existing helpful empty state concept with actions for import and new brief.

## Testing

Manual verification should cover:

- Page renders with existing database rows.
- Search filters by client, email, suburb, status, and type.
- Status/type filters work.
- Header sort and sort dropdown work.
- Column visibility toggles hide/show columns.
- Master and row checkboxes select expected rows.
- Pagination updates result range and enables/disables buttons correctly.
- Row links navigate to brief detail.

Use `tsc` for type checking per project instruction. Do not use a production build just to check types.

## Out Of Scope

- Backend pagination.
- Persisting table preferences.
- Bulk delete or bulk edit APIs.
- A reusable table abstraction for other pages.
- Permanent deletion unless an existing safe endpoint is already available.
