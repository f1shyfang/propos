import { Suspense } from 'react';
import { db } from '@/lib/db';
import { buyerBriefsTable, cmaRecordsTable, propertiesTable, suburbsTable } from '@/lib/db/schema';
import { asc, desc, eq, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/shared/icon';
import { PropertyThumb } from '@/components/shared/property-thumb';
import { MatchScore } from '@/components/shared/match-score';
import { PropertyShortlistActions } from '@/components/shortlists/property-shortlist-actions';
import { calculatePricePerSqm } from '@/lib/cma-utils';
import { computeMatchScore } from '@/lib/match-score';
import { briefRowToCriteria, propertyRowToMatchInput, suburbMatches } from '@/lib/match-properties-for-brief';
import { propertyTypesMatch } from '@/lib/property-type-utils';

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

function formatSaleDate(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });
}

const NSW_BASE = 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services';

async function queryLayer(service: string, layer: number, envelope: string, fields: string): Promise<Record<string, unknown>[]> {
  const url = `${NSW_BASE}/${service}/MapServer/${layer}/query?geometry=${envelope}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=${fields}&returnGeometry=false&f=json`;
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    const json = await res.json() as { features?: Array<{ attributes: Record<string, unknown> }> };
    return (json.features ?? []).map(f => f.attributes);
  } catch {
    return [];
  }
}

type RiskOverlay = {
  flood: boolean;
  bushfire: string | null; // e.g. "Vegetation Category 1"
  heritage: { name: string; type: string } | null;
  nsw: boolean; // whether data is available (NSW only)
}

async function fetchRiskOverlay(lat: number, lng: number, state: string | null): Promise<RiskOverlay> {
  if (state?.toUpperCase() !== 'NSW') return { flood: false, bushfire: null, heritage: null, nsw: false };

  const buf = 0.001;
  const envelope = `${lng - buf},${lat - buf},${lng + buf},${lat + buf}`;

  const [floodRows, bushfireRows, heritageRows] = await Promise.all([
    queryLayer('ePlanning/Planning_Portal_Hazard', 230, envelope, 'LAY_CLASS'),
    queryLayer('ePlanning/Planning_Portal_Hazard', 229, envelope, 'd_Category,d_Guidelin'),
    queryLayer('ePlanning/Planning_Portal_Principal_Planning', 16, envelope, 'H_NAME,LAY_CLASS'),
  ]);

  const bushfireCategory = bushfireRows.find(r => r.d_Category && r.d_Category !== 'Vegetation Buffer');
  return {
    flood: floodRows.length > 0,
    bushfire: bushfireCategory ? (bushfireCategory.d_Category as string) : null,
    heritage: heritageRows.length > 0 ? { name: heritageRows[0].H_NAME as string, type: heritageRows[0].LAY_CLASS as string } : null,
    nsw: true,
  };
}

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ briefId?: string }>;
}) {
  const { id } = await params;
  const { briefId: briefIdParam } = await searchParams;
  const selectedBriefId = briefIdParam ? Number(briefIdParam) : null;

  const [rows, allBriefs] = await Promise.all([
    db.select()
      .from(propertiesTable)
      .leftJoin(suburbsTable, eq(propertiesTable.suburbId, suburbsTable.suburbId))
      .where(eq(propertiesTable.id, id))
      .limit(1),
    db.select({ id: buyerBriefsTable.id, clientName: buyerBriefsTable.clientName })
      .from(buyerBriefsTable)
      .orderBy(asc(buyerBriefsTable.clientName)),
  ]);

  if (!rows.length) notFound();

  const { properties: p, suburbs: s } = rows[0];

  // Per-brief scoring when a client is selected
  let selectedBrief: typeof buyerBriefsTable.$inferSelect | null = null;
  let perBriefScore: number | null = null;
  let briefBreakdown: {
    budgetOk: boolean;
    suburbOk: boolean;
    typeOk: boolean;
    bedsOk: boolean;
    bathsOk: boolean;
    parkingOk: boolean;
  } | null = null;

  if (selectedBriefId) {
    const briefRows = await db.select()
      .from(buyerBriefsTable)
      .where(eq(buyerBriefsTable.id, selectedBriefId))
      .limit(1);
    selectedBrief = briefRows[0] ?? null;
    if (selectedBrief) {
      const criteria = briefRowToCriteria(selectedBrief);
      const matchInput = propertyRowToMatchInput(p);
      perBriefScore = computeMatchScore(matchInput, criteria);
      briefBreakdown = {
        budgetOk: (p.price ?? 0) >= criteria.budgetMin && (p.price ?? 0) <= criteria.budgetMax,
        suburbOk: suburbMatches(criteria.suburbs, p.suburb ?? ''),
        typeOk: propertyTypesMatch(criteria.propertyTypes, p.propertyType ?? ''),
        bedsOk: (p.bedrooms ?? 0) >= criteria.minBeds,
        bathsOk: (p.bathrooms ?? 0) >= criteria.minBaths,
        parkingOk: criteria.parking !== 'required' || !!p.parkingSpaces,
      };
    }
  }

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
  const risk = await fetchRiskOverlay(trueLat ?? 0, trueLng ?? 0, p.state);

  const cmaRows = await db.select()
    .from(cmaRecordsTable)
    .where(eq(cmaRecordsTable.propertyId, p.id))
    .orderBy(desc(cmaRecordsTable.saleDate))
    .limit(6);

  const price = formatPrice(p.price, p.priceDisplay);

  // Gap between asking price and AI estimated value
  const valuationGapPct = (p.appraisedValue && p.price)
    ? ((p.price - p.appraisedValue) / p.appraisedValue) * 100
    : null;

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
                <span className={`pg-badge ${matchScore >= 80 ? 'pg-badge-green' : matchScore >= 65 ? 'pg-badge-yellow' : 'pg-badge-red'}`}><Icon name="sparkles" size={10} /> AI matched · {matchScore}</span>
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

          {/* Valuation */}
          {p.appraisedValue && (
            <div style={{ marginTop: 20, borderRadius: 8, border: '1px solid var(--pg-border)', overflow: 'hidden' }}>
              <div style={{ padding: '9px 16px', borderBottom: '1px solid var(--pg-border)', background: 'var(--pg-bg-2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--pg-text-dim)' }}>Valuation</span>
                <div style={{ flex: 1 }} />
                {valuationGapPct !== null && (
                  <span className={`pg-badge ${valuationGapPct > 5 ? 'pg-badge-red' : valuationGapPct < -5 ? 'pg-badge-green' : 'pg-badge-yellow'}`} style={{ fontSize: 10 }}>
                    {valuationGapPct > 5 ? 'Above appraised value' : valuationGapPct < -5 ? 'Below appraised value — potential deal' : 'Near appraised value'}
                  </span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--pg-border)' }}>
                <div style={{ padding: '12px 16px', borderRight: '1px solid var(--pg-border)' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--pg-text-faint)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>Asking price</div>
                  <div className="pg-display" style={{ fontSize: 20, fontWeight: 500 }}>{price}</div>
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--pg-text-faint)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>Appraised value</div>
                  <div className="pg-display" style={{ fontSize: 20, fontWeight: 500 }}>{formatPrice(p.appraisedValue, null)}</div>
                  <div style={{ fontSize: 11, color: 'var(--pg-text-faint)', marginTop: 3 }}>
                    Range: {formatPrice(Math.round(p.appraisedValue * 0.95), null)} – {formatPrice(Math.round(p.appraisedValue * 1.05), null)}
                  </div>
                </div>
              </div>
              <div style={{ padding: '10px 16px', display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ fontSize: 11.5, color: 'var(--pg-text-dim)', flex: 1 }}>
                  {valuationGapPct !== null
                    ? valuationGapPct > 5
                      ? `Asking is ${valuationGapPct.toFixed(1)}% above appraised value. May have room to negotiate.`
                      : valuationGapPct < -5
                        ? `Asking is ${Math.abs(valuationGapPct).toFixed(1)}% below appraised value — priced to sell quickly.`
                        : `Asking is within ${Math.abs(valuationGapPct).toFixed(1)}% of appraised value — fairly priced.`
                    : 'No valuation gap data.'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--pg-text-faint)', flexShrink: 0 }}>
                  Confidence: <span style={{ color: 'var(--pg-text)', fontWeight: 500 }}>{p.confidenceScore ?? '—'}/100</span>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginTop: 24, borderBottom: '1px solid var(--pg-border)' }}>
            <span style={{
              padding: '12px 16px 14px',
              fontSize: 13, fontWeight: 500,
              color: 'var(--pg-text)',
              borderBottom: '2px solid var(--pg-text)',
              marginBottom: -1,
            }}>Overview</span>
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

            {/* Nearby Schools */}
            {nearbySchools.length > 0 && (
              <div style={{ paddingTop: 28, borderTop: '1px solid var(--pg-border)' }}>
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

            {/* CMA table */}
            <div style={{ paddingTop: 28, borderTop: '1px solid var(--pg-border)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
                <h3 className="pg-display" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Recent comparable sales</h3>
                <span style={{ fontSize: 12, color: 'var(--pg-text-faint)' }}>Last 6 months · within 1km</span>
                <div style={{ flex: 1 }} />
              </div>
              <div className="pg-card-flat" style={{ overflow: 'hidden' }}>
                {cmaRows.length ? cmaRows.map((c, i, a) => {
                  const pricePerSqm = c.pricePerSqm ?? calculatePricePerSqm(c.salePrice, c.landSizeSqm);
                  const bedBathCar = [c.bedrooms, c.bathrooms, p.parkingSpaces]
                    .map(v => v ?? '—')
                    .join('·');

                  return (
                    <div key={c.id} className="pg-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 0.8fr', padding: '12px 16px', alignItems: 'center', fontSize: 13, borderBottom: i < a.length - 1 ? '1px solid var(--pg-border)' : 'none' }}>
                      <div style={{ fontWeight: 500 }}>{c.comparableAddress ?? 'Comparable'}</div>
                      <div style={{ color: 'var(--pg-text-dim)', fontSize: 12 }}>{formatSaleDate(c.saleDate)}</div>
                      <div className="pg-mono">{c.salePrice ? formatPrice(c.salePrice, null) : '—'}</div>
                      <div style={{ color: 'var(--pg-text-dim)' }}>{bedBathCar}</div>
                      <div style={{ color: 'var(--pg-text-dim)', fontSize: 12 }}>{c.landSizeSqm ? `${c.landSizeSqm}m²` : '—'}</div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="pg-mono" style={{ fontSize: 11, color: 'var(--pg-text-faint)' }}>
                          {pricePerSqm ? `$${pricePerSqm.toLocaleString('en-AU')}/m²` : '—'}
                        </span>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--pg-text-dim)' }}>
                    No comparable sales available.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Actions (includes buyer brief selector) */}
          <Suspense fallback={<div className="pg-card" style={{ padding: 18, fontSize: 13, color: 'var(--pg-text-dim)' }}>Loading actions…</div>}>
            <PropertyShortlistActions propertyId={id} />
          </Suspense>

          {/* Per-brief match breakdown — shown when a brief is selected */}
          {briefBreakdown && (
            <div style={{ background: 'var(--pg-bg-2)', border: '1px solid var(--pg-border)', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Icon name="sparkles" size={13} color="var(--pg-text-dim)" />
                <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--pg-text-dim)' }}>
                  {selectedBrief!.clientName} match
                </span>
                <div style={{ flex: 1 }} />
                {perBriefScore === 0
                  ? <span className="pg-badge pg-badge-red" style={{ fontSize: 10 }}>No match</span>
                  : <MatchScore score={perBriefScore!} size={28} stroke={2.5} />
                }
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { ok: briefBreakdown.budgetOk, l: briefBreakdown.budgetOk ? `Budget: ${price} in range` : `Budget: ${price} out of range` },
                  { ok: briefBreakdown.suburbOk, l: briefBreakdown.suburbOk ? `Suburb: ${p.suburb} matches` : `Suburb: ${p.suburb} not in brief` },
                  { ok: briefBreakdown.typeOk, l: briefBreakdown.typeOk ? `Type: ${p.propertyType} matches` : `Type: ${p.propertyType} not in brief` },
                  { ok: briefBreakdown.bedsOk, l: briefBreakdown.bedsOk ? `Beds: ${p.bedrooms ?? '—'} meets min` : `Beds: ${p.bedrooms ?? '—'} below min` },
                  { ok: briefBreakdown.bathsOk, l: briefBreakdown.bathsOk ? `Baths: ${p.bathrooms ?? '—'} meets min` : `Baths: ${p.bathrooms ?? '—'} below min` },
                  { ok: briefBreakdown.parkingOk, l: briefBreakdown.parkingOk ? `Parking: ${p.parkingSpaces ? `${p.parkingSpaces} space${p.parkingSpaces !== 1 ? 's' : ''}` : 'not required'}` : 'Parking: required but none' },
                ].map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 13, height: 13, borderRadius: 999, flexShrink: 0, background: m.ok ? 'var(--pg-green)' : 'var(--pg-red, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={m.ok ? 'check' : 'minus'} size={9} color="#FFF" strokeWidth={3} />
                    </div>
                    <div style={{ fontSize: 12, color: m.ok ? 'var(--pg-text)' : 'var(--pg-text-dim)' }}>{m.l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Propos score breakdown */}
          <div style={{ background: 'var(--pg-bg-2)', border: '1px solid var(--pg-border)', borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Icon name="sparkles" size={13} color="var(--pg-text-dim)" />
              <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--pg-text-dim)' }}>Propos Score</span>
              <div style={{ flex: 1 }} />
              <MatchScore score={matchScore} size={28} stroke={2.5} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 16px' }}>
              {[
                { ok: (p.sweetspotScore ?? 0) >= 50, l: `Sweetspot: ${p.sweetspotScore ?? '—'}` },
                { ok: (p.confidenceScore ?? 0) >= 70, l: `Confidence: ${p.confidenceScore ?? '—'}` },
                { ok: (p.distressScore ?? 0) <= 50, l: `Distress: ${p.distressScore ?? '—'}` },
                { ok: p.underOffer === 0, l: p.underOffer ? 'Under offer' : 'Not under offer' },
                { ok: p.grossYield != null && p.grossYield > 0.03, l: p.grossYield ? `Yield: ${(p.grossYield * 100).toFixed(1)}%` : 'Yield pending' },
                { ok: (p.rScore ?? 0) >= 70, l: `R-score: ${p.rScore ?? '—'}` },
              ].map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 13, height: 13, borderRadius: 999, flexShrink: 0, background: m.ok ? 'var(--pg-green)' : 'var(--pg-text-very-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={m.ok ? 'check' : 'minus'} size={9} color="#FFF" strokeWidth={3} />
                  </div>
                  <div style={{ fontSize: 11.5, color: m.ok ? 'var(--pg-text)' : 'var(--pg-text-dim)' }}>{m.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Listing agent */}
          <div className="pg-card-flat" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--pg-border)', background: 'var(--pg-bg-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pg-label">Listing info</span>
            </div>
            <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="pg-avatar pg-avatar-lg" style={{ background: 'var(--pg-bg-2)' }}>LA</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{p.suburb ?? 'Local'} Agency</div>
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
            <div className="pg-card-flat" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--pg-border)', background: 'var(--pg-bg-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="pg-label">Crime &amp; Safety</span>
                {s.crimeRank != null && (
                  <span className={`pg-badge ${s.crimeRank <= 30 ? 'pg-badge-green' : s.crimeRank <= 70 ? 'pg-badge-yellow' : 'pg-badge-red'}`} style={{ fontSize: 10 }}>
                    Rank {s.crimeRank}
                  </span>
                )}
              </div>
              <div style={{ padding: '0 14px' }}>
                {s.violentPer1000 != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 12.5, borderBottom: '1px solid var(--pg-border)' }}>
                    <span style={{ color: 'var(--pg-text-dim)' }}>Violent crime / 1,000</span>
                    <span className="pg-mono">{s.violentPer1000.toFixed(1)}</span>
                  </div>
                )}
                {s.propertyPer1000 != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 12.5, borderBottom: s.crimeTrendSummary ? '1px solid var(--pg-border)' : 'none' }}>
                    <span style={{ color: 'var(--pg-text-dim)' }}>Property crime / 1,000</span>
                    <span className="pg-mono">{s.propertyPer1000.toFixed(1)}</span>
                  </div>
                )}
                {s.crimeTrendSummary && (
                  <div style={{ padding: '8px 0', fontSize: 12, color: 'var(--pg-text-dim)', lineHeight: 1.5 }}>
                    {s.crimeTrendSummary}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Risk overlay */}
          <div className="pg-card-flat" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--pg-border)', background: 'var(--pg-bg-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pg-label">Risk overlay</span>
              {risk.nsw && !risk.flood && !risk.bushfire && !risk.heritage && (
                <span className="pg-badge pg-badge-green" style={{ fontSize: 10 }}>Low overall</span>
              )}
              {!risk.nsw && <span className="pg-badge" style={{ fontSize: 10 }}>NSW only</span>}
            </div>
            <div style={{ padding: '0 14px' }}>
              {[
                { l: 'Flood planning area', s: !risk.nsw ? 'No data' : risk.flood ? 'Affected' : 'Clear', dot: !risk.nsw ? 'var(--pg-text-very-faint)' : risk.flood ? 'var(--pg-red, #ef4444)' : 'var(--pg-green)' },
                { l: 'Bushfire prone land', s: !risk.nsw ? 'No data' : risk.bushfire ?? 'Clear', dot: !risk.nsw ? 'var(--pg-text-very-faint)' : risk.bushfire ? 'var(--pg-amber, #f59e0b)' : 'var(--pg-green)' },
                { l: 'Heritage overlay', s: !risk.nsw ? 'No data' : risk.heritage ? (risk.heritage.name ?? risk.heritage.type) : 'None listed', dot: !risk.nsw ? 'var(--pg-text-very-faint)' : risk.heritage ? 'var(--pg-amber, #f59e0b)' : 'var(--pg-green)' },
              ].map((r, i, a) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '8px 0', fontSize: 12.5, borderBottom: i < a.length - 1 ? '1px solid var(--pg-border)' : 'none' }}>
                  <div style={{ width: 6, height: 6, borderRadius: 999, background: r.dot, flexShrink: 0, marginTop: 4 }} />
                  <span style={{ flex: 1 }}>{r.l}</span>
                  <span style={{ color: 'var(--pg-text-dim)', fontSize: 12, textAlign: 'right', maxWidth: 120 }}>{r.s}</span>
                </div>
              ))}
            </div>
            {risk.nsw && (
              <div style={{ padding: '0 14px 10px', fontSize: 11, color: 'var(--pg-text-faint)', lineHeight: 1.4 }}>
                Source: NSW ePlanning Spatial Viewer. Flood data may not reflect latest council maps.
              </div>
            )}
          </div>

          {/* Feasibility */}
          <div className="pg-card-flat" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--pg-border)', background: 'var(--pg-bg-2)' }}>
              <span className="pg-label">Feasibility · OO · {p.state}</span>
            </div>
            <div style={{ padding: '0 14px' }}>
              {[
                { l: `Stamp duty (${p.state}, OO)`, v: calcStampDuty(p.price) },
                { l: 'Conveyancing & gov fees', v: '$2,500' },
                { l: "Buyer's agent fee (1.5%)", v: p.price ? `$${Math.round(p.price * 0.015).toLocaleString('en-AU')}` : '—' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 12.5, borderBottom: '1px solid var(--pg-border)' }}>
                  <span style={{ color: 'var(--pg-text-dim)' }}>{f.l}</span>
                  <span className="pg-mono">{f.v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 13 }}>
                <span style={{ fontWeight: 500 }}>Total acquisition</span>
                <span className="pg-mono" style={{ fontWeight: 600 }}>
                  {p.price ? formatPrice(p.price + Math.round(p.price * 0.05) + 2500 + Math.round(p.price * 0.015), null) : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="pg-card-flat" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--pg-border)', background: 'var(--pg-bg-2)' }}>
              <span className="pg-label">Recent activity</span>
            </div>
            <div style={{ padding: '4px 14px' }}>
              {[
                { d: 'Today', e: 'Property viewed', i: 'eye' as const, c: 'var(--pg-text-dim)' },
                { d: 'Recent', e: `Matched · ${matchScore} score`, i: 'sparkles' as const, c: 'var(--pg-text-dim)' },
                { d: 'Listed', e: `Listed for ${price}`, i: 'building' as const, c: 'var(--pg-text-dim)' },
              ].map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 11, padding: '8px 0', fontSize: 12.5 }}>
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
