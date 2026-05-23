'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@/components/shared/icon';
import { TopBar } from '@/components/shared/top-bar';
import { calcFollowUpOverdue, SOURCE_TYPES, ACCESS_STATUSES, VENDOR_MOTIVATIONS } from '@/lib/off-market-utils';

interface OffMarketProperty {
  id: number; address: string; suburb: string; state: string | null;
  propertyType: string | null; bedrooms: number | null; bathrooms: number | null;
  priceMin: number | null; priceMax: number | null;
  sourceType: string; accessStatus: string; vendorMotivation: string;
  sellingAgentName: string | null; sellingAgentPhone: string | null;
  howSourced: string | null; internalNotes: string | null;
  confidential: boolean; lastContactedAt: string | null; createdAt: string;
  expectedListingDate: string | null;
}

type Filter = 'all' | 'pre_market' | 'off_market' | 'confidential';

const ACCESS_LABEL: Record<string, string> = {
  not_inspected: 'Not Inspected', inspected: 'Inspected',
  under_negotiation: 'Under Negotiation', sold: 'Sold', lost: 'Lost',
};
const ACCESS_COLOR: Record<string, string> = {
  not_inspected: '', inspected: 'pg-badge-blue',
  under_negotiation: 'pg-badge-amber', sold: 'pg-badge-green', lost: 'pg-badge-red',
};
const MOTIVATION_LABEL: Record<string, string> = {
  highly_motivated: 'Highly Motivated', motivated: 'Motivated',
  testing_market: 'Testing Market', unknown: 'Unknown',
};
const MOTIVATION_COLOR: Record<string, string> = {
  highly_motivated: 'pg-badge-green', motivated: 'pg-badge-blue',
  testing_market: 'pg-badge-amber', unknown: '',
};

function fmtPrice(min: number | null, max: number | null): string {
  if (!min && !max) return '—';
  const f = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}K`;
  if (min && max) return `${f(min)} – ${f(max)}`;
  if (min) return `From ${f(min)}`;
  if (max) return `To ${f(max)}`;
  return '—';
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
}

export default function OffMarketPage() {
  const [properties, setProperties] = useState<OffMarketProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await fetch('/api/off-market');
    if (res.ok) setProperties((await res.json()).properties ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function markContacted(id: number) {
    await fetch(`/api/off-market/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ touchLastContacted: true }),
    });
    load();
  }

  async function deleteProperty(id: number) {
    await fetch(`/api/off-market/${id}`, { method: 'DELETE' });
    setProperties(p => p.filter(x => x.id !== id));
  }

  const filtered = properties.filter(p => {
    if (filter === 'pre_market') return p.expectedListingDate != null;
    if (filter === 'off_market') return p.expectedListingDate == null;
    if (filter === 'confidential') return p.confidential;
    return true;
  });

  const overdueCount = properties.filter(p =>
    calcFollowUpOverdue(p.lastContactedAt ? new Date(p.lastContactedAt) : new Date(0), p.accessStatus as never)
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar
        eyebrow={`${properties.length} properties · ${overdueCount} follow-up${overdueCount !== 1 ? 's' : ''} overdue`}
        title="Off-Market Hub"
        actions={
          <button className="pg-btn pg-btn-primary" onClick={() => setShowForm(true)}>
            <Icon name="plus" size={13} />Add property
          </button>
        }
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }} className="pg-scroll">
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {(['all', 'pre_market', 'off_market', 'confidential'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`pg-btn pg-btn-sm ${filter === f ? 'pg-btn-accent' : 'pg-btn-ghost'}`}
              style={{ fontSize: 12, color: filter === f ? undefined : 'var(--pg-text-dim)' }}>
              {f === 'all' ? 'All' : f === 'pre_market' ? 'Pre-Market' : f === 'off_market' ? 'Off-Market' : 'Confidential'}
            </button>
          ))}
        </div>

        {loading && <div style={{ color: 'var(--pg-text-dim)', fontSize: 13 }}>Loading…</div>}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--pg-text-faint)' }}>
            <Icon name="building" size={36} color="var(--pg-text-very-faint)" />
            <div style={{ fontSize: 15, marginTop: 14, fontWeight: 500 }}>No off-market properties</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Add properties you&apos;ve sourced through your network.</div>
            <button className="pg-btn pg-btn-primary" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>
              Add first property
            </button>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="pg-card-flat" style={{ overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '2.5fr 0.9fr 1fr 0.9fr 1fr 0.8fr',
              padding: '10px 16px', borderBottom: '1px solid var(--pg-border)',
              fontSize: 10.5, color: 'var(--pg-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500,
            }}>
              <span>Property</span><span>Price guide</span><span>Access</span>
              <span>Motivation</span><span>Source</span><span style={{ textAlign: 'right' }}>Last contact</span>
            </div>
            {filtered.map((p, i, a) => {
              const overdue = calcFollowUpOverdue(p.lastContactedAt ? new Date(p.lastContactedAt) : new Date(0), p.accessStatus as never);
              const days = daysSince(p.lastContactedAt);
              return (
                <div key={p.id} style={{
                  display: 'grid', gridTemplateColumns: '2.5fr 0.9fr 1fr 0.9fr 1fr 0.8fr',
                  padding: '12px 16px', alignItems: 'center', fontSize: 13,
                  borderBottom: i < a.length - 1 ? '1px solid var(--pg-border)' : 'none',
                  background: overdue ? 'rgba(239,68,68,0.03)' : undefined,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 500 }} className="pg-truncate">{p.address}</span>
                      {p.confidential && <Icon name="shield" size={11} color="var(--pg-text-faint)" />}
                      {p.expectedListingDate && <span className="pg-badge pg-badge-purple" style={{ fontSize: 10 }}>Pre-market</span>}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--pg-text-dim)' }}>
                      {p.suburb}{p.state ? `, ${p.state}` : ''}
                      {p.bedrooms != null ? ` · ${p.bedrooms}b` : ''}
                      {p.bathrooms != null ? `/${p.bathrooms}ba` : ''}
                    </div>
                    {p.sellingAgentName && (
                      <div style={{ fontSize: 11, color: 'var(--pg-text-faint)', marginTop: 2 }}>
                        Agent: {p.sellingAgentName}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, fontFamily: 'var(--pg-font-mono)' }}>{fmtPrice(p.priceMin, p.priceMax)}</div>
                  <div>
                    <span className={`pg-badge ${ACCESS_COLOR[p.accessStatus] ?? ''}`} style={{ fontSize: 11 }}>
                      {ACCESS_LABEL[p.accessStatus] ?? p.accessStatus}
                    </span>
                  </div>
                  <div>
                    <span className={`pg-badge ${MOTIVATION_COLOR[p.vendorMotivation] ?? ''}`} style={{ fontSize: 11 }}>
                      {MOTIVATION_LABEL[p.vendorMotivation] ?? p.vendorMotivation}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>
                    {p.sourceType.replace(/_/g, ' ')}
                    {p.howSourced && <div style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>{p.howSourced}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11.5, color: overdue ? 'var(--pg-red)' : 'var(--pg-text-faint)' }}>
                      {days === null ? 'Never' : `${days}d ago`}
                      {overdue && ' ⚠'}
                    </div>
                    <button onClick={() => markContacted(p.id)}
                      className="pg-btn pg-btn-sm pg-btn-ghost" style={{ fontSize: 11, marginTop: 4, color: 'var(--pg-accent)', padding: '2px 6px' }}>
                      Mark contacted
                    </button>
                    <button onClick={() => deleteProperty(p.id)}
                      className="pg-btn pg-btn-sm pg-btn-ghost" style={{ fontSize: 11, marginTop: 2, color: 'var(--pg-text-faint)', padding: '2px 6px' }}>
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && <AddOffMarketModal onClose={() => setShowForm(false)} onCreated={() => { load(); setShowForm(false); }} />}
    </div>
  );
}

function AddOffMarketModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    address: '', suburb: '', state: '', propertyType: '', bedrooms: '', bathrooms: '', parkingSpaces: '',
    priceMin: '', priceMax: '', sourceType: 'other', howSourced: '', accessStatus: 'not_inspected',
    vendorMotivation: 'unknown', sellingAgentName: '', sellingAgentPhone: '', sellingAgentEmail: '',
    expectedListingDate: '', internalNotes: '', confidential: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setSaving(true);
    setError('');
    const res = await fetch('/api/off-market', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        parkingSpaces: form.parkingSpaces ? Number(form.parkingSpaces) : null,
        priceMin: form.priceMin ? Number(form.priceMin) : null,
        priceMax: form.priceMax ? Number(form.priceMax) : null,
      }),
    });
    if (res.ok) {
      onCreated();
    } else {
      const d = await res.json();
      setError(d.error ?? 'Failed to save');
      setSaving(false);
    }
  }

  const field = (key: keyof typeof form, label: string, type: string = 'text', placeholder = '') => (
    <div>
      <label style={{ fontSize: 12, color: 'var(--pg-text-dim)', display: 'block', marginBottom: 5 }}>{label}</label>
      <input type={type} value={String(form[key])} onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? e.target.value : e.target.value }))}
        placeholder={placeholder}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--pg-border)', borderRadius: 6, background: 'var(--pg-bg)', color: 'var(--pg-text)', fontSize: 13, boxSizing: 'border-box' }} />
    </div>
  );

  const select = (key: keyof typeof form, label: string, options: readonly string[], labelFn: (s: string) => string = s => s) => (
    <div>
      <label style={{ fontSize: 12, color: 'var(--pg-text-dim)', display: 'block', marginBottom: 5 }}>{label}</label>
      <select value={String(form[key])} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--pg-border)', borderRadius: 6, background: 'var(--pg-bg)', color: 'var(--pg-text)', fontSize: 13 }}>
        {options.map(o => <option key={o} value={o}>{labelFn(o)}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '40px 0' }} onClick={onClose}>
      <div style={{ background: 'var(--pg-bg)', borderRadius: 12, padding: '28px', width: 520, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
        <h2 className="pg-display" style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>Add off-market property</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            {field('address', 'Address *', 'text', '12 Smith St')}
            {field('suburb', 'Suburb *', 'text', 'Richmond')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {field('state', 'State', 'text', 'VIC')}
            {field('bedrooms', 'Bedrooms', 'number', '3')}
            {field('bathrooms', 'Bathrooms', 'number', '2')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {field('priceMin', 'Price min', 'number', '900000')}
            {field('priceMax', 'Price max', 'number', '1100000')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {select('sourceType', 'Source type', SOURCE_TYPES, s => s.replace(/_/g, ' '))}
            {field('howSourced', 'How sourced', 'text', 'Via selling agent at open home')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {select('accessStatus', 'Access status', ACCESS_STATUSES, s => s.replace(/_/g, ' '))}
            {select('vendorMotivation', 'Vendor motivation', VENDOR_MOTIVATIONS, s => s.replace(/_/g, ' '))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {field('sellingAgentName', 'Selling agent name')}
            {field('sellingAgentPhone', 'Phone')}
            {field('sellingAgentEmail', 'Email')}
          </div>
          {field('expectedListingDate', 'Expected listing date (pre-market)', 'date')}
          <div>
            <label style={{ fontSize: 12, color: 'var(--pg-text-dim)', display: 'block', marginBottom: 5 }}>Internal notes</label>
            <textarea value={form.internalNotes} onChange={e => setForm(f => ({ ...f, internalNotes: e.target.value }))}
              rows={3} placeholder="Vendor wants quick settlement, motivated to sell by end of financial year…"
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--pg-border)', borderRadius: 6, background: 'var(--pg-bg)', color: 'var(--pg-text)', fontSize: 13, resize: 'none', boxSizing: 'border-box', fontFamily: 'var(--pg-font-body)' }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.confidential} onChange={e => setForm(f => ({ ...f, confidential: e.target.checked }))} style={{ accentColor: 'var(--pg-accent)' }} />
            Mark as confidential (visible only to you and agency owner)
          </label>
          {error && <div style={{ fontSize: 12, color: 'var(--pg-red)' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
            <button className="pg-btn" onClick={onClose}>Cancel</button>
            <button className="pg-btn pg-btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Adding…' : 'Add property'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
