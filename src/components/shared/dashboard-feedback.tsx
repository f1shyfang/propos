'use client';

import { useState, useEffect } from 'react';
import { Icon } from './icon';
import { MatchScore } from './match-score';
import { PropertyThumb } from './property-thumb';

interface FeedbackRow {
  shortlistId: number;
  feedbackStatus: string;
  feedbackText: string | null;
  createdAt: string;
  feedbackAt: string | null;
  propertyId: string;
  address: string;
  suburb: string | null;
  state: string | null;
  price: number | null;
  priceDisplay: string | null;
  overallScore: number | null;
  briefId: number;
  clientName: string;
}

const STATUS_CLASS: Record<string, string> = {
  interested: 'pg-badge-green',
  need_more_info: 'pg-badge-amber',
  not_for_me: 'pg-badge-red',
  viewed: 'pg-badge-blue',
  new: '',
};

const STATUS_LABEL: Record<string, string> = {
  interested: 'Interested',
  need_more_info: 'Need more info',
  not_for_me: 'Not for me',
  viewed: 'Viewed',
  new: 'Awaiting',
};

function scoreToMatchPct(overall: number | null): number {
  if (overall == null) return 50;
  return Math.min(99, Math.max(1, Math.round(overall / 100)));
}

function formatPrice(price: number | null, display: string | null): string {
  if (display) return display;
  if (!price) return '—';
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  return `$${(price / 1000).toFixed(0)}K`;
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function DashboardFeedback() {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch('/api/dashboard/feedback')
      .then(r => r.ok ? r.json() : { rows: [] })
      .then(data => { setRows(data.rows ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5000); // poll every 5s
    return () => clearInterval(id);
  }, []);

  const awaitingCount = rows.filter(r => r.feedbackStatus === 'new').length;

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 16 }}>
        <h2 className="pg-display" style={{ margin: 0, fontSize: 18, fontWeight: 600, whiteSpace: 'nowrap' }}>
          Awaiting client feedback
        </h2>
        <span style={{ fontSize: 12, color: 'var(--pg-text-faint)' }}>
          {loading ? 'Loading…' : `${rows.length} propert${rows.length === 1 ? 'y' : 'ies'} shared · ${awaitingCount} still waiting`}
        </span>
        <div style={{ flex: 1 }} />
        <button className="pg-btn pg-btn-sm pg-btn-ghost" style={{ color: 'var(--pg-text-dim)' }}>
          Nudge all <Icon name="arrow-right" size={11} />
        </button>
      </div>

      {rows.length === 0 && !loading ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--pg-text-faint)', fontSize: 13 }}>
          No shortlisted properties yet. Shortlist properties from a brief to see client feedback here.
        </div>
      ) : (
        <div className="pg-card-flat" style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '2.2fr 1.6fr 0.8fr 1fr 1fr 0.6fr',
            padding: '10px 16px',
            borderBottom: '1px solid var(--pg-border)',
            fontSize: 10.5, color: 'var(--pg-text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500,
          }}>
            <span>Property</span><span>Client</span><span>Match</span>
            <span style={{ textAlign: 'right' }}>Price</span><span>Status</span>
            <span style={{ textAlign: 'right' }}>Shared</span>
          </div>
          {rows.map((r, i, a) => {
            const initials = r.clientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            return (
              <a key={r.shortlistId} href={`/properties/${r.propertyId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="pg-row" style={{
                  display: 'grid', gridTemplateColumns: '2.2fr 1.6fr 0.8fr 1fr 1fr 0.6fr',
                  padding: '12px 16px', alignItems: 'center',
                  borderBottom: i < a.length - 1 ? '1px solid var(--pg-border)' : 'none',
                  fontSize: 13,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                    <PropertyThumb seed={i % 6} height={36} style={{ width: 56, flexShrink: 0, borderRadius: 5 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 500 }} className="pg-truncate">{r.address ?? '—'}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--pg-text-dim)' }}>{r.suburb}, {r.state}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                    <div className="pg-avatar pg-avatar-sm">{initials}</div>
                    <span className="pg-truncate">{r.clientName}</span>
                  </div>
                  <div><MatchScore score={scoreToMatchPct(r.overallScore)} size={28} stroke={2.5} /></div>
                  <div style={{ textAlign: 'right', fontFamily: 'var(--pg-font-mono)' }}>
                    {formatPrice(r.price, r.priceDisplay)}
                  </div>
                  <div>
                    <span className={`pg-badge ${STATUS_CLASS[r.feedbackStatus] ?? ''}`} style={{ fontSize: 11 }}>
                      {STATUS_LABEL[r.feedbackStatus] ?? r.feedbackStatus}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', color: 'var(--pg-text-faint)', fontSize: 12 }}>
                    {timeAgo(r.createdAt)}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
