'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/shared/icon';
import { IntakeDropzone } from '@/components/intake/intake-dropzone';
import { TranscriptInput } from '@/components/intake/transcript-input';
import { ParsedBriefReview } from '@/components/intake/parsed-brief-review';
import { EMPTY_BRIEF_FORM, type BriefFormPayload } from '@/lib/brief-field-options';
import { validateBriefForm } from '@/lib/intake/validate-brief-form';

type Tab = 'audio' | 'text';
type Phase = 'input' | 'transcribing' | 'parsing' | 'review';

export default function IntakePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('audio');
  const [phase, setPhase] = useState<Phase>('input');
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [form, setForm] = useState<BriefFormPayload>(EMPTY_BRIEF_FORM);
  const [intakeId, setIntakeId] = useState<number | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<Record<string, 'high' | 'low'>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const busy = phase === 'transcribing' || phase === 'parsing' || saving;

  async function runParse(text: string, source: 'audio' | 'text', filename?: string) {
    setPhase('parsing');
    setStatusMessage('Extracting client fields…');
    setErrors([]);

    try {
      const res = await fetch('/api/intake/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, source, originalFilename: filename }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage(data.error ?? 'Parse failed');
        setForm(EMPTY_BRIEF_FORM);
        setTranscript(text);
        setPhase('review');
        return;
      }
      setTranscript(text);
      setForm(data.parsed);
      setIntakeId(data.intakeId);
      setMissingFields(data.missingFields ?? []);
      setConfidence(data.confidence ?? {});
      setPhase('review');
      setStatusMessage(null);
    } catch {
      setStatusMessage('Could not parse transcript. Fill in the form manually.');
      setTranscript(text);
      setForm(EMPTY_BRIEF_FORM);
      setPhase('review');
    }
  }

  async function handleAudioFile(file: File) {
    setPhase('transcribing');
    setStatusMessage('Transcribing audio…');
    setErrors([]);

    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/intake/transcribe', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage(data.error ?? 'Transcription failed');
        setPhase('input');
        return;
      }
      await runParse(data.transcript, 'audio', data.filename ?? file.name);
    } catch {
      setStatusMessage('Could not transcribe audio. Try again or paste the transcript manually.');
      setPhase('input');
    }
  }

  async function handleTextSubmit() {
    const text = textInput.trim();
    if (!text) {
      setStatusMessage('Enter or upload a transcript first.');
      return;
    }
    await runParse(text, 'text');
  }

  function handleBack() {
    setPhase('input');
    setStatusMessage(null);
    setErrors([]);
  }

  async function handleSave() {
    const validation = validateBriefForm(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setSaving(true);
    setErrors([]);
    try {
      const res = await fetch('/api/intake/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intakeId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.fields ?? [data.error ?? 'Save failed']);
        return;
      }
      router.push(`/briefs/${data.brief.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ marginBottom: 36 }}>
        <a href="/briefs" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--pg-text-faint)', fontSize: 12.5, textDecoration: 'none', marginBottom: 16 }}>
          <Icon name="chevron-left" size={12} />Back to clients
        </a>
        <h1 className="pg-display" style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>Import from recording</h1>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--pg-text-dim)' }}>
          Drop a meeting recording or paste a transcript. We&apos;ll extract client fields for you to review.
        </p>
      </div>

      {phase === 'input' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {(['audio', 'text'] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`pg-btn ${tab === t ? 'pg-btn-accent' : ''}`}
                onClick={() => { setTab(t); setStatusMessage(null); }}
              >
                {t === 'audio' ? 'Audio (.m4a)' : 'Transcript'}
              </button>
            ))}
          </div>

          {tab === 'audio' ? (
            <IntakeDropzone disabled={busy} onFileSelected={handleAudioFile} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <TranscriptInput value={textInput} disabled={busy} onChange={setTextInput} />
              <button type="button" className="pg-btn pg-btn-accent" style={{ alignSelf: 'flex-start' }} disabled={busy} onClick={handleTextSubmit}>
                Parse transcript
              </button>
            </div>
          )}
        </>
      )}

      {(phase === 'transcribing' || phase === 'parsing') && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--pg-text-dim)' }}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>{statusMessage}</div>
          <div style={{ fontSize: 13, marginTop: 8, color: 'var(--pg-text-faint)' }}>This may take a minute…</div>
        </div>
      )}

      {phase === 'review' && (
        <ParsedBriefReview
          form={form}
          transcript={transcript}
          missingFields={missingFields}
          confidence={confidence}
          errors={errors}
          saving={saving}
          onChange={setForm}
          onSave={handleSave}
          onBack={handleBack}
        />
      )}

      {statusMessage && phase === 'input' && (
        <div style={{ marginTop: 16, fontSize: 13, color: 'var(--pg-red)' }}>{statusMessage}</div>
      )}
    </div>
  );
}
