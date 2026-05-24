'use client';

import { useEffect, useState } from 'react';
import {
  formatOfferEventLabel,
  formatOfferEventShort,
  type OfferHistoryEntryInput,
} from '@/lib/offer-history';

export type OfferEventRow = {
  id: number;
  eventType: string;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
};

function toEntry(ev: OfferEventRow): OfferHistoryEntryInput {
  return {
    eventType: ev.eventType as 'sub_state' | 'amount',
    previousValue: ev.previousValue,
    newValue: ev.newValue,
  };
}

export function OfferHistoryTimeline({
  dealId,
  refreshKey,
  compact = false,
  initialEvents,
}: {
  dealId: string;
  refreshKey?: string | number;
  compact?: boolean;
  initialEvents?: OfferEventRow[];
}) {
  const [events, setEvents] = useState<OfferEventRow[]>(initialEvents ?? []);
  const [loading, setLoading] = useState(initialEvents === undefined);

  useEffect(() => {
    if (initialEvents !== undefined) {
      setEvents(initialEvents);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/deals/${dealId}/offer-events`);
      const data = res.ok ? await res.json() : { events: [] };
      if (!cancelled) {
        setEvents(data.events ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dealId, refreshKey, initialEvents]);

  if (loading) {
    return (
      <p style={{ fontSize: 12.5, color: 'var(--pg-text-faint)', marginTop: compact ? 10 : 16 }}>
        Loading offer history…
      </p>
    );
  }

  if (events.length === 0) {
    return (
      <p style={{ fontSize: 12.5, color: 'var(--pg-text-faint)', marginTop: compact ? 10 : 16 }}>
        Offer changes will appear here when you save offer details.
      </p>
    );
  }

  const sorted = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div style={{ marginTop: compact ? 12 : 20 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--pg-text-faint)',
          marginBottom: 10,
        }}
      >
        Offer history
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {sorted.map((ev, i) => (
          <div key={ev.id} style={{ display: 'flex', gap: 12, paddingBottom: 4 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: 10,
                flexShrink: 0,
                paddingTop: 5,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: 'var(--pg-purple)',
                  flexShrink: 0,
                }}
              />
              {i < sorted.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    width: 2,
                    background: 'var(--pg-border)',
                    minHeight: compact ? 18 : 28,
                    margin: '3px 0',
                  }}
                />
              )}
            </div>
            <div style={{ flex: 1, paddingBottom: compact ? 10 : 14 }}>
              <div style={{ fontSize: compact ? 12.5 : 13, fontWeight: 500, lineHeight: 1.4 }}>
                {compact
                  ? formatOfferEventShort(toEntry(ev))
                  : formatOfferEventLabel(toEntry(ev))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--pg-text-faint)', marginTop: 3 }}>
                {new Date(ev.createdAt).toLocaleString('en-AU', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Compact list for pipeline cards (no fetch). */
export function OfferHistoryInline({ events }: { events: OfferEventRow[] }) {
  if (!events.length) return null;

  const sorted = [...events]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <div
      style={{
        marginTop: 8,
        paddingTop: 8,
        borderTop: '1px dashed var(--pg-border)',
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--pg-text-faint)',
          marginBottom: 6,
        }}
      >
        Offer log
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {sorted.map((ev) => (
          <div
            key={ev.id}
            style={{
              fontSize: 10.5,
              color: 'var(--pg-text-dim)',
              lineHeight: 1.35,
            }}
          >
            <span style={{ color: 'var(--pg-text)' }}>
              {formatOfferEventShort(toEntry(ev))}
            </span>
            <span style={{ color: 'var(--pg-text-faint)' }}>
              {' · '}
              {new Date(ev.createdAt).toLocaleDateString('en-AU', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
