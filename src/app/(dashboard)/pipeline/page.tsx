'use client';

import { useState } from 'react';
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
  settled: { dot: 'var(--pg-green)', muted: true },
};

const COLUMNS = DEAL_STATUSES.filter((s) => !['lost', 'withdrawn'].includes(s));

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

export default function PipelinePage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [activeDeal, setActiveDeal] = useState<PipelineDeal | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: dealsData, isLoading: loading, isError } = useQuery({
    queryKey: queryKeys.deals.all,
    queryFn: fetchDeals,
  });

  const deals = dealsData?.deals ?? [];

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

  const byStatus = COLUMNS.reduce<Record<string, PipelineDeal[]>>((acc, s) => {
    acc[s] = deals.filter((d) => d.status === s);
    return acc;
  }, {});

  const totalValue = deals
    .filter((d) => !['settled', 'lost', 'withdrawn'].includes(d.status))
    .reduce((s, d) => s + (d.price ?? d.offerAmount ?? 0), 0);
  const activeCount = deals.filter((d) => !['settled', 'lost', 'withdrawn'].includes(d.status)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar
        eyebrow={loading ? 'Loading…' : `${activeCount} active · ${fmt(totalValue, null)} in pipeline`}
        title="Pipeline"
        actions={
          <>
            <div style={{ display: 'flex', background: 'var(--pg-surface)', border: '1px solid var(--pg-border)', borderRadius: 6, padding: 2 }}>
              <button type="button" className="pg-btn pg-btn-sm pg-btn-ghost" style={{ background: 'var(--pg-bg-2)' }}>
                <Icon name="grid" size={12} />Board
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

      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px', opacity: loading ? 0.6 : 1 }} className="pg-scroll">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div style={{ display: 'flex', gap: 14, height: '100%', minHeight: 600 }}>
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
                >
                  {colDeals.map((d) => (
                    <DraggableDealCard key={d.id} deal={d} />
                  ))}
                </KCol>
              );
            })}
          </div>
          <DragOverlay>
            {activeDeal ? <DealCardContent deal={activeDeal} dragging /> : null}
          </DragOverlay>
        </DndContext>
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
  status, title, count, value, dot, muted, children,
}: {
  status: string;
  title: string;
  count: number;
  value: string;
  dot?: string;
  muted?: boolean;
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
      <div style={{ padding: '11px 12px 9px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {dot && <div style={{ width: 6, height: 6, borderRadius: 999, background: dot, flexShrink: 0 }} />}
        <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.02em' }}>{title}</div>
        <span style={{ fontSize: 11, fontFamily: 'var(--pg-font-mono)', color: 'var(--pg-text-faint)' }}>{count}</span>
        <div style={{ flex: 1 }} />
        <span className="pg-mono" style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>{value}</span>
      </div>
      <div style={{ padding: '0 8px 8px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto', flex: 1, minHeight: 80 }} className="pg-scroll">
        {children}
      </div>
    </div>
  );
}

function DraggableDealCard({ deal }: { deal: PipelineDeal }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }
    : { opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <DealCardContent deal={deal} />
    </div>
  );
}

function DealCardContent({ deal, dragging }: { deal: PipelineDeal; dragging?: boolean }) {
  const scoreToMatchPct = (v: number | null) => (v == null ? 50 : Math.min(99, Math.max(1, Math.round(v / 100))));
  const daysToSettlement = deal.settlementDate
    ? Math.round((new Date(deal.settlementDate).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <a
      href={`/deals/${deal.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', pointerEvents: dragging ? 'none' : 'auto' }}
      onClick={(e) => dragging && e.preventDefault()}
    >
      <div style={{
        background: 'var(--pg-surface)',
        border: `1px solid ${dragging ? 'var(--pg-accent)' : 'var(--pg-border)'}`,
        borderRadius: 8,
        padding: 10,
        position: 'relative',
        cursor: dragging ? 'grabbing' : 'grab',
        boxShadow: dragging ? '0 8px 24px rgba(0,0,0,0.12)' : 'none',
      }}>
        {deal.priority !== 'standard' && (
          <div style={{ position: 'absolute', top: 8, right: 8, width: 5, height: 5, borderRadius: 999, background: deal.priority === 'urgent' ? 'var(--pg-red)' : 'var(--pg-amber)' }} />
        )}
        <div style={{ fontSize: 12.5, fontWeight: 500 }}>{deal.address ?? 'Unknown address'}</div>
        <div style={{ fontSize: 11, color: 'var(--pg-text-dim)' }}>{deal.suburb}{deal.state ? `, ${deal.state}` : ''}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <span className="pg-mono" style={{ fontSize: 12, fontWeight: 500 }}>{fmt(deal.price, deal.priceDisplay)}</span>
          <div style={{ flex: 1 }} />
          <MatchScore score={scoreToMatchPct(deal.overallScore)} size={22} stroke={2.2} />
        </div>
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--pg-border)', fontSize: 11, color: 'var(--pg-text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="users" size={10} color="var(--pg-text-faint)" />
          <span style={{ flex: 1 }}>{deal.clientName ?? '—'}</span>
          {deal.isAuction && <span className="pg-badge pg-badge-blue" style={{ fontSize: 9, padding: '1px 5px' }}>Auction</span>}
        </div>
        {deal.offerSubState && (
          <div style={{ marginTop: 7 }}>
            <span className="pg-badge" style={{ fontSize: 10 }}>{deal.offerSubState.replace(/_/g, ' ')}</span>
          </div>
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
