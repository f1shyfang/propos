'use client';

import { useState } from 'react';
import { Icon } from './icon';

interface FeedbackButtonsProps {
  shortlistId: number;
  initialStatus?: string;
  initialText?: string;
}

const BUTTONS = [
  { id: 'interested', label: 'Interested', icon: 'thumbs-up' as const, c: 'var(--pg-green)', tint: 'rgba(34,197,94,0.08)' },
  { id: 'need_more_info', label: 'Need info', icon: 'help-circle' as const, c: 'var(--pg-amber)', tint: 'rgba(245,158,11,0.08)' },
  { id: 'not_for_me', label: 'Not for me', icon: 'thumbs-down' as const, c: 'var(--pg-red)', tint: 'rgba(239,68,68,0.08)' },
];

const NOT_FOR_ME_REASONS = [
  'Wrong area', 'Over budget', "Don't like the style",
  'Too small', 'Too large', 'Wrong property type',
];

export function FeedbackButtons({ shortlistId, initialStatus = 'new', initialText = '' }: FeedbackButtonsProps) {
  const [status, setStatus] = useState(initialStatus);
  const [text, setText] = useState(initialText);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit(newStatus: string, newReason?: string) {
    setSaving(true);
    setSaved(false);
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shortlistId,
        feedbackStatus: newStatus,
        feedbackText: text || null,
        feedbackReason: newReason ?? (reason || null),
      }),
    });
    if (res.ok) {
      setStatus(newStatus);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  return (
    <div style={{ marginTop: 14 }}>
      {/* Three feedback buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {BUTTONS.map(b => {
          const active = status === b.id;
          return (
            <button key={b.id}
              onClick={() => submit(b.id)}
              disabled={saving}
              style={{
                background: active ? b.tint : 'transparent',
                border: '1px solid',
                borderColor: active ? 'transparent' : 'var(--pg-border)',
                color: active ? b.c : 'var(--pg-text-dim)',
                borderRadius: 6, padding: '8px 4px',
                fontSize: 12, fontWeight: active ? 500 : 400,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                transition: 'all 0.15s',
              }}>
              <Icon name={b.icon} size={11} strokeWidth={active ? 1.8 : 1.5} />
              {b.label}
            </button>
          );
        })}
      </div>

      {/* Reason chips for "not for me" */}
      {status === 'not_for_me' && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 }}>
          {NOT_FOR_ME_REASONS.map(r => (
            <button key={r} onClick={() => { setReason(r); submit('not_for_me', r); }}
              style={{
                padding: '3px 9px', borderRadius: 999, fontSize: 11,
                border: '1px solid',
                borderColor: reason === r ? 'var(--pg-red)' : 'var(--pg-border)',
                background: reason === r ? 'rgba(239,68,68,0.08)' : 'transparent',
                color: reason === r ? 'var(--pg-red)' : 'var(--pg-text-dim)',
                cursor: 'pointer',
              }}>
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Comment box */}
      <textarea
        placeholder="Add a note for your agent…"
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={() => { if (text !== initialText && status !== 'new') submit(status); }}
        rows={2}
        style={{
          width: '100%', marginTop: 10, padding: '8px 10px',
          border: '1px solid var(--pg-border)', borderRadius: 6,
          background: 'var(--pg-bg)', color: 'var(--pg-text)',
          fontSize: 12.5, lineHeight: 1.5, resize: 'none',
          fontFamily: 'var(--pg-font-body)', boxSizing: 'border-box',
        }}
      />

      {saved && (
        <div style={{ fontSize: 11, color: 'var(--pg-green)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="check" size={10} color="var(--pg-green)" /> Feedback saved
        </div>
      )}
    </div>
  );
}
