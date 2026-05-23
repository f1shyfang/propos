'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/shared/icon';
import { validateStep1, validateStep2, validateStep3, validateStep4 } from '@/lib/brief-validation';

const STEPS = [
  'Client Info',
  'Budget & Finance',
  'Property Requirements',
  'Location',
  'Must-Haves',
  'Strategy',
];

const PROPERTY_TYPES = ['House', 'Apartment', 'Townhouse', 'Villa Unit', 'Duplex', 'Acreage', 'Vacant Land'];
const MUST_HAVE_OPTIONS = [
  { id: 'natural_light', label: 'Natural light' },
  { id: 'near_transport', label: 'Near public transport' },
  { id: 'internal_laundry', label: 'Internal laundry' },
  { id: 'garage', label: 'Garage / off-street parking' },
  { id: 'north_facing', label: 'North-facing aspect' },
  { id: 'backyard', label: 'Backyard / outdoor area' },
  { id: 'school_zone', label: 'School catchment zone' },
  { id: 'granny_flat', label: 'Granny flat potential' },
];
const DEAL_BREAKER_OPTIONS = [
  { id: 'ground_floor', label: 'Ground floor' },
  { id: 'main_road', label: 'Main road frontage' },
  { id: 'no_balcony', label: 'No balcony (apartment)' },
  { id: 'cladding', label: 'Cladding issues' },
  { id: 'high_strata', label: 'High strata fees' },
  { id: 'west_facing', label: 'West-facing living areas' },
];
const SYDNEY_SUBURBS = [
  'Surry Hills', 'Newtown', 'Pyrmont', 'Redfern', 'Darlinghurst',
  'Paddington', 'Glebe', 'Rozelle', 'Marrickville', 'Randwick',
  'Lane Cove', 'Mosman', 'Manly', 'Parramatta', 'Homebush',
  'Ryde', 'Canterbury', 'Liverpool', 'Dulwich Hill', 'Caulfield',
  'Hawthorn', 'Richmond', 'Fitzroy', 'Collingwood', 'South Yarra',
];

type BriefForm = {
  clientName: string; email: string; phone: string; contactMethod: string;
  engagementType: string;
  preApprovalStatus: string; budgetMin: string; budgetMax: string; buyerType: string;
  propertyTypes: string[]; minBeds: number; minBaths: number; parking: string;
  suburbs: string[]; suburbInput: string;
  mustHaves: string[]; dealBreakers: string[];
  urgency: string; purchasePurpose: string; auctionWillingness: boolean;
};

const initial: BriefForm = {
  clientName: '', email: '', phone: '', contactMethod: 'email', engagementType: 'full-service',
  preApprovalStatus: 'Not Started', budgetMin: '', budgetMax: '', buyerType: 'owner-occupier',
  propertyTypes: [], minBeds: 2, minBaths: 1, parking: 'nice_to_have',
  suburbs: [], suburbInput: '',
  mustHaves: [], dealBreakers: [],
  urgency: '3 months', purchasePurpose: 'PPOR', auctionWillingness: true,
};

export default function NewBriefPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<BriefForm>(initial);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggle<K extends keyof BriefForm>(key: K, val: string) {
    setForm(f => {
      const arr = f[key] as string[];
      return { ...f, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  }

  function addSuburb(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setForm(f => ({ ...f, suburbs: f.suburbs.includes(trimmed) ? f.suburbs : [...f.suburbs, trimmed], suburbInput: '' }));
  }

  function validateCurrent(): boolean {
    let result = { valid: true, errors: [] as string[] };
    if (step === 0) result = validateStep1({ clientName: form.clientName, email: form.email, phone: form.phone });
    if (step === 1) result = validateStep2({ budgetMin: Number(form.budgetMin), budgetMax: Number(form.budgetMax) });
    if (step === 2) result = validateStep3({ propertyTypes: form.propertyTypes, minBeds: form.minBeds, minBaths: form.minBaths });
    if (step === 3) result = validateStep4({ suburbs: form.suburbs });
    setErrors(result.errors);
    return result.valid;
  }

  async function handleNext() {
    if (!validateCurrent()) return;
    if (step < STEPS.length - 1) { setStep(s => s + 1); setErrors([]); return; }
    // Submit
    setSaving(true);
    try {
      const res = await fetch('/api/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: form.clientName, email: form.email, phone: form.phone,
          contactMethod: form.contactMethod, engagementType: form.engagementType,
          preApprovalStatus: form.preApprovalStatus,
          budgetMin: Number(form.budgetMin) || null,
          budgetMax: Number(form.budgetMax) || null,
          buyerType: form.buyerType,
          propertyTypes: form.propertyTypes,
          minBeds: form.minBeds, minBaths: form.minBaths, parking: form.parking,
          suburbs: form.suburbs,
          mustHaves: form.mustHaves, dealBreakers: form.dealBreakers,
          urgency: form.urgency, purchasePurpose: form.purchasePurpose,
          auctionWillingness: form.auctionWillingness,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErrors([data.error ?? 'Save failed']); return; }
      router.push(`/briefs/${data.brief.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <a href="/briefs" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--pg-text-faint)', fontSize: 12.5, textDecoration: 'none', marginBottom: 16 }}>
          <Icon name="chevron-left" size={12} />Back to briefs
        </a>
        <h1 className="pg-display" style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>New Buyer Brief</h1>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--pg-text-dim)' }}>Capture everything you need to find the perfect property.</p>
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 36 }}>
        {STEPS.map((s, i) => (
          <button key={i} onClick={() => { if (i < step) { setStep(i); setErrors([]); } }}
            style={{
              flex: 1, height: 4, borderRadius: 999, border: 'none', cursor: i < step ? 'pointer' : 'default',
              background: i < step ? 'var(--pg-accent)' : i === step ? 'var(--pg-text)' : 'var(--pg-border)',
              transition: 'background 0.2s',
            }} title={s}
          />
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--pg-text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 24 }}>
        Step {step + 1} of {STEPS.length} — {STEPS[step]}
      </div>

      {/* Step content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {step === 0 && (
          <StepClientInfo form={form} setForm={setForm} errors={errors} />
        )}
        {step === 1 && (
          <StepBudget form={form} setForm={setForm} errors={errors} />
        )}
        {step === 2 && (
          <StepPropertyReqs form={form} setForm={setForm} errors={errors} toggle={toggle} />
        )}
        {step === 3 && (
          <StepLocation form={form} setForm={setForm} errors={errors} addSuburb={addSuburb} toggle={toggle} />
        )}
        {step === 4 && (
          <StepMustHaves form={form} toggle={toggle} />
        )}
        {step === 5 && (
          <StepStrategy form={form} setForm={setForm} />
        )}
      </div>

      {errors.length > 0 && (
        <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13, color: 'var(--pg-red)' }}>
          Please fix the highlighted fields before continuing.
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
        <button className="pg-btn" onClick={() => { setStep(s => s - 1); setErrors([]); }} disabled={step === 0}>
          <Icon name="chevron-left" size={12} />Back
        </button>
        <button className="pg-btn pg-btn-accent" onClick={handleNext} disabled={saving}>
          {step === STEPS.length - 1 ? (saving ? 'Saving…' : 'Create brief') : 'Continue'}
          {step < STEPS.length - 1 && <Icon name="chevron-right" size={12} />}
        </button>
      </div>
    </div>
  );
}

function FormField({ label, error, children }: { label: string; error?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="pg-label" style={{ marginBottom: 6, color: error ? 'var(--pg-red)' : undefined }}>{label}</div>
      {children}
    </div>
  );
}

function StepClientInfo({ form, setForm, errors }: { form: BriefForm; setForm: React.Dispatch<React.SetStateAction<BriefForm>>; errors: string[] }) {
  return (
    <>
      <FormField label="Client name *" error={errors.includes('clientName')}>
        <input className="pg-input" style={{ width: '100%', borderColor: errors.includes('clientName') ? 'var(--pg-red)' : undefined }}
          value={form.clientName} placeholder="Sarah Chen & Tom Williams"
          onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
      </FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormField label="Email *" error={errors.includes('email')}>
          <input className="pg-input" type="email" style={{ width: '100%', borderColor: errors.includes('email') ? 'var(--pg-red)' : undefined }}
            value={form.email} placeholder="sarah@example.com"
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </FormField>
        <FormField label="Phone *" error={errors.includes('phone')}>
          <input className="pg-input" style={{ width: '100%', borderColor: errors.includes('phone') ? 'var(--pg-red)' : undefined }}
            value={form.phone} placeholder="0400 000 000"
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </FormField>
      </div>
      <FormField label="Preferred contact method">
        <div style={{ display: 'flex', gap: 8 }}>
          {['email', 'phone', 'sms'].map(m => (
            <button key={m} onClick={() => setForm(f => ({ ...f, contactMethod: m }))}
              className={`pg-btn ${form.contactMethod === m ? 'pg-btn-accent' : ''}`}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </FormField>
      <FormField label="Engagement type">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['full-service', 'sourcing-only', 'negotiation-only'].map(t => (
            <button key={t} onClick={() => setForm(f => ({ ...f, engagementType: t }))}
              className={`pg-btn ${form.engagementType === t ? 'pg-btn-accent' : ''}`}
              style={{ fontSize: 12 }}>
              {t.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </FormField>
    </>
  );
}

function StepBudget({ form, setForm, errors }: { form: BriefForm; setForm: React.Dispatch<React.SetStateAction<BriefForm>>; errors: string[] }) {
  return (
    <>
      <FormField label="Pre-approval status">
        <select className="pg-input" style={{ width: '100%' }} value={form.preApprovalStatus}
          onChange={e => setForm(f => ({ ...f, preApprovalStatus: e.target.value }))}>
          {['Not Started', 'In Progress', 'Pre-Approved', 'Formal Approval', 'Expired'].map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormField label="Budget minimum (AUD) *" error={errors.includes('budgetMin') || errors.includes('budgetRange')}>
          <input className="pg-input" type="number" style={{ width: '100%', borderColor: errors.includes('budgetMin') ? 'var(--pg-red)' : undefined }}
            value={form.budgetMin} placeholder="800000"
            onChange={e => setForm(f => ({ ...f, budgetMin: e.target.value }))} />
        </FormField>
        <FormField label="Budget maximum (AUD) *" error={errors.includes('budgetMax') || errors.includes('budgetRange')}>
          <input className="pg-input" type="number" style={{ width: '100%', borderColor: errors.includes('budgetMax') ? 'var(--pg-red)' : undefined }}
            value={form.budgetMax} placeholder="1100000"
            onChange={e => setForm(f => ({ ...f, budgetMax: e.target.value }))} />
        </FormField>
      </div>
      {errors.includes('budgetRange') && (
        <div style={{ fontSize: 12, color: 'var(--pg-red)' }}>Budget minimum must be less than maximum.</div>
      )}
      <FormField label="Buyer type">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['owner-occupier', 'investor', 'first-home buyer', 'upsizer', 'downsizer'].map(t => (
            <button key={t} onClick={() => setForm(f => ({ ...f, buyerType: t }))}
              className={`pg-btn ${form.buyerType === t ? 'pg-btn-accent' : ''}`}
              style={{ fontSize: 12 }}>
              {t.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </FormField>
    </>
  );
}

function StepPropertyReqs({ form, setForm, errors, toggle }: {
  form: BriefForm; setForm: React.Dispatch<React.SetStateAction<BriefForm>>;
  errors: string[]; toggle: (key: keyof BriefForm, val: string) => void;
}) {
  return (
    <>
      <FormField label="Property types *" error={errors.includes('propertyTypes')}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PROPERTY_TYPES.map(t => (
            <button key={t} onClick={() => toggle('propertyTypes', t)}
              className={`pg-btn ${form.propertyTypes.includes(t) ? 'pg-btn-accent' : ''}`}
              style={{ borderColor: errors.includes('propertyTypes') && !form.propertyTypes.includes(t) ? 'var(--pg-red)' : undefined }}>
              {t}
            </button>
          ))}
        </div>
      </FormField>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <FormField label="Min bedrooms">
          <input className="pg-input" type="number" min={0} max={10} style={{ width: '100%' }}
            value={form.minBeds} onChange={e => setForm(f => ({ ...f, minBeds: Number(e.target.value) }))} />
        </FormField>
        <FormField label="Min bathrooms">
          <input className="pg-input" type="number" min={0} max={10} style={{ width: '100%' }}
            value={form.minBaths} onChange={e => setForm(f => ({ ...f, minBaths: Number(e.target.value) }))} />
        </FormField>
        <FormField label="Parking">
          <select className="pg-input" style={{ width: '100%' }} value={form.parking}
            onChange={e => setForm(f => ({ ...f, parking: e.target.value }))}>
            <option value="required">Required</option>
            <option value="nice_to_have">Nice to have</option>
            <option value="not_needed">Not needed</option>
          </select>
        </FormField>
      </div>
    </>
  );
}

function StepLocation({ form, setForm, errors, addSuburb, toggle }: {
  form: BriefForm; setForm: React.Dispatch<React.SetStateAction<BriefForm>>;
  errors: string[]; addSuburb: (s: string) => void;
  toggle: (key: keyof BriefForm, val: string) => void;
}) {
  const suggestions = form.suburbInput.length >= 2
    ? SYDNEY_SUBURBS.filter(s => s.toLowerCase().includes(form.suburbInput.toLowerCase()) && !form.suburbs.includes(s))
    : [];

  return (
    <>
      <FormField label="Suburbs of interest *" error={errors.includes('suburbs')}>
        <div style={{ position: 'relative' }}>
          <input className="pg-input" style={{ width: '100%', borderColor: errors.includes('suburbs') ? 'var(--pg-red)' : undefined }}
            value={form.suburbInput} placeholder="Search suburbs…"
            onChange={e => setForm(f => ({ ...f, suburbInput: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (suggestions[0]) addSuburb(suggestions[0]); else addSuburb(form.suburbInput); } }}
          />
          {suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--pg-surface)', border: '1px solid var(--pg-border)', borderRadius: 8, marginTop: 4, zIndex: 10, overflow: 'hidden' }}>
              {suggestions.slice(0, 6).map(s => (
                <button key={s} onClick={() => addSuburb(s)}
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
            {form.suburbs.map(s => (
              <span key={s} className="pg-badge pg-badge-blue" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                {s}
                <button onClick={() => toggle('suburbs', s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', lineHeight: 1 }}>
                  <Icon name="x" size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
      </FormField>
    </>
  );
}

function StepMustHaves({ form, toggle }: { form: BriefForm; toggle: (key: keyof BriefForm, val: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
      <div>
        <div className="pg-label" style={{ marginBottom: 12 }}>Must-haves</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MUST_HAVE_OPTIONS.map(o => (
            <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={form.mustHaves.includes(o.id)}
                onChange={() => toggle('mustHaves', o.id)}
                style={{ accentColor: 'var(--pg-accent)' }} />
              {o.label}
            </label>
          ))}
        </div>
      </div>
      <div>
        <div className="pg-label" style={{ marginBottom: 12 }}>Deal-breakers</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DEAL_BREAKER_OPTIONS.map(o => (
            <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={form.dealBreakers.includes(o.id)}
                onChange={() => toggle('dealBreakers', o.id)}
                style={{ accentColor: 'var(--pg-red)' }} />
              {o.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepStrategy({ form, setForm }: { form: BriefForm; setForm: React.Dispatch<React.SetStateAction<BriefForm>> }) {
  return (
    <>
      <FormField label="Urgency">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Immediate', '3 months', '6 months', '12 months', 'No fixed timeline'].map(u => (
            <button key={u} onClick={() => setForm(f => ({ ...f, urgency: u }))}
              className={`pg-btn ${form.urgency === u ? 'pg-btn-accent' : ''}`}
              style={{ fontSize: 12 }}>
              {u}
            </button>
          ))}
        </div>
      </FormField>
      <FormField label="Purchase purpose">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['PPOR', 'Investment', 'SMSF', 'Rentvesting'].map(p => (
            <button key={p} onClick={() => setForm(f => ({ ...f, purchasePurpose: p }))}
              className={`pg-btn ${form.purchasePurpose === p ? 'pg-btn-accent' : ''}`}>
              {p}
            </button>
          ))}
        </div>
      </FormField>
      <FormField label="Willing to buy at auction?">
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setForm(f => ({ ...f, auctionWillingness: true }))}
            className={`pg-btn ${form.auctionWillingness ? 'pg-btn-accent' : ''}`}>Yes</button>
          <button onClick={() => setForm(f => ({ ...f, auctionWillingness: false }))}
            className={`pg-btn ${!form.auctionWillingness ? 'pg-btn-accent' : ''}`}>No</button>
        </div>
      </FormField>
    </>
  );
}
