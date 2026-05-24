'use client';

import { useState } from 'react';
import { Icon } from '@/components/shared/icon';
import {
  BUYER_TYPES,
  CONTACT_METHODS,
  DEAL_BREAKER_OPTIONS,
  ENGAGEMENT_TYPES,
  MUST_HAVE_OPTIONS,
  PRE_APPROVAL_STATUSES,
  PROPERTY_TYPES,
  PURCHASE_PURPOSES,
  SYDNEY_SUBURBS,
  URGENCY_OPTIONS,
  type BriefFormPayload,
} from '@/lib/brief-field-options';

interface ParsedBriefReviewProps {
  form: BriefFormPayload;
  transcript: string;
  missingFields: string[];
  confidence: Record<string, 'high' | 'low'>;
  errors: string[];
  saving: boolean;
  onChange: (form: BriefFormPayload) => void;
  onSave: () => void;
  onBack: () => void;
}

function FormField({ label, error, hint, children }: {
  label: string;
  error?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="pg-label" style={{ marginBottom: 6, color: error ? 'var(--pg-red)' : undefined }}>
        {label}
        {hint && <span style={{ fontWeight: 400, color: 'var(--pg-text-faint)', marginLeft: 8 }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function isLow(field: string, missingFields: string[], confidence: Record<string, 'high' | 'low'>) {
  return missingFields.includes(field) || confidence[field] === 'low';
}

export function ParsedBriefReview({
  form,
  transcript,
  missingFields,
  confidence,
  errors,
  saving,
  onChange,
  onSave,
  onBack,
}: ParsedBriefReviewProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [suburbInput, setSuburbInput] = useState('');

  function set<K extends keyof BriefFormPayload>(key: K, value: BriefFormPayload[K]) {
    onChange({ ...form, [key]: value });
  }

  function toggleArray(key: 'propertyTypes' | 'mustHaves' | 'dealBreakers' | 'suburbs', val: string) {
    const arr = form[key];
    set(key, arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  function addSuburb(name: string) {
    const trimmed = name.trim();
    if (!trimmed || form.suburbs.includes(trimmed)) return;
    set('suburbs', [...form.suburbs, trimmed]);
    setSuburbInput('');
  }

  const suggestions = suburbInput.length >= 2
    ? SYDNEY_SUBURBS.filter((s) => s.toLowerCase().includes(suburbInput.toLowerCase()) && !form.suburbs.includes(s))
    : [];

  const lowStyle = (field: string) => (
    isLow(field, missingFields, confidence)
      ? { borderColor: 'var(--pg-amber, #d97706)', boxShadow: '0 0 0 1px rgba(217,119,6,0.25)' }
      : undefined
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <button
        type="button"
        className="pg-btn"
        onClick={() => setShowTranscript(!showTranscript)}
        style={{ alignSelf: 'flex-start', fontSize: 12 }}
      >
        <Icon name="chevron-down" size={12} style={{ transform: showTranscript ? 'rotate(180deg)' : undefined }} />
        {showTranscript ? 'Hide' : 'Show'} transcript
      </button>
      {showTranscript && (
        <div style={{
          padding: 14,
          background: 'var(--pg-bg-2)',
          borderRadius: 8,
          fontSize: 13,
          lineHeight: 1.6,
          color: 'var(--pg-text-dim)',
          maxHeight: 200,
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
        }}>
          {transcript}
        </div>
      )}

      {missingFields.length > 0 && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(217,119,6,0.08)',
          border: '1px solid rgba(217,119,6,0.25)',
          borderRadius: 8,
          fontSize: 13,
          color: 'var(--pg-text)',
        }}>
          Some fields could not be inferred from the transcript. Please review highlighted fields.
        </div>
      )}

      <section>
        <h2 className="pg-label" style={{ marginBottom: 16, fontSize: 11 }}>Client</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Client name *" error={errors.includes('clientName')} hint={isLow('clientName', missingFields, confidence) ? 'needs review' : undefined}>
            <input className="pg-input" style={{ width: '100%', ...lowStyle('clientName') }}
              value={form.clientName} onChange={(e) => set('clientName', e.target.value)} />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="Email *" error={errors.includes('email')} hint={isLow('email', missingFields, confidence) ? 'needs review' : undefined}>
              <input className="pg-input" type="email" style={{ width: '100%', ...lowStyle('email') }}
                value={form.email} onChange={(e) => set('email', e.target.value)} />
            </FormField>
            <FormField label="Phone *" error={errors.includes('phone')} hint={isLow('phone', missingFields, confidence) ? 'needs review' : undefined}>
              <input className="pg-input" style={{ width: '100%', ...lowStyle('phone') }}
                value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </FormField>
          </div>
          <FormField label="Contact method">
            <div style={{ display: 'flex', gap: 8 }}>
              {CONTACT_METHODS.map((m) => (
                <button key={m} type="button" onClick={() => set('contactMethod', m)}
                  className={`pg-btn ${form.contactMethod === m ? 'pg-btn-accent' : ''}`}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Engagement type">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ENGAGEMENT_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => set('engagementType', t)}
                  className={`pg-btn ${form.engagementType === t ? 'pg-btn-accent' : ''}`} style={{ fontSize: 12 }}>
                  {t.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </button>
              ))}
            </div>
          </FormField>
        </div>
      </section>

      <section>
        <h2 className="pg-label" style={{ marginBottom: 16, fontSize: 11 }}>Budget & finance</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Pre-approval status">
            <select className="pg-input" style={{ width: '100%' }} value={form.preApprovalStatus}
              onChange={(e) => set('preApprovalStatus', e.target.value)}>
              {PRE_APPROVAL_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="Budget min (AUD) *" error={errors.includes('budgetMin') || errors.includes('budgetRange')}>
              <input className="pg-input" type="number" style={{ width: '100%', ...lowStyle('budgetMin') }}
                value={form.budgetMin} onChange={(e) => set('budgetMin', e.target.value)} />
            </FormField>
            <FormField label="Budget max (AUD) *" error={errors.includes('budgetMax') || errors.includes('budgetRange')}>
              <input className="pg-input" type="number" style={{ width: '100%', ...lowStyle('budgetMax') }}
                value={form.budgetMax} onChange={(e) => set('budgetMax', e.target.value)} />
            </FormField>
          </div>
          <FormField label="Buyer type">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {BUYER_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => set('buyerType', t)}
                  className={`pg-btn ${form.buyerType === t ? 'pg-btn-accent' : ''}`} style={{ fontSize: 12 }}>
                  {t.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </button>
              ))}
            </div>
          </FormField>
        </div>
      </section>

      <section>
        <h2 className="pg-label" style={{ marginBottom: 16, fontSize: 11 }}>Property requirements</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Property types *" error={errors.includes('propertyTypes')}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PROPERTY_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => toggleArray('propertyTypes', t)}
                  className={`pg-btn ${form.propertyTypes.includes(t) ? 'pg-btn-accent' : ''}`}>
                  {t}
                </button>
              ))}
            </div>
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <FormField label="Min bedrooms">
              <input className="pg-input" type="number" min={0} max={10} style={{ width: '100%' }}
                value={form.minBeds} onChange={(e) => set('minBeds', Number(e.target.value))} />
            </FormField>
            <FormField label="Min bathrooms">
              <input className="pg-input" type="number" min={0} max={10} style={{ width: '100%' }}
                value={form.minBaths} onChange={(e) => set('minBaths', Number(e.target.value))} />
            </FormField>
            <FormField label="Parking">
              <select className="pg-input" style={{ width: '100%' }} value={form.parking}
                onChange={(e) => set('parking', e.target.value)}>
                <option value="required">Required</option>
                <option value="nice_to_have">Nice to have</option>
                <option value="not_needed">Not needed</option>
              </select>
            </FormField>
          </div>
        </div>
      </section>

      <section>
        <h2 className="pg-label" style={{ marginBottom: 16, fontSize: 11 }}>Location</h2>
        <FormField label="Suburbs *" error={errors.includes('suburbs')}>
          <div style={{ position: 'relative' }}>
            <input className="pg-input" style={{ width: '100%', ...lowStyle('suburbs') }}
              value={suburbInput} placeholder="Search suburbs…"
              onChange={(e) => setSuburbInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (suggestions[0]) addSuburb(suggestions[0]);
                  else addSuburb(suburbInput);
                }
              }}
            />
            {suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'var(--pg-surface)', border: '1px solid var(--pg-border)',
                borderRadius: 8, marginTop: 4, zIndex: 10, overflow: 'hidden',
              }}>
                {suggestions.slice(0, 6).map((s) => (
                  <button key={s} type="button" onClick={() => addSuburb(s)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
                    className="pg-row">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          {form.suburbs.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {form.suburbs.map((s) => (
                <span key={s} className="pg-badge pg-badge-blue" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                  {s}
                  <button type="button" onClick={() => toggleArray('suburbs', s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    <Icon name="x" size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </FormField>
      </section>

      <section>
        <h2 className="pg-label" style={{ marginBottom: 16, fontSize: 11 }}>Preferences</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div>
            <div className="pg-label" style={{ marginBottom: 12 }}>Must-haves</div>
            {MUST_HAVE_OPTIONS.map((o) => (
              <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, marginBottom: 8 }}>
                <input type="checkbox" checked={form.mustHaves.includes(o.id)}
                  onChange={() => toggleArray('mustHaves', o.id)} style={{ accentColor: 'var(--pg-accent)' }} />
                {o.label}
              </label>
            ))}
          </div>
          <div>
            <div className="pg-label" style={{ marginBottom: 12 }}>Deal-breakers</div>
            {DEAL_BREAKER_OPTIONS.map((o) => (
              <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, marginBottom: 8 }}>
                <input type="checkbox" checked={form.dealBreakers.includes(o.id)}
                  onChange={() => toggleArray('dealBreakers', o.id)} style={{ accentColor: 'var(--pg-red)' }} />
                {o.label}
              </label>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
          <FormField label="Urgency">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {URGENCY_OPTIONS.map((u) => (
                <button key={u} type="button" onClick={() => set('urgency', u)}
                  className={`pg-btn ${form.urgency === u ? 'pg-btn-accent' : ''}`} style={{ fontSize: 12 }}>
                  {u}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Purchase purpose">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PURCHASE_PURPOSES.map((p) => (
                <button key={p} type="button" onClick={() => set('purchasePurpose', p)}
                  className={`pg-btn ${form.purchasePurpose === p ? 'pg-btn-accent' : ''}`}>
                  {p}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Willing to buy at auction?">
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => set('auctionWillingness', true)}
                className={`pg-btn ${form.auctionWillingness ? 'pg-btn-accent' : ''}`}>Yes</button>
              <button type="button" onClick={() => set('auctionWillingness', false)}
                className={`pg-btn ${!form.auctionWillingness ? 'pg-btn-accent' : ''}`}>No</button>
            </div>
          </FormField>
        </div>
      </section>

      {errors.length > 0 && (
        <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13, color: 'var(--pg-red)' }}>
          Please fix the highlighted fields before saving.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8 }}>
        <button type="button" className="pg-btn" onClick={onBack} disabled={saving}>
          <Icon name="chevron-left" size={12} />Back
        </button>
        <button type="button" className="pg-btn pg-btn-accent" onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Create client'}
        </button>
      </div>
    </div>
  );
}
