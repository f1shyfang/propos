'use client';

import { useState, useEffect, useRef } from 'react';
import { Icon } from './icon';
import { MatchScore } from './match-score';
import { PropertyThumb } from './property-thumb';
import { ShortlistDealButton } from '@/components/deals/shortlist-deal-button';

interface FeedbackItem {
  shortlistId: number;
  briefId: number | null;
  feedbackStatus: string;
  feedbackText: string | null;
  feedbackReason: string | null;
  feedbackAt: string | null;
  sharedAt: string | null;
  clientName: string;
  property: {
    id: string;
    address: string;
    suburb: string | null;
    price: string;
    score: number;
  };
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

const GRID = 'minmax(0,2.2fr) minmax(0,1.3fr) minmax(0,0.7fr) minmax(0,0.9fr) minmax(0,1fr) minmax(0,0.7fr) minmax(0,1fr)';

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function DashboardFeedback() {
  const [rows, setRows] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const sinceRef = useRef<string | null>(null);

  function mergeItems(prev: FeedbackItem[], incoming: FeedbackItem[]): FeedbackItem[] {
    if (incoming.length === 0) return prev;
    const map = new Map(prev.map((r) => [r.shortlistId, r]));
    for (const item of incoming) {
      map.set(item.shortlistId, item);
    }
    return Array.from(map.values()).sort((a, b) => {
      const ta = a.feedbackAt ? new Date(a.feedbackAt).getTime() : 0;
      const tb = b.feedbackAt ? new Date(b.feedbackAt).getTime() : 0;
      return tb - ta;
    });
  }

  function fetchFeed(reset = false) {
    const url = new URL('/api/feedback/poll', window.location.origin);
    if (!reset && sinceRef.current) {
      url.searchParams.set('since', sinceRef.current);
    }

    fetch(url.toString())
      .then((r) => (r.ok ? r.json() : { items: [], lastUpdated: null }))
      .then((data: { items: FeedbackItem[]; lastUpdated: string | null }) => {
        const incoming = data.items ?? [];
        if (reset) {
          setRows(incoming);
        } else {
          setRows((prev) => mergeItems(prev, incoming));
        }
        if (data.lastUpdated) {
          sinceRef.current = data.lastUpdated;
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    fetchFeed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => fetchFeed(false), 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const awaitingCount = rows.filter(
    (r) => r.feedbackStatus === 'new' || r.feedbackStatus === 'viewed',
  ).length;

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 16 }}>
        <h2 className="pg-display" style={{ margin: 0, fontSize: 18, fontWeight: 600, whiteSpace: 'nowrap' }}>
          Awaiting client feedback
        </h2>
        <span style={{ fontSize: 12, color: 'var(--pg-text-faint)' }}>
          {loading
            ? 'Loading…'
            : `${rows.length} propert${rows.length === 1 ? 'y' : 'ies'} shared · ${awaitingCount} still waiting`}
        </span>
        <div style={{ flex: 1 }} />
        <button
          className="pg-btn pg-btn-sm pg-btn-ghost"
          style={{ color: 'var(--pg-text-dim)' }}
          onClick={() => {
            sinceRef.current = null;
            fetchFeed(true);
          }}
        >
          <Icon name="rotate-cw" size={11} /> Refresh
        </button>
      </div>

      {rows.length === 0 && !loading ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--pg-text-faint)', fontSize: 13 }}>
          No shared properties with feedback yet. Share a shortlist with a client to see their responses here.
        </div>
      ) : (
        <div className="pg-card-flat" style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: GRID, gap: 16, alignItems: 'center',
            padding: '10px 16px',
            borderBottom: '1px solid var(--pg-border)',
            fontSize: 10.5, color: 'var(--pg-text-faint)', letterSpacing: '0.06em',
            textTransform: 'uppercase', fontWeight: 500,
          }}>
            <span style={{ minWidth: 0 }}>Property</span>
            <span style={{ minWidth: 0 }}>Client</span>
            <span style={{ minWidth: 0 }}>Match</span>
            <span style={{ textAlign: 'right', minWidth: 0 }}>Price</span>
            <span style={{ minWidth: 0 }}>Status</span>
            <span style={{ textAlign: 'right', minWidth: 0 }}>Feedback</span>
            <span style={{ minWidth: 0 }}>Action</span>
          </div>
          {rows.map((r, i, a) => {
            const initials = r.clientName
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            return (
              <div
                key={r.shortlistId}
                className="pg-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID,
                  gap: 16,
                  padding: '12px 16px',
                  alignItems: 'center',
                  borderBottom: i < a.length - 1 ? '1px solid var(--pg-border)' : 'none',
                  fontSize: 13,
                }}
              >
                <a href={`/properties/${r.property.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 11, minWidth: 0, overflow: 'hidden' }}>
                  <PropertyThumb seed={i % 6} height={36} style={{ width: 56, flexShrink: 0, borderRadius: 5 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }} className="pg-truncate">
                      {r.property.address ?? '—'}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--pg-text-dim)' }}>
                      {r.property.suburb}
                    </div>
                  </div>
                </a>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, overflow: 'hidden' }}>
                  <div className="pg-avatar pg-avatar-sm">{initials}</div>
                  <span className="pg-truncate">{r.clientName}</span>
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <MatchScore score={r.property.score} size={28} stroke={2.5} />
                </div>
                <div style={{ textAlign: 'right', fontFamily: 'var(--pg-font-mono)', minWidth: 0, overflow: 'hidden' }}>
                  {r.property.price}
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <span
                    className={`pg-badge ${STATUS_CLASS[r.feedbackStatus] ?? ''}`}
                    style={{ fontSize: 11 }}
                  >
                    {STATUS_LABEL[r.feedbackStatus] ?? r.feedbackStatus}
                  </span>
                </div>
                <div style={{ textAlign: 'right', color: 'var(--pg-text-faint)', fontSize: 12, minWidth: 0, overflow: 'hidden' }}>
                  {timeAgo(r.feedbackAt)}
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  {r.briefId && r.feedbackStatus === 'interested' && (
                    <ShortlistDealButton
                      briefId={r.briefId}
                      propertyId={r.property.id}
                      feedbackStatus={r.feedbackStatus}
                      size="sm"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
