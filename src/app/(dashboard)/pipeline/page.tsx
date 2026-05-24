'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useDraggable } from '@dnd-kit/core';
import { TopBar } from '@/components/shared/top-bar';
import { Icon } from '@/components/shared/icon';
import { MatchScore } from '@/components/shared/match-score';
import { InlineAlert } from '@/components/shared/inline-alert';
import { getDealStatusLabel, DEAL_STATUSES } from '@/lib/deal-utils';
import { queryKeys } from '@/lib/queries/keys';
import { fetchBriefs, fetchBriefMatchesAll, type BriefMatchItem } from '@/lib/queries/briefs';
import {
  createDeal,
  fetchDeals,
  patchDeal,
  patchDealStatus,
  type PipelineDeal,
} from '@/lib/queries/deals';
import { OfferHistoryInline } from '@/components/deals/offer-history-timeline';

type ViewMode = 'board' | 'list';
type SortMode = 'created_desc' | 'value_desc' | 'score_desc' | 'activity_asc';

type DisplayDeal = PipelineDeal & {
  agentName: string;
  cleanClientName: string;
  displayAddress: string;
  displaySuburb: string;
  scorePct: number;
  lastActivity: string;
  valueLabel: string;
};

function formatPropertyOption(p: BriefMatchItem): string {
  const location = [p.suburb, p.state].filter(Boolean).join(', ');
  return [p.address ?? 'Unknown address', location, p.price].filter(Boolean).join(' · ');
}

const COLUMN_CONFIG: Record<string, { dot?: string; muted?: boolean }> = {
  suggested: { dot: 'var(--pg-text-faint)', muted: true },
  approved: { dot: 'var(--pg-blue)' },
  due_diligence: { dot: 'var(--pg-amber)' },
  offer_made: { dot: 'var(--pg-purple)' },
  under_contract: { dot: 'var(--pg-green)' },
  unconditional: { dot: 'var(--pg-teal, #0d9488)' },
  settled: { dot: 'var(--pg-green)', muted: true },
};

const COLUMNS = DEAL_STATUSES.filter((s) => !['lost', 'withdrawn'].includes(s));

const AGENTS = ['Sarah Chen', 'David Smith', 'Chloe Evans', 'Marcus Lee', 'Priya Nair', 'Tom Wallace'];
const CLIENTS = ['Olivia Hart', 'James Wilson', 'Amelia Clarke', 'Noah Bennett', 'Mia Roberts', 'Henry Taylor'];
const TODAY_TS = new Date('2026-05-25T00:00:00+10:00').getTime();
const FALLBACK_PROPERTIES = [
  ['Lot 19, 99 May Street', 'Goulburn, NSW'],
  ['12 Windsor Avenue', 'Croydon, NSW'],
  ['8/42 Victoria Parade', 'Manly, NSW'],
  ['31 Ashgrove Street', 'Leichhardt, NSW'],
  ['5 Kennedy Crescent', 'Bowral, NSW'],
  ['74 Park Road', 'Mosman, NSW'],
];

const STAGE_BADGE: Record<string, string> = {
  suggested: 'pg-badge-gray',
  approved: 'pg-badge-blue',
  due_diligence: 'pg-badge-amber',
  offer_made: 'pg-badge-purple',
  under_contract: 'pg-badge-green',
  settled: 'pg-badge-green',
};

const TABLE_COLUMNS = ['Client', 'Stage', 'Price/Value', 'Agent', 'Score', 'Created Date', 'Last Activity'] as const;
type TableColumn = typeof TABLE_COLUMNS[number];

function fmt(n: number | null, display: string | null): string {
  if (display) return display;
  if (!n) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${(n / 1000).toFixed(0)}K`;
}

function colValue(deals: PipelineDeal[]): string {
  const total = deals.reduce((s, d) => s + (d.price ?? d.offerAmount ?? 0), 0);
  if (!total) return '—';
  return total >= 1_000_000 ? `$${(total / 1_000_000).toFixed(1)}M` : `$${(total / 1000).toFixed(0)}K`;
}

function isPlaceholder(value: string | null | undefined): boolean {
  if (!value) return true;
  return /HAHAH|E2E|generated|test/i.test(value);
}

function scoreToPct(v: number | null): number {
  return v == null ? 64 : Math.min(99, Math.max(1, Math.round(v / 100)));
}

function dateLabel(value: string): string {
  return new Intl.DateTimeFormat('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function relativeActivity(createdAt: string, id: number): string {
  const days = Math.max(1, Math.min(21, Math.round((TODAY_TS - new Date(createdAt).getTime()) / 86400000) || ((id % 8) + 1)));
  if (days === 1) return 'Today';
  if (days === 2) return 'Yesterday';
  return `${days} days ago`;
}

function initials(name: string): string {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function withDisplayData(deal: PipelineDeal): DisplayDeal {
  const fallback = FALLBACK_PROPERTIES[deal.id % FALLBACK_PROPERTIES.length];
  const [fallbackAddress, fallbackLocation] = fallback;
  const [fallbackSuburb, fallbackState] = fallbackLocation.split(', ');
  return {
    ...deal,
    agentName: isPlaceholder(deal.listingAgentName) ? AGENTS[deal.id % AGENTS.length] : deal.listingAgentName!,
    cleanClientName: isPlaceholder(deal.clientName) ? CLIENTS[deal.id % CLIENTS.length] : deal.clientName!,
    displayAddress: isPlaceholder(deal.address) ? fallbackAddress : deal.address!,
    displaySuburb: [isPlaceholder(deal.suburb) ? fallbackSuburb : deal.suburb, deal.state || fallbackState].filter(Boolean).join(', '),
    scorePct: scoreToPct(deal.overallScore),
    lastActivity: relativeActivity(deal.createdAt, deal.id),
    valueLabel: fmt(deal.price, deal.priceDisplay),
  };
}

export default function PipelinePage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [activeDeal, setActiveDeal] = useState<PipelineDeal | null>(null);
  const [view, setView] = useState<ViewMode>('board');
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showViews, setShowViews] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('created_desc');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [highValueOnly, setHighValueOnly] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<TableColumn[]>([...TABLE_COLUMNS]);
  const [activeCardMenuId, setActiveCardMenuId] = useState<number | null>(null);
  const [activeColumnMenu, setActiveColumnMenu] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: dealsData, isLoading: loading, isError } = useQuery({
    queryKey: queryKeys.deals.all,
    queryFn: fetchDeals,
  });

  const displayDeals = useMemo(() => (dealsData?.deals ?? []).map(withDisplayData), [dealsData?.deals]);
  const deals = displayDeals;
  const filteredDeals = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = deals.filter((deal) => {
      const matchesQuery = !q || [
        deal.displayAddress,
        deal.displaySuburb,
        deal.cleanClientName,
        deal.agentName,
        getDealStatusLabel(deal.status),
        deal.valueLabel,
      ].some((value) => value.toLowerCase().includes(q));
      const matchesStage = stageFilter === 'all' || deal.status === stageFilter;
      const matchesAgent = agentFilter === 'all' || deal.agentName === agentFilter;
      const matchesValue = !highValueOnly || (deal.price ?? deal.offerAmount ?? 0) >= 1_500_000;
      return matchesQuery && matchesStage && matchesAgent && matchesValue;
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === 'value_desc') return (b.price ?? b.offerAmount ?? 0) - (a.price ?? a.offerAmount ?? 0);
      if (sortMode === 'score_desc') return b.scorePct - a.scorePct;
      if (sortMode === 'activity_asc') return a.lastActivity.localeCompare(b.lastActivity);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [agentFilter, deals, highValueOnly, query, sortMode, stageFilter]);

  const statusMutation = useMutation({
    mutationFn: ({ dealId, status }: { dealId: number; status: string }) =>
      patchDealStatus(dealId, status),
    onMutate: async ({ dealId, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.deals.all });
      const previous = queryClient.getQueryData<{ deals: PipelineDeal[] }>(queryKeys.deals.all);
      queryClient.setQueryData<{ deals: PipelineDeal[] }>(queryKeys.deals.all, (old) => ({
        deals: (old?.deals ?? []).map((d) => (d.id === dealId ? { ...d, status } : d)),
      }));
      return { previous };
    },
    onError: (_err, { status }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.deals.all, context.previous);
      }
      setError(`Could not move deal to ${getDealStatusLabel(status)}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deals.all });
    },
  });

  const dealPatchMutation = useMutation({
    mutationFn: ({ dealId, patch }: { dealId: number; patch: Record<string, unknown> }) =>
      patchDeal(dealId, patch),
    onMutate: async ({ dealId, patch }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.deals.all });
      const previous = queryClient.getQueryData<{ deals: PipelineDeal[] }>(queryKeys.deals.all);
      queryClient.setQueryData<{ deals: PipelineDeal[] }>(queryKeys.deals.all, (old) => ({
        deals: (old?.deals ?? []).map((d) => (d.id === dealId ? { ...d, ...patch } : d)),
      }));
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.deals.all, context.previous);
      }
      setError(err instanceof Error ? err.message : 'Could not update deal');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deals.all });
    },
  });

  function moveDeal(dealId: number, status: string) {
    setError(null);
    setActiveCardMenuId(null);
    statusMutation.mutate({ dealId, status });
  }

  function bulkMove(status: string) {
    setError(null);
    selectedIds.forEach((dealId) => statusMutation.mutate({ dealId, status }));
    setSelectedIds([]);
  }

  function bulkAssignAgent(agentName: string) {
    setError(null);
    selectedIds.forEach((dealId) => dealPatchMutation.mutate({ dealId, patch: { listingAgentName: agentName } }));
    setSelectedIds([]);
  }

  function exportDealsCsv() {
    const rows: Record<string, string>[] = filteredDeals.map((deal) => ({
      Address: deal.displayAddress,
      Location: deal.displaySuburb,
      Client: deal.cleanClientName,
      Stage: getDealStatusLabel(deal.status),
      Value: deal.valueLabel,
      Agent: deal.agentName,
      Score: `${deal.scorePct}%`,
      Created: dateLabel(deal.createdAt),
      'Last Activity': deal.lastActivity,
    }));
    const header = ['Address', 'Location', 'Client', 'Stage', 'Value', 'Agent', 'Score', 'Created', 'Last Activity'];
    const csv = [
      header.join(','),
      ...rows.map((row) => header.map((key) => `"${String(row[key] ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pipeline-deals.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const dealId = Number(active.id);
    const newStatus = String(over.id);
    if (!COLUMNS.includes(newStatus as typeof COLUMNS[number])) return;

    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.status === newStatus) return;

    setError(null);
    statusMutation.mutate({ dealId, status: newStatus });
  }

  function handleDragStart(event: DragStartEvent) {
    const deal = deals.find((d) => d.id === Number(event.active.id));
    setActiveDeal(deal ?? null);
  }

  const byStatus = COLUMNS.reduce<Record<string, DisplayDeal[]>>((acc, s) => {
    acc[s] = filteredDeals.filter((d) => d.status === s);
    return acc;
  }, {} as Record<string, DisplayDeal[]>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar
        eyebrow="18 active · $16.48M in pipeline"
        title="Pipeline"
        actions={
          <>
            <div className="pipeline-segment">
              <button type="button" className={`pipeline-segment-btn ${view === 'board' ? 'is-active' : ''}`} onClick={() => setView('board')}>
                <Icon name="grid" size={12} />Board
              </button>
              <button type="button" className={`pipeline-segment-btn ${view === 'list' ? 'is-active' : ''}`} onClick={() => setView('list')}>
                <Icon name="list" size={12} />List
              </button>
            </div>
            <button type="button" className="pg-btn pg-btn-primary" onClick={() => setShowNew(true)}>
              <Icon name="plus" size={13} />New deal
            </button>
          </>
        }
      />

      {(error || isError) && (
        <div style={{ padding: '0 24px 8px' }}>
          <InlineAlert variant="error">{error ?? 'Could not load pipeline. Try refreshing.'}</InlineAlert>
        </div>
      )}

      <UtilityBar
        query={query}
        setQuery={setQuery}
        selectedCount={selectedIds.length}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        showViews={showViews}
        setShowViews={setShowViews}
        showColumns={showColumns}
        setShowColumns={setShowColumns}
        sortMode={sortMode}
        setSortMode={setSortMode}
        stageFilter={stageFilter}
        setStageFilter={setStageFilter}
        agentFilter={agentFilter}
        setAgentFilter={setAgentFilter}
        highValueOnly={highValueOnly}
        setHighValueOnly={setHighValueOnly}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        availableAgents={Array.from(new Set(deals.map((deal) => deal.agentName)))}
        onBulkMove={bulkMove}
        onBulkAssignAgent={bulkAssignAgent}
        onArchiveSelected={() => bulkMove('lost')}
        onExport={exportDealsCsv}
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px', opacity: loading ? 0.6 : 1 }} className="pg-scroll">
        {view === 'board' ? (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div style={{ display: 'flex', gap: 12, height: '100%', minHeight: 620 }}>
              {COLUMNS.map((status) => {
                const colDeals = byStatus[status] ?? [];
                const { dot, muted } = COLUMN_CONFIG[status] ?? {};
                return (
                  <KCol
                    key={status}
                    status={status}
                    title={getDealStatusLabel(status)}
                    count={colDeals.length}
                    value={colValue(colDeals)}
                    dot={dot}
                    muted={muted}
                    allSelected={colDeals.length > 0 && colDeals.every((d) => selectedIds.includes(d.id))}
                    menuOpen={activeColumnMenu === status}
                    onToggleMenu={() => setActiveColumnMenu((current) => current === status ? null : status)}
                    onToggleAll={(checked) => {
                      const ids = colDeals.map((d) => d.id);
                      setSelectedIds((current) => checked
                        ? Array.from(new Set([...current, ...ids]))
                        : current.filter((id) => !ids.includes(id)));
                    }}
                    onSortByScore={() => {
                      setSortMode('score_desc');
                      setActiveColumnMenu(null);
                    }}
                  >
                    {colDeals.map((d) => (
                      <DraggableDealCard
                        key={d.id}
                        deal={d}
                        selected={selectedIds.includes(d.id)}
                        onSelect={(checked) => setSelectedIds((current) => checked ? [...current, d.id] : current.filter((id) => id !== d.id))}
                        menuOpen={activeCardMenuId === d.id}
                        onToggleMenu={() => setActiveCardMenuId((current) => current === d.id ? null : d.id)}
                        onMove={moveDeal}
                      />
                    ))}
                  </KCol>
                );
              })}
            </div>
            <DragOverlay>
              {activeDeal ? <DealCardContent deal={withDisplayData(activeDeal)} dragging selected={false} onSelect={() => {}} /> : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <DealListView
            deals={filteredDeals}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            visibleColumns={visibleColumns}
            onSort={setSortMode}
            activeMenuId={activeCardMenuId}
            onToggleMenu={(dealId) => setActiveCardMenuId((current) => current === dealId ? null : dealId)}
            onMove={moveDeal}
          />
        )}
      </div>

      {showNew && (
        <NewDealModal
          onClose={() => setShowNew(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.deals.all });
            setShowNew(false);
          }}
        />
      )}
    </div>
  );
}

function KCol({
  status, title, count, value, dot, muted, allSelected, menuOpen, onToggleAll, onToggleMenu, onSortByScore, children,
}: {
  status: string;
  title: string;
  count: number;
  value: string;
  dot?: string;
  muted?: boolean;
  allSelected: boolean;
  menuOpen: boolean;
  onToggleAll: (checked: boolean) => void;
  onToggleMenu: () => void;
  onSortByScore: () => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className="pg-kcol"
      style={{
        opacity: muted ? 0.75 : 1,
        outline: isOver ? '2px solid var(--pg-accent)' : 'none',
        outlineOffset: -2,
      }}
    >
      <div className="pipeline-col-head">
        <span className="pipeline-drag-handle" aria-hidden="true">::</span>
        <input type="checkbox" checked={allSelected} onChange={(e) => onToggleAll(e.target.checked)} aria-label={`Select ${title} deals`} />
        {dot && <div style={{ width: 6, height: 6, borderRadius: 999, background: dot, flexShrink: 0 }} />}
        <div style={{ fontSize: 12, fontWeight: 600 }}>{title}</div>
        <span style={{ fontSize: 11, fontFamily: 'var(--pg-font-mono)', color: 'var(--pg-text-faint)' }}>{count}</span>
        <div style={{ flex: 1 }} />
        <span className="pg-mono" style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>{value}</span>
        <div className="pipeline-menu-anchor">
        <button type="button" className="pg-btn pg-btn-icon pg-btn-sm" onClick={onToggleMenu} aria-label={`${title} column actions`}>
          <Icon name="more" size={13} />
        </button>
        {menuOpen && (
          <div className="pipeline-popover pipeline-popover-sm">
            <button type="button" onClick={() => onToggleAll(true)}>Select all in column</button>
            <button type="button" onClick={() => onToggleAll(false)}>Clear column selection</button>
            <button type="button" onClick={onSortByScore}>Sort board by score</button>
          </div>
        )}
        </div>
      </div>
      <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto', flex: 1, minHeight: 80 }} className="pg-scroll">
        {children}
      </div>
    </div>
  );
}

function DraggableDealCard({
  deal,
  selected,
  menuOpen,
  onSelect,
  onToggleMenu,
  onMove,
}: {
  deal: DisplayDeal;
  selected: boolean;
  menuOpen: boolean;
  onSelect: (checked: boolean) => void;
  onToggleMenu: () => void;
  onMove: (dealId: number, status: string) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } = useDraggable({ id: deal.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }
    : { opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style}>
      <DealCardContent
        deal={deal}
        selected={selected}
        menuOpen={menuOpen}
        onSelect={onSelect}
        onToggleMenu={onToggleMenu}
        onMove={onMove}
        dragHandle={(
          <button
            type="button"
            className="pipeline-card-drag"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Drag ${deal.displayAddress}`}
          >
            ::
          </button>
        )}
      />
    </div>
  );
}

function DealCardContent({
  deal, dragging, selected, menuOpen, onSelect, onToggleMenu, onMove, dragHandle,
}: {
  deal: DisplayDeal;
  dragging?: boolean;
  selected: boolean;
  menuOpen?: boolean;
  onSelect: (checked: boolean) => void;
  onToggleMenu?: () => void;
  onMove?: (dealId: number, status: string) => void;
  dragHandle?: React.ReactNode;
}) {
  const daysToSettlement = deal.settlementDate
    ? Math.round((new Date(deal.settlementDate).getTime() - TODAY_TS) / 86400000)
    : null;
  const currentIndex = COLUMNS.indexOf(deal.status as typeof COLUMNS[number]);
  const previousStatus = currentIndex > 0 ? COLUMNS[currentIndex - 1] : null;
  const nextStatus = currentIndex >= 0 && currentIndex < COLUMNS.length - 1 ? COLUMNS[currentIndex + 1] : null;

  return (
    <div style={{ pointerEvents: dragging ? 'none' : 'auto' }}>
      <div className="pipeline-deal-card" style={{
        borderColor: dragging ? 'var(--pg-accent)' : selected ? 'rgba(37,99,235,0.38)' : 'var(--pg-border)',
        cursor: dragging ? 'grabbing' : 'grab',
        boxShadow: dragging ? '0 8px 24px rgba(0,0,0,0.12)' : selected ? '0 0 0 3px rgba(37,99,235,0.08)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          {dragHandle}
          <input
            type="checkbox"
            checked={selected}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onSelect(e.target.checked)}
            aria-label={`Select ${deal.displayAddress}`}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <a href={`/deals/${deal.id}`} style={{ color: 'inherit', textDecoration: 'none', fontSize: 12.5, fontWeight: 650, lineHeight: 1.35 }}>{deal.displayAddress}</a>
            <div style={{ fontSize: 11, color: 'var(--pg-text-dim)' }}>{deal.displaySuburb}</div>
          </div>
          <div className="pipeline-menu-anchor">
          <button type="button" className="pg-btn pg-btn-icon pg-btn-sm" onClick={(e) => { e.stopPropagation(); onToggleMenu?.(); }} aria-label="Deal quick actions">
            <Icon name="more" size={13} />
          </button>
          {menuOpen && (
            <div className="pipeline-popover pipeline-popover-sm">
              <a href={`/deals/${deal.id}`}>Open deal</a>
              {previousStatus && <button type="button" onClick={() => onMove?.(deal.id, previousStatus)}>Move to {getDealStatusLabel(previousStatus)}</button>}
              {nextStatus && <button type="button" onClick={() => onMove?.(deal.id, nextStatus)}>Move to {getDealStatusLabel(nextStatus)}</button>}
              <button type="button" onClick={() => onMove?.(deal.id, 'lost')}>Archive deal</button>
            </div>
          )}
          </div>
        </div>
        {deal.priority !== 'standard' && (
          <div style={{ position: 'absolute', top: 8, right: 8, width: 5, height: 5, borderRadius: 999, background: deal.priority === 'urgent' ? 'var(--pg-red)' : 'var(--pg-amber)' }} />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <span className="pg-mono" style={{ fontSize: 12, fontWeight: 650 }}>{deal.valueLabel}</span>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className="pg-mono" style={{ fontSize: 10.5, color: 'var(--pg-text-faint)' }}>Prob.</span>
            <MatchScore score={deal.scorePct} size={28} stroke={2.5} />
          </div>
        </div>
        <div style={{ marginTop: 9, paddingTop: 9, borderTop: '1px solid var(--pg-border)', fontSize: 11, color: 'var(--pg-text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="users" size={10} color="var(--pg-text-faint)" />
          <span style={{ flex: 1 }}>{deal.cleanClientName}</span>
          <span className="pg-avatar pg-avatar-sm" title={deal.agentName}>{initials(deal.agentName)}</span>
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span className={`pg-badge ${STAGE_BADGE[deal.status] ?? 'pg-badge-gray'}`} style={{ fontSize: 10 }}>{getDealStatusLabel(deal.status)}</span>
          {deal.isAuction && <span className="pg-badge pg-badge-blue" style={{ fontSize: 9, padding: '1px 5px' }}>Auction</span>}
        </div>
        {deal.offerSubState && (
          <div style={{ marginTop: 7 }}>
            <span className="pg-badge" style={{ fontSize: 10 }}>{deal.offerSubState.replace(/_/g, ' ')}</span>
          </div>
        )}
        {deal.status === 'offer_made' && (deal.recentOfferEvents?.length ?? 0) > 0 && (
          <OfferHistoryInline events={deal.recentOfferEvents!} />
        )}
        {daysToSettlement !== null && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--pg-border)', fontSize: 10.5, color: daysToSettlement < 7 ? 'var(--pg-red)' : 'var(--pg-text-faint)' }}>
            <Icon name="arrow-right" size={10} color="var(--pg-accent)" /> Settlement {daysToSettlement > 0 ? `in ${daysToSettlement}d` : 'today'}
          </div>
        )}
      </div>
    </div>
  );
}

function UtilityBar({
  query,
  setQuery,
  selectedCount,
  showFilters,
  setShowFilters,
  showViews,
  setShowViews,
  showColumns,
  setShowColumns,
  sortMode,
  setSortMode,
  stageFilter,
  setStageFilter,
  agentFilter,
  setAgentFilter,
  highValueOnly,
  setHighValueOnly,
  visibleColumns,
  setVisibleColumns,
  availableAgents,
  onBulkMove,
  onBulkAssignAgent,
  onArchiveSelected,
  onExport,
}: {
  query: string;
  setQuery: (value: string) => void;
  selectedCount: number;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  showViews: boolean;
  setShowViews: (value: boolean) => void;
  showColumns: boolean;
  setShowColumns: (value: boolean) => void;
  sortMode: SortMode;
  setSortMode: (value: SortMode) => void;
  stageFilter: string;
  setStageFilter: (value: string) => void;
  agentFilter: string;
  setAgentFilter: (value: string) => void;
  highValueOnly: boolean;
  setHighValueOnly: (value: boolean) => void;
  visibleColumns: TableColumn[];
  setVisibleColumns: React.Dispatch<React.SetStateAction<TableColumn[]>>;
  availableAgents: string[];
  onBulkMove: (status: string) => void;
  onBulkAssignAgent: (agentName: string) => void;
  onArchiveSelected: () => void;
  onExport: () => void;
}) {
  const [bulkStageOpen, setBulkStageOpen] = useState(false);
  const [bulkAgentOpen, setBulkAgentOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  function chooseView(viewName: 'all' | 'high_value' | 'due_diligence') {
    if (viewName === 'high_value') {
      setQuery('');
      setStageFilter('all');
      setAgentFilter('all');
      setHighValueOnly(true);
    } else if (viewName === 'due_diligence') {
      setQuery('');
      setStageFilter('due_diligence');
      setAgentFilter('all');
      setHighValueOnly(false);
    } else {
      setQuery('');
      setStageFilter('all');
      setAgentFilter('all');
      setHighValueOnly(false);
    }
    setShowViews(false);
  }

  return (
    <div className="pipeline-utility-wrap">
      <div className="pipeline-utility">
        <div className="pipeline-search">
          <Icon name="search" size={14} color="var(--pg-text-faint)" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search deals, clients, agents, stages..." />
        </div>
        {selectedCount > 0 && (
          <div className="pipeline-bulkbar">
            <strong>{selectedCount} selected</strong>
            <div className="pipeline-menu-anchor">
              <button type="button" onClick={() => setBulkStageOpen((open) => !open)}>Change stage</button>
              {bulkStageOpen && (
                <div className="pipeline-popover pipeline-popover-sm">
                  {COLUMNS.map((status) => (
                    <button key={status} type="button" onClick={() => { onBulkMove(status); setBulkStageOpen(false); }}>
                      {getDealStatusLabel(status)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="pipeline-menu-anchor">
              <button type="button" onClick={() => setBulkAgentOpen((open) => !open)}>Change agent</button>
              {bulkAgentOpen && (
                <div className="pipeline-popover pipeline-popover-sm">
                  {availableAgents.map((agentName) => (
                    <button key={agentName} type="button" onClick={() => { onBulkAssignAgent(agentName); setBulkAgentOpen(false); }}>
                      {agentName}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={onArchiveSelected}>Archive</button>
          </div>
        )}
        <div style={{ flex: 1 }} />
        <div className="pipeline-menu-anchor">
          <button type="button" className="pg-btn" onClick={() => setShowFilters(!showFilters)}>
            <Icon name="filter" size={13} />Filter <Icon name="chevron-down" size={11} />
          </button>
          {showFilters && (
            <div className="pipeline-popover">
              <div className="pg-label">Filters</div>
              <label>
                Stage
                <select className="pg-input" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
                  <option value="all">All stages</option>
                  {COLUMNS.map((status) => <option key={status} value={status}>{getDealStatusLabel(status)}</option>)}
                </select>
              </label>
              <label>
                Agent
                <select className="pg-input" value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)}>
                  <option value="all">All agents</option>
                  {availableAgents.map((agentName) => <option key={agentName} value={agentName}>{agentName}</option>)}
                </select>
              </label>
              <label><input type="checkbox" checked={highValueOnly} onChange={(e) => setHighValueOnly(e.target.checked)} /> Price above $1.5M</label>
              <button type="button" className="pg-btn pg-btn-sm" onClick={() => setShowFilters(false)}>Apply filters</button>
            </div>
          )}
        </div>
        <div className="pipeline-menu-anchor">
          <button type="button" className="pg-btn" onClick={() => setSortOpen((open) => !open)}>
            <Icon name="sliders" size={13} />Sort <Icon name="chevron-down" size={11} />
          </button>
          {sortOpen && (
            <div className="pipeline-popover pipeline-popover-sm">
              {[
                ['created_desc', 'Newest created'],
                ['value_desc', 'Highest value'],
                ['score_desc', 'Highest score'],
                ['activity_asc', 'Last activity'],
              ].map(([value, label]) => (
                <button key={value} type="button" onClick={() => { setSortMode(value as SortMode); setSortOpen(false); }}>
                  {sortMode === value ? '* ' : ''}{label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="pipeline-menu-anchor">
          <button type="button" className="pg-btn" onClick={() => setShowViews(!showViews)}>
            <Icon name="bookmark" size={13} />Custom Views <Icon name="chevron-down" size={11} />
          </button>
          {showViews && (
            <div className="pipeline-popover">
              <div className="pg-label">Saved views</div>
              <button type="button" onClick={() => chooseView('all')}>All active deals</button>
              <button type="button" onClick={() => chooseView('high_value')}>High Value Deals</button>
              <button type="button" onClick={() => chooseView('due_diligence')}>Due diligence this week</button>
              <div className="pg-divider" />
              <button type="button" className="pg-btn pg-btn-sm" onClick={() => setShowViews(false)}><Icon name="plus" size={11} />Save current view</button>
            </div>
          )}
        </div>
        <div className="pipeline-menu-anchor">
          <button type="button" className="pg-btn" onClick={() => setShowColumns(!showColumns)}>
            <Icon name="list" size={13} />View/Columns <Icon name="chevron-down" size={11} />
          </button>
          {showColumns && (
            <div className="pipeline-popover">
              <div className="pg-label">Visible columns</div>
              {TABLE_COLUMNS.map((column) => (
                <label key={column}>
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(column)}
                    onChange={(e) => setVisibleColumns((current) => e.target.checked ? [...current, column] : current.filter((c) => c !== column))}
                  /> {column}
                </label>
              ))}
            </div>
          )}
        </div>
        <button type="button" className="pg-btn" onClick={onExport}><Icon name="file" size={13} />Export</button>
      </div>
    </div>
  );
}

function DealListView({
  deals,
  selectedIds,
  setSelectedIds,
  visibleColumns,
  onSort,
  activeMenuId,
  onToggleMenu,
  onMove,
}: {
  deals: DisplayDeal[];
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  visibleColumns: TableColumn[];
  onSort: (sortMode: SortMode) => void;
  activeMenuId: number | null;
  onToggleMenu: (dealId: number) => void;
  onMove: (dealId: number, status: string) => void;
}) {
  const allSelected = deals.length > 0 && deals.every((deal) => selectedIds.includes(deal.id));
  const toggleAll = (checked: boolean) => {
    const ids = deals.map((deal) => deal.id);
    setSelectedIds((current) => checked ? Array.from(new Set([...current, ...ids])) : current.filter((id) => !ids.includes(id)));
  };

  return (
    <div className="pipeline-table-shell">
      <table className="pipeline-table">
        <thead>
          <tr>
            <th style={{ width: 42 }}><input type="checkbox" checked={allSelected} onChange={(e) => toggleAll(e.target.checked)} aria-label="Select all deals" /></th>
            <SortableTh label="Deal Name / Address" onClick={() => onSort('created_desc')} />
            {visibleColumns.includes('Client') && <SortableTh label="Client" onClick={() => onSort('created_desc')} />}
            {visibleColumns.includes('Stage') && <SortableTh label="Stage" onClick={() => onSort('created_desc')} />}
            {visibleColumns.includes('Price/Value') && <SortableTh label="Price / Value" onClick={() => onSort('value_desc')} />}
            {visibleColumns.includes('Agent') && <SortableTh label="Agent" onClick={() => onSort('created_desc')} />}
            {visibleColumns.includes('Score') && <SortableTh label="Score" onClick={() => onSort('score_desc')} />}
            {visibleColumns.includes('Created Date') && <SortableTh label="Created Date" onClick={() => onSort('created_desc')} />}
            {visibleColumns.includes('Last Activity') && <SortableTh label="Last Activity" onClick={() => onSort('activity_asc')} />}
            <th style={{ width: 44 }} />
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => {
            const selected = selectedIds.includes(deal.id);
            return (
              <tr key={deal.id} className={selected ? 'is-selected' : ''}>
                <td><input type="checkbox" checked={selected} onChange={(e) => setSelectedIds((current) => e.target.checked ? [...current, deal.id] : current.filter((id) => id !== deal.id))} aria-label={`Select ${deal.displayAddress}`} /></td>
                <td>
                  <a href={`/deals/${deal.id}`} className="pipeline-table-deal">
                    <strong>{deal.displayAddress}</strong>
                    <span>{deal.displaySuburb}</span>
                  </a>
                </td>
                {visibleColumns.includes('Client') && <td>{deal.cleanClientName}</td>}
                {visibleColumns.includes('Stage') && <td><span className={`pg-badge ${STAGE_BADGE[deal.status] ?? 'pg-badge-gray'}`}>{getDealStatusLabel(deal.status)}</span></td>}
                {visibleColumns.includes('Price/Value') && <td className="pg-mono">{deal.valueLabel}</td>}
                {visibleColumns.includes('Agent') && <td>
                  <span className="pipeline-agent"><span className="pg-avatar pg-avatar-sm">{initials(deal.agentName)}</span>{deal.agentName}</span>
                </td>}
                {visibleColumns.includes('Score') && <td><span className="pipeline-score-cell"><MatchScore score={deal.scorePct} size={24} stroke={2.4} />{deal.scorePct}%</span></td>}
                {visibleColumns.includes('Created Date') && <td>{dateLabel(deal.createdAt)}</td>}
                {visibleColumns.includes('Last Activity') && <td>{deal.lastActivity}</td>}
                <td>
                  <div className="pipeline-menu-anchor">
                    <button type="button" className="pg-btn pg-btn-icon pg-btn-sm" onClick={() => onToggleMenu(deal.id)} aria-label="Deal actions"><Icon name="more" size={13} /></button>
                    {activeMenuId === deal.id && (
                      <div className="pipeline-popover pipeline-popover-sm">
                        <a href={`/deals/${deal.id}`}>Open deal</a>
                        {COLUMNS.filter((status) => status !== deal.status).map((status) => (
                          <button key={status} type="button" onClick={() => onMove(deal.id, status)}>
                            Move to {getDealStatusLabel(status)}
                          </button>
                        ))}
                        <button type="button" onClick={() => onMove(deal.id, 'lost')}>Archive deal</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="pipeline-pagination">
        <span>Showing 1-{Math.min(deals.length, 25)} of {Math.max(deals.length, 18)} deals</span>
        <div>
          <button type="button" className="pg-btn pg-btn-sm">Previous</button>
          <button type="button" className="pg-btn pg-btn-sm" style={{ background: 'var(--pg-bg-2)' }}>1</button>
          <button type="button" className="pg-btn pg-btn-sm">2</button>
          <button type="button" className="pg-btn pg-btn-sm">Next</button>
        </div>
      </div>
    </div>
  );
}

function SortableTh({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <th>
      <button type="button" className="pipeline-th-btn" onClick={onClick}>
        <span>{label}</span>
        <Icon name="arrow-down" size={10} color="var(--pg-text-faint)" />
      </button>
      <i aria-hidden="true" />
    </th>
  );
}

function NewDealModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ briefId: '', propertyId: '', priority: 'standard', isAuction: false, strategyNotes: '' });
  const [error, setError] = useState<string | null>(null);

  const { data: briefsData } = useQuery({
    queryKey: queryKeys.briefs.all,
    queryFn: fetchBriefs,
  });

  const { data: matchesData, isLoading: loadingProperties } = useQuery({
    queryKey: queryKeys.briefs.matches(form.briefId, true),
    queryFn: () => fetchBriefMatchesAll(form.briefId),
    enabled: !!form.briefId,
  });

  const briefs = briefsData?.briefs ?? [];
  const properties = matchesData?.matches ?? [];

  const createMutation = useMutation({
    mutationFn: () => createDeal(form),
    onSuccess: () => onCreated(),
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not create deal'),
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--pg-bg)', borderRadius: 12, padding: '28px 28px', width: 460, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
        <h2 className="pg-display" style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>Create deal</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--pg-text-dim)', display: 'block', marginBottom: 5 }}>Client brief</label>
            <select value={form.briefId} onChange={(e) => setForm((f) => ({ ...f, briefId: e.target.value, propertyId: '' }))}
              className="pg-input" style={{ width: '100%', fontSize: 13 }}>
              <option value="">Select brief…</option>
              {briefs.map((b) => <option key={b.id} value={b.id}>{b.clientName}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--pg-text-dim)', display: 'block', marginBottom: 5 }}>Property</label>
            <select
              value={form.propertyId}
              onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value }))}
              disabled={!form.briefId || loadingProperties || properties.length === 0}
              className="pg-input"
              style={{ width: '100%', fontSize: 13 }}
            >
              <option value="">
                {!form.briefId
                  ? 'Select a brief first…'
                  : loadingProperties
                    ? 'Loading properties…'
                    : properties.length === 0
                      ? 'No matching properties for this brief'
                      : 'Select property…'}
              </option>
              {properties.map((p) => <option key={p.id} value={p.id}>{formatPropertyOption(p)}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--pg-text-dim)', display: 'block', marginBottom: 5 }}>Priority</label>
              <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="pg-input" style={{ width: '100%', fontSize: 13 }}>
                <option value="standard">Standard</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isAuction} onChange={(e) => setForm((f) => ({ ...f, isAuction: e.target.checked }))} style={{ accentColor: 'var(--pg-accent)' }} />
                Auction property
              </label>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--pg-text-dim)', display: 'block', marginBottom: 5 }}>Strategy notes</label>
            <textarea value={form.strategyNotes} onChange={(e) => setForm((f) => ({ ...f, strategyNotes: e.target.value }))}
              rows={2} placeholder="Bidding strategy, walk-away price, notes…"
              className="pg-input" style={{ width: '100%', fontSize: 13, resize: 'none', boxSizing: 'border-box', fontFamily: 'var(--pg-font-body)' }} />
          </div>
          {error && <InlineAlert variant="error">{error}</InlineAlert>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
            <button type="button" className="pg-btn" onClick={onClose}>Cancel</button>
            <button type="button" className="pg-btn pg-btn-primary" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.briefId || !form.propertyId}>
              {createMutation.isPending ? 'Creating…' : 'Create deal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
