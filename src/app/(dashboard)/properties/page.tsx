import { db } from '@/lib/db';
import { propertiesTable } from '@/lib/db/schema';
import { desc, gt, and, or, ilike, isNotNull } from 'drizzle-orm';
import { Icon } from '@/components/shared/icon';
import { PropertySearch } from '@/components/shared/property-search';
import { PropertiesView } from '@/components/shared/properties-view';
import type { PropertyPin } from '@/components/shared/properties-view';

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
    .limit(60);

  const initialPins: PropertyPin[] = properties
    .filter(p => p.latitude && p.longitude)
    .map(p => {
      const rawLat = p.latitude!;
      const rawLng = p.longitude!;
      const isSwapped = rawLat > 0 && rawLng < 0;
      const lat = isSwapped ? rawLng : rawLat;
      const lng = isSwapped ? rawLat : rawLng;
      return {
        id: p.id,
        lat, lng,
        address: p.address ?? '—',
        suburb: p.suburb ?? '—',
        state: p.state,
        price: formatPrice(p.price, p.priceDisplay),
        score: scoreToMatchPct(p.overallScore),
        underOffer: !!p.underOffer,
        href: `/properties/${p.id}`,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        parkingSpaces: p.parkingSpaces,
        propertyType: p.propertyType,
        days: p.days,
      };
    });

  const defaultCenter: [number, number] = initialPins.length
    ? [
        initialPins.reduce((s, p) => s + p.lat, 0) / initialPins.length,
        initialPins.reduce((s, p) => s + p.lng, 0) / initialPins.length,
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
          <a href="/properties" style={{ color: 'var(--pg-text-faint)', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', padding: '4px 8px' }}>
            <Icon name="x" size={11} />Clear all
          </a>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>
          Sort: Match score <Icon name="chevron-down" size={11} color="var(--pg-text-faint)" />
        </span>
      </div>

      <PropertiesView
        initialPins={initialPins}
        defaultCenter={defaultCenter}
        searchParams={{ q, type, beds: sp.beds }}
      />
    </div>
  );
}

function FilterChip({ label, param, value, current }: { label: string; param: string; value: string; current?: string }) {
  const active = current === value;
  const href = active ? '/properties' : `/properties?${param}=${encodeURIComponent(value)}`;
  return (
    <a href={href} style={{
      background: active ? 'var(--pg-accent-soft)' : 'var(--pg-surface)',
      border: '1px solid', borderColor: active ? 'rgba(229,177,0,0.3)' : 'var(--pg-border)',
      color: active ? '#806000' : 'var(--pg-text-dim)',
      borderRadius: 999, padding: '4px 10px', fontSize: 11.5, fontWeight: 500,
      display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none',
    }}>
      {label}
      {active && <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>}
    </a>
  );
}
