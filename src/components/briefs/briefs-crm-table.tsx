'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Icon } from '@/components/shared/icon';
import {
  filterBriefRows,
  formatBudgetRange,
  getDisplayBriefRows,
  paginateBriefRows,
  reorderColumnKeys,
  resizeColumnWidth,
  rowsToCsv,
  sortBriefRowsMulti,
  type BriefTableRow,
  type CsvColumnKey,
  type SortKey,
  type SortState,
} from '@/lib/briefs-table-utils';

type ColumnKey = 'budget' | 'suburbs' | 'status' | 'type' | 'created' | 'phone' | 'agent';
type Density = 'compact' | 'standard' | 'comfortable';
type SavedView = 'all' | 'active' | 'highBudget';

type Props = {
  rows: BriefTableRow[];
};

type ColumnDef = {
  key: ColumnKey;
  label: string;
  sortKey: SortKey;
  min: number;
  max: number;
  csv: CsvColumnKey;
  numeric?: boolean;
  editable?: boolean;
};

const COLUMNS: ColumnDef[] = [
  { key: 'budget', label: 'Budget', sortKey: 'budget', min: 132, max: 260, csv: 'budget', numeric: true, editable: true },
  { key: 'suburbs', label: 'Suburbs', sortKey: 'suburbs', min: 180, max: 420, csv: 'suburbs' },
  { key: 'status', label: 'Status', sortKey: 'status', min: 124, max: 220, csv: 'status', editable: true },
  { key: 'type', label: 'Type', sortKey: 'type', min: 130, max: 260, csv: 'type' },
  { key: 'phone', label: 'Phone', sortKey: 'client', min: 130, max: 220, csv: 'phone' },
  { key: 'agent', label: 'Agent', sortKey: 'client', min: 130, max: 240, csv: 'agent' },
  { key: 'created', label: 'Created', sortKey: 'created', min: 104, max: 180, csv: 'created' },
];

const SAVED_VIEWS: Array<{ key: SavedView; label: string }> = [
  { key: 'all', label: 'All Clients' },
  { key: 'active', label: 'My Active Clients' },
  { key: 'highBudget', label: 'High Budget' },
];

const DENSITY: Record<Density, { row: number; header: number; text: number }> = {
  compact: { row: 8, header: 9, text: 12 },
  standard: { row: 12, header: 10, text: 13 },
  comfortable: { row: 16, header: 12, text: 14 },
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

function briefHref(row: BriefTableRow, suffix = ''): string {
  return row.id > 0 ? `/briefs/${row.id}${suffix}` : '#';
}

function statusClass(status: string | null): string {
  const s = status ?? 'searching';
  if (['searching', 'active', 'qualified', 'high intent'].includes(s)) return 'pg-badge-green pg-badge-dot';
  if (['paused', 'nurture'].includes(s)) return 'pg-badge-amber pg-badge-dot';
  if (['archived', 'lost'].includes(s)) return 'pg-badge-gray pg-badge-dot';
  return 'pg-badge-blue pg-badge-dot';
}

function SortGlyph({ direction, priority }: { direction?: 'asc' | 'desc'; priority?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: direction ? 'var(--pg-blue)' : 'var(--pg-text-very-faint)' }}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        {direction === 'asc' ? (
          <path d="M6 2.25v7.5M3.25 5 6 2.25 8.75 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        ) : direction === 'desc' ? (
          <path d="M6 9.75v-7.5M3.25 7 6 9.75 8.75 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M4 3h4M4 6h4M4 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        )}
      </svg>
      {priority && <span style={{ fontSize: 9, fontWeight: 700 }}>{priority}</span>}
    </span>
  );
}

function pinnedLeftStyle(offset: number): React.CSSProperties {
  return {
    position: 'sticky',
    left: offset,
    zIndex: 4,
    background: 'inherit',
    boxShadow: offset > 0 ? '8px 0 16px rgba(20,18,12,0.04)' : undefined,
  };
}

function pinnedRightStyle(): React.CSSProperties {
  return {
    position: 'sticky',
    right: 0,
    zIndex: 4,
    background: 'inherit',
    boxShadow: '-8px 0 16px rgba(20,18,12,0.04)',
  };
}

export function BriefsCrmTable({ rows: inputRows }: Props) {
  const display = useMemo(() => getDisplayBriefRows(inputRows), [inputRows]);
  const [savedView, setSavedView] = useState<SavedView>('all');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [propertyType, setPropertyType] = useState('all');
  const [suburb, setSuburb] = useState('all');
  const [sortRules, setSortRules] = useState<SortState[]>([{ key: 'created', direction: 'desc' }]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [density, setDensity] = useState<Density>('standard');
  const [openPanel, setOpenPanel] = useState<'views' | 'filter' | 'columns' | 'sort' | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ rowId: number; x: number; y: number } | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<ColumnKey | null>(null);
  const [resizing, setResizing] = useState<{ key: ColumnKey; startX: number; startWidth: number } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>({
    budget: true,
    suburbs: true,
    status: true,
    type: true,
    phone: true,
    agent: true,
    created: true,
  });
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>(COLUMNS.map((c) => c.key));
  const [columnWidths, setColumnWidths] = useState<Record<ColumnKey, number>>({
    budget: 156,
    suburbs: 260,
    status: 140,
    type: 150,
    phone: 150,
    agent: 148,
    created: 112,
  });

  const shellRef = useRef<HTMLDivElement>(null);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const baseRows = useMemo(() => {
    if (savedView === 'active') return display.rows.filter((row) => ['active', 'searching', 'qualified', 'high intent'].includes(row.status ?? 'searching'));
    if (savedView === 'highBudget') return display.rows.filter((row) => (row.budgetMax ?? row.budgetMin ?? 0) >= 1_500_000);
    return display.rows;
  }, [display.rows, savedView]);

  const statuses = useMemo(() => unique(display.rows.map((row) => row.status ?? 'searching')), [display.rows]);
  const propertyTypes = useMemo(() => unique(display.rows.flatMap((row) => row.propertyTypes)), [display.rows]);
  const suburbs = useMemo(() => unique(display.rows.flatMap((row) => row.suburbs)), [display.rows]);
  const columns = useMemo(() => columnOrder.map((key) => COLUMNS.find((c) => c.key === key)!).filter((column) => visibleColumns[column.key]), [columnOrder, visibleColumns]);

  const filteredRows = useMemo(
    () => filterBriefRows(baseRows, { search, status, propertyType, suburb }),
    [baseRows, propertyType, search, status, suburb],
  );
  const sortedRows = useMemo(() => sortBriefRowsMulti(filteredRows, sortRules), [filteredRows, sortRules]);
  const paged = useMemo(() => paginateBriefRows(sortedRows, page, pageSize), [page, pageSize, sortedRows]);

  const grid = useMemo(() => [
    '44px',
    '260px',
    ...columns.map((column) => `${columnWidths[column.key]}px`),
    '52px',
  ].join(' '), [columns, columnWidths]);

  const isDirtyView = search !== '' || status !== 'all' || propertyType !== 'all' || suburb !== 'all' || sortRules.length !== 1 || sortRules[0]?.key !== 'created' || sortRules[0]?.direction !== 'desc';
  const selectedVisibleCount = paged.rows.filter((row) => selectedIds.has(row.id)).length;
  const allVisibleSelected = paged.rows.length > 0 && selectedVisibleCount === paged.rows.length;
  const densityValue = DENSITY[density];

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!shellRef.current?.contains(event.target as Node)) {
        setOpenPanel(null);
        setOpenMenuId(null);
        setContextMenu(null);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  useEffect(() => {
    if (!resizing) return;
    function onPointerMove(event: PointerEvent) {
      const def = COLUMNS.find((column) => column.key === resizing.key)!;
      setColumnWidths((current) => ({
        ...current,
        [resizing.key]: resizeColumnWidth(resizing.startWidth, event.clientX - resizing.startX, def.min, def.max),
      }));
    }
    function onPointerUp() {
      setResizing(null);
    }
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp, { once: true });
    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };
  }, [resizing]);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = selectedVisibleCount > 0 && !allVisibleSelected;
    }
  }, [allVisibleSelected, selectedVisibleCount]);

  function setFilter(next: Partial<{ search: string; status: string; propertyType: string; suburb: string }>) {
    if (next.search != null) setSearch(next.search);
    if (next.status != null) setStatus(next.status);
    if (next.propertyType != null) setPropertyType(next.propertyType);
    if (next.suburb != null) setSuburb(next.suburb);
    setPage(1);
  }

  function clearFilters() {
    setFilter({ search: '', status: 'all', propertyType: 'all', suburb: 'all' });
  }

  function updateSort(key: SortKey, additive: boolean) {
    setSortRules((current) => {
      const existing = current.find((rule) => rule.key === key);
      const nextDirection = existing?.direction === 'asc' ? 'desc' : 'asc';
      if (!additive) return [{ key, direction: nextDirection }];
      const without = current.filter((rule) => rule.key !== key);
      return [...without, { key, direction: nextDirection }].slice(0, 3);
    });
  }

  function selectVisible(checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const row of paged.rows) {
        if (checked) next.add(row.id);
        else next.delete(row.id);
      }
      return next;
    });
  }

  async function copyValue(key: string, value: string) {
    await navigator.clipboard?.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1200);
  }

  function exportRows(rows: BriefTableRow[]) {
    const csvColumns: CsvColumnKey[] = ['client', 'email', 'phone', 'budget', 'suburbs', 'status', 'type', 'agent', 'created'];
    const blob = new Blob([rowsToCsv(rows, csvColumns)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function renderCell(row: BriefTableRow, column: ColumnDef) {
    if (column.key === 'budget') {
      return <EditableCell numeric>{formatBudgetRange(row.budgetMin, row.budgetMax)}</EditableCell>;
    }
    if (column.key === 'suburbs') {
      const full = row.suburbs.join(', ');
      return <span title={full} className="pg-truncate" style={{ color: 'var(--pg-text-dim)' }}>{full || '-'}</span>;
    }
    if (column.key === 'status') {
      return <EditableCell><span className={`pg-badge ${statusClass(row.status)}`} style={{ border: '1px solid color-mix(in srgb, currentColor 18%, transparent)' }}>{row.status ?? 'searching'}</span></EditableCell>;
    }
    if (column.key === 'type') return <span className="pg-truncate" title={row.propertyTypes.join(', ')}>{row.propertyTypes.join(', ') || '-'}</span>;
    if (column.key === 'phone') return <CopyCell id={`${row.id}-phone`} value={row.phone ?? '-'} copied={copied} onCopy={copyValue} />;
    if (column.key === 'agent') return <span className="pg-truncate">{row.agent ?? 'Unassigned'}</span>;
    return <span style={{ color: 'var(--pg-text-faint)' }}>{formatDate(row.createdAt)}</span>;
  }

  const activeFilterChips = [
    status !== 'all' ? { key: 'status', label: `Status is ${status}`, clear: () => setFilter({ status: 'all' }) } : null,
    propertyType !== 'all' ? { key: 'type', label: `Type is ${propertyType}`, clear: () => setFilter({ propertyType: 'all' }) } : null,
    suburb !== 'all' ? { key: 'suburb', label: `Suburbs contains ${suburb}`, clear: () => setFilter({ suburb: 'all' }) } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; clear: () => void }>;

  return (
    <div ref={shellRef} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '0 32px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ position: 'relative' }}>
          <button className="pg-btn" type="button" onClick={() => setOpenPanel(openPanel === 'views' ? null : 'views')}>
            {SAVED_VIEWS.find((view) => view.key === savedView)?.label}
            {isDirtyView && <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--pg-amber)' }} />}
            <Icon name="chevron-down" size={11} color="var(--pg-text-faint)" />
          </button>
          {openPanel === 'views' && <Panel width={220}>{SAVED_VIEWS.map((view) => <button key={view.key} className="pg-btn pg-btn-sm pg-btn-ghost" type="button" onClick={() => { setSavedView(view.key); setOpenPanel(null); setPage(1); }} style={{ width: '100%', justifyContent: 'flex-start' }}>{view.label}</button>)}</Panel>}
        </div>

        <div style={{ position: 'relative', flex: '1 1 360px', maxWidth: 520 }}>
          <Icon name="search" size={13} color="var(--pg-text-faint)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="pg-input" value={search} onChange={(e) => setFilter({ search: e.target.value })} placeholder="Search clients, email, phone, suburb..." style={{ height: 34, paddingLeft: 32, paddingRight: 74 }} />
          {search && <button type="button" onClick={() => setFilter({ search: '' })} style={{ position: 'absolute', right: 52, top: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--pg-text-faint)' }}><Icon name="x" size={12} /></button>}
          <span style={{ position: 'absolute', right: 10, top: 7, fontFamily: 'var(--pg-font-mono)', fontSize: 10.5, color: 'var(--pg-text-faint)', border: '1px solid var(--pg-border)', borderRadius: 4, padding: '1px 5px' }}>⌘K</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {activeFilterChips.map((chip) => <button key={chip.key} type="button" className="pg-badge pg-badge-blue" onClick={chip.clear}>{chip.label}<Icon name="x" size={10} /></button>)}
        </div>

        <div style={{ flex: 1 }} />
        <ToolbarButton panel="filter" icon="filter" openPanel={openPanel} setOpenPanel={setOpenPanel} label="Where" />
        <ToolbarButton panel="sort" icon="arrow-up" openPanel={openPanel} setOpenPanel={setOpenPanel} label="Sort" />
        <ToolbarButton panel="columns" icon="grid" openPanel={openPanel} setOpenPanel={setOpenPanel} label="Columns" />
        <button className="pg-btn pg-btn-icon" type="button" title="Export CSV" onClick={() => exportRows(sortedRows)}><Icon name="file-text" size={14} /></button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, minHeight: 34 }}>
        <span className="pg-label">Density</span>
        {(['compact', 'standard', 'comfortable'] as Density[]).map((item) => <button key={item} type="button" className={`pg-btn pg-btn-sm ${density === item ? 'pg-btn-primary' : ''}`} onClick={() => setDensity(item)}>{item}</button>)}
        <span className="pg-badge">Where <strong>Suburbs</strong> contains <strong>{suburb === 'all' ? 'Any' : suburb}</strong></span>
        {display.hiddenTestRows > 0 && <span style={{ fontSize: 12, color: 'var(--pg-text-faint)' }}>{display.hiddenTestRows} generated test client{display.hiddenTestRows === 1 ? '' : 's'} hidden</span>}
        {display.usingDemoRows && <span style={{ fontSize: 12, color: 'var(--pg-text-faint)' }}>Showing realistic demo CRM data</span>}
      </div>

      <PopoverPanels
        openPanel={openPanel}
        statuses={statuses}
        status={status}
        propertyTypes={propertyTypes}
        propertyType={propertyType}
        suburbs={suburbs}
        suburb={suburb}
        columns={COLUMNS}
        columnOrder={columnOrder}
        visibleColumns={visibleColumns}
        sortRules={sortRules}
        setFilter={setFilter}
        clearFilters={clearFilters}
        setVisibleColumns={setVisibleColumns}
        draggedColumn={draggedColumn}
        setDraggedColumn={setDraggedColumn}
        setColumnOrder={setColumnOrder}
        setSortRules={setSortRules}
      />

      <div className="pg-scroll" style={{ flex: 1, overflow: 'auto', border: '1px solid var(--pg-border)', borderRadius: 12, background: 'var(--pg-surface)' }}>
        <div style={{ minWidth: 44 + 260 + columns.reduce((sum, c) => sum + columnWidths[c.key], 0) + 52 }}>
          <div style={{ position: 'sticky', top: 0, zIndex: 10, display: 'grid', gridTemplateColumns: grid, background: 'var(--pg-bg-2)', borderBottom: '1px solid var(--pg-border)' }}>
            <HeaderCell sticky left={0} pad={densityValue.header}><input ref={headerCheckboxRef} type="checkbox" checked={allVisibleSelected} onChange={(e) => selectVisible(e.target.checked)} style={{ accentColor: 'var(--pg-accent)' }} /></HeaderCell>
            <HeaderCell sticky left={44} pad={densityValue.header}><SortHeader label="Client" sortKey="client" sortRules={sortRules} onSort={updateSort} /></HeaderCell>
            {columns.map((column) => <HeaderCell key={column.key} align={column.numeric ? 'right' : 'left'} pad={densityValue.header}>
              <SortHeader label={column.label} sortKey={column.sortKey} sortRules={sortRules} onSort={updateSort} />
              <button type="button" aria-label={`Resize ${column.label}`} onPointerDown={(e) => setResizing({ key: column.key, startX: e.clientX, startWidth: columnWidths[column.key] })} style={{ position: 'absolute', right: -3, top: 0, bottom: 0, width: 7, border: 'none', background: resizing?.key === column.key ? 'var(--pg-blue)' : 'transparent', cursor: 'col-resize' }} />
            </HeaderCell>)}
            <HeaderCell stickyRight pad={densityValue.header} />
          </div>

          {paged.rows.length === 0 ? <EmptyState clearFilters={clearFilters} /> : paged.rows.map((row) => {
            const selected = selectedIds.has(row.id);
            const rowBg = selected ? 'var(--pg-blue-tint)' : 'var(--pg-surface)';
            return (
              <div key={row.id} className="pg-row" onContextMenu={(e) => { e.preventDefault(); setContextMenu({ rowId: row.id, x: e.clientX, y: e.clientY }); }} style={{ display: 'grid', gridTemplateColumns: grid, background: rowBg, borderBottom: '1px solid var(--pg-border)', fontSize: densityValue.text }}>
                <Cell sticky left={0} selected={selected} pad={densityValue.row}><input type="checkbox" checked={selected} onChange={(e) => setSelectedIds((current) => { const next = new Set(current); if (e.target.checked) next.add(row.id); else next.delete(row.id); return next; })} style={{ accentColor: 'var(--pg-accent)' }} /></Cell>
                <Cell sticky left={44} selected={selected} pad={densityValue.row}>
                  <Link href={briefHref(row)} style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0, color: 'inherit', textDecoration: 'none' }}>
                    <div className="pg-avatar pg-avatar-sm">{initials(row.clientName)}</div>
                    <div style={{ minWidth: 0 }}>
                      <div className="pg-truncate" style={{ fontWeight: 650 }}>{row.clientName}</div>
                      <CopyCell id={`${row.id}-email`} value={row.email ?? 'No email'} copied={copied} onCopy={copyValue} subdued />
                    </div>
                  </Link>
                </Cell>
                {columns.map((column) => <Cell key={column.key} selected={selected} pad={densityValue.row} align={column.numeric ? 'right' : 'left'}>{renderCell(row, column)}</Cell>)}
                <Cell stickyRight selected={selected} pad={densityValue.row}>
                  <RowActions row={row} open={openMenuId === row.id} setOpen={() => setOpenMenuId(openMenuId === row.id ? null : row.id)} exportRow={() => exportRows([row])} />
                </Cell>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, fontSize: 12, color: 'var(--pg-text-dim)' }}>
        <span>Rows per page</span>
        <select className="pg-input" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} style={{ width: 78, fontSize: 12 }}><option>10</option><option>15</option><option>25</option><option>50</option></select>
        <span>{paged.from}-{paged.to} of {sortedRows.length}</span>
        <div style={{ flex: 1 }} />
        <button className="pg-btn pg-btn-sm" disabled={paged.page <= 1} onClick={() => setPage(1)}>First</button>
        <button className="pg-btn pg-btn-sm" disabled={paged.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <span className="pg-mono">{paged.page} / {paged.totalPages}</span>
        <button className="pg-btn pg-btn-sm" disabled={paged.page >= paged.totalPages} onClick={() => setPage((p) => Math.min(paged.totalPages, p + 1))}>Next</button>
        <button className="pg-btn pg-btn-sm" disabled={paged.page >= paged.totalPages} onClick={() => setPage(paged.totalPages)}>Last</button>
      </div>

      {selectedIds.size > 0 && <BulkBar count={selectedIds.size} clear={() => setSelectedIds(new Set())} exportSelected={() => exportRows(sortedRows.filter((row) => selectedIds.has(row.id)))} />}
      {contextMenu && <ContextMenu row={sortedRows.find((row) => row.id === contextMenu.rowId)} x={contextMenu.x} y={contextMenu.y} close={() => setContextMenu(null)} />}
    </div>
  );
}

function Panel({ children, width = 260 }: { children: React.ReactNode; width?: number }) {
  return <div className="pg-card" style={{ position: 'absolute', zIndex: 40, top: 38, left: 0, width, padding: 10, boxShadow: '0 18px 50px rgba(20,18,12,0.12)' }}>{children}</div>;
}

function ToolbarButton({ panel, label, icon, openPanel, setOpenPanel }: { panel: 'filter' | 'sort' | 'columns'; label: string; icon: 'filter' | 'arrow-up' | 'grid'; openPanel: string | null; setOpenPanel: (v: 'filter' | 'sort' | 'columns' | null) => void }) {
  return <button className="pg-btn" type="button" onClick={() => setOpenPanel(openPanel === panel ? null : panel)}><Icon name={icon} size={13} />{label}<Icon name="chevron-down" size={11} color="var(--pg-text-faint)" /></button>;
}

function HeaderCell({ children, sticky, stickyRight, left = 0, pad, align = 'left' }: { children?: React.ReactNode; sticky?: boolean; stickyRight?: boolean; left?: number; pad: number; align?: 'left' | 'right' }) {
  return <div style={{ ...(sticky ? pinnedLeftStyle(left) : stickyRight ? pinnedRightStyle() : {}), position: sticky || stickyRight ? 'sticky' : 'relative', padding: `${pad}px 12px`, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: align === 'right' ? 'flex-end' : 'flex-start', gap: 6, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--pg-text-faint)', textTransform: 'uppercase', borderRight: '1px solid var(--pg-border)' }}>{children}</div>;
}

function Cell({ children, sticky, stickyRight, left = 0, selected, pad, align = 'left' }: { children: React.ReactNode; sticky?: boolean; stickyRight?: boolean; left?: number; selected: boolean; pad: number; align?: 'left' | 'right' }) {
  return <div tabIndex={0} style={{ ...(sticky ? pinnedLeftStyle(left) : stickyRight ? pinnedRightStyle() : {}), background: selected ? 'var(--pg-blue-tint)' : 'inherit', padding: `${pad}px 12px`, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: align === 'right' ? 'flex-end' : 'flex-start', borderRight: '1px solid var(--pg-border)', outlineOffset: -2, fontVariantNumeric: align === 'right' ? 'tabular-nums' : undefined }}>{children}</div>;
}

function SortHeader({ label, sortKey, sortRules, onSort }: { label: string; sortKey: SortKey; sortRules: SortState[]; onSort: (key: SortKey, additive: boolean) => void }) {
  const index = sortRules.findIndex((rule) => rule.key === sortKey);
  const rule = index >= 0 ? sortRules[index] : null;
  return <button type="button" onClick={(e) => onSort(sortKey, e.shiftKey)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', color: rule ? 'var(--pg-text)' : 'inherit', font: 'inherit', textTransform: 'inherit', letterSpacing: 'inherit' }}>{label}<SortGlyph direction={rule?.direction} priority={rule ? index + 1 : undefined} /></button>;
}

function EditableCell({ children, numeric }: { children: React.ReactNode; numeric?: boolean }) {
  return <span className="pg-truncate" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: numeric ? 'flex-end' : 'flex-start', width: '100%', fontFamily: numeric ? 'var(--pg-font-mono)' : undefined, fontVariantNumeric: numeric ? 'tabular-nums' : undefined }}>{children}<Icon name="pen" size={10} color="var(--pg-text-very-faint)" /></span>;
}

function CopyCell({ id, value, copied, onCopy, subdued }: { id: string; value: string; copied: string | null; onCopy: (id: string, value: string) => void; subdued?: boolean }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 0, color: subdued ? 'var(--pg-text-dim)' : undefined }}><span className="pg-truncate">{value}</span><button type="button" className="pg-btn pg-btn-icon pg-btn-sm" onClick={(e) => { e.preventDefault(); onCopy(id, value); }} title="Copy" style={{ width: 20, height: 20, opacity: 0.75 }}>{copied === id ? <Icon name="check" size={10} /> : <Icon name="file" size={10} />}</button></span>;
}

function RowActions({ row, open, setOpen, exportRow }: { row: BriefTableRow; open: boolean; setOpen: () => void; exportRow: () => void }) {
  return <div style={{ position: 'relative' }}><button type="button" className="pg-btn pg-btn-icon pg-btn-sm" onClick={setOpen}><Icon name="more" size={13} /></button>{open && <div className="pg-card" style={{ position: 'absolute', right: 0, top: 28, zIndex: 50, width: 170, padding: 6, boxShadow: '0 18px 50px rgba(20,18,12,0.12)' }}><Link href={briefHref(row, '?tab=profile')} className="pg-btn pg-btn-sm pg-btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', textDecoration: 'none' }}>Edit</Link><button className="pg-btn pg-btn-sm pg-btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }}>Duplicate</button><button className="pg-btn pg-btn-sm pg-btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }}>Reassign</button><button className="pg-btn pg-btn-sm pg-btn-ghost" onClick={exportRow} style={{ width: '100%', justifyContent: 'flex-start' }}>Export row</button><button className="pg-btn pg-btn-sm pg-btn-ghost" disabled style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--pg-red)', cursor: 'not-allowed' }}>Delete</button></div>}</div>;
}

function BulkBar({ count, clear, exportSelected }: { count: number; clear: () => void; exportSelected: () => void }) {
  return <div style={{ position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 80, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12, background: '#111827', color: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.24)' }}><strong>{count} selected</strong><button className="pg-btn pg-btn-sm" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.18)' }}>Update Status</button><button className="pg-btn pg-btn-sm" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.18)' }}>Assign Agent</button><button className="pg-btn pg-btn-sm" onClick={exportSelected} style={{ color: 'white', borderColor: 'rgba(255,255,255,0.18)' }}>Export Selected</button><button className="pg-btn pg-btn-sm" style={{ color: '#fecaca', borderColor: 'rgba(255,255,255,0.18)' }}>Delete</button><button className="pg-btn pg-btn-sm" onClick={clear} style={{ color: 'white', borderColor: 'rgba(255,255,255,0.18)' }}>Clear</button></div>;
}

function ContextMenu({ row, x, y, close }: { row?: BriefTableRow; x: number; y: number; close: () => void }) {
  if (!row) return null;
  return <div className="pg-card" style={{ position: 'fixed', left: x, top: y, zIndex: 90, width: 180, padding: 6, boxShadow: '0 18px 50px rgba(20,18,12,0.16)' }} onClick={close}><Link href={briefHref(row, '?tab=profile')} className="pg-btn pg-btn-sm pg-btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', textDecoration: 'none' }}>Edit</Link><button className="pg-btn pg-btn-sm pg-btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }}>Duplicate</button><button className="pg-btn pg-btn-sm pg-btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }}>Reassign</button><button className="pg-btn pg-btn-sm pg-btn-ghost" disabled style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--pg-red)' }}>Delete</button></div>;
}

function EmptyState({ clearFilters }: { clearFilters: () => void }) {
  return <div style={{ padding: 56, textAlign: 'center', color: 'var(--pg-text-dim)' }}><Icon name="users" size={34} color="var(--pg-text-very-faint)" /><div style={{ marginTop: 12, fontWeight: 600 }}>No clients match this view.</div><div style={{ marginTop: 4, fontSize: 12 }}>Skeleton loaders can occupy the same grid rows while data is loading.</div><button className="pg-btn pg-btn-sm" type="button" onClick={clearFilters} style={{ marginTop: 14 }}>Clear filters</button></div>;
}

function PopoverPanels(props: {
  openPanel: 'views' | 'filter' | 'columns' | 'sort' | null;
  statuses: string[];
  status: string;
  propertyTypes: string[];
  propertyType: string;
  suburbs: string[];
  suburb: string;
  columns: ColumnDef[];
  columnOrder: ColumnKey[];
  visibleColumns: Record<ColumnKey, boolean>;
  sortRules: SortState[];
  setFilter: (next: Partial<{ status: string; propertyType: string; suburb: string }>) => void;
  clearFilters: () => void;
  setVisibleColumns: React.Dispatch<React.SetStateAction<Record<ColumnKey, boolean>>>;
  draggedColumn: ColumnKey | null;
  setDraggedColumn: (key: ColumnKey | null) => void;
  setColumnOrder: React.Dispatch<React.SetStateAction<ColumnKey[]>>;
  setSortRules: React.Dispatch<React.SetStateAction<SortState[]>>;
}) {
  if (props.openPanel === 'filter') return <FloatingPanel right={126}><Select label="Status" value={props.status} values={props.statuses} all="All statuses" onChange={(status) => props.setFilter({ status })} /><Select label="Type" value={props.propertyType} values={props.propertyTypes} all="All types" onChange={(propertyType) => props.setFilter({ propertyType })} /><Select label="Suburbs contains" value={props.suburb} values={props.suburbs} all="Any suburb" onChange={(suburb) => props.setFilter({ suburb })} /><button className="pg-btn pg-btn-sm" onClick={props.clearFilters}>Clear filters</button></FloatingPanel>;
  if (props.openPanel === 'sort') return <FloatingPanel right={86}>{(['client', 'budget', 'status', 'created'] as SortKey[]).map((key) => <button key={key} className="pg-btn pg-btn-sm" onClick={() => props.setSortRules((rules) => [...rules.filter((rule) => rule.key !== key), { key, direction: 'asc' }].slice(0, 3))}>{key}</button>)}</FloatingPanel>;
  if (props.openPanel === 'columns') return <FloatingPanel right={0} width={310}>{props.columnOrder.map((key) => { const column = props.columns.find((c) => c.key === key)!; return <label key={key} draggable onDragStart={() => props.setDraggedColumn(key)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (props.draggedColumn) props.setColumnOrder((order) => reorderColumnKeys(order, props.draggedColumn!, key)); props.setDraggedColumn(null); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', cursor: 'grab' }}><Icon name="grid" size={12} color="var(--pg-text-faint)" /><input type="checkbox" checked={props.visibleColumns[key]} onChange={(e) => props.setVisibleColumns((current) => ({ ...current, [key]: e.target.checked }))} style={{ accentColor: 'var(--pg-accent)' }} />{column.label}<span style={{ marginLeft: 'auto', color: 'var(--pg-text-faint)', fontSize: 11 }}>drag</span></label>; })}</FloatingPanel>;
  return null;
}

function FloatingPanel({ children, right, width = 260 }: { children: React.ReactNode; right: number; width?: number }) {
  return <div className="pg-card" style={{ position: 'absolute', right, top: 92, zIndex: 60, width, padding: 12, display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 18px 50px rgba(20,18,12,0.12)' }}>{children}</div>;
}

function Select({ label, value, values, all, onChange }: { label: string; value: string; values: string[]; all: string; onChange: (value: string) => void }) {
  return <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: 'var(--pg-text-dim)' }}>{label}<select className="pg-input" value={value} onChange={(e) => onChange(e.target.value)}><option value="all">{all}</option>{values.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>;
}
