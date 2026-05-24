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
    <div className="flex flex-col h-full bg-[var(--pg-surface)]">
      <TopBar
        eyebrow={`${properties.length} properties · ${overdueCount} follow-up${overdueCount !== 1 ? 's' : ''} overdue`}
        title="Off-Market Hub"
        actions={
          <button className="pg-btn pg-btn-primary shadow-sm hover:shadow-md transition-all duration-200" onClick={() => setShowForm(true)}>
            <Icon name="plus" size={13} />Add property
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-6 md:p-8 pg-scroll">
        {/* Filter bar */}
        <div className="flex gap-2 mb-6">
          {(['all', 'pre_market', 'off_market', 'confidential'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`pg-btn pg-btn-sm transition-colors duration-200 ${filter === f ? 'pg-btn-accent shadow-sm' : 'pg-btn-ghost text-[var(--pg-text-dim)]'}`}
            >
              {f === 'all' ? 'All' : f === 'pre_market' ? 'Pre-Market' : f === 'off_market' ? 'Off-Market' : 'Confidential'}
            </button>
          ))}
        </div>

        {loading && <div className="text-[var(--pg-text-dim)] text-sm animate-pulse">Loading…</div>}

        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center text-[var(--pg-text-faint)] border border-dashed border-[var(--pg-border)] rounded-xl">
            <div className="flex justify-center mb-3 text-[var(--pg-text-very-faint)]"><Icon name="building" size={36} /></div>
            <div className="text-[15px] font-medium text-[var(--pg-text-dim)]">No off-market properties</div>
            <div className="text-[13px] mt-1 text-[var(--pg-text-faint)]">Add properties you&apos;ve sourced through your network.</div>
            <button className="pg-btn pg-btn-primary mt-4 mx-auto shadow-sm" onClick={() => setShowForm(true)}>
              Add first property
            </button>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="pg-card p-0 overflow-hidden shadow-sm">
            <div className="grid grid-cols-[2.5fr_0.9fr_1fr_0.9fr_1fr_0.8fr] px-4 py-3 border-b border-[var(--pg-border)] text-[10.5px] text-[var(--pg-text-faint)] uppercase tracking-wider font-medium bg-[var(--pg-bg-offset)]">
              <span>Property</span><span>Price guide</span><span>Access</span>
              <span>Motivation</span><span>Source</span><span className="text-right">Last contact</span>
            </div>
            {filtered.map((p, i, a) => {
              const overdue = calcFollowUpOverdue(p.lastContactedAt ? new Date(p.lastContactedAt) : new Date(0), p.accessStatus as never);
              const days = daysSince(p.lastContactedAt);
              return (
                <div key={p.id} className={`grid grid-cols-[2.5fr_0.9fr_1fr_0.9fr_1fr_0.8fr] px-4 py-3 items-center text-[13px] hover:bg-[var(--pg-bg-offset)] transition-colors duration-150 ${i < a.length - 1 ? 'border-b border-[var(--pg-border)]' : ''} ${overdue ? 'bg-red-50/50' : ''}`}>
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium pg-truncate">{p.address}</span>
                      {p.confidential && <Icon name="shield" size={11} className="text-[var(--pg-text-faint)]" />}
                      {p.expectedListingDate && <span className="pg-badge pg-badge-purple text-[10px]">Pre-market</span>}
                    </div>
                    <div className="text-[11.5px] text-[var(--pg-text-dim)] mt-0.5">
                      {p.suburb}{p.state ? `, ${p.state}` : ''}
                      {p.bedrooms != null ? ` · ${p.bedrooms}b` : ''}
                      {p.bathrooms != null ? `/${p.bathrooms}ba` : ''}
                    </div>
                    {p.sellingAgentName && (
                      <div className="text-[11px] text-[var(--pg-text-faint)] mt-1">
                        Agent: {p.sellingAgentName}
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-mono">{fmtPrice(p.priceMin, p.priceMax)}</div>
                  <div>
                    <span className={`pg-badge text-[11px] ${ACCESS_COLOR[p.accessStatus] ?? ''}`}>
                      {ACCESS_LABEL[p.accessStatus] ?? p.accessStatus}
                    </span>
                  </div>
                  <div>
                    <span className={`pg-badge text-[11px] ${MOTIVATION_COLOR[p.vendorMotivation] ?? ''}`}>
                      {MOTIVATION_LABEL[p.vendorMotivation] ?? p.vendorMotivation}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--pg-text-dim)] pr-2">
                    {p.sourceType.replace(/_/g, ' ')}
                    {p.howSourced && <div className="text-[11px] text-[var(--pg-text-faint)] mt-0.5">{p.howSourced}</div>}
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <div className={`text-[11.5px] ${overdue ? 'text-[var(--pg-red)] font-medium' : 'text-[var(--pg-text-faint)]'}`}>
                      {days === null ? 'Never' : `${days}d ago`}
                      {overdue && ' ⚠'}
                    </div>
                    <button onClick={() => markContacted(p.id)} className="pg-btn pg-btn-sm pg-btn-ghost text-[11px] text-[var(--pg-accent)] px-1.5 py-0.5 hover:bg-[var(--pg-bg-2)] transition-colors">
                      Mark contacted
                    </button>
                    <button onClick={() => deleteProperty(p.id)} className="pg-btn pg-btn-sm pg-btn-ghost text-[11px] text-[var(--pg-text-faint)] px-1.5 py-0.5 hover:bg-[var(--pg-bg-2)] transition-colors">
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

  async function save(e?: React.FormEvent) {
    if (e) e.preventDefault();
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
      <label className="block text-xs text-[var(--pg-text-dim)] mb-1.5">{label}</label>
      <input type={type} value={String(form[key])} onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? e.target.value : e.target.value }))}
        placeholder={placeholder} required={label.includes('*')}
        className="w-full px-3 py-2 border border-[var(--pg-border)] rounded-md bg-[var(--pg-bg)] text-[var(--pg-text)] text-[13px] focus:outline-none focus:ring-1 focus:ring-[var(--pg-primary)] focus:border-[var(--pg-primary)] transition-shadow" />
    </div>
  );

  const select = (key: keyof typeof form, label: string, options: readonly string[], labelFn: (s: string) => string = s => s) => (
    <div>
      <label className="block text-xs text-[var(--pg-text-dim)] mb-1.5">{label}</label>
      <select value={String(form[key])} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full px-3 py-2 border border-[var(--pg-border)] rounded-md bg-[var(--pg-bg)] text-[var(--pg-text)] text-[13px] focus:outline-none focus:ring-1 focus:ring-[var(--pg-primary)] focus:border-[var(--pg-primary)] transition-shadow">
        {options.map(o => <option key={o} value={o}>{labelFn(o)}</option>)}
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-[1000] flex items-start justify-center overflow-y-auto py-10 backdrop-blur-sm transition-all" onClick={onClose}>
      <div className="bg-[var(--pg-bg)] rounded-xl p-8 w-[520px] max-w-[90vw] shadow-2xl m-auto" onClick={e => e.stopPropagation()}>
        <h2 className="pg-display m-0 mb-6 text-xl font-semibold">Add off-market property</h2>
        
        {/* Converted to a semantic form */}
        <form onSubmit={save} className="flex flex-col gap-4">
          <div className="grid grid-cols-[2fr_1fr] gap-3">
            {field('address', 'Address *', 'text', '12 Smith St')}
            {field('suburb', 'Suburb *', 'text', 'Richmond')}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {field('state', 'State', 'text', 'VIC')}
            {field('bedrooms', 'Bedrooms', 'number', '3')}
            {field('bathrooms', 'Bathrooms', 'number', '2')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field('priceMin', 'Price min', 'number', '900000')}
            {field('priceMax', 'Price max', 'number', '1100000')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {select('sourceType', 'Source type', SOURCE_TYPES, s => s.replace(/_/g, ' '))}
            {field('howSourced', 'How sourced', 'text', 'Via selling agent at open home')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {select('accessStatus', 'Access status', ACCESS_STATUSES, s => s.replace(/_/g, ' '))}
            {select('vendorMotivation', 'Vendor motivation', VENDOR_MOTIVATIONS, s => s.replace(/_/g, ' '))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {field('sellingAgentName', 'Selling agent name')}
            {field('sellingAgentPhone', 'Phone')}
            {field('sellingAgentEmail', 'Email')}
          </div>
          {field('expectedListingDate', 'Expected listing date (pre-market)', 'date')}
          <div>
            <label className="block text-xs text-[var(--pg-text-dim)] mb-1.5">Internal notes</label>
            <textarea value={form.internalNotes} onChange={e => setForm(f => ({ ...f, internalNotes: e.target.value }))}
              rows={3} placeholder="Vendor wants quick settlement, motivated to sell by end of financial year…"
              className="w-full px-3 py-2 border border-[var(--pg-border)] rounded-md bg-[var(--pg-bg)] text-[var(--pg-text)] text-[13px] resize-y font-sans focus:outline-none focus:ring-1 focus:ring-[var(--pg-primary)] focus:border-[var(--pg-primary)] transition-shadow" />
          </div>
          <label className="flex items-center gap-2 text-[13px] cursor-pointer mt-1 group">
            <input type="checkbox" checked={form.confidential} onChange={e => setForm(f => ({ ...f, confidential: e.target.checked }))} className="accent-[var(--pg-accent)] w-4 h-4 rounded border-gray-300 focus:ring-[var(--pg-accent)]" />
            <span className="group-hover:text-[var(--pg-text)] transition-colors">Mark as confidential (visible only to you and agency owner)</span>
          </label>
          
          {error && <div className="text-xs text-[var(--pg-red)] bg-red-50 p-2 rounded">{error}</div>}
          
          <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-[var(--pg-border)]">
            <button type="button" className="pg-btn hover:bg-[var(--pg-bg-offset)] transition-colors" onClick={onClose}>Cancel</button>
            <button type="submit" className="pg-btn pg-btn-primary shadow-sm hover:shadow-md transition-all duration-200" disabled={saving}>
              {saving ? 'Adding…' : 'Add property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
