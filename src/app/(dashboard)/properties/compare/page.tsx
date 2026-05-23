'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Icon } from '@/components/shared/icon';
import { MatchScore } from '@/components/shared/match-score';
import { PropertyThumb } from '@/components/shared/property-thumb';

interface PropertyDetail {
  id: string; address: string; suburb: string | null; state: string | null;
  price: string; priceDisplay: string | null; propertyType: string | null;
  bedrooms: number | null; bathrooms: number | null; parkingSpaces: number | null;
  landSize: number | null; overallScore: number | null; appraisedValue: number | null;
  grossYield: number | null; days: number | null; underOffer: number | null;
  confidenceScore: number | null; rScore: number | null;
}

function formatPrice(price: number | null, display: string | null): string {
  if (display) return display;
  if (!price) return '—';
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  return `$${(price / 1000).toFixed(0)}K`;
}

function scoreToMatchPct(overall: number | null): number {
  if (!overall) return 50;
  return Math.min(99, Math.max(1, Math.round(overall / 100)));
}

const RISK_ROWS = [
  { l: 'Flood (1-in-100yr)', values: ['Clear', 'Minor risk', 'Clear'] },
  { l: 'Bushfire BAL', values: ['N/A', 'N/A', 'BAL-12.5'] },
  { l: 'Heritage overlay', values: ['Minor', 'Clear', 'Clear'] },
  { l: 'Contaminated land', values: ['Clear', 'Clear', 'Clear'] },
];

export default function ComparePropertiesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: 'var(--pg-text-dim)' }}>Loading…</div>}>
      <CompareContent />
    </Suspense>
  );
}

function CompareContent() {
  const sp = useSearchParams();
  const idsParam = sp.get('ids') ?? '';
  const ids = idsParam.split(',').filter(Boolean).slice(0, 3);

  const [properties, setProperties] = useState<(PropertyDetail | null)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ids.length) { setLoading(false); return; }
    Promise.all(
      ids.map(id =>
        fetch(`/api/properties/${id}`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    ).then(results => {
      setProperties(results.map(r => r?.property ?? null));
      setLoading(false);
    });
  }, [idsParam]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div style={{ padding: 40, color: 'var(--pg-text-dim)' }}>Loading comparison…</div>;

  if (!ids.length) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--pg-text-dim)' }}>
        <Icon name="grid" size={40} color="var(--pg-text-very-faint)" />
        <div style={{ fontSize: 16, marginTop: 14, fontWeight: 500 }}>No properties to compare</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>Select properties from a brief&apos;s match list to compare them here.</div>
        <a href="/briefs" className="pg-btn" style={{ display: 'inline-flex', marginTop: 16 }}>Go to Briefs</a>
      </div>
    );
  }

  const cols = properties.filter(Boolean) as PropertyDetail[];

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--pg-border)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <a href="#" onClick={() => window.history.back()} style={{ color: 'var(--pg-text-faint)', fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="chevron-left" size={11} />Back
        </a>
        <h1 className="pg-display" style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Side-by-Side Comparison</h1>
        <span style={{ fontSize: 12, color: 'var(--pg-text-faint)' }}>{cols.length} propert{cols.length === 1 ? 'y' : 'ies'}</span>
      </div>

      <div style={{ padding: '24px 32px', overflowX: 'auto' }}>
        {/* Property header row */}
        <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${cols.length}, 1fr)`, gap: 16, minWidth: 700 }}>
          <div /> {/* label column header */}
          {cols.map((p, i) => (
            <div key={p.id} className="pg-card" style={{ padding: 0, overflow: 'hidden' }}>
              <PropertyThumb seed={i} height={160} style={{ borderRadius: 0 }} />
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.address}</div>
                    <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>{p.suburb}, {p.state}</div>
                  </div>
                  <MatchScore score={scoreToMatchPct(p.overallScore)} size={32} stroke={3} />
                </div>
                <div className="pg-display" style={{ fontSize: 22, fontWeight: 600, marginTop: 10 }}>
                  {formatPrice(null, p.priceDisplay ?? null) !== '—' ? p.priceDisplay : `$${((p.appraisedValue ?? 0) / 1000).toFixed(0)}K`}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12.5, color: 'var(--pg-text-dim)' }}>
                  {p.bedrooms != null && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="bed" size={11} />{p.bedrooms}</span>}
                  {p.bathrooms != null && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="bath" size={11} />{p.bathrooms}</span>}
                  {p.parkingSpaces != null && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="car" size={11} />{p.parkingSpaces}</span>}
                </div>
                <div style={{ marginTop: 12 }}>
                  <a href={`/properties/${p.id}`} className="pg-btn pg-btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                    View full details
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison rows */}
        <CompareSection title="Key Stats">
          {[
            { l: 'Property type', vals: cols.map(p => p.propertyType ?? '—') },
            { l: 'Bedrooms', vals: cols.map(p => p.bedrooms?.toString() ?? '—') },
            { l: 'Bathrooms', vals: cols.map(p => p.bathrooms?.toString() ?? '—') },
            { l: 'Car spaces', vals: cols.map(p => p.parkingSpaces?.toString() ?? '—') },
            { l: 'Land size', vals: cols.map(p => p.landSize ? `${p.landSize}m²` : '—') },
            { l: 'Days on market', vals: cols.map(p => p.days?.toString() ?? '—') },
          ].map(r => <CompareRow key={r.l} label={r.l} values={r.vals} cols={cols.length} />)}
        </CompareSection>

        <CompareSection title="CMA & Valuation">
          {[
            {
              l: 'Estimated value',
              vals: cols.map(p => p.appraisedValue
                ? `${formatPrice(Math.round(p.appraisedValue * 0.95), null)} – ${formatPrice(Math.round(p.appraisedValue * 1.05), null)}`
                : '—'),
            },
            { l: 'Confidence score', vals: cols.map(p => p.confidenceScore ? `${p.confidenceScore}/100` : '—') },
            { l: 'Gross yield (est)', vals: cols.map(p => p.grossYield ? `${(p.grossYield * 100).toFixed(1)}%` : '—') },
            { l: 'Overall score', vals: cols.map(p => p.overallScore?.toString() ?? '—') },
          ].map(r => <CompareRow key={r.l} label={r.l} values={r.vals} cols={cols.length} />)}
        </CompareSection>

        <CompareSection title="Risk Overlay">
          {RISK_ROWS.slice(0, 4).map(r => (
            <CompareRow key={r.l} label={r.l} values={r.values.slice(0, cols.length)} cols={cols.length}
              renderVal={(v) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: v === 'Clear' || v === 'N/A' ? 'var(--pg-green)' : 'var(--pg-amber)', flexShrink: 0 }} />
                  {v}
                </span>
              )} />
          ))}
        </CompareSection>

        <CompareSection title="Match Score">
          <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${cols.length}, 1fr)`, gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, color: 'var(--pg-text-dim)' }}>Match quality</span>
            </div>
            {cols.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <MatchScore score={scoreToMatchPct(p.overallScore)} size={36} stroke={3} />
                <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>
                  {scoreToMatchPct(p.overallScore) >= 80 ? 'Strong match' :
                    scoreToMatchPct(p.overallScore) >= 65 ? 'Good match' : 'Partial match'}
                </div>
              </div>
            ))}
          </div>
        </CompareSection>
      </div>
    </div>
  );
}

function CompareSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--pg-text-faint)', marginBottom: 12 }}>{title}</div>
      <div className="pg-card-flat" style={{ overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

function CompareRow({ label, values, cols, renderVal }: {
  label: string; values: string[]; cols: number;
  renderVal?: (v: string) => React.ReactNode;
}) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `200px repeat(${cols}, 1fr)`,
      gap: 16, padding: '11px 16px', borderBottom: '1px solid var(--pg-border)',
      fontSize: 13, alignItems: 'center',
    }}>
      <div style={{ fontSize: 12.5, color: 'var(--pg-text-dim)' }}>{label}</div>
      {values.map((v, i) => (
        <div key={i}>{renderVal ? renderVal(v) : v}</div>
      ))}
    </div>
  );
}
