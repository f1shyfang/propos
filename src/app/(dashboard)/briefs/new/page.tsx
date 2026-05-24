'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/shared/icon';
import {
  DEAL_BREAKER_OPTIONS,
  EMPTY_BRIEF_FORM,
  MUST_HAVE_OPTIONS,
  PROPERTY_TYPES,
  type BriefFormPayload,
} from '@/lib/brief-field-options';
import { buildBriefMatchesHref } from '@/lib/core-flow-utils';

type BriefForm = BriefFormPayload;

const initial: BriefForm = { ...EMPTY_BRIEF_FORM };

type AiPhase = 'idle' | 'transcribing' | 'parsing';

export default function NewBriefPage() {
  const router = useRouter();
  const [form, setForm] = useState<BriefForm>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiPhase, setAiPhase] = useState<AiPhase>('idle');
  const [aiKeys, setAiKeys] = useState<Set<string>>(new Set());
  const [aiError, setAiError] = useState<string | null>(null);
  const [suburbSuggestions, setSuburbSuggestions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/properties/suburbs')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.suburbs) setSuburbSuggestions(d.suburbs); });
  }, []);

  function set<K extends keyof BriefForm>(key: K, val: BriefForm[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function toggle(key: 'propertyTypes' | 'mustHaves' | 'dealBreakers', val: string) {
    setForm(f => {
      const arr = f[key] as string[];
      return { ...f, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  }

  async function handleAudioFile(file: File) {
    setAiError(null);
    setAiPhase('transcribing');

    try {
      const fd = new FormData();
      fd.append('file', file);
      const transcribeRes = await fetch('/api/intake/transcribe', { method: 'POST', body: fd });
      if (!transcribeRes.ok) {
        const d = await transcribeRes.json();
        throw new Error(d.error ?? 'Transcription failed');
      }
      const { transcript, filename } = await transcribeRes.json();

      setAiPhase('parsing');
      const parseRes = await fetch('/api/intake/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, source: 'audio', originalFilename: filename }),
      });
      if (!parseRes.ok) {
        const d = await parseRes.json();
        throw new Error(d.error ?? 'Parsing failed');
      }
      const { parsed } = await parseRes.json() as { parsed: Partial<BriefFormPayload> };

      const filled = new Set<string>();
      const updates: Partial<BriefForm> = {};
      for (const [k, v] of Object.entries(parsed)) {
        const isEmpty = v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
        if (!isEmpty) {
          (updates as Record<string, unknown>)[k] = v;
          filled.add(k);
        }
      }

      setForm(f => ({ ...f, ...updates }));
      setAiKeys(filled);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Audio processing failed');
    } finally {
      setAiPhase('idle');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const busy = aiPhase !== 'idle';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
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
      if (!res.ok) { setError(data.error ?? 'Save failed'); return; }
      router.push(buildBriefMatchesHref(data.brief.id));
    } finally {
      setSaving(false);
    }
  }

  const aiLabel = (key: string) => aiKeys.has(key)
    ? <Icon name="sparkles" size={11} color="var(--pg-primary)" style={{ marginLeft: 4, verticalAlign: 'middle' }} />
    : null;

  return (
    <form onSubmit={submit} style={{ padding: '40px 32px 80px' }}>
      <a href="/briefs" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--pg-text-faint)', fontSize: 12, textDecoration: 'none', marginBottom: 20 }}>
        <Icon name="chevron-left" size={12} />Back to clients
      </a>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <h1 className="pg-display" style={{ margin: 0, fontSize: 30 }}>New Client</h1>
          <p style={{ margin: '8px 0 0', color: 'var(--pg-text-dim)', fontSize: 14 }}>Fill in the details or upload a call recording to auto-fill.</p>
        </div>
        <button className="pg-btn pg-btn-accent" type="submit" disabled={saving || busy}>
          {saving ? 'Creating…' : 'Create client'}
        </button>
      </div>

      {error && (
        <div className="pg-card-flat" style={{ padding: 14, color: 'var(--pg-red)', marginBottom: 20, fontSize: 13 }}>{error}</div>
      )}

      {/* Audio intake zone */}
      <AudioIntakeZone
        fileInputRef={fileInputRef}
        phase={aiPhase}
        error={aiError}
        onFile={handleAudioFile}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, opacity: busy ? 0.5 : 1, pointerEvents: busy ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
        {/* Client */}
        <Section title="Client">
          <Field label={<>Client name{aiLabel('clientName')}</>}>
            <input className="pg-input" style={{ width: '100%' }} value={form.clientName}
              placeholder="Sarah Chen & Tom Williams"
              onChange={e => set('clientName', e.target.value)} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
            <Field label={<>Email{aiLabel('email')}</>}>
              <input className="pg-input" type="email" style={{ width: '100%' }} value={form.email}
                placeholder="sarah@example.com"
                onChange={e => set('email', e.target.value)} />
            </Field>
            <Field label={<>Phone{aiLabel('phone')}</>}>
              <input className="pg-input" style={{ width: '100%' }} value={form.phone}
                placeholder="0400 000 000"
                onChange={e => set('phone', e.target.value)} />
            </Field>
          </div>
          <Field label="Contact method" style={{ marginTop: 14 }}>
            <ChipGroup values={['email', 'phone', 'sms']} selected={[form.contactMethod]}
              onToggle={v => set('contactMethod', v)} single />
          </Field>
          <Field label="Engagement type" style={{ marginTop: 14 }}>
            <ChipGroup
              values={['full-service', 'sourcing-only', 'negotiation-only']}
              selected={[form.engagementType]}
              onToggle={v => set('engagementType', v)}
              single
              format={v => v.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
            />
          </Field>
        </Section>

        {/* Budget */}
        <Section title="Budget">
          <Field label="Pre-approval status">
            <select className="pg-input" style={{ width: '100%' }} value={form.preApprovalStatus}
              onChange={e => set('preApprovalStatus', e.target.value)}>
              {['Not Started', 'In Progress', 'Pre-Approved', 'Formal Approval', 'Expired'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
            <Field label={<>Min (AUD){aiLabel('budgetMin')}</>}>
              <input className="pg-input" type="number" style={{ width: '100%' }} value={form.budgetMin}
                placeholder="800000" onChange={e => set('budgetMin', e.target.value)} />
            </Field>
            <Field label={<>Max (AUD){aiLabel('budgetMax')}</>}>
              <input className="pg-input" type="number" style={{ width: '100%' }} value={form.budgetMax}
                placeholder="1100000" onChange={e => set('budgetMax', e.target.value)} />
            </Field>
          </div>
          <Field label={<>Buyer type{aiLabel('buyerType')}</>} style={{ marginTop: 14 }}>
            <ChipGroup
              values={['owner-occupier', 'investor', 'first-home buyer', 'upsizer', 'downsizer']}
              selected={[form.buyerType]}
              onToggle={v => set('buyerType', v)}
              single
              format={v => v.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
            />
          </Field>
        </Section>

        {/* Property requirements */}
        <Section title="Property Requirements">
          <Field label={<>Property types{aiLabel('propertyTypes')}</>}>
            <div style={{ marginTop: 6 }}>
              <ChipGroup values={[...PROPERTY_TYPES]} selected={form.propertyTypes}
                onToggle={v => toggle('propertyTypes', v)} />
            </div>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 14 }}>
            <Field label={<>Min beds{aiLabel('minBeds')}</>}>
              <input className="pg-input" type="number" min={0} max={10} style={{ width: '100%' }}
                value={form.minBeds} onChange={e => set('minBeds', Number(e.target.value))} />
            </Field>
            <Field label={<>Min baths{aiLabel('minBaths')}</>}>
              <input className="pg-input" type="number" min={0} max={10} style={{ width: '100%' }}
                value={form.minBaths} onChange={e => set('minBaths', Number(e.target.value))} />
            </Field>
            <Field label={<>Parking{aiLabel('parking')}</>}>
              <select className="pg-input" style={{ width: '100%' }} value={form.parking}
                onChange={e => set('parking', e.target.value)}>
                <option value="required">Required</option>
                <option value="nice_to_have">Nice to have</option>
                <option value="not_needed">Not needed</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* Location */}
        <Section title="Location">
          <Field label={<>Preferred suburbs{aiLabel('suburbs')}</>}>
            <TagInput
              value={form.suburbs.join(', ')}
              placeholder="Search suburbs…"
              suggestions={suburbSuggestions}
              onChange={v => set('suburbs', v.split(',').map(s => s.trim()).filter(Boolean))}
            />
          </Field>
        </Section>

        {/* Must-haves */}
        <Section title="Must-Haves">
          {aiKeys.has('mustHaves') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--pg-primary)', marginBottom: 10 }}>
              <Icon name="sparkles" size={11} />AI extracted
            </div>
          )}
          <SearchableCheckList
            options={MUST_HAVE_OPTIONS.map(o => ({ id: o.id, label: o.label }))}
            selected={form.mustHaves}
            onToggle={v => toggle('mustHaves', v)}
            accentColor="var(--pg-accent)"
          />
        </Section>

        {/* Deal-breakers */}
        <Section title="Deal-Breakers">
          {aiKeys.has('dealBreakers') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--pg-primary)', marginBottom: 10 }}>
              <Icon name="sparkles" size={11} />AI extracted
            </div>
          )}
          <SearchableCheckList
            options={DEAL_BREAKER_OPTIONS.map(o => ({ id: o.id, label: o.label }))}
            selected={form.dealBreakers}
            onToggle={v => toggle('dealBreakers', v)}
            accentColor="var(--pg-red)"
          />
        </Section>

        {/* Strategy */}
        <Section title="Strategy" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
            <Field label={<>Urgency{aiLabel('urgency')}</>}>
              <ChipGroup
                values={['Immediate', '3 months', '6 months', '12 months', 'No fixed timeline']}
                selected={[form.urgency]}
                onToggle={v => set('urgency', v)}
                single
              />
            </Field>
            <Field label={<>Purchase purpose{aiLabel('purchasePurpose')}</>}>
              <ChipGroup
                values={['PPOR', 'Investment', 'SMSF', 'Rentvesting']}
                selected={[form.purchasePurpose]}
                onToggle={v => set('purchasePurpose', v)}
                single
              />
            </Field>
            <Field label="Willing to bid at auction?">
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => set('auctionWillingness', true)}
                  className={`pg-btn ${form.auctionWillingness ? 'pg-btn-accent' : ''}`}>Yes</button>
                <button type="button" onClick={() => set('auctionWillingness', false)}
                  className={`pg-btn ${!form.auctionWillingness ? 'pg-btn-accent' : ''}`}>No</button>
              </div>
            </Field>
          </div>
        </Section>
      </div>
    </form>
  );
}

function AudioIntakeZone({ fileInputRef, phase, error, onFile }: {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  phase: AiPhase;
  error: string | null;
  onFile: (f: File) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const busy = phase !== 'idle';

  const handleFile = useCallback((file: File) => onFile(file), [onFile]);

  const phaseLabel = phase === 'transcribing' ? 'Transcribing audio…' : phase === 'parsing' ? 'Extracting brief fields…' : null;

  return (
    <div style={{ marginBottom: 28 }}>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !busy) fileInputRef.current?.click(); }}
        onDragOver={e => { e.preventDefault(); if (!busy) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setDragOver(false);
          if (busy) return;
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => !busy && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--pg-primary)' : 'var(--pg-border)'}`,
          borderRadius: 12,
          padding: '48px 24px',
          textAlign: 'center' as const,
          cursor: busy ? 'default' : 'pointer',
          background: dragOver ? 'var(--pg-bg-2)' : 'transparent',
          opacity: busy ? 0.75 : 1,
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'var(--pg-bg-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--pg-primary)',
          }}>
            <div className={busy ? 'pg-spin' : ''} style={{ display: 'flex' }}>
              <Icon name="mic" size={24} />
            </div>
          </div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 500 }}>
          {phaseLabel ?? 'AI Call Intake'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--pg-text-dim)', marginTop: 6, maxWidth: 380, margin: '6px auto 0' }}>
          {busy
            ? 'Please wait…'
            : 'Drop a call recording here or click to browse — we\'ll auto-fill the form from the transcript'}
        </div>
        {!busy && (
          <button type="button" className="pg-btn pg-btn-primary" style={{ marginTop: 20 }}
            onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            Upload recording
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".m4a,audio/m4a,audio/mp4,audio/*"
          style={{ display: 'none' }}
          disabled={busy}
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      {error && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--pg-red)', paddingLeft: 4 }}>{error}</div>
      )}
    </div>
  );
}

function Section({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <section className="pg-card-flat" style={{ padding: 20, ...style }}>
      <h2 className="pg-display" style={{ margin: '0 0 16px', fontSize: 17 }}>{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children, style }: { label: React.ReactNode; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <div className="pg-label" style={{ marginBottom: 6, display: 'flex', alignItems: 'center' }}>{label}</div>
      {children}
    </div>
  );
}

function ChipGroup({ values, selected, onToggle, single, format }: {
  values: string[];
  selected: string[];
  onToggle: (v: string) => void;
  single?: boolean;
  format?: (v: string) => string;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {values.map(v => (
        <button key={v} type="button"
          onClick={() => onToggle(v)}
          className={`pg-btn pg-btn-sm ${selected.includes(v) ? 'pg-btn-accent' : ''}`}
          style={{ textTransform: 'capitalize', fontSize: 12 }}>
          {format ? format(v) : v.replace(/_/g, ' ')}
        </button>
      ))}
    </div>
  );
}

function TagInput({
  value,
  onChange,
  placeholder,
  suggestions,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suggestions?: string[];
}) {
  const tags = value.split(',').map(s => s.trim()).filter(Boolean);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = suggestions?.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s),
  ) ?? [];

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    onChange([...tags, trimmed].join(', '));
    setInput('');
    setOpen(false);
  }

  function removeTag(tag: string) {
    onChange(tags.filter(t => t !== tag).join(', '));
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 5, padding: '6px 8px',
        border: '1px solid var(--pg-border)', borderRadius: 8,
        background: 'var(--pg-bg)', minHeight: 38, alignItems: 'center',
      }}>
        {tags.map(t => (
          <span key={t} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px',
            borderRadius: 999, background: 'var(--pg-bg-2)', border: '1px solid var(--pg-border)',
            fontSize: 12, color: 'var(--pg-text)',
          }}>
            {t}
            <button type="button" onMouseDown={e => { e.preventDefault(); removeTag(t); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pg-text-faint)', fontSize: 14, lineHeight: 1, padding: 0 }}>
              ×
            </button>
          </span>
        ))}
        <input
          style={{ flex: 1, minWidth: 80, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--pg-text)', fontFamily: 'var(--pg-font-body)' }}
          placeholder={tags.length === 0 ? placeholder : 'Add…'}
          value={input}
          onChange={e => { setInput(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={e => {
            if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
              e.preventDefault();
              addTag(input);
            }
            if (e.key === 'Backspace' && !input && tags.length) {
              removeTag(tags[tags.length - 1]);
            }
          }}
        />
      </div>
      {open && (filtered.length > 0 || input.trim()) && (
        <div onMouseDown={e => e.preventDefault()} style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
          background: 'var(--pg-surface)', border: '1px solid var(--pg-border)',
          borderRadius: 8, marginTop: 2, maxHeight: 200, overflow: 'auto',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        }}>
          {filtered.map(s => (
            <div key={s} onMouseDown={() => addTag(s)}
              style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', color: 'var(--pg-text)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--pg-bg-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {s}
            </div>
          ))}
          {input.trim() && !filtered.some(s => s.toLowerCase() === input.trim().toLowerCase()) && (
            <div onMouseDown={() => addTag(input)}
              style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', color: 'var(--pg-accent)' }}>
              Add &ldquo;{input.trim()}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchableCheckList({ options, selected, onToggle, accentColor }: {
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  accentColor: string;
}) {
  const [query, setQuery] = useState('');
  const filtered = query.length > 0
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--pg-text-faint)', pointerEvents: 'none' }} />
        <input className="pg-input" style={{ width: '100%', paddingLeft: 30 }}
          value={query} placeholder="Filter…"
          onChange={e => setQuery(e.target.value)} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--pg-text-faint)', padding: '4px 0' }}>No matches</div>
        )}
        {filtered.map(o => (
          <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={selected.includes(o.id)}
              onChange={() => onToggle(o.id)}
              style={{ accentColor }} />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}
