'use client';

import { useEffect, useState } from 'react';
import { formatOfferEventLabel } from '@/lib/offer-history';

type OfferEventRow = {
  id: number;
  eventType: string;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
};

export function OfferHistoryTimeline({ dealId }: { dealId: string }) {
  const [events, setEvents] = useState<OfferEventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [dealId]);

  if (loading) {
    return (
      <p style={{ fontSize: 12.5, color: 'var(--pg-text-faint)', marginTop: 16 }}>
        Loading offer history…
      </p>
    );
  }

  if (events.length === 0) {
    return (
      <p style={{ fontSize: 12.5, color: 'var(--pg-text-faint)', marginTop: 16 }}>
        Offer changes will appear here when you save offer details.
      </p>
    );
  }

  return (
    <div style={{ marginTop: 20 }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {events.map((ev) => (
          <div
            key={ev.id}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--pg-border)',
              borderRadius: 8,
              background: 'var(--pg-bg-2)',
            }}
          >
            <div style={{ fontSize: 13 }}>
              {formatOfferEventLabel({
                eventType: ev.eventType as 'sub_state' | 'amount',
                previousValue: ev.previousValue,
                newValue: ev.newValue,
              })}
            </div>
            <div style={{ fontSize: 11, color: 'var(--pg-text-faint)', marginTop: 4 }}>
              {new Date(ev.createdAt).toLocaleString('en-AU')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
