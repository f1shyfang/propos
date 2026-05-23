'use client';

import { useState, useEffect } from 'react';
import { TopBar } from '@/components/shared/top-bar';
import { Icon } from '@/components/shared/icon';
import { MatchScore } from '@/components/shared/match-score';
import { getDealStatusLabel, DEAL_STATUSES } from '@/lib/deal-utils';

interface LiveDeal {
  id: number; status: string; offerSubState: string | null; offerAmount: number | null;
  priority: string; isAuction: boolean; exchangeDate: string | null; settlementDate: string | null;
  clientName: string | null; propertyId: string | null;
  address: string | null; suburb: string | null; state: string | null;
  price: number | null; priceDisplay: string | null; overallScore: number | null;
  createdAt: string;
}

type Brief = { id: number; clientName: string };
type Property = { id: string; address: string; suburb: string | null; priceDisplay: string | null; price: number | null };

const COLUMN_CONFIG: Record<string, { dot?: string; muted?: boolean }> = {
  suggested: { dot: 'var(--pg-text-faint)', muted: true },
  approved: { dot: 'var(--pg-blue)' },
  due_diligence: { dot: 'var(--pg-amber)' },
  offer_made: { dot: 'var(--pg-purple)' },
  under_contract: { dot: 'var(--pg-green)' },
  settled: { dot: 'var(--pg-green)', muted: true },
  lost: { dot: 'var(--pg-red)', muted: true },
  withdrawn: { muted: true },
};

const COLUMNS = DEAL_STATUSES.filter(s => !['lost', 'withdrawn'].includes(s));

function fmt(n: number | null, display: string | null): string {
  if (display) return display;
  if (!n) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${(n / 1000).toFixed(0)}K`;
}

function colValue(deals: LiveDeal[]): string {
  const total = deals.reduce((s, d) => s + (d.price ?? d.offerAmount ?? 0), 0);
  if (!total) return '—';
  return total >= 1_000_000 ? `$${(total / 1_000_000).toFixed(1)}M` : `$${(total / 1000).toFixed(0)}K`;
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<LiveDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  async function load() {
    const res = await fetch('/api/deals');
    if (res.ok) setDeals((await res.json()).deals ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const byStatus = DEAL_STATUSES.reduce<Record<string, LiveDeal[]>>((acc, s) => {
    acc[s] = deals.filter(d => d.status === s);
    return acc;
  }, {});

  const totalValue = deals.filter(d => !['settled', 'lost', 'withdrawn'].includes(d.status)).reduce((s, d) => s + (d.price ?? d.offerAmount ?? 0), 0);
  const activeCount = deals.filter(d => !['settled', 'lost', 'withdrawn'].includes(d.status)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar
        eyebrow={loading ? 'Loading…' : `${activeCount} active · ${fmt(totalValue, null)} in pipeline`}
        title="Pipeline"
        actions={
          <>
            <div style={{ display: 'flex', background: 'var(--pg-surface)', border: '1px solid var(--pg-border)', borderRadius: 6, padding: 2 }}>
              <button className="pg-btn pg-btn-sm pg-btn-ghost" style={{ background: 'var(--pg-bg-2)' }}><Icon name="grid" size={12} />Board</button>
            </div>
            <button className="pg-btn pg-btn-primary" onClick={() => setShowNew(true)}><Icon name="plus" size={13} />New deal</button>
          </>
        }
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px' }} className="pg-scroll">
        <div style={{ display: 'flex', gap: 14, height: '100%', minHeight: 600 }}>
          {COLUMNS.map(status => {
            const colDeals = byStatus[status] ?? [];
            const { dot, muted } = COLUMN_CONFIG[status] ?? {};
            return (
              <KCol key={status} title={getDealStatusLabel(status)} count={colDeals.length} value={colValue(colDeals)} dot={dot} muted={muted}>
                {colDeals.map(d => (
                  <LiveDealCard key={d.id} deal={d} />
                ))}
              </KCol>
            );
          })}
        </div>
      </div>

      {showNew && <NewDealModal onClose={() => setShowNew(false)} onCreated={() => { load(); setShowNew(false); }} />}
    </div>
  );
}

function KCol({ title, count, value, dot, muted, children }: {
  title: string; count: number; value: string; dot?: string; muted?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="pg-kcol" style={{ opacity: muted ? 0.75 : 1 }}>
      <div style={{ padding: '11px 12px 9px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {dot && <div style={{ width: 6, height: 6, borderRadius: 999, background: dot, flexShrink: 0 }} />}
        <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.02em' }}>{title}</div>
        <span style={{ fontSize: 11, fontFamily: 'var(--pg-font-mono)', color: 'var(--pg-text-faint)' }}>{count}</span>
        <div style={{ flex: 1 }} />
        <span className="pg-mono" style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>{value}</span>
      </div>
      <div style={{ padding: '0 8px 8px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto', flex: 1 }} className="pg-scroll">
        {children}
      </div>
    </div>
  );
}

function LiveDealCard({ deal }: { deal: LiveDeal }) {
  const scoreToMatchPct = (v: number | null) => v == null ? 50 : Math.min(99, Math.max(1, Math.round(v / 100)));
  const daysToSettlement = deal.settlementDate ? Math.round((new Date(deal.settlementDate).getTime() - Date.now()) / 86400000) : null;

  return (
    <a href={`/deals/${deal.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{
        background: 'var(--pg-surface)', border: '1px solid var(--pg-border)',
        borderRadius: 8, padding: 10, position: 'relative',
        transition: 'border-color 0.15s',
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
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [form, setForm] = useState({ briefId: '', propertyId: '', priority: 'standard', isAuction: false, strategyNotes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetch('/api/briefs').then(r => r.json()), fetch('/api/properties').then(r => r.json())]).then(([b, p]) => {
      setBriefs(b.briefs ?? []);
      setProperties((p.properties ?? []).slice(0, 50));
    });
  }, []);

  async function create() {
    if (!form.briefId || !form.propertyId) return;
    setSaving(true);
    await fetch('/api/deals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    onCreated();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--pg-bg)', borderRadius: 12, padding: '28px 28px', width: 460, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
        <h2 className="pg-display" style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>Create deal</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--pg-text-dim)', display: 'block', marginBottom: 5 }}>Client brief</label>
            <select value={form.briefId} onChange={e => setForm(f => ({ ...f, briefId: e.target.value }))}
              style={{ width: '100%', padding: '9px 10px', border: '1px solid var(--pg-border)', borderRadius: 6, background: 'var(--pg-bg)', color: 'var(--pg-text)', fontSize: 13 }}>
              <option value="">Select brief…</option>
              {briefs.map(b => <option key={b.id} value={b.id}>{b.clientName}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--pg-text-dim)', display: 'block', marginBottom: 5 }}>Property</label>
            <select value={form.propertyId} onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
              style={{ width: '100%', padding: '9px 10px', border: '1px solid var(--pg-border)', borderRadius: 6, background: 'var(--pg-bg)', color: 'var(--pg-text)', fontSize: 13 }}>
              <option value="">Select property…</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.address}{p.suburb ? ` — ${p.suburb}` : ''}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--pg-text-dim)', display: 'block', marginBottom: 5 }}>Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                style={{ width: '100%', padding: '9px 10px', border: '1px solid var(--pg-border)', borderRadius: 6, background: 'var(--pg-bg)', color: 'var(--pg-text)', fontSize: 13 }}>
                <option value="standard">Standard</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isAuction} onChange={e => setForm(f => ({ ...f, isAuction: e.target.checked }))} style={{ accentColor: 'var(--pg-accent)' }} />
                Auction property
              </label>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--pg-text-dim)', display: 'block', marginBottom: 5 }}>Strategy notes</label>
            <textarea value={form.strategyNotes} onChange={e => setForm(f => ({ ...f, strategyNotes: e.target.value }))}
              rows={2} placeholder="Bidding strategy, walk-away price, notes…"
              style={{ width: '100%', padding: '9px 10px', border: '1px solid var(--pg-border)', borderRadius: 6, background: 'var(--pg-bg)', color: 'var(--pg-text)', fontSize: 13, resize: 'none', boxSizing: 'border-box', fontFamily: 'var(--pg-font-body)' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
            <button className="pg-btn" onClick={onClose}>Cancel</button>
            <button className="pg-btn pg-btn-primary" onClick={create} disabled={saving || !form.briefId || !form.propertyId}>
              {saving ? 'Creating…' : 'Create deal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
