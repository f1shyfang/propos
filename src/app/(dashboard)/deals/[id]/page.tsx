'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Icon } from '@/components/shared/icon';
import { MatchScore } from '@/components/shared/match-score';
import { getDealStatusLabel, getOfferSubStateLabel, DEAL_STATUSES, calcCoolingOffStatus } from '@/lib/deal-utils';
import { calcStampDuty } from '@/lib/settlement-utils';
import { DealDocumentPanel } from '@/components/deals/deal-document-panel';
import { DealDocumentActions, type DealDocumentRow } from '@/components/deals/deal-document-actions';
import { OfferHistoryTimeline } from '@/components/deals/offer-history-timeline';

type Tab = 'overview' | 'due_diligence' | 'cma' | 'offer' | 'settlement' | 'contacts' | 'documents';

interface Deal {
  id: number; status: string; offerSubState: string | null; offerAmount: number | null;
  offerConditions: string[]; priority: string; isAuction: boolean;
  exchangeDate: string | null; settlementDate: string | null;
  listingAgentName: string | null; listingAgentPhone: string | null; strategyNotes: string | null;
  clientName: string; clientEmail: string; budgetMax: number | null; purchasePurpose: string | null;
  propertyId: string; address: string; suburb: string | null; state: string | null;
  propertyType: string | null; bedrooms: number | null; bathrooms: number | null;
  parkingSpaces: number | null; landSize: number | null;
  price: number | null; priceDisplay: string | null; overallScore: number | null;
  appraisedValue: number | null; grossYield: number | null;
  latitude: number | null; longitude: number | null;
}

interface ChecklistItem { id: number; title: string; assignee: string | null; dayOffset: number | null; completedAt: string | null; status: string; }
interface Milestone { id: number; title: string; dayOffset: number | null; dueDate: string | null; completedAt: string | null; status: string; notes: string | null; }
interface Contact { id: number; role: string; name: string | null; company: string | null; phone: string | null; email: string | null; reference: string | null; notes: string | null; }
type Document = DealDocumentRow & { uploadedBy: string | null };
interface CMAComp { id: string; address: string; price: number | null; priceDisplay: string | null; bedrooms: number | null; bathrooms: number | null; landSize: number | null; comparabilityScore: number; }

function fmt(n: number | null): string {
  if (!n) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${(n / 1000).toFixed(0)}K`;
}

function scoreToMatchPct(v: number | null): number {
  if (v == null) return 50;
  return Math.min(99, Math.max(1, Math.round(v / 100)));
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'var(--pg-red)', high: 'var(--pg-amber)', standard: 'var(--pg-text-faint)',
};

const OFFER_CONDITIONS = [
  'Subject to finance', 'Subject to building & pest', 'Subject to sale of existing property',
  'Early release of deposit', 'Section 66W Certificate (NSW)',
];

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('overview');
  const [deal, setDeal] = useState<Deal | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [cma, setCma] = useState<{ comparables: CMAComp[]; estimatedValue: number | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    const res = await fetch(`/api/deals/${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoadError(
        typeof data === 'object' && data && 'error' in data
          ? String(data.error)
          : res.status === 404
            ? 'Deal not found.'
            : `Could not load deal (${res.status}).`,
      );
      setLoading(false);
      return;
    }
    setDeal(data.deal);
    setChecklist(data.checklist ?? []);
    setMilestones(data.milestones ?? []);
    setContacts(data.contacts ?? []);
    setDocuments(data.documents ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (deal && tab === 'cma') {
      fetch(`/api/cma/${deal.propertyId}`).then(r => r.ok ? r.json() : null).then(d => d && setCma(d));
    }
  }, [deal, tab]);

  async function updateDeal(patch: Record<string, unknown>) {
    setSaving(true);
    await fetch(`/api/deals/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    await load();
    setSaving(false);
  }

  async function toggleChecklist(itemId: number, completed: boolean) {
    await fetch(`/api/deals/${id}/checklist`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, completed }),
    });
    await load();
  }

  async function toggleMilestone(milestoneId: number, completed: boolean) {
    await fetch(`/api/deals/${id}/milestones`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ milestoneId, completed }),
    });
    await load();
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--pg-text-dim)' }}>Loading deal…</div>;
  if (!deal) {
    return (
      <div style={{ padding: 40, color: 'var(--pg-red)' }}>
        {loadError ?? 'Deal not found.'}
      </div>
    );
  }

  const daysToSettlement = deal.settlementDate
    ? Math.round((new Date(deal.settlementDate).getTime() - Date.now()) / 86400000)
    : null;

  const coolingOffExpiry = deal.exchangeDate && !deal.isAuction && deal.state
    ? (() => {
        const d = new Date(deal.exchangeDate);
        const bDays: Record<string, number> = { NSW: 5, VIC: 3, QLD: 5, SA: 2, ACT: 5, NT: 4 };
        const n = bDays[deal.state ?? ''] ?? 0;
        let added = 0;
        while (added < n) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) added++; }
        return d;
      })()
    : null;

  const coolingStatus = coolingOffExpiry ? calcCoolingOffStatus(coolingOffExpiry) : null;

  const TABS: [Tab, string][] = [
    ['overview', 'Overview'],
    ['due_diligence', 'Due Diligence'],
    ['cma', 'CMA'],
    ['offer', 'Offer'],
    ['settlement', 'Settlement'],
    ['contacts', 'Contacts'],
    ['documents', 'Documents'],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 32px 0', borderBottom: '1px solid var(--pg-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <a href="/pipeline" style={{ color: 'var(--pg-text-faint)', fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="chevron-left" size={11} />Pipeline
          </a>
          <span className="pg-badge" style={{ fontSize: 11 }}>{getDealStatusLabel(deal.status)}</span>
          {deal.priority !== 'standard' && (
            <span style={{ fontSize: 11, color: PRIORITY_COLORS[deal.priority], fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {deal.priority}
            </span>
          )}
          {deal.isAuction && <span className="pg-badge pg-badge-blue" style={{ fontSize: 11 }}>Auction</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, paddingBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <h1 className="pg-display" style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{deal.address}</h1>
            <div style={{ fontSize: 13, color: 'var(--pg-text-dim)', marginTop: 3 }}>
              {deal.suburb}, {deal.state} · {deal.clientName}
              {deal.priceDisplay || deal.price ? ` · ${deal.priceDisplay ?? fmt(deal.price)}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={deal.status}
              onChange={e => updateDeal({ status: e.target.value })}
              disabled={saving}
              style={{ padding: '6px 10px', border: '1px solid var(--pg-border)', borderRadius: 6, background: 'var(--pg-bg)', color: 'var(--pg-text)', fontSize: 12, cursor: 'pointer' }}
            >
              {DEAL_STATUSES.map(s => <option key={s} value={s}>{getDealStatusLabel(s)}</option>)}
            </select>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', padding: '10px 14px 12px', fontSize: 13,
              fontWeight: tab === t ? 500 : 400,
              color: tab === t ? 'var(--pg-text)' : 'var(--pg-text-dim)',
              cursor: 'pointer', borderBottom: tab === t ? '2px solid var(--pg-text)' : '2px solid transparent',
              marginBottom: -1, fontFamily: 'var(--pg-font-body)',
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }} className="pg-scroll">

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="pg-card" style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--pg-text-faint)', marginBottom: 14 }}>Property</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>{deal.priceDisplay ?? fmt(deal.price)}</div>
                  <div style={{ fontSize: 12, color: 'var(--pg-text-dim)', marginTop: 4 }}>
                    {deal.propertyType} · {deal.bedrooms ?? '—'} bed / {deal.bathrooms ?? '—'} bath / {deal.parkingSpaces ?? '—'} car
                    {deal.landSize ? ` · ${deal.landSize}m²` : ''}
                  </div>
                </div>
                <MatchScore score={scoreToMatchPct(deal.overallScore)} size={40} stroke={3} />
              </div>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--pg-border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { l: 'Appraised value', v: fmt(deal.appraisedValue) },
                  { l: 'Gross yield', v: deal.grossYield ? `${(deal.grossYield * 100).toFixed(1)}%` : '—' },
                  { l: 'Purchase purpose', v: deal.purchasePurpose ?? '—' },
                  { l: 'Client budget', v: fmt(deal.budgetMax) },
                ].map(({ l, v }) => (
                  <div key={l}>
                    <div style={{ fontSize: 11, color: 'var(--pg-text-faint)', marginBottom: 2 }}>{l}</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14 }}>
                <a href={`/properties/${deal.propertyId}`} className="pg-btn pg-btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                  View full listing
                </a>
              </div>
            </div>
            <div className="pg-card" style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--pg-text-faint)', marginBottom: 14 }}>Timeline</div>
              {daysToSettlement !== null && (
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--pg-font-display)', color: daysToSettlement < 14 ? 'var(--pg-red)' : 'var(--pg-text)' }}>
                  {daysToSettlement > 0 ? `${daysToSettlement}d to settlement` : daysToSettlement === 0 ? 'Settlement today' : `${Math.abs(daysToSettlement)}d overdue`}
                </div>
              )}
              {coolingStatus && (
                <div style={{ marginTop: 12, fontSize: 13, color: coolingStatus.expired ? 'var(--pg-text-faint)' : 'var(--pg-amber)' }}>
                  Cooling-off: {coolingStatus.expired ? 'Expired ✓' : `${coolingStatus.daysLeft}d remaining`}
                </div>
              )}
              {deal.exchangeDate && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--pg-text-dim)' }}>
                  Exchanged: {new Date(deal.exchangeDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
              {deal.settlementDate && (
                <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>
                  Settlement: {new Date(deal.settlementDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
              {deal.state && deal.price && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--pg-border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--pg-text-faint)', marginBottom: 4 }}>Stamp duty estimate ({deal.state})</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{fmt(calcStampDuty(deal.price, deal.state, deal.purchasePurpose === 'investment'))}</div>
                </div>
              )}
            </div>
            {deal.strategyNotes && (
              <div className="pg-card" style={{ padding: '20px 22px', gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--pg-text-faint)', marginBottom: 10 }}>Strategy Notes</div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--pg-text)' }}>{deal.strategyNotes}</div>
              </div>
            )}
          </div>
        )}

        {/* DUE DILIGENCE TAB */}
        {tab === 'due_diligence' && (
          <div>
            <DealDocumentActions
              dealId={id}
              documents={documents}
              defaultTag="Building Inspection"
              onRefresh={load}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 20 }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--pg-text-dim)' }}>
                  {checklist.filter(i => i.status === 'completed').length} / {checklist.length} complete
                </div>
                <div style={{ marginTop: 6, height: 4, width: 200, background: 'var(--pg-border)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--pg-green)', borderRadius: 999, width: `${checklist.length ? (checklist.filter(i => i.status === 'completed').length / checklist.length) * 100 : 0}%`, transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>
            <div className="pg-card-flat" style={{ overflow: 'hidden' }}>
              {checklist.length === 0 && (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--pg-text-faint)', fontSize: 13 }}>No checklist items. Create a deal first to auto-generate items.</div>
              )}
              {checklist.map((item, i, a) => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px',
                  borderBottom: i < a.length - 1 ? '1px solid var(--pg-border)' : 'none',
                }}>
                  <input type="checkbox" checked={item.status === 'completed'} onChange={e => toggleChecklist(item.id, e.target.checked)}
                    style={{ accentColor: 'var(--pg-green)', marginTop: 2, cursor: 'pointer', width: 16, height: 16 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, textDecoration: item.status === 'completed' ? 'line-through' : 'none', color: item.status === 'completed' ? 'var(--pg-text-faint)' : 'var(--pg-text)' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--pg-text-faint)', marginTop: 2 }}>
                      Assignee: {item.assignee ?? '—'} · Due: Day {item.dayOffset ?? '—'}
                      {item.completedAt && ` · Completed ${new Date(item.completedAt).toLocaleDateString('en-AU')}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    <span className={`pg-badge ${item.status === 'completed' ? 'pg-badge-green' : item.status === 'overdue' ? 'pg-badge-red' : ''}`} style={{ fontSize: 10 }}>
                      {item.status}
                    </span>
                    <DealDocumentActions
                      dealId={id}
                      documents={documents}
                      checklistItemId={item.id}
                      compact
                      onRefresh={load}
                    />
                  </div>
                </div>
              ))}
            </div>
            <DealDocumentPanel
              dealId={id}
              documents={documents}
              onRefresh={load}
              title="Due diligence files"
              defaultTag="Building Inspection"
              tagFilter={[
                'Section 32 / Vendor Statement',
                'Strata Report',
                'Building Inspection',
                'Pest Inspection',
                'Contract of Sale',
                'Other',
              ]}
              allowGenerate={null}
            />
          </div>
        )}

        {/* CMA TAB */}
        {tab === 'cma' && (
          <div>
            {!cma ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--pg-text-dim)' }}>Loading comparable sales…</div>
            ) : (
              <>
                <DealDocumentActions dealId={id} documents={documents} defaultTag="CMA Report" showGenerateCma onRefresh={load} />
                <div style={{ marginBottom: 20, marginTop: 16, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div className="pg-card" style={{ padding: '16px 20px', minWidth: 200 }}>
                    <div style={{ fontSize: 11, color: 'var(--pg-text-faint)', marginBottom: 4 }}>Estimated value range</div>
                    <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--pg-font-display)' }}>
                      {cma.estimatedValue ? `${fmt(Math.round(cma.estimatedValue * 0.95))} – ${fmt(Math.round(cma.estimatedValue * 1.05))}` : '—'}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--pg-text-dim)', lineHeight: 1.6, maxWidth: 400 }}>
                    Based on {cma.comparables.length} comparable properties in {deal.suburb}. Same suburb, ±1 bedroom, ±30% land size.
                  </div>
                </div>
                <div className="pg-card-flat" style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1fr 0.8fr 0.8fr', padding: '10px 16px', borderBottom: '1px solid var(--pg-border)', fontSize: 10.5, color: 'var(--pg-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
                    <span>Address</span><span>Bed/Bath</span><span style={{ textAlign: 'right' }}>Price</span><span style={{ textAlign: 'right' }}>Land</span><span style={{ textAlign: 'right' }}>Match</span>
                  </div>
                  {cma.comparables.map((comp, i, a) => (
                    <div key={comp.id} style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1fr 0.8fr 0.8fr', padding: '11px 16px', borderBottom: i < a.length - 1 ? '1px solid var(--pg-border)' : 'none', fontSize: 13, alignItems: 'center' }}>
                      <a href={`/properties/${comp.id}`} style={{ color: 'var(--pg-text)', textDecoration: 'none' }} className="pg-truncate">{comp.address}</a>
                      <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>{comp.bedrooms ?? '—'}/{comp.bathrooms ?? '—'}</div>
                      <div style={{ textAlign: 'right', fontFamily: 'var(--pg-font-mono)', fontSize: 12 }}>{comp.priceDisplay ?? fmt(comp.price)}</div>
                      <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--pg-text-dim)' }}>{comp.landSize ? `${comp.landSize}m²` : '—'}</div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: comp.comparabilityScore >= 90 ? 'var(--pg-green)' : 'var(--pg-amber)' }}>{comp.comparabilityScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <DealDocumentPanel
              dealId={id}
              documents={documents}
              onRefresh={load}
              title="CMA reports"
              defaultTag="CMA Report"
              tagFilter={['CMA Report', 'Correspondence']}
              allowGenerate="cma"
            />
          </div>
        )}

        {/* OFFER TAB */}
        {tab === 'offer' && (
          <OfferTab deal={deal} dealId={id} documents={documents} onSave={updateDeal} onRefresh={load} saving={saving} />
        )}

        {/* SETTLEMENT TAB */}
        {tab === 'settlement' && (
          <SettlementTab
            dealId={id}
            deal={deal}
            documents={documents}
            milestones={milestones}
            onToggle={toggleMilestone}
            onSave={updateDeal}
            onRefresh={load}
            saving={saving}
            daysToSettlement={daysToSettlement}
            coolingStatus={coolingStatus}
          />
        )}

        {/* CONTACTS TAB */}
        {tab === 'contacts' && (
          <ContactsTab dealId={id} contacts={contacts} onRefresh={load} />
        )}

        {/* DOCUMENTS TAB */}
        {tab === 'documents' && (
          <DocumentsTab dealId={id} documents={documents} onRefresh={load} dealStatus={deal.status} />
        )}
      </div>
    </div>
  );
}

// ── Offer Tab ─────────────────────────────────────────────────────────────────
function OfferTab({ deal, dealId, documents, onSave, onRefresh, saving }: {
  deal: Deal; dealId: string; documents: Document[];
  onSave: (p: Record<string, unknown>) => Promise<void>; onRefresh: () => Promise<void>; saving: boolean;
}) {
  const [amount, setAmount] = useState(String(deal.offerAmount ?? ''));
  const [subState, setSubState] = useState(deal.offerSubState ?? 'draft');
  const [conditions, setConditions] = useState<string[]>(deal.offerConditions ?? []);
  const [settlement, setSettlement] = useState(deal.settlementDate ? deal.settlementDate.slice(0, 10) : '');
  const [exchange, setExchange] = useState(deal.exchangeDate ? deal.exchangeDate.slice(0, 10) : '');

  async function save() {
    await onSave({
      offerAmount: amount ? Number(amount.replace(/[^0-9]/g, '')) : null,
      offerSubState: subState,
      offerConditions: conditions,
      settlementDate: settlement || null,
      exchangeDate: exchange || null,
    });
  }

  const deposit = amount ? Math.round(Number(amount.replace(/[^0-9]/g, '')) * 0.1) : 0;

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="pg-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={{ fontSize: 12, color: 'var(--pg-text-dim)', display: 'block', marginBottom: 6 }}>Offer amount</label>
          <input type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 1250000"
            style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--pg-border)', borderRadius: 6, background: 'var(--pg-bg)', color: 'var(--pg-text)', fontSize: 14, boxSizing: 'border-box' }} />
          {deposit > 0 && <div style={{ fontSize: 11.5, color: 'var(--pg-text-faint)', marginTop: 4 }}>10% deposit: ${deposit.toLocaleString()}</div>}
        </div>
        <div>
          <label style={{ fontSize: 12, color: 'var(--pg-text-dim)', display: 'block', marginBottom: 6 }}>Offer status</label>
          <select value={subState} onChange={e => setSubState(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--pg-border)', borderRadius: 6, background: 'var(--pg-bg)', color: 'var(--pg-text)', fontSize: 13 }}>
            {['draft', 'sent', 'negotiating', 'counter_offer', 'accepted', 'rejected'].map(s => (
              <option key={s} value={s}>{getOfferSubStateLabel(s)}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--pg-text-dim)', display: 'block', marginBottom: 6 }}>Exchange date</label>
            <input type="date" value={exchange} onChange={e => setExchange(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--pg-border)', borderRadius: 6, background: 'var(--pg-bg)', color: 'var(--pg-text)', fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--pg-text-dim)', display: 'block', marginBottom: 6 }}>Settlement date</label>
            <input type="date" value={settlement} onChange={e => setSettlement(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--pg-border)', borderRadius: 6, background: 'var(--pg-bg)', color: 'var(--pg-text)', fontSize: 13 }} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, color: 'var(--pg-text-dim)', display: 'block', marginBottom: 8 }}>Special conditions</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {OFFER_CONDITIONS.map(c => (
              <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={conditions.includes(c)} onChange={e => setConditions(prev => e.target.checked ? [...prev, c] : prev.filter(x => x !== c))}
                  style={{ accentColor: 'var(--pg-accent)' }} />
                {c}
              </label>
            ))}
          </div>
        </div>
        <button className="pg-btn pg-btn-primary" onClick={save} disabled={saving} style={{ alignSelf: 'flex-start' }}>
          {saving ? 'Saving…' : 'Save offer details'}
        </button>
      </div>
      <DealDocumentPanel
        dealId={dealId}
        documents={documents}
        onRefresh={onRefresh}
        title="Offer documents"
        defaultTag="Offer Letter"
        tagFilter={['Offer Letter', 'Contract of Sale', 'Correspondence', 'Other']}
        allowGenerate="offer"
      />
      <OfferHistoryTimeline dealId={dealId} key={`${dealId}-${deal.offerSubState}-${deal.offerAmount}`} />
    </div>
  );
}

// ── Settlement Tab ────────────────────────────────────────────────────────────
function SettlementTab({ dealId, deal, documents, milestones, onToggle, onSave, onRefresh, saving, daysToSettlement, coolingStatus }: {
  dealId: string;
  deal: Deal;
  documents: Document[];
  milestones: Milestone[];
  onToggle: (id: number, completed: boolean) => Promise<void>;
  onSave: (p: Record<string, unknown>) => Promise<void>;
  onRefresh: () => Promise<void>;
  saving: boolean;
  daysToSettlement: number | null;
  coolingStatus: { expired: boolean; daysLeft: number } | null;
}) {
  const [exchange, setExchange] = useState(deal.exchangeDate ? deal.exchangeDate.slice(0, 10) : '');
  const [settlement, setSettlement] = useState(deal.settlementDate ? deal.settlementDate.slice(0, 10) : '');

  async function generateMilestones() {
    if (!exchange || !settlement) return;
    await onSave({ status: 'under_contract', exchangeDate: exchange, settlementDate: settlement });
  }

  return (
    <div>
      {/* Countdown */}
      {daysToSettlement !== null && (
        <div style={{ marginBottom: 24, padding: '20px 24px', background: 'var(--pg-card)', border: '1px solid var(--pg-border)', borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--pg-text-faint)', marginBottom: 8 }}>Settlement countdown</div>
          <div style={{ fontSize: 40, fontWeight: 700, fontFamily: 'var(--pg-font-display)', color: daysToSettlement < 7 ? 'var(--pg-red)' : daysToSettlement < 14 ? 'var(--pg-amber)' : 'var(--pg-text)' }}>
            {daysToSettlement > 0 ? `${daysToSettlement} days` : daysToSettlement === 0 ? 'Today' : `${Math.abs(daysToSettlement)}d overdue`}
          </div>
          {coolingStatus && (
            <div style={{ marginTop: 8, fontSize: 13, color: coolingStatus.expired ? 'var(--pg-text-faint)' : 'var(--pg-amber)' }}>
              Cooling-off period: {coolingStatus.expired ? '✓ Expired' : `${coolingStatus.daysLeft} days remaining`}
            </div>
          )}
        </div>
      )}

      {/* Date inputs + generate */}
      {milestones.length === 0 && (
        <div className="pg-card" style={{ padding: '20px 24px', marginBottom: 24, maxWidth: 500 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Set dates to generate milestone timeline</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--pg-text-dim)', display: 'block', marginBottom: 4 }}>Exchange date</label>
              <input type="date" value={exchange} onChange={e => setExchange(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--pg-border)', borderRadius: 6, background: 'var(--pg-bg)', color: 'var(--pg-text)', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--pg-text-dim)', display: 'block', marginBottom: 4 }}>Settlement date</label>
              <input type="date" value={settlement} onChange={e => setSettlement(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--pg-border)', borderRadius: 6, background: 'var(--pg-bg)', color: 'var(--pg-text)', fontSize: 13 }} />
            </div>
          </div>
          <button className="pg-btn pg-btn-primary" onClick={generateMilestones} disabled={saving || !exchange || !settlement}>
            Generate milestone timeline
          </button>
        </div>
      )}

      {/* Milestone timeline */}
      {milestones.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--pg-text-faint)', marginBottom: 12 }}>
            Milestone timeline · {milestones.filter(m => m.status === 'completed').length}/{milestones.length} complete
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {milestones.map((m, i) => {
              const overdue = m.dueDate && m.status !== 'completed' && new Date(m.dueDate) < new Date();
              return (
                <div key={m.id} style={{ display: 'flex', gap: 14, paddingBottom: 4 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
                    <button onClick={() => onToggle(m.id, m.status !== 'completed')}
                      style={{ width: 20, height: 20, borderRadius: 999, border: `2px solid ${m.status === 'completed' ? 'var(--pg-green)' : overdue ? 'var(--pg-red)' : 'var(--pg-border)'}`, background: m.status === 'completed' ? 'var(--pg-green)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {m.status === 'completed' && <Icon name="check" size={10} color="white" />}
                    </button>
                    {i < milestones.length - 1 && <div style={{ flex: 1, width: 2, background: 'var(--pg-border)', minHeight: 24, margin: '2px 0' }} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, textDecoration: m.status === 'completed' ? 'line-through' : 'none', color: m.status === 'completed' ? 'var(--pg-text-faint)' : 'var(--pg-text)' }}>{m.title}</span>
                      {overdue && <span className="pg-badge pg-badge-red" style={{ fontSize: 10 }}>Overdue</span>}
                    </div>
                    {m.dueDate && (
                      <div style={{ fontSize: 11.5, color: 'var(--pg-text-faint)', marginTop: 2 }}>
                        Day {m.dayOffset} · {new Date(m.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                        {m.completedAt && ` · Completed ${new Date(m.completedAt).toLocaleDateString('en-AU')}`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <DealDocumentPanel
        dealId={dealId}
        documents={documents}
        onRefresh={onRefresh}
        title="Settlement documents"
        defaultTag="Finance Approval"
        tagFilter={['Finance Approval', 'Stamp Duty Receipt', 'Certificate of Title', 'Correspondence', 'Other']}
        allowGenerate={null}
      />
    </div>
  );
}

// ── Contacts Tab ──────────────────────────────────────────────────────────────
const CONTACT_ROLES = ['conveyancer', 'broker', 'inspector', 'strata_manager', 'selling_agent', 'other'];

function ContactsTab({ dealId, contacts, onRefresh }: { dealId: string; contacts: Contact[]; onRefresh: () => Promise<void> }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ role: 'conveyancer', name: '', company: '', phone: '', email: '', reference: '' });
  const [saving, setSaving] = useState(false);

  async function addContact() {
    setSaving(true);
    await fetch(`/api/deals/${dealId}/contacts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    await onRefresh();
    setAdding(false);
    setForm({ role: 'conveyancer', name: '', company: '', phone: '', email: '', reference: '' });
    setSaving(false);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="pg-btn" onClick={() => setAdding(true)}><Icon name="plus" size={12} />Add contact</button>
      </div>
      {contacts.length === 0 && !adding && (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--pg-text-faint)', fontSize: 13 }}>No contacts yet. Add the conveyancer, broker, or other parties.</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {contacts.map(c => (
          <div key={c.id} className="pg-card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--pg-text-faint)', marginBottom: 6 }}>{c.role.replace(/_/g, ' ')}</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{c.name ?? '—'}</div>
            {c.company && <div style={{ fontSize: 12, color: 'var(--pg-text-dim)', marginTop: 2 }}>{c.company}</div>}
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {c.phone && <a href={`tel:${c.phone}`} style={{ fontSize: 12, color: 'var(--pg-accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="phone" size={11} />{c.phone}</a>}
              {c.email && <a href={`mailto:${c.email}`} style={{ fontSize: 12, color: 'var(--pg-accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="mail" size={11} />{c.email}</a>}
              {c.reference && <div style={{ fontSize: 11.5, color: 'var(--pg-text-faint)' }}>Ref: {c.reference}</div>}
            </div>
          </div>
        ))}
        {adding && (
          <div className="pg-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              style={{ padding: '7px 10px', border: '1px solid var(--pg-border)', borderRadius: 6, background: 'var(--pg-bg)', color: 'var(--pg-text)', fontSize: 12 }}>
              {CONTACT_ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </select>
            {(['name', 'company', 'phone', 'email', 'reference'] as const).map(f => (
              <input key={f} type="text" placeholder={f} value={form[f]} onChange={e => setForm(prev => ({ ...prev, [f]: e.target.value }))}
                style={{ padding: '7px 10px', border: '1px solid var(--pg-border)', borderRadius: 6, background: 'var(--pg-bg)', color: 'var(--pg-text)', fontSize: 12 }} />
            ))}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="pg-btn pg-btn-sm pg-btn-primary" onClick={addContact} disabled={saving}>{saving ? 'Adding…' : 'Add'}</button>
              <button className="pg-btn pg-btn-sm" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Documents Tab ─────────────────────────────────────────────────────────────
function DocumentsTab({
  dealId,
  documents,
  onRefresh,
  dealStatus,
}: {
  dealId: string;
  documents: Document[];
  onRefresh: () => Promise<void>;
  dealStatus: string;
}) {
  const canInvoice = ['under_contract', 'unconditional', 'settled'].includes(dealStatus);

  return (
    <DealDocumentPanel
      dealId={dealId}
      documents={documents}
      onRefresh={onRefresh}
      title="All documents"
      tagFilter={['CMA Report', 'Offer Letter', 'Invoice', 'Contract of Sale', 'Other']}
      allowGenerate={canInvoice ? 'invoice' : null}
    />
  );
}
