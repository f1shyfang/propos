import { db } from '@/lib/db';
import { propertiesTable } from '@/lib/db/schema';
import { desc, gt, and, or, ilike, isNotNull } from 'drizzle-orm';
import { Icon } from '@/components/shared/icon';
import { PropertyThumb } from '@/components/shared/property-thumb';
import { MatchScore } from '@/components/shared/match-score';
import { PropertySearch } from '@/components/shared/property-search';
import { PropertyMapLoader } from '@/components/shared/property-map-loader';

function scoreToMatchPct(overall: number | null): number {
  if (!overall) return 50;
  return Math.min(99, Math.max(40, Math.round((overall / 8000) * 100)));
}

function formatPrice(price: number | null, display: string | null): string {
  if (display) return display;
  if (!price || price === 0) return 'POA';
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  return `$${(price / 1000).toFixed(0)}K`;
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; beds?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const type = sp.type?.trim();
  const beds = sp.beds ? parseInt(sp.beds) : undefined;

  const conditions = [gt(propertiesTable.price, 0), isNotNull(propertiesTable.latitude), isNotNull(propertiesTable.longitude)];

  if (q) {
    conditions.push(
      or(
        ilike(propertiesTable.address, `%${q}%`),
        ilike(propertiesTable.suburb, `%${q}%`),
        ilike(propertiesTable.lgaName, `%${q}%`),
      )!
    );
  }

  if (type) conditions.push(ilike(propertiesTable.propertyType, `%${type}%`));
  if (beds) conditions.push(gt(propertiesTable.bedrooms, beds - 1));

  const properties = await db.select()
    .from(propertiesTable)
    .where(and(...conditions))
    .orderBy(desc(propertiesTable.overallScore))
    .limit(50);

  const mapPins = properties
    .filter(p => p.latitude && p.longitude)
    .map((p, i) => {
      // Most records have lat/lng swapped in the DB — detect and correct
      const rawLat = p.latitude!;
      const rawLng = p.longitude!;
      const isSwapped = rawLat > 0 && rawLng < 0; // longitude stored in lat column
      const lat = isSwapped ? rawLng : rawLat;
      const lng = isSwapped ? rawLat : rawLng;
      return {
      id: p.id,
      lat,
      lng,
      address: p.address ?? '—',
      suburb: p.suburb ?? '—',
      price: formatPrice(p.price, p.priceDisplay),
      score: scoreToMatchPct(p.overallScore),
      underOffer: !!p.underOffer,
      href: `/properties/${p.id}`,
      };
    });

  // Default center: Melbourne CBD, or average of results
  const defaultCenter: [number, number] = mapPins.length
    ? [
        mapPins.reduce((s, p) => s + p.lat, 0) / mapPins.length,
        mapPins.reduce((s, p) => s + p.lng, 0) / mapPins.length,
      ]
    : [-37.8136, 144.9631];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search header */}
      <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--pg-border)' }}>
        <PropertySearch defaultValue={q} />
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', background: 'var(--pg-surface)', border: '1px solid var(--pg-border)', borderRadius: 6, padding: 2 }}>
          <button className="pg-btn pg-btn-sm pg-btn-ghost" style={{ background: 'var(--pg-bg-2)' }}><Icon name="map" size={12} />Map</button>
          <button className="pg-btn pg-btn-sm pg-btn-ghost" style={{ color: 'var(--pg-text-dim)' }}><Icon name="list" size={12} />List</button>
        </div>
        <button className="pg-btn"><Icon name="bookmark" size={13} />Save search</button>
      </div>

      {/* Filters */}
      <div style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--pg-border)', flexWrap: 'wrap' }}>
        <FilterChip label="House" param="type" value="house" current={type} />
        <FilterChip label="Townhouse" param="type" value="townhouse" current={type} />
        <FilterChip label="Unit / Apt" param="type" value="unit" current={type} />
        <FilterChip label="2+ bed" param="beds" value="2" current={sp.beds} />
        <FilterChip label="3+ bed" param="beds" value="3" current={sp.beds} />
        {(q || type || beds) && (
          <a href="/properties" style={{ background: 'transparent', border: 'none', color: 'var(--pg-text-faint)', fontSize: 11.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', padding: '4px 8px' }}>
            <Icon name="x" size={11} />Clear all
          </a>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>
          <span className="pg-mono" style={{ color: 'var(--pg-text)', fontWeight: 500 }}>{properties.length}</span> results
        </span>
        <span style={{ fontSize: 12, color: 'var(--pg-text-dim)', display: 'flex', alignItems: 'center', gap: 5 }}>
          Sort: Match score <Icon name="chevron-down" size={11} color="var(--pg-text-faint)" />
        </span>
      </div>

      {/* Split view */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* List panel */}
        <div style={{ width: 380, flex: '0 0 380px', borderRight: '1px solid var(--pg-border)', overflow: 'auto', background: 'var(--pg-bg)' }} className="pg-scroll">
          {properties.length === 0 && (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--pg-text-dim)' }}>
              <Icon name="search" size={24} color="var(--pg-text-very-faint)" />
              <div style={{ marginTop: 12, fontSize: 14 }}>No properties found</div>
              <div style={{ marginTop: 4, fontSize: 12, color: 'var(--pg-text-faint)' }}>Try a different suburb or address</div>
            </div>
          )}
          {properties.map((p, i) => {
            const score = scoreToMatchPct(p.overallScore);
            const price = formatPrice(p.price, p.priceDisplay);
            const isActive = i === 0;
            return (
              <a key={p.id} href={`/properties/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  display: 'flex', gap: 12, padding: '14px 16px',
                  borderBottom: '1px solid var(--pg-border)',
                  background: isActive ? 'var(--pg-accent-soft)' : 'transparent',
                  borderLeft: isActive ? '2px solid var(--pg-accent)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'background 100ms',
                }}>
                  <PropertyThumb seed={i} height={72} style={{ width: 100, flexShrink: 0, borderRadius: 6 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }} className="pg-truncate">{p.address}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--pg-text-dim)' }} className="pg-truncate">{p.suburb}, {p.state}</div>
                      </div>
                      <MatchScore score={score} size={30} stroke={2.5} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                      <span className="pg-mono" style={{ fontSize: 13, fontWeight: 500 }}>{price}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: 'var(--pg-text-dim)' }}>
                        {p.bedrooms != null && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="bed" size={11} />{p.bedrooms}</span>}
                        {p.bathrooms != null && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="bath" size={11} />{p.bathrooms}</span>}
                        {p.parkingSpaces != null && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="car" size={11} />{p.parkingSpaces}</span>}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      <span className={`pg-badge ${p.underOffer ? 'pg-badge-amber' : 'pg-badge-green'}`} style={{ fontSize: 10.5 }}>
                        {p.underOffer ? 'Under Offer' : 'For Sale'}
                      </span>
                      {p.propertyType && (
                        <span className="pg-badge" style={{ fontSize: 10.5, textTransform: 'capitalize' }}>{p.propertyType}</span>
                      )}
                      {p.days != null && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--pg-text-faint)' }}>{p.days}d</span>}
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Real Leaflet map */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <PropertyMapLoader pins={mapPins} defaultCenter={defaultCenter} />

          {/* Legend */}
          <div className="pg-card" style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 1000, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 16, fontSize: 11.5, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            {[
              { l: 'Top match', c: '#E5B100' },
              { l: 'For Sale', c: '#22C55E' },
              { l: 'Under Offer', c: '#F59E0B' },
            ].map((item, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--pg-text-dim)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 999, background: item.c }} /> {item.l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, param, value, current }: { label: string; param: string; value: string; current?: string }) {
  const active = current === value;
  const href = active ? '/properties' : `/properties?${param}=${encodeURIComponent(value)}`;
  return (
    <a href={href} style={{
      background: active ? 'var(--pg-accent-soft)' : 'var(--pg-surface)',
      border: '1px solid',
      borderColor: active ? 'rgba(229,177,0,0.3)' : 'var(--pg-border)',
      color: active ? '#806000' : 'var(--pg-text-dim)',
      borderRadius: 999, padding: '4px 10px',
      fontSize: 11.5, fontWeight: 500, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 5,
      textDecoration: 'none',
    }}>
      {label}
      {active && (
        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      )}
    </a>
  );
}
