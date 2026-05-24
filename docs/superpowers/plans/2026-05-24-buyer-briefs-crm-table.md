# Buyer Briefs CRM Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/briefs` static list with a functional CRM-style buyer brief data table.

**Architecture:** Keep `src/app/(dashboard)/briefs/page.tsx` as the server data-loading boundary and move interactive table behavior into a focused client component. Add pure utility functions for filtering, sorting, pagination, column visibility, demo fallback, and formatting so behavior can be covered with Vitest without browser-heavy tests.

**Tech Stack:** Next.js App Router, React 19 client component, TypeScript, Vitest, existing Propos CSS primitives, Tailwind available but not required for this focused edit.

---

## File Structure

- Create `src/lib/briefs-table-utils.ts`: pure row types and table behavior helpers.
- Create `src/lib/__tests__/briefs-table-utils.test.ts`: unit tests for filtering, sorting, pagination, test-noise filtering, and demo fallback.
- Create `src/components/briefs/briefs-crm-table.tsx`: interactive table UI and local state.
- Modify `src/app/(dashboard)/briefs/page.tsx`: normalize DB rows and render `BriefsCrmTable`.

## Task 1: Pure Table Utilities

**Files:**
- Create: `src/lib/briefs-table-utils.ts`
- Create: `src/lib/__tests__/briefs-table-utils.test.ts`

- [ ] **Step 1: Write failing utility tests**

Create `src/lib/__tests__/briefs-table-utils.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  CRM_DEMO_BRIEFS,
  filterBriefRows,
  formatBudgetRange,
  getDisplayBriefRows,
  isTestNoiseBrief,
  paginateBriefRows,
  sortBriefRows,
  type BriefTableRow,
} from '../briefs-table-utils';

const rows: BriefTableRow[] = [
  {
    id: 1,
    clientName: 'Sarah & Tom',
    email: 'sarah@example.com',
    budgetMin: 800000,
    budgetMax: 1100000,
    suburbs: ['Surry Hills', 'Newtown'],
    status: 'searching',
    propertyTypes: ['Apartment'],
    createdAt: '2026-05-24T00:00:00.000Z',
  },
  {
    id: 2,
    clientName: 'Mina Patel',
    email: 'mina@example.com',
    budgetMin: 1200000,
    budgetMax: 1800000,
    suburbs: ['Marrickville'],
    status: 'paused',
    propertyTypes: ['House'],
    createdAt: '2026-05-20T00:00:00.000Z',
  },
  {
    id: 3,
    clientName: 'E2E mpj generated',
    email: 'test@example.com',
    budgetMin: null,
    budgetMax: 900000,
    suburbs: ['Pyrmont'],
    status: 'searching',
    propertyTypes: ['Unit'],
    createdAt: '2026-05-19T00:00:00.000Z',
  },
];

describe('briefs table utilities', () => {
  it('formats budget ranges compactly', () => {
    expect(formatBudgetRange(800000, 1100000)).toBe('$800K - $1.1M');
    expect(formatBudgetRange(null, 900000)).toBe('up to $900K');
    expect(formatBudgetRange(null, null)).toBe('—');
  });

  it('detects obvious generated test rows', () => {
    expect(isTestNoiseBrief(rows[0])).toBe(false);
    expect(isTestNoiseBrief(rows[2])).toBe(true);
  });

  it('uses demo rows if every database row is filtered as test noise', () => {
    const displayRows = getDisplayBriefRows([rows[2]]);
    expect(displayRows.rows).toEqual(CRM_DEMO_BRIEFS);
    expect(displayRows.usingDemoRows).toBe(true);
    expect(displayRows.hiddenTestRows).toBe(1);
  });

  it('filters by search, status, and property type', () => {
    expect(filterBriefRows(rows, { search: 'surry', status: 'all', propertyType: 'all' }).map((r) => r.id)).toEqual([1]);
    expect(filterBriefRows(rows, { search: '', status: 'paused', propertyType: 'all' }).map((r) => r.id)).toEqual([2]);
    expect(filterBriefRows(rows, { search: '', status: 'all', propertyType: 'House' }).map((r) => r.id)).toEqual([2]);
  });

  it('sorts by client, budget, and created date', () => {
    expect(sortBriefRows(rows, { key: 'client', direction: 'asc' }).map((r) => r.clientName)).toEqual([
      'E2E mpj generated',
      'Mina Patel',
      'Sarah & Tom',
    ]);
    expect(sortBriefRows(rows, { key: 'budget', direction: 'desc' }).map((r) => r.id)).toEqual([2, 1, 3]);
    expect(sortBriefRows(rows, { key: 'created', direction: 'asc' }).map((r) => r.id)).toEqual([3, 2, 1]);
  });

  it('paginates rows and reports ranges', () => {
    const result = paginateBriefRows(rows, 1, 2);
    expect(result.rows.map((r) => r.id)).toEqual([1, 2]);
    expect(result.from).toBe(1);
    expect(result.to).toBe(2);
    expect(result.totalPages).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm vitest run src/lib/__tests__/briefs-table-utils.test.ts`

Expected: FAIL because `src/lib/briefs-table-utils.ts` does not exist.

- [ ] **Step 3: Implement utilities**

Create `src/lib/briefs-table-utils.ts`:

```ts
export type BriefTableRow = {
  id: number;
  clientName: string;
  email: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  suburbs: string[];
  status: string | null;
  propertyTypes: string[];
  createdAt: string | null;
};

export type SortKey = 'client' | 'budget' | 'created';
export type SortDirection = 'asc' | 'desc';

export type SortState = {
  key: SortKey;
  direction: SortDirection;
};

export type BriefTableFilters = {
  search: string;
  status: string;
  propertyType: string;
};

export const CRM_DEMO_BRIEFS: BriefTableRow[] = [
  {
    id: -1,
    clientName: 'Sarah & Tom',
    email: 'sarah.tom@example.com',
    budgetMin: 800000,
    budgetMax: 1100000,
    suburbs: ['Surry Hills', 'Newtown', 'Pyrmont'],
    status: 'searching',
    propertyTypes: ['Apartment'],
    createdAt: '2026-05-24T00:00:00.000Z',
  },
  {
    id: -2,
    clientName: 'Mina Patel',
    email: 'mina.patel@example.com',
    budgetMin: 1200000,
    budgetMax: 1800000,
    suburbs: ['Marrickville', 'Dulwich Hill'],
    status: 'qualified',
    propertyTypes: ['House', 'Townhouse'],
    createdAt: '2026-05-22T00:00:00.000Z',
  },
  {
    id: -3,
    clientName: 'James O’Connor',
    email: 'james.oconnor@example.com',
    budgetMin: 950000,
    budgetMax: 1350000,
    suburbs: ['Randwick', 'Coogee'],
    status: 'searching',
    propertyTypes: ['Apartment', 'Unit'],
    createdAt: '2026-05-21T00:00:00.000Z',
  },
  {
    id: -4,
    clientName: 'Anika & Leo Chen',
    email: 'anika.chen@example.com',
    budgetMin: 1600000,
    budgetMax: 2400000,
    suburbs: ['Lane Cove', 'Artarmon'],
    status: 'active',
    propertyTypes: ['House'],
    createdAt: '2026-05-18T00:00:00.000Z',
  },
  {
    id: -5,
    clientName: 'Michael Tran',
    email: 'michael.tran@example.com',
    budgetMin: 550000,
    budgetMax: 800000,
    suburbs: ['Parramatta', 'Homebush'],
    status: 'paused',
    propertyTypes: ['Apartment'],
    createdAt: '2026-05-17T00:00:00.000Z',
  },
];

function compactAud(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(n / 1000)}K`;
}

export function formatBudgetRange(min: number | null, max: number | null): string {
  if (min && max) return `${compactAud(min)} - ${compactAud(max)}`;
  if (max) return `up to ${compactAud(max)}`;
  if (min) return `from ${compactAud(min)}`;
  return '—';
}

export function isTestNoiseBrief(row: BriefTableRow): boolean {
  const haystack = [row.clientName, row.email ?? ''].join(' ').toLowerCase();
  return /\be2e\b|\btest\b|generated|mpj/.test(haystack);
}

export function getDisplayBriefRows(inputRows: BriefTableRow[]): {
  rows: BriefTableRow[];
  hiddenTestRows: number;
  usingDemoRows: boolean;
} {
  const rows = inputRows.filter((row) => !isTestNoiseBrief(row));
  const hiddenTestRows = inputRows.length - rows.length;
  if (rows.length === 0) return { rows: CRM_DEMO_BRIEFS, hiddenTestRows, usingDemoRows: true };
  return { rows, hiddenTestRows, usingDemoRows: false };
}

export function filterBriefRows(rows: BriefTableRow[], filters: BriefTableFilters): BriefTableRow[] {
  const q = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    const statusOk = filters.status === 'all' || (row.status ?? 'searching') === filters.status;
    const typeOk = filters.propertyType === 'all' || row.propertyTypes.includes(filters.propertyType);
    const searchOk = !q || [
      row.clientName,
      row.email ?? '',
      row.status ?? '',
      ...row.suburbs,
      ...row.propertyTypes,
    ].join(' ').toLowerCase().includes(q);
    return statusOk && typeOk && searchOk;
  });
}

function budgetSortValue(row: BriefTableRow): number {
  return row.budgetMax ?? row.budgetMin ?? 0;
}

export function sortBriefRows(rows: BriefTableRow[], sort: SortState): BriefTableRow[] {
  const dir = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (sort.key === 'client') return a.clientName.localeCompare(b.clientName) * dir;
    if (sort.key === 'budget') return (budgetSortValue(a) - budgetSortValue(b)) * dir;
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return (aTime - bTime) * dir;
  });
}

export function paginateBriefRows(rows: BriefTableRow[], page: number, pageSize: number): {
  rows: BriefTableRow[];
  page: number;
  totalPages: number;
  from: number;
  to: number;
} {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
  return {
    rows: pageRows,
    page: safePage,
    totalPages,
    from: rows.length === 0 ? 0 : start + 1,
    to: start + pageRows.length,
  };
}
```

- [ ] **Step 4: Run utility tests and verify pass**

Run: `pnpm vitest run src/lib/__tests__/briefs-table-utils.test.ts`

Expected: PASS.

## Task 2: Server Page Data Boundary

**Files:**
- Modify: `src/app/(dashboard)/briefs/page.tsx`

- [ ] **Step 1: Replace inline table with component boundary**

Modify `src/app/(dashboard)/briefs/page.tsx` to this shape:

```tsx
import { db } from '@/lib/db';
import { buyerBriefsTable } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { TopBar } from '@/components/shared/top-bar';
import { Icon } from '@/components/shared/icon';
import { BriefsCrmTable } from '@/components/briefs/briefs-crm-table';
import type { BriefTableRow } from '@/lib/briefs-table-utils';

export const dynamic = 'force-dynamic';

function cleanSuburb(s: string): string {
  const idx = s.indexOf(' - ');
  return idx >= 0 ? s.slice(idx + 3).trim() : s.trim();
}

export default async function BriefsPage() {
  const briefs = await db.select().from(buyerBriefsTable).orderBy(desc(buyerBriefsTable.createdAt));

  const rows: BriefTableRow[] = briefs.map((b) => ({
    id: b.id,
    clientName: b.clientName,
    email: b.email,
    budgetMin: b.budgetMin,
    budgetMax: b.budgetMax,
    suburbs: ((b.suburbs as string[]) ?? []).map(cleanSuburb),
    status: b.status ?? 'searching',
    propertyTypes: (b.propertyTypes as string[]) ?? [],
    createdAt: b.createdAt ? b.createdAt.toISOString() : null,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar
        eyebrow={`${rows.length} active brief${rows.length !== 1 ? 's' : ''}`}
        title="Buyer Briefs"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/briefs/intake" className="pg-btn">
              <Icon name="mic" size={13} />Import from recording
            </a>
            <a href="/briefs/new" className="pg-btn pg-btn-accent">
              <Icon name="plus" size={13} />New brief
            </a>
          </div>
        }
      />
      <BriefsCrmTable rows={rows} />
    </div>
  );
}
```

- [ ] **Step 2: Run type check and verify expected failure**

Run: `pnpm tsc --noEmit`

Expected: FAIL because `BriefsCrmTable` does not exist yet.

## Task 3: Interactive CRM Table Component

**Files:**
- Create: `src/components/briefs/briefs-crm-table.tsx`

- [ ] **Step 1: Implement component**

Create `src/components/briefs/briefs-crm-table.tsx`:

```tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/shared/icon';
import {
  filterBriefRows,
  formatBudgetRange,
  getDisplayBriefRows,
  paginateBriefRows,
  sortBriefRows,
  type BriefTableRow,
  type SortKey,
  type SortState,
} from '@/lib/briefs-table-utils';

const PAGE_SIZE = 10;
const GRID = '40px minmax(240px, 2fr) minmax(140px, 1fr) minmax(180px, 1.3fr) minmax(120px, 0.8fr) minmax(130px, 0.8fr) minmax(100px, 0.7fr) 40px';

type ColumnKey = 'budget' | 'suburbs' | 'status' | 'type' | 'created';

type Props = {
  rows: BriefTableRow[];
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function initials(name: string): string {
  return name
    .split(/\s+|&/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'BB';
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function statusClass(status: string | null): string {
  const s = status ?? 'searching';
  if (['searching', 'active', 'qualified'].includes(s)) return 'pg-badge-green pg-badge-dot';
  if (['paused', 'nurture'].includes(s)) return 'pg-badge-amber pg-badge-dot';
  if (['archived', 'lost'].includes(s)) return 'pg-badge-gray pg-badge-dot';
  return 'pg-badge-blue pg-badge-dot';
}

function SortButton({ label, sortKey, sort, onSort }: { label: string; sortKey: SortKey; sort: SortState; onSort: (key: SortKey) => void }) {
  const active = sort.key === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        border: 'none',
        background: 'transparent',
        padding: 0,
        font: 'inherit',
        color: active ? 'var(--pg-text)' : 'var(--pg-text-faint)',
        cursor: 'pointer',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}
    >
      {label}
      <span style={{ fontSize: 10, color: active ? 'var(--pg-text)' : 'var(--pg-text-very-faint)' }}>
        {active ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  );
}

export function BriefsCrmTable({ rows: inputRows }: Props) {
  const display = useMemo(() => getDisplayBriefRows(inputRows), [inputRows]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [propertyType, setPropertyType] = useState('all');
  const [sort, setSort] = useState<SortState>({ key: 'created', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [openPanel, setOpenPanel] = useState<'filter' | 'sort' | 'columns' | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>({
    budget: true,
    suburbs: true,
    status: true,
    type: true,
    created: true,
  });

  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const statuses = useMemo(() => unique(display.rows.map((row) => row.status ?? 'searching')), [display.rows]);
  const propertyTypes = useMemo(() => unique(display.rows.flatMap((row) => row.propertyTypes)), [display.rows]);

  const filteredRows = useMemo(
    () => filterBriefRows(display.rows, { search, status, propertyType }),
    [display.rows, propertyType, search, status],
  );
  const sortedRows = useMemo(() => sortBriefRows(filteredRows, sort), [filteredRows, sort]);
  const paged = useMemo(() => paginateBriefRows(sortedRows, page, PAGE_SIZE), [page, sortedRows]);

  useEffect(() => {
    setPage(1);
  }, [search, status, propertyType]);

  useEffect(() => {
    if (page !== paged.page) setPage(paged.page);
  }, [page, paged.page]);

  const visibleIds = paged.rows.map((row) => row.id);
  const selectedVisibleCount = visibleIds.filter((id) => selectedIds.has(id)).length;
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = selectedVisibleCount > 0 && !allVisibleSelected;
    }
  }, [allVisibleSelected, selectedVisibleCount]);

  function updateSort(key: SortKey) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  }

  function toggleCurrentPage(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of visibleIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  function clearFilters() {
    setSearch('');
    setStatus('all');
    setPropertyType('all');
  }

  const hiddenColumnCount = Object.values(visibleColumns).filter((v) => !v).length;

  return (
    <div style={{ padding: '0 32px 32px', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: '1 1 360px', maxWidth: 460 }}>
          <Icon name="search" size={13} color="var(--pg-text-faint)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="pg-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients, email, suburbs..."
            style={{ paddingLeft: 32, height: 34 }}
          />
        </div>
        {selectedIds.size > 0 && (
          <span className="pg-badge pg-badge-blue" style={{ fontSize: 11 }}>{selectedIds.size} selected</span>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
          <button type="button" className="pg-btn" onClick={() => setOpenPanel(openPanel === 'filter' ? null : 'filter')}>
            <Icon name="sliders" size={13} />Filter <span style={{ color: 'var(--pg-text-faint)' }}>⌄</span>
          </button>
          <button type="button" className="pg-btn" onClick={() => setOpenPanel(openPanel === 'sort' ? null : 'sort')}>
            <Icon name="arrow-up-down" size={13} />Sort <span style={{ color: 'var(--pg-text-faint)' }}>⌄</span>
          </button>
          <button type="button" className="pg-btn" onClick={() => setOpenPanel(openPanel === 'columns' ? null : 'columns')}>
            <Icon name="columns" size={13} />View{hiddenColumnCount ? ` (${hiddenColumnCount})` : ''} <span style={{ color: 'var(--pg-text-faint)' }}>⌄</span>
          </button>
          {openPanel && (
            <div className="pg-card" style={{ position: 'absolute', right: 0, top: 38, zIndex: 20, width: 260, padding: 14, boxShadow: '0 18px 50px rgba(20,18,12,0.10)' }}>
              {openPanel === 'filter' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>Status
                    <select className="pg-input" value={status} onChange={(e) => setStatus(e.target.value)} style={{ marginTop: 5 }}>
                      <option value="all">All statuses</option>
                      {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <label style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>Type
                    <select className="pg-input" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} style={{ marginTop: 5 }}>
                      <option value="all">All types</option>
                      {propertyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                  <button type="button" className="pg-btn pg-btn-sm" onClick={clearFilters} style={{ alignSelf: 'flex-start' }}>Clear filters</button>
                </div>
              )}
              {openPanel === 'sort' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(['client', 'budget', 'created'] as SortKey[]).map((key) => (
                    <button key={key} type="button" className="pg-btn pg-btn-sm" onClick={() => updateSort(key)} style={{ justifyContent: 'space-between' }}>
                      {key[0].toUpperCase() + key.slice(1)}
                      {sort.key === key ? (sort.direction === 'asc' ? '↑' : '↓') : ''}
                    </button>
                  ))}
                </div>
              )}
              {openPanel === 'columns' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {(Object.keys(visibleColumns) as ColumnKey[]).map((key) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={visibleColumns[key]}
                        onChange={(e) => setVisibleColumns((current) => ({ ...current, [key]: e.target.checked }))}
                        style={{ accentColor: 'var(--pg-accent)' }}
                      />
                      {key === 'type' ? 'Type' : key[0].toUpperCase() + key.slice(1)}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {(display.hiddenTestRows > 0 || display.usingDemoRows) && (
        <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--pg-text-faint)' }}>
          {display.hiddenTestRows > 0 && `${display.hiddenTestRows} generated test brief${display.hiddenTestRows === 1 ? '' : 's'} hidden.`}
          {display.usingDemoRows && ' Showing demo CRM data because no usable briefs were found.'}
        </div>
      )}

      <div className="pg-card-flat" style={{ overflow: 'hidden', background: 'var(--pg-surface)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 12, alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--pg-border)', fontSize: 10.5, color: 'var(--pg-text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          <input ref={headerCheckboxRef} type="checkbox" checked={allVisibleSelected} onChange={(e) => toggleCurrentPage(e.target.checked)} style={{ accentColor: 'var(--pg-accent)' }} />
          <SortButton label="Client" sortKey="client" sort={sort} onSort={updateSort} />
          {visibleColumns.budget && <SortButton label="Budget" sortKey="budget" sort={sort} onSort={updateSort} />}
          {visibleColumns.suburbs && <span>Suburbs</span>}
          {visibleColumns.status && <span>Status</span>}
          {visibleColumns.type && <span>Type</span>}
          {visibleColumns.created && <SortButton label="Created" sortKey="created" sort={sort} onSort={updateSort} />}
          <span />
        </div>

        {paged.rows.length === 0 ? (
          <div style={{ padding: '54px 0', textAlign: 'center', color: 'var(--pg-text-dim)' }}>
            <Icon name="users" size={34} color="var(--pg-text-very-faint)" />
            <div style={{ fontSize: 15, fontWeight: 500, marginTop: 12 }}>No briefs match your filters.</div>
            <button type="button" className="pg-btn pg-btn-sm" onClick={clearFilters} style={{ marginTop: 14 }}>Clear filters</button>
          </div>
        ) : paged.rows.map((row, i) => (
          <div key={row.id} className="pg-row" style={{ position: 'relative', display: 'grid', gridTemplateColumns: GRID, gap: 12, alignItems: 'center', padding: '12px 14px', borderBottom: i < paged.rows.length - 1 ? '1px solid var(--pg-border)' : 'none', fontSize: 13 }}>
            <input
              type="checkbox"
              checked={selectedIds.has(row.id)}
              onChange={(e) => setSelectedIds((current) => {
                const next = new Set(current);
                if (e.target.checked) next.add(row.id);
                else next.delete(row.id);
                return next;
              })}
              style={{ accentColor: 'var(--pg-accent)' }}
            />
            <Link href={`/briefs/${row.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, color: 'inherit', textDecoration: 'none' }}>
              <div className="pg-avatar pg-avatar-sm">{initials(row.clientName)}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }} className="pg-truncate">{row.clientName}</div>
                <div style={{ fontSize: 11.5, color: 'var(--pg-text-dim)' }} className="pg-truncate">{row.email ?? 'No email'}</div>
              </div>
            </Link>
            {visibleColumns.budget && <div className="pg-mono" style={{ fontSize: 12 }}>{formatBudgetRange(row.budgetMin, row.budgetMax)}</div>}
            {visibleColumns.suburbs && (
              <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }} className="pg-truncate">
                {row.suburbs.slice(0, 3).join(', ') || '—'}{row.suburbs.length > 3 ? ` +${row.suburbs.length - 3}` : ''}
              </div>
            )}
            {visibleColumns.status && <span className={`pg-badge ${statusClass(row.status)}`} style={{ justifySelf: 'start', fontSize: 11 }}>{row.status ?? 'searching'}</span>}
            {visibleColumns.type && <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }} className="pg-truncate">{row.propertyTypes.join(', ') || '—'}</div>}
            {visibleColumns.created && <div style={{ fontSize: 12, color: 'var(--pg-text-faint)' }}>{formatDate(row.createdAt)}</div>}
            <div style={{ position: 'relative', justifySelf: 'end' }}>
              <button type="button" className="pg-btn pg-btn-icon pg-btn-sm" onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)} aria-label={`Actions for ${row.clientName}`}>⋯</button>
              {openMenuId === row.id && (
                <div className="pg-card" style={{ position: 'absolute', right: 0, top: 28, zIndex: 30, width: 150, padding: 6, boxShadow: '0 18px 50px rgba(20,18,12,0.12)' }}>
                  <Link href={`/briefs/${row.id}`} className="pg-btn pg-btn-sm pg-btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', textDecoration: 'none' }}>Open brief</Link>
                  <Link href={`/briefs/${row.id}?tab=profile`} className="pg-btn pg-btn-sm pg-btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', textDecoration: 'none' }}>Edit</Link>
                  <button type="button" className="pg-btn pg-btn-sm pg-btn-ghost" disabled style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--pg-text-faint)', cursor: 'not-allowed' }}>Delete unavailable</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 14, color: 'var(--pg-text-dim)', fontSize: 12 }}>
        <span>Showing {paged.from} to {paged.to} of {sortedRows.length} result{sortedRows.length === 1 ? '' : 's'}</span>
        <div style={{ flex: 1 }} />
        <button type="button" className="pg-btn pg-btn-sm" disabled={paged.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
        <span className="pg-mono" style={{ color: 'var(--pg-text-faint)' }}>{paged.page} / {paged.totalPages}</span>
        <button type="button" className="pg-btn pg-btn-sm" disabled={paged.page >= paged.totalPages} onClick={() => setPage((p) => Math.min(paged.totalPages, p + 1))}>Next</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run type check**

Run: `pnpm tsc --noEmit`

Expected: Either PASS or specific icon-name/type errors to resolve in Step 3.

- [ ] **Step 3: Resolve icon type errors if present**

If `arrow-up-down` or `columns` are not valid icon names, replace them with existing icon names from `src/components/shared/icon.tsx`, preferably `arrow-up-right` for sort and `layout` or `sliders` for columns if available.

Run: `pnpm tsc --noEmit`

Expected: PASS.

## Task 4: Interaction Polish And Responsive Safety

**Files:**
- Modify: `src/components/briefs/briefs-crm-table.tsx`

- [ ] **Step 1: Add click-outside dismissal for menus**

Add a wrapper ref and effect to close dropdowns when clicking outside. Insert near existing refs/state:

```tsx
const tableShellRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  function onPointerDown(event: PointerEvent) {
    if (!tableShellRef.current?.contains(event.target as Node)) {
      setOpenPanel(null);
      setOpenMenuId(null);
    }
  }
  document.addEventListener('pointerdown', onPointerDown);
  return () => document.removeEventListener('pointerdown', onPointerDown);
}, []);
```

Then add `ref={tableShellRef}` to the top-level returned `<div>` in `BriefsCrmTable`.

- [ ] **Step 2: Add horizontal overflow for narrow screens**

Wrap the table card in an overflow container or add minimum width to the table surface:

```tsx
<div className="pg-scroll" style={{ overflowX: 'auto' }}>
  <div className="pg-card-flat" style={{ minWidth: 1040, overflow: 'hidden', background: 'var(--pg-surface)' }}>
    ...existing table...
  </div>
</div>
```

Keep the footer outside the horizontal scroll.

- [ ] **Step 3: Run type check**

Run: `pnpm tsc --noEmit`

Expected: PASS.

## Task 5: Final Verification

**Files:**
- Verify: `src/lib/briefs-table-utils.ts`
- Verify: `src/components/briefs/briefs-crm-table.tsx`
- Verify: `src/app/(dashboard)/briefs/page.tsx`

- [ ] **Step 1: Run focused tests**

Run: `pnpm vitest run src/lib/__tests__/briefs-table-utils.test.ts`

Expected: PASS.

- [ ] **Step 2: Run full unit suite**

Run: `pnpm test`

Expected: PASS, or unrelated pre-existing failures clearly identified.

- [ ] **Step 3: Run type check**

Run: `pnpm tsc --noEmit`

Expected: PASS.

- [ ] **Step 4: Manual browser check**

Run: `pnpm dev` if the dev server is not already running, then visit `/briefs`.

Verify:

- Search filters rows by client, email, suburb, status, and type.
- Filter dropdown changes visible rows.
- Sort dropdown and sortable headers update row order.
- Column visibility toggles hide and show columns.
- Master checkbox selects only current page rows.
- Row checkbox selection count updates.
- Kebab menu opens and links work.
- Pagination shows `Showing 1 to 10 of N results` and Previous/Next states are correct.
- Test rows are hidden and demo rows appear if no usable data exists.

---

## Self-Review Notes

- Spec coverage: toolbar, sortable headers, selection, row menus, realistic data handling, pagination, hover state, and functional controls are covered.
- Scope: backend pagination, persistent preferences, and destructive delete remain out of scope.
- Type consistency: `BriefTableRow`, `SortState`, and `SortKey` are defined in Task 1 and reused by Tasks 2 and 3.
