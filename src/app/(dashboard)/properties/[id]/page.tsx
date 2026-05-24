import { Suspense } from 'react';
import { db } from '@/lib/db';
import { propertiesTable, suburbsTable } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/shared/icon';
import { PropertyThumb } from '@/components/shared/property-thumb';
import { MatchScore } from '@/components/shared/match-score';
import { PropertyShortlistActions } from '@/components/shortlists/property-shortlist-actions';

function scoreToMatchPct(overall: number | null): number {
  if (!overall) return 50;
  return Math.min(99, Math.max(1, Math.round(overall / 100)));
}

function formatPrice(price: number | null, display: string | null): string {
  if (display) return display;
  if (!price) return '—';
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  return `$${(price / 1000).toFixed(0)}K`;
}

function calcStampDuty(price: number | null): string {
  if (!price) return '—';
  const duty = price * 0.05;
  return `$${duty.toLocaleString('en-AU', { maximumFractionDigits: 0 })}`;
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const rows = await db.select()
    .from(propertiesTable)
    .leftJoin(suburbsTable, eq(propertiesTable.suburbId, suburbsTable.suburbId))
    .where(eq(propertiesTable.id, id))
    .limit(1);

  if (!rows.length) notFound();

  const { properties: p, suburbs: s } = rows[0];
  const matchScore = scoreToMatchPct(p.overallScore);

  type SchoolRow = { id: number; name: string; type: string | null; sector: string | null; distanceKm: number };
  let nearbySchools: SchoolRow[] = [];
  // Correct for swapped lat/lng: valid AU lat is -45 to -10
  const trueLat = (p.latitude != null && p.latitude >= -45 && p.latitude <= -10) ? p.latitude : p.longitude;
  const trueLng = (p.latitude != null && p.latitude >= -45 && p.latitude <= -10) ? p.longitude : p.latitude;

  if (trueLat != null && trueLng != null) {
    const schoolRows = await db.execute(sql`
      SELECT id, name, type, sector, distance_km FROM (
        SELECT DISTINCT ON (name) id, name, type, sector,
          round((ST_Distance(
            ST_SetSRID(ST_Point(${trueLng}, ${trueLat}), 4326)::geography,
            ST_SetSRID(ST_Point(longitude, latitude), 4326)::geography
          ) / 1000)::numeric, 2) AS distance_km
        FROM schools
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        ORDER BY name, distance_km ASC
      ) deduped
      ORDER BY distance_km ASC
      LIMIT 5
    `);
    const raw = (schoolRows as unknown as { rows: Array<Record<string, unknown>> }).rows ?? schoolRows;
    nearbySchools = (raw as Array<Record<string, unknown>>).map(r => ({
      id: r.id as number,
      name: r.name as string,
      type: r.type as string | null,
      sector: r.sector as string | null,
      distanceKm: Number(r.distance_km),
    }));
  }
  const price = formatPrice(p.price, p.priceDisplay);

  const propTypeLabel = p.propertyType
    ? p.propertyType.charAt(0).toUpperCase() + p.propertyType.slice(1)
    : 'Property';

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Breadcrumb */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '14px 32px',
        borderBottom: '1px solid var(--pg-border)',
        fontSize: 12.5, color: 'var(--pg-text-dim)',
      }}>
        <a href="/properties" style={{ color: 'var(--pg-text-faint)', cursor: 'pointer', textDecoration: 'none' }}>Properties</a>
        <Icon name="chevron-right" size={12} color="var(--pg-text-very-faint)" />
        <a style={{ color: 'var(--pg-text-faint)', cursor: 'pointer' }}>{p.suburb}, {p.state}</a>
        <Icon name="chevron-right" size={12} color="var(--pg-text-very-faint)" />
        <span style={{ color: 'var(--pg-text)' }}>{p.address}</span>
        <div style={{ flex: 1 }} />
        <button className="pg-btn pg-btn-sm pg-btn-ghost" style={{ color: 'var(--pg-text-dim)' }}><Icon name="chevron-left" size={12} />Prev</button>
        <button className="pg-btn pg-btn-sm pg-btn-ghost" style={{ color: 'var(--pg-text-dim)' }}>Next<Icon name="chevron-right" size={12} /></button>
        <div className="pg-divider-v" style={{ height: 18, margin: '0 4px' }} />
        <button className="pg-btn pg-btn-sm pg-btn-ghost" style={{ color: 'var(--pg-text-dim)' }}><Icon name="share" size={12} />Share</button>
        <button className="pg-btn pg-btn-sm pg-btn-ghost" style={{ color: 'var(--pg-text-dim)' }}><Icon name="bookmark" size={12} />Save</button>
      </div>

      <div style={{ padding: '24px 32px 28px', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 32 }}>
        {/* LEFT */}
        <div>
          {/* Gallery */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 6, height: 360 }}>
            <PropertyThumb seed={0} height={360} imageUrl={p.images?.[0]} style={{ gridRow: '1 / span 2', borderRadius: 10 }} />
            <PropertyThumb seed={2} height={177} imageUrl={p.images?.[1]} style={{ borderRadius: 10 }} />
            <PropertyThumb seed={1} height={177} imageUrl={p.images?.[2]} style={{ borderRadius: 10 }} />
            <PropertyThumb seed={3} height={177} imageUrl={p.images?.[3]} style={{ borderRadius: 10 }} />
            <div style={{
              borderRadius: 10,
              background: 'var(--pg-bg-2)',
              border: '1px solid var(--pg-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 4,
              color: 'var(--pg-text-dim)', cursor: 'pointer',
            }}>
              <Icon name="image" size={20} />
              <span style={{ fontSize: 12 }}>{p.images && p.images.length > 4 ? `+${p.images.length - 4} more` : '+ more'}</span>
            </div>
          </div>

          {/* Title block */}
          <div style={{ marginTop: 28, display: 'flex', alignItems: 'flex-start', gap: 18 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span className="pg-badge pg-badge-green pg-badge-dot">For Sale</span>
                <span className="pg-badge pg-badge-yellow"><Icon name="sparkles" size={10} /> AI matched · {matchScore}</span>
                {p.days != null && <span style={{ fontSize: 11.5, color: 'var(--pg-text-faint)' }}>· {p.days} days on market</span>}
              </div>
              <h1 className="pg-display" style={{ margin: 0, fontSize: 32, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
                {p.address}
              </h1>
              <div style={{ fontSize: 14, color: 'var(--pg-text-dim)', marginTop: 6 }}>
                {p.suburb}, {p.state} · {propTypeLabel}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--pg-text-faint)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Asking</div>
              <div className="pg-display" style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 1.1, marginTop: 2 }}>{price}</div>
              {p.appraisedValue && (
                <div style={{ fontSize: 12, color: 'var(--pg-text-faint)', marginTop: 4 }}>
                  Est. value: {formatPrice(p.appraisedValue, null)}
                </div>
              )}
            </div>
          </div>

          {/* Key stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', marginTop: 24, paddingTop: 20, paddingBottom: 20, borderTop: '1px solid var(--pg-border)', borderBottom: '1px solid var(--pg-border)' }}>
            {[
              { i: 'bed' as const, l: 'Bedrooms', v: p.bedrooms?.toString() ?? '—' },
              { i: 'bath' as const, l: 'Bathrooms', v: p.bathrooms?.toString() ?? '—' },
              { i: 'car' as const, l: 'Car spaces', v: p.parkingSpaces?.toString() ?? '—' },
              { i: 'square' as const, l: 'Land', v: p.landSize ? `${p.landSize}m²` : '—' },
              { i: 'chart' as const, l: 'Score', v: p.overallScore?.toString() ?? '—' },
            ].map((stat, i) => (
              <div key={i} style={{ paddingLeft: i === 0 ? 0 : 18, borderLeft: i > 0 ? '1px solid var(--pg-border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--pg-text-faint)' }}>
                  <Icon name={stat.i} size={12} />
                  <span style={{ fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{stat.l}</span>
                </div>
                <div className="pg-display" style={{ fontSize: 22, fontWeight: 500, marginTop: 4 }}>{stat.v}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginTop: 24, borderBottom: '1px solid var(--pg-border)' }}>
            {[['Overview', true], ['Match', false], ['CMA', false], ['Feasibility', false], ['Due diligence', false], ['History', false]].map(([l, active], i) => (
              <button key={i} style={{
                background: 'none', border: 'none', padding: '12px 16px 14px',
                fontSize: 13, fontWeight: active ? 500 : 400,
                color: active ? 'var(--pg-text)' : 'var(--pg-text-dim)',
                cursor: 'pointer',
                borderBottom: active ? '2px solid var(--pg-text)' : '2px solid transparent',
                marginBottom: -1, fontFamily: 'var(--pg-font-body)',
              }}>{l as string}</button>
            ))}
          </div>

          {/* Overview content */}
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <h3 className="pg-display" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>About this property</h3>
              <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.65, color: 'var(--pg-text)' }}>
                A {p.propertyType ?? 'property'} located at {p.address}, {p.suburb}, {p.state}. {p.bedrooms} bedroom{p.bedrooms !== 1 ? 's' : ''}, {p.bathrooms} bathroom{p.bathrooms !== 1 ? 's' : ''}{p.parkingSpaces ? `, ${p.parkingSpaces} car space${p.parkingSpaces !== 1 ? 's' : ''}` : ''}.
                {p.landSize ? ` Land area: ${p.landSize}m².` : ''}
                {p.grossYield ? ` Estimated gross yield: ${(p.grossYield * 100).toFixed(1)}%.` : ''}
              </p>
              {s && (
                <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.65, color: 'var(--pg-text)' }}>
                  {s.name} suburb — population {s.population?.toLocaleString() ?? '—'}.
                </p>
              )}
            </div>

            {/* Match card */}
            <div style={{ background: 'var(--pg-accent-soft)', border: '1px solid rgba(229,177,0,0.25)', borderRadius: 10, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Icon name="sparkles" size={14} color="var(--pg-accent)" />
                <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#806000' }}>Propos Score Breakdown</span>
                <div style={{ flex: 1 }} />
                <MatchScore score={matchScore} size={32} stroke={3} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 24px' }}>
                {[
                  { ok: (p.sweetspotScore ?? 0) >= 50, l: `Sweetspot score: ${p.sweetspotScore ?? '—'}/100` },
                  { ok: (p.confidenceScore ?? 0) >= 70, l: `Confidence: ${p.confidenceScore ?? '—'}/100` },
                  { ok: (p.distressScore ?? 0) <= 50, l: `Distress level: ${p.distressScore ?? '—'}/100` },
                  { ok: p.underOffer === 0, l: p.underOffer ? 'Under offer' : 'Not under offer' },
                  { ok: p.grossYield != null && p.grossYield > 0.03, l: p.grossYield ? `Gross yield: ${(p.grossYield * 100).toFixed(1)}%` : 'Yield data pending' },
                  { ok: (p.rScore ?? 0) >= 70, l: `R-score: ${p.rScore ?? '—'}` },
                ].map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 999, flexShrink: 0, background: m.ok ? 'var(--pg-green)' : 'var(--pg-text-very-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                      <Icon name={m.ok ? 'check' : 'minus'} size={10} color="#FFF" strokeWidth={3} />
                    </div>
                    <div style={{ fontSize: 13, color: m.ok ? 'var(--pg-text)' : 'var(--pg-text-dim)' }}>{m.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nearby Schools */}
            {nearbySchools.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
                  <h3 className="pg-display" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Nearby Schools</h3>
                  <span style={{ fontSize: 12, color: 'var(--pg-text-faint)' }}>Closest {nearbySchools.length}</span>
                </div>
                <div className="pg-card-flat" style={{ overflow: 'hidden' }}>
                  {nearbySchools.map((school, i) => (
                    <div key={school.id} style={{
                      display: 'grid', gridTemplateColumns: '1fr auto',
                      padding: '11px 16px', fontSize: 13, alignItems: 'center',
                      borderBottom: i < nearbySchools.length - 1 ? '1px solid var(--pg-border)' : 'none',
                    }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{school.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--pg-text-faint)', marginTop: 2 }}>
                          {[school.type, school.sector].filter(Boolean).map(v => v!.charAt(0).toUpperCase() + v!.slice(1)).join(' · ')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="pg-mono" style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>{school.distanceKm} km</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CMA table — static demo */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
                <h3 className="pg-display" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Recent comparable sales</h3>
                <span style={{ fontSize: 12, color: 'var(--pg-text-faint)' }}>Last 6 months · within 1km</span>
                <div style={{ flex: 1 }} />
              </div>
              <div className="pg-card-flat" style={{ overflow: 'hidden' }}>
                {[
                  { addr: 'Comparable 1', date: 'Recent', sold: p.appraisedValue ? formatPrice(Math.round(p.appraisedValue * 1.02), null) : '—', bbc: `${p.bedrooms}·${p.bathrooms}·${p.parkingSpaces ?? 1}`, sqm: p.landSize ? `${Math.round(p.landSize * 0.95)}m²` : '—', comp: 96 },
                  { addr: 'Comparable 2', date: 'Recent', sold: p.appraisedValue ? formatPrice(Math.round(p.appraisedValue * 0.97), null) : '—', bbc: `${p.bedrooms}·${p.bathrooms}·${p.parkingSpaces ?? 1}`, sqm: p.landSize ? `${Math.round(p.landSize * 0.88)}m²` : '—', comp: 88 },
                  { addr: 'Comparable 3', date: 'Older', sold: p.appraisedValue ? formatPrice(Math.round(p.appraisedValue * 1.05), null) : '—', bbc: `${p.bedrooms}·${p.bathrooms}·${(p.parkingSpaces ?? 0) + 1}`, sqm: p.landSize ? `${Math.round(p.landSize * 1.07)}m²` : '—', comp: 80 },
                ].map((c, i, a) => (
                  <div key={i} className="pg-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 0.8fr', padding: '12px 16px', alignItems: 'center', fontSize: 13, borderBottom: i < a.length - 1 ? '1px solid var(--pg-border)' : 'none' }}>
                    <div style={{ fontWeight: 500 }}>{c.addr}</div>
                    <div style={{ color: 'var(--pg-text-dim)', fontSize: 12 }}>{c.date}</div>
                    <div className="pg-mono">{c.sold}</div>
                    <div style={{ color: 'var(--pg-text-dim)' }}>{c.bbc}</div>
                    <div style={{ color: 'var(--pg-text-dim)', fontSize: 12 }}>{c.sqm}</div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="pg-mono" style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>{c.comp}% comp</span>
                    </div>
                  </div>
                ))}
              </div>
              {p.appraisedValue && (
                <div style={{ marginTop: 14, padding: '14px 16px', background: 'var(--pg-bg-2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>Estimated value range</div>
                  <div className="pg-display" style={{ fontSize: 18, fontWeight: 500 }}>
                    {formatPrice(p.appraisedValue ? Math.round(p.appraisedValue * 0.95) : null, null)} — {formatPrice(p.appraisedValue ? Math.round(p.appraisedValue * 1.05) : null, null)}
                  </div>
                  <div style={{ flex: 1 }} />
                  <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>Confidence: <span style={{ color: 'var(--pg-text)', fontWeight: 500 }}>{p.confidenceScore ?? '—'}/100</span></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Actions */}
          <Suspense fallback={<div className="pg-card" style={{ padding: 18, fontSize: 13, color: 'var(--pg-text-dim)' }}>Loading actions…</div>}>
            <PropertyShortlistActions propertyId={id} />
          </Suspense>

          {/* Listing agent */}
          <div>
            <div className="pg-label" style={{ marginBottom: 10 }}>Listing info</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="pg-avatar pg-avatar-lg" style={{ background: 'var(--pg-bg-2)' }}>LA</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{p.suburb ?? 'Local'} Agency</div>
                <div style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>Listed on realestate.com.au</div>
              </div>
              {p.url && (
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="pg-btn pg-btn-icon">
                  <Icon name="arrow-up-right" size={13} />
                </a>
              )}
            </div>
          </div>

          {/* Crime & Safety */}
          {s && (s.crimeRank != null || s.violentPer1000 != null || s.propertyPer1000 != null) && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span className="pg-label">Crime &amp; Safety</span>
                {s.crimeRank != null && (
                  <span className={`pg-badge ${s.crimeRank <= 30 ? 'pg-badge-green' : s.crimeRank <= 70 ? 'pg-badge-yellow' : 'pg-badge-red'}`} style={{ fontSize: 10 }}>
                    Rank {s.crimeRank}
                  </span>
                )}
              </div>
              <div className="pg-card-flat" style={{ padding: 14 }}>
                {s.violentPer1000 != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12.5, borderBottom: '1px solid var(--pg-border)' }}>
                    <span style={{ color: 'var(--pg-text-dim)' }}>Violent crime / 1,000</span>
                    <span className="pg-mono">{s.violentPer1000.toFixed(1)}</span>
                  </div>
                )}
                {s.propertyPer1000 != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12.5, borderBottom: s.crimeTrendSummary ? '1px solid var(--pg-border)' : 'none' }}>
                    <span style={{ color: 'var(--pg-text-dim)' }}>Property crime / 1,000</span>
                    <span className="pg-mono">{s.propertyPer1000.toFixed(1)}</span>
                  </div>
                )}
                {s.crimeTrendSummary && (
                  <div style={{ paddingTop: 8, fontSize: 12, color: 'var(--pg-text-dim)', lineHeight: 1.5 }}>
                    {s.crimeTrendSummary}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Risk overlay — static */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span className="pg-label">Risk overlay</span>
              <span className="pg-badge pg-badge-green" style={{ fontSize: 10 }}>Low overall</span>
            </div>
            <div className="pg-card-flat" style={{ padding: 14 }}>
              {[
                { l: 'Flood (1-in-100yr)', s: 'Clear', dot: 'var(--pg-green)' },
                { l: 'Bushfire BAL', s: 'Not applicable', dot: 'var(--pg-text-very-faint)' },
                { l: 'Heritage overlay', s: 'Minor', dot: 'var(--pg-amber)' },
                { l: 'Contaminated land', s: 'Clear', dot: 'var(--pg-green)' },
              ].map((r, i, a) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', fontSize: 12.5, borderBottom: i < a.length - 1 ? '1px solid var(--pg-border)' : 'none' }}>
                  <div style={{ width: 6, height: 6, borderRadius: 999, background: r.dot, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{r.l}</span>
                  <span style={{ color: 'var(--pg-text-dim)', fontSize: 12 }}>{r.s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Feasibility */}
          <div>
            <div className="pg-label" style={{ marginBottom: 10 }}>Feasibility · OO · {p.state}</div>
            <div className="pg-card-flat" style={{ padding: 14 }}>
              {[
                { l: `Stamp duty (${p.state}, OO)`, v: calcStampDuty(p.price) },
                { l: 'Conveyancing & gov fees', v: '$2,500' },
                { l: "Buyer's agent fee (1.5%)", v: p.price ? `$${Math.round(p.price * 0.015).toLocaleString('en-AU')}` : '—' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12.5 }}>
                  <span style={{ color: 'var(--pg-text-dim)' }}>{f.l}</span>
                  <span className="pg-mono">{f.v}</span>
                </div>
              ))}
              <div style={{ height: 1, background: 'var(--pg-border)', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ fontWeight: 500 }}>Total acquisition</span>
                <span className="pg-mono" style={{ fontWeight: 600 }}>
                  {p.price ? formatPrice(p.price + Math.round(p.price * 0.05) + 2500 + Math.round(p.price * 0.015), null) : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div>
            <div className="pg-label" style={{ marginBottom: 10 }}>Recent activity</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { d: 'Today', e: 'Property viewed', i: 'eye' as const, c: 'var(--pg-text-dim)' },
                { d: 'Recent', e: `Matched · ${matchScore} score`, i: 'sparkles' as const, c: 'var(--pg-accent)' },
                { d: 'Listed', e: `Listed for ${price}`, i: 'building' as const, c: 'var(--pg-text-dim)' },
              ].map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 11, padding: '7px 0', fontSize: 12.5 }}>
                  <div style={{ width: 22, display: 'flex', justifyContent: 'center', paddingTop: 1 }}>
                    <Icon name={h.i} size={12} color={h.c} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div>{h.e}</div>
                    <div style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>{h.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
