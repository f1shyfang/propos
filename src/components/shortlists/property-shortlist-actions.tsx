'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { Icon } from '@/components/shared/icon';

export function PropertyShortlistActions({ propertyId }: { propertyId: string }) {
  const searchParams = useSearchParams();
  const briefIdParam = searchParams.get('briefId');
  const [briefId, setBriefId] = useState<number | null>(briefIdParam ? Number(briefIdParam) : null);
  const [briefs, setBriefs] = useState<Array<{ id: number; clientName: string; clientUserId: string | null }>>([]);
  const [shortlistId, setShortlistId] = useState<number | null>(null);
  const [sharedAt, setSharedAt] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/briefs')
      .then((r) => r.ok ? r.json() : { briefs: [] })
      .then((d) => {
        const list = d.briefs ?? [];
        setBriefs(list);
        if (!briefId && list.length > 0) setBriefId(list[0].id);
      });
  }, [briefId]);

  useEffect(() => {
    if (!briefId) return;
    fetch(`/api/briefs/${briefId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d) return;
        const item = (d.shortlist ?? []).find((s: { property?: { id: string } }) => s.property?.id === propertyId);
        setShortlistId(item?.shortlistId ?? null);
        setSharedAt(item?.sharedAt ?? null);
      });
  }, [briefId, propertyId]);

  async function ensureOnShortlist(): Promise<number | null> {
    if (shortlistId) return shortlistId;
    if (!briefId) return null;
    const res = await fetch('/api/shortlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ briefId, propertyId }),
    });
    if (res.status === 409) {
      const detail = await fetch(`/api/briefs/${briefId}`).then((r) => r.json());
      const item = (detail.shortlist ?? []).find((s: { property?: { id: string } }) => s.property?.id === propertyId);
      return item?.shortlistId ?? null;
    }
    if (!res.ok) return null;
    const body = await res.json();
    return body.shortlist?.id ?? null;
  }

  async function addToShortlist() {
    if (!briefId) {
      setMessage('Select a buyer brief first');
      return;
    }
    setBusy(true);
    setMessage(null);
    const id = await ensureOnShortlist();
    if (id) {
      setShortlistId(id);
      setMessage('Added to shortlist');
    } else {
      setMessage('Could not add to shortlist');
    }
    setBusy(false);
  }

  async function shareWithClient() {
    if (!briefId) {
      setMessage('Select a buyer brief first');
      return;
    }
    setBusy(true);
    setMessage(null);
    const id = await ensureOnShortlist();
    if (!id) {
      setMessage('Add to shortlist first');
      setBusy(false);
      return;
    }
    const res = await fetch('/api/shortlists/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ briefId, shortlistIds: [id] }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setSharedAt(new Date().toISOString());
      setMessage('Shared with client');
    } else {
      setMessage(body.error ?? 'Could not share');
    }
    setBusy(false);
  }

  const selectedBrief = briefs.find((b) => b.id === briefId);

  return (
    <div className="pg-card" style={{ padding: 18 }}>
      {briefs.length > 1 && (
        <label style={{ display: 'block', fontSize: 12, color: 'var(--pg-text-dim)', marginBottom: 8 }}>
          Buyer brief
          <select
            className="pg-input"
            style={{ width: '100%', marginTop: 4, fontSize: 13 }}
            value={briefId ?? ''}
            onChange={(e) => setBriefId(Number(e.target.value))}
          >
            {briefs.map((b) => (
              <option key={b.id} value={b.id}>{b.clientName}</option>
            ))}
          </select>
        </label>
      )}
      <button
        type="button"
        className="pg-btn pg-btn-accent"
        style={{ width: '100%', justifyContent: 'center', padding: '10px 12px', fontSize: 13 }}
        disabled={busy || !!shortlistId}
        onClick={addToShortlist}
      >
        <Icon name="bookmark" size={14} strokeWidth={1.8} />
        {shortlistId ? 'On shortlist' : 'Add to shortlist'}
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
        <button
          type="button"
          className="pg-btn"
          style={{ justifyContent: 'center' }}
          disabled={busy || !selectedBrief?.clientUserId}
          onClick={shareWithClient}
        >
          <Icon name="share" size={13} />
          {sharedAt ? 'Shared' : 'Share'}
        </button>
        <button type="button" className="pg-btn" style={{ justifyContent: 'center' }}>
          <Icon name="pipeline" size={13} />Create deal
        </button>
      </div>
      {message && (
        <p style={{ fontSize: 11, margin: '8px 0 0', color: message.includes('Could') || message.includes('Select') ? 'var(--pg-red)' : 'var(--pg-green)' }}>
          {message}
        </p>
      )}
    </div>
  );
}
