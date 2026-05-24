'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

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
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function statusClass(status: string | null): string {
  const s = status ?? 'searching';
  if (['searching', 'active', 'qualified'].includes(s)) return 'pg-badge-green pg-badge-dot';
  if (['paused', 'nurture'].includes(s)) return 'pg-badge-amber pg-badge-dot';
  if (['archived', 'lost'].includes(s)) return 'pg-badge-gray pg-badge-dot';
  return 'pg-badge-blue pg-badge-dot';
}

function briefHref(row: BriefTableRow, suffix = ''): string {
  return row.id > 0 ? `/briefs/${row.id}${suffix}` : '#';
}

function gridTemplate(columns: Record<ColumnKey, boolean>): string {
  return [
    '40px',
    'minmax(240px, 2fr)',
    columns.budget ? 'minmax(140px, 1fr)' : null,
    columns.suburbs ? 'minmax(180px, 1.3fr)' : null,
    columns.status ? 'minmax(120px, 0.8fr)' : null,
    columns.type ? 'minmax(130px, 0.8fr)' : null,
    columns.created ? 'minmax(100px, 0.7fr)' : null,
    '40px',
  ].filter(Boolean).join(' ');
}

function SortButton({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
}) {
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
        {active ? (sort.direction === 'asc' ? 'up' : 'down') : 'sort'}
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
  const tableShellRef = useRef<HTMLDivElement>(null);

  const statuses = useMemo(() => unique(display.rows.map((row) => row.status ?? 'searching')), [display.rows]);
  const propertyTypes = useMemo(() => unique(display.rows.flatMap((row) => row.propertyTypes)), [display.rows]);

  const filteredRows = useMemo(
    () => filterBriefRows(display.rows, { search, status, propertyType }),
    [display.rows, propertyType, search, status],
  );
  const sortedRows = useMemo(() => sortBriefRows(filteredRows, sort), [filteredRows, sort]);
  const paged = useMemo(() => paginateBriefRows(sortedRows, page, PAGE_SIZE), [page, sortedRows]);

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
    setPage(1);
  }

  const hiddenColumnCount = Object.values(visibleColumns).filter((v) => !v).length;
  const grid = gridTemplate(visibleColumns);

  return (
    <div ref={tableShellRef} style={{ padding: '0 32px 32px', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: '1 1 360px', maxWidth: 460 }}>
          <Icon name="search" size={13} color="var(--pg-text-faint)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="pg-input"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
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
            <Icon name="filter" size={13} />Filter <Icon name="chevron-down" size={11} color="var(--pg-text-faint)" />
          </button>
          <button type="button" className="pg-btn" onClick={() => setOpenPanel(openPanel === 'sort' ? null : 'sort')}>
            <Icon name="arrow-up" size={13} />Sort <Icon name="chevron-down" size={11} color="var(--pg-text-faint)" />
          </button>
          <button type="button" className="pg-btn" onClick={() => setOpenPanel(openPanel === 'columns' ? null : 'columns')}>
            <Icon name="grid" size={13} />View{hiddenColumnCount ? ` (${hiddenColumnCount})` : ''} <Icon name="chevron-down" size={11} color="var(--pg-text-faint)" />
          </button>

          {openPanel && (
            <div className="pg-card" style={{ position: 'absolute', right: 0, top: 38, zIndex: 20, width: 260, padding: 14, boxShadow: '0 18px 50px rgba(20,18,12,0.10)' }}>
              {openPanel === 'filter' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>Status
                    <select className="pg-input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={{ marginTop: 5 }}>
                      <option value="all">All statuses</option>
                      {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <label style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>Type
                    <select className="pg-input" value={propertyType} onChange={(e) => { setPropertyType(e.target.value); setPage(1); }} style={{ marginTop: 5 }}>
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
                      {sort.key === key ? (sort.direction === 'asc' ? 'up' : 'down') : ''}
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

      <div className="pg-scroll" style={{ overflowX: 'auto' }}>
        <div className="pg-card-flat" style={{ minWidth: 1040, overflow: 'hidden', background: 'var(--pg-surface)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: grid, gap: 12, alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--pg-border)', fontSize: 10.5, color: 'var(--pg-text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
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
            <div key={row.id} className="pg-row" style={{ position: 'relative', display: 'grid', gridTemplateColumns: grid, gap: 12, alignItems: 'center', padding: '12px 14px', borderBottom: i < paged.rows.length - 1 ? '1px solid var(--pg-border)' : 'none', fontSize: 13 }}>
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
              <Link href={briefHref(row)} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, color: 'inherit', textDecoration: 'none' }}>
                <div className="pg-avatar pg-avatar-sm">{initials(row.clientName)}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }} className="pg-truncate">{row.clientName}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--pg-text-dim)' }} className="pg-truncate">{row.email ?? 'No email'}</div>
                </div>
              </Link>
              {visibleColumns.budget && <div className="pg-mono" style={{ fontSize: 12 }}>{formatBudgetRange(row.budgetMin, row.budgetMax)}</div>}
              {visibleColumns.suburbs && (
                <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }} className="pg-truncate">
                  {row.suburbs.slice(0, 3).join(', ') || '-'}{row.suburbs.length > 3 ? ` +${row.suburbs.length - 3}` : ''}
                </div>
              )}
              {visibleColumns.status && <span className={`pg-badge ${statusClass(row.status)}`} style={{ justifySelf: 'start', fontSize: 11 }}>{row.status ?? 'searching'}</span>}
              {visibleColumns.type && <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }} className="pg-truncate">{row.propertyTypes.join(', ') || '-'}</div>}
              {visibleColumns.created && <div style={{ fontSize: 12, color: 'var(--pg-text-faint)' }}>{formatDate(row.createdAt)}</div>}
              <div style={{ position: 'relative', justifySelf: 'end' }}>
                <button type="button" className="pg-btn pg-btn-icon pg-btn-sm" onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)} aria-label={`Actions for ${row.clientName}`}>
                  <Icon name="more" size={13} />
                </button>
                {openMenuId === row.id && (
                  <div className="pg-card" style={{ position: 'absolute', right: 0, top: 28, zIndex: 30, width: 160, padding: 6, boxShadow: '0 18px 50px rgba(20,18,12,0.12)' }}>
                    <Link href={briefHref(row)} className="pg-btn pg-btn-sm pg-btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', textDecoration: 'none' }}>Open brief</Link>
                    <Link href={briefHref(row, '?tab=profile')} className="pg-btn pg-btn-sm pg-btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', textDecoration: 'none' }}>Edit</Link>
                    <button type="button" className="pg-btn pg-btn-sm pg-btn-ghost" disabled style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--pg-text-faint)', cursor: 'not-allowed' }}>Delete unavailable</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
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
