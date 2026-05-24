'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { FeedbackButtons } from '@/components/shared/feedback-buttons';
import { Icon } from '@/components/shared/icon';
import { PropertyThumb } from '@/components/shared/property-thumb';

interface ComparableSale {
  address: string | null;
  saleDate: string | Date | null;
  salePrice: string | null;
  pricePerSqm: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
}

interface PropertyDetail {
  id: string;
  address: string;
  suburb: string | null;
  state: string | null;
  price: string;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  description: string | null;
  appraisedValue: number | null;
  comparables: ComparableSale[];
  riskSummary: string[];
}

function formatSaleDate(date: string | Date | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });
}

export default function PortalPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const shortlistId = searchParams.get('shortlistId');

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState('new');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackReason, setFeedbackReason] = useState('');
  const [agentNote, setAgentNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [propRes, portalRes] = await Promise.all([
      fetch(`/api/properties/${id}`),
      fetch('/api/portal/shortlists'),
    ]);

    if (propRes.ok) {
      const data = await propRes.json();
      const p = data.property ?? data;
      setProperty({
        id: p.id,
        address: p.address,
        suburb: p.suburb,
        state: p.state,
        price: p.price ?? p.priceDisplay ?? '—',
        propertyType: p.propertyType,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        parkingSpaces: p.parkingSpaces,
        description: p.description ?? null,
        appraisedValue: p.appraisedValue ?? null,
        comparables: p.comparables ?? [],
        riskSummary: p.riskSummary ?? [],
      });
    }

    if (portalRes.ok && shortlistId) {
      const portal = await portalRes.json();
      const item = (portal.items ?? []).find(
        (it: { shortlistId: number }) => String(it.shortlistId) === shortlistId,
      );
      if (item) {
        setFeedbackStatus(item.feedbackStatus ?? 'new');
        setFeedbackText(item.feedbackText ?? '');
        setFeedbackReason(item.feedbackReason ?? '');
        setAgentNote(item.agentNote);
        if (item.feedbackStatus === 'new') {
          await fetch('/api/feedback/viewed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shortlistId: Number(shortlistId) }),
          });
          setFeedbackStatus('viewed');
        }
      }
    }

    setLoading(false);
  }, [id, shortlistId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div style={{ padding: 40, color: 'var(--pg-text-dim)' }}>Loading property…</div>;
  }

  if (!property) {
    return <div style={{ padding: 40, color: 'var(--pg-red)' }}>Property not found.</div>;
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 32px 64px' }}>
      <Link href="/portal" style={{ fontSize: 12, color: 'var(--pg-text-faint)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
        <Icon name="chevron-left" size={11} /> Back to my properties
      </Link>

      <PropertyThumb seed={property.id.charCodeAt(0)} height={320} />

      <div style={{ marginTop: 24 }}>
        <h1 className="pg-display" style={{ margin: 0, fontSize: 28, fontWeight: 500 }}>{property.address}</h1>
        <div style={{ fontSize: 14, color: 'var(--pg-text-dim)', marginTop: 6 }}>
          {property.suburb}{property.state ? `, ${property.state}` : ''} · {property.propertyType ?? 'Property'}
        </div>
        <div className="pg-mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 12 }}>{property.price}</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 13, color: 'var(--pg-text-dim)' }}>
          {property.bedrooms != null && <span>{property.bedrooms} bed</span>}
          {property.bathrooms != null && <span>{property.bathrooms} bath</span>}
          {property.parkingSpaces != null && <span>{property.parkingSpaces} car</span>}
        </div>
      </div>

      {agentNote && (
        <div style={{
          marginTop: 24, padding: '14px 16px', background: 'var(--pg-accent-soft)',
          borderRadius: 8, fontSize: 13, lineHeight: 1.5,
        }}>
          <div className="pg-label" style={{ marginBottom: 6 }}>Note from your agent</div>
          {agentNote}
        </div>
      )}

      {property.riskSummary.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="pg-label" style={{ marginBottom: 10 }}>Risk &amp; area context</div>
          <div className="pg-card-flat" style={{ padding: 14 }}>
            {property.riskSummary.map((line) => (
              <div
                key={line}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  fontSize: 13,
                  padding: '6px 0',
                  borderBottom: '1px solid var(--pg-border)',
                }}
              >
                <Icon name="shield" size={13} color="var(--pg-text-dim)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {property.comparables.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="pg-label" style={{ marginBottom: 10 }}>Recent comparable sales</div>
          <div className="pg-card-flat" style={{ overflow: 'hidden' }}>
            {property.comparables.map((c, i) => (
              <div
                key={`${c.address}-${i}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 12,
                  padding: '11px 16px',
                  fontSize: 13,
                  borderBottom: i < property.comparables.length - 1 ? '1px solid var(--pg-border)' : 'none',
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{c.address ?? 'Comparable sale'}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--pg-text-faint)', marginTop: 2 }}>
                    {formatSaleDate(c.saleDate)}
                    {c.bedrooms != null ? ` · ${c.bedrooms} bed` : ''}
                    {c.bathrooms != null ? ` · ${c.bathrooms} bath` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="pg-mono" style={{ fontWeight: 500 }}>{c.salePrice ?? '—'}</div>
                  {c.pricePerSqm && (
                    <div style={{ fontSize: 11, color: 'var(--pg-text-faint)', marginTop: 2 }}>{c.pricePerSqm}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {property.appraisedValue != null && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--pg-text-dim)' }}>
              Agent estimate: ${(property.appraisedValue / 1_000_000).toFixed(2)}M range context
            </div>
          )}
        </div>
      )}

      {property.description && (
        <p style={{ marginTop: 24, fontSize: 14, lineHeight: 1.6, color: 'var(--pg-text-dim)' }}>
          {property.description}
        </p>
      )}

      {shortlistId && (
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--pg-border)' }}>
          <div className="pg-label" style={{ marginBottom: 12 }}>Your feedback</div>
          <FeedbackButtons
            shortlistId={Number(shortlistId)}
            initialStatus={feedbackStatus}
            initialText={feedbackText}
            initialReason={feedbackReason}
            onSaved={load}
          />
        </div>
      )}
    </div>
  );
}
