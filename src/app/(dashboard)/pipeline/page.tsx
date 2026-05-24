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
  patchDealStatus,
  type PipelineDeal,
} from '@/lib/queries/deals';
import { OfferHistoryInline } from '@/components/deals/offer-history-timeline';

type ViewMode = 'board' | 'list';

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
    agentName: AGENTS[deal.id % AGENTS.length],
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: dealsData, isLoading: loading, isError } = useQuery({
    queryKey: queryKeys.deals.all,
    queryFn: fetchDeals,
  });

  const displayDeals = useMemo(() => (dealsData?.deals ?? []).map(withDisplayData), [dealsData?.deals]);
  const deals = displayDeals;
  const filteredDeals = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return deals;
    return deals.filter((deal) => [
      deal.displayAddress,
      deal.displaySuburb,
      deal.cleanClientName,
      deal.agentName,
      getDealStatusLabel(deal.status),
      deal.valueLabel,
    ].some((value) => value.toLowerCase().includes(q)));
  }, [deals, query]);

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
                    onToggleAll={(checked) => {
                      const ids = colDeals.map((d) => d.id);
                      setSelectedIds((current) => checked
                        ? Array.from(new Set([...current, ...ids]))
                        : current.filter((id) => !ids.includes(id)));
                    }}
                  >
                    {colDeals.map((d) => (
                      <DraggableDealCard
                        key={d.id}
                        deal={d}
                        selected={selectedIds.includes(d.id)}
                        onSelect={(checked) => setSelectedIds((current) => checked ? [...current, d.id] : current.filter((id) => id !== d.id))}
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
  status, title, count, value, dot, muted, allSelected, onToggleAll, children,
}: {
  status: string;
  title: string;
  count: number;
  value: string;
  dot?: string;
  muted?: boolean;
  allSelected: boolean;
  onToggleAll: (checked: boolean) => void;
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
        <span className="pipeline-drag-handle" aria-hidden="true">⋮⋮</span>
        <input type="checkbox" checked={allSelected} onChange={(e) => onToggleAll(e.target.checked)} aria-label={`Select ${title} deals`} />
        {dot && <div style={{ width: 6, height: 6, borderRadius: 999, background: dot, flexShrink: 0 }} />}
        <div style={{ fontSize: 12, fontWeight: 600 }}>{title}</div>
        <span style={{ fontSize: 11, fontFamily: 'var(--pg-font-mono)', color: 'var(--pg-text-faint)' }}>{count}</span>
        <div style={{ flex: 1 }} />
        <span className="pg-mono" style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>{value}</span>
        <button type="button" className="pg-btn pg-btn-icon pg-btn-sm" aria-label={`${title} column actions`}>
          <Icon name="more" size={13} />
        </button>
      </div>
      <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto', flex: 1, minHeight: 80 }} className="pg-scroll">
        {children}
      </div>
    </div>
  );
}

function DraggableDealCard({ deal, selected, onSelect }: { deal: DisplayDeal; selected: boolean; onSelect: (checked: boolean) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }
    : { opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <DealCardContent deal={deal} selected={selected} onSelect={onSelect} />
    </div>
  );
}

function DealCardContent({
  deal, dragging, selected, onSelect,
}: { deal: DisplayDeal; dragging?: boolean; selected: boolean; onSelect: (checked: boolean) => void }) {
  const daysToSettlement = deal.settlementDate
    ? Math.round((new Date(deal.settlementDate).getTime() - TODAY_TS) / 86400000)
    : null;

  return (
    <a
      href={`/deals/${deal.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', pointerEvents: dragging ? 'none' : 'auto' }}
      onClick={(e) => dragging && e.preventDefault()}
    >
      <div className="pipeline-deal-card" style={{
        borderColor: dragging ? 'var(--pg-accent)' : selected ? 'rgba(37,99,235,0.38)' : 'var(--pg-border)',
        cursor: dragging ? 'grabbing' : 'grab',
        boxShadow: dragging ? '0 8px 24px rgba(0,0,0,0.12)' : selected ? '0 0 0 3px rgba(37,99,235,0.08)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <input
            type="checkbox"
            checked={selected}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onSelect(e.target.checked)}
            aria-label={`Select ${deal.displayAddress}`}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 650, lineHeight: 1.35 }}>{deal.displayAddress}</div>
            <div style={{ fontSize: 11, color: 'var(--pg-text-dim)' }}>{deal.displaySuburb}</div>
          </div>
          <button type="button" className="pg-btn pg-btn-icon pg-btn-sm" onClick={(e) => e.preventDefault()} aria-label="Deal quick actions">
            <Icon name="more" size={13} />
          </button>
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
    </a>
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
}) {
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
            <button type="button">Change stage</button>
            <button type="button">Change agent</button>
            <button type="button">Archive</button>
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
              <label><input type="checkbox" defaultChecked /> Active stages</label>
              <label><input type="checkbox" /> Price above $1.5M</label>
              <label><input type="checkbox" /> Sarah Chen</label>
              <button type="button" className="pg-btn pg-btn-sm">Apply filters</button>
            </div>
          )}
        </div>
        <button type="button" className="pg-btn"><Icon name="sliders" size={13} />Sort</button>
        <div className="pipeline-menu-anchor">
          <button type="button" className="pg-btn" onClick={() => setShowViews(!showViews)}>
            <Icon name="bookmark" size={13} />Custom Views <Icon name="chevron-down" size={11} />
          </button>
          {showViews && (
            <div className="pipeline-popover">
              <div className="pg-label">Saved views</div>
              <button type="button">All active deals</button>
              <button type="button">High Value Deals</button>
              <button type="button">Due diligence this week</button>
              <div className="pg-divider" />
              <button type="button" className="pg-btn pg-btn-sm"><Icon name="plus" size={11} />Save current view</button>
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
              {['Client', 'Stage', 'Price/Value', 'Agent', 'Score', 'Created Date', 'Last Activity'].map((column) => (
                <label key={column}><input type="checkbox" defaultChecked /> {column}</label>
              ))}
            </div>
          )}
        </div>
        <button type="button" className="pg-btn"><Icon name="file" size={13} />Export</button>
      </div>
    </div>
  );
}

function DealListView({
  deals,
  selectedIds,
  setSelectedIds,
}: {
  deals: DisplayDeal[];
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
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
            {['Deal Name / Address', 'Client', 'Stage', 'Price / Value', 'Agent', 'Score', 'Created Date', 'Last Activity'].map((header) => (
              <th key={header}>
                <span>{header}</span>
                <Icon name="arrow-down" size={10} color="var(--pg-text-faint)" />
                <i aria-hidden="true" />
              </th>
            ))}
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
                <td>{deal.cleanClientName}</td>
                <td><span className={`pg-badge ${STAGE_BADGE[deal.status] ?? 'pg-badge-gray'}`}>{getDealStatusLabel(deal.status)}</span></td>
                <td className="pg-mono">{deal.valueLabel}</td>
                <td>
                  <span className="pipeline-agent"><span className="pg-avatar pg-avatar-sm">{initials(deal.agentName)}</span>{deal.agentName}</span>
                </td>
                <td><span className="pipeline-score-cell"><MatchScore score={deal.scorePct} size={24} stroke={2.4} />{deal.scorePct}%</span></td>
                <td>{dateLabel(deal.createdAt)}</td>
                <td>{deal.lastActivity}</td>
                <td><button type="button" className="pg-btn pg-btn-icon pg-btn-sm" aria-label="Deal actions"><Icon name="more" size={13} /></button></td>
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
