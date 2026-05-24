'use client';

import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@/components/shared/icon';
import { OUTREACH_TEMPLATES } from '@/lib/outreach-templates';

type OutreachRow = {
  id: number;
  templateId: string;
  recipientLabel: string | null;
  status: string | null;
  createdAt: string;
};

export function PropertyOutreachPanel({
  propertyId,
  briefId,
}: {
  propertyId: string;
  briefId?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState(OUTREACH_TEMPLATES[0].id);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [outreach, setOutreach] = useState<OutreachRow[]>([]);

  const loadOutreach = useCallback(async () => {
    const res = await fetch(`/api/properties/${propertyId}/outreach`);
    if (res.ok) {
      const data = await res.json();
      setOutreach(data.outreach ?? []);
    }
  }, [propertyId]);

  useEffect(() => {
    void loadOutreach();
  }, [loadOutreach]);

  async function sendOutreach() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/properties/${propertyId}/outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, briefId: briefId ?? null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Could not log outreach');
      setMessage('Outreach logged');
      setOpen(false);
      await loadOutreach();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  const template = OUTREACH_TEMPLATES.find((t) => t.id === templateId);

  return (
    <>
      <div className="pg-card-flat" style={{ overflow: 'hidden' }}>
        <div
          style={{
            padding: '9px 14px',
            borderBottom: '1px solid var(--pg-border)',
            background: 'var(--pg-bg-2)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span className="pg-label">Listing info</span>
        </div>
        <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="pg-avatar pg-avatar-lg" style={{ background: 'var(--pg-bg-2)' }}>
            LA
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>Selling agent</div>
            <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>Log outreach to the activity feed</div>
          </div>
          <button type="button" className="pg-btn pg-btn-sm pg-btn-primary" onClick={() => setOpen(true)}>
            Contact agent
          </button>
        </div>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => !busy && setOpen(false)}
        >
          <div
            className="pg-card"
            style={{ maxWidth: 480, width: '100%', padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="pg-display" style={{ margin: '0 0 16px', fontSize: 18 }}>
              Contact selling agent
            </h2>
            <label style={{ fontSize: 12, color: 'var(--pg-text-dim)', display: 'block', marginBottom: 6 }}>
              Template
            </label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value as typeof templateId)}
              style={{
                width: '100%',
                padding: '9px 12px',
                marginBottom: 14,
                border: '1px solid var(--pg-border)',
                borderRadius: 6,
                background: 'var(--pg-bg)',
                color: 'var(--pg-text)',
                fontSize: 13,
              }}
            >
              {OUTREACH_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            {template && (
              <p
                style={{
                  fontSize: 12.5,
                  color: 'var(--pg-text-dim)',
                  lineHeight: 1.55,
                  margin: '0 0 16px',
                  padding: 12,
                  background: 'var(--pg-bg-2)',
                  borderRadius: 8,
                }}
              >
                {template.preview}
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="pg-btn" disabled={busy} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="pg-btn pg-btn-primary"
                disabled={busy}
                onClick={() => void sendOutreach()}
              >
                {busy ? 'Sending…' : 'Send & log'}
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <p style={{ fontSize: 12, color: 'var(--pg-green)', marginTop: 8 }}>{message}</p>
      )}

      <div className="pg-card-flat" style={{ overflow: 'hidden', marginTop: 20 }}>
        <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--pg-border)', background: 'var(--pg-bg-2)' }}>
          <span className="pg-label">Recent activity</span>
        </div>
        <div style={{ padding: '4px 14px' }}>
          {outreach.length === 0 ? (
            <div style={{ padding: '12px 0', fontSize: 12.5, color: 'var(--pg-text-faint)' }}>
              No outreach logged yet.
            </div>
          ) : (
            outreach.map((row) => {
              const tpl = OUTREACH_TEMPLATES.find((t) => t.id === row.templateId);
              return (
                <div
                  key={row.id}
                  style={{ display: 'flex', gap: 11, padding: '8px 0', fontSize: 12.5, borderBottom: '1px solid var(--pg-border)' }}
                >
                  <div style={{ width: 22, paddingTop: 1 }}>
                    <Icon name="mail" size={12} color="var(--pg-text-dim)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div>Outreach: {tpl?.label ?? row.templateId}</div>
                    <div style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>
                      {new Date(row.createdAt).toLocaleString('en-AU')}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
