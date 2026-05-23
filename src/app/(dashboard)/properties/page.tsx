import { db } from '@/lib/db';
import { propertiesTable } from '@/lib/db/schema';
import { desc, gt, and, like } from 'drizzle-orm';
import { Icon } from '@/components/shared/icon';
import { PropertyThumb } from '@/components/shared/property-thumb';
import { MatchScore } from '@/components/shared/match-score';

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
  searchParams: Promise<{ suburb?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const suburb = sp.suburb;
  const type = sp.type;

  const conditions = [gt(propertiesTable.price, 0)];
  if (suburb) conditions.push(like(propertiesTable.suburb, `%${suburb}%`));
  if (type) conditions.push(like(propertiesTable.propertyType, `%${type}%`));

  const properties = await db.select()
    .from(propertiesTable)
    .where(and(...conditions))
    .orderBy(desc(propertiesTable.overallScore))
    .limit(8);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search header */}
      <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--pg-border)' }}>
        <div style={{ flex: 1, maxWidth: 480, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'var(--pg-surface)', border: '1px solid var(--pg-border-strong)', borderRadius: 8 }}>
          <Icon name="search" size={14} color="var(--pg-text-dim)" />
          <span style={{ fontSize: 13 }}>Search suburb, address…</span>
          <div style={{ flex: 1 }} />
          <Icon name="x" size={13} color="var(--pg-text-faint)" />
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', background: 'var(--pg-surface)', border: '1px solid var(--pg-border)', borderRadius: 6, padding: 2 }}>
          <button className="pg-btn pg-btn-sm pg-btn-ghost" style={{ background: 'var(--pg-bg-2)' }}><Icon name="map" size={12} />Map</button>
          <button className="pg-btn pg-btn-sm pg-btn-ghost" style={{ color: 'var(--pg-text-dim)' }}><Icon name="grid" size={12} />Grid</button>
          <button className="pg-btn pg-btn-sm pg-btn-ghost" style={{ color: 'var(--pg-text-dim)' }}><Icon name="list" size={12} />Table</button>
        </div>
        <button className="pg-btn"><Icon name="bookmark" size={13} />Save search</button>
      </div>

      {/* Filters */}
      <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--pg-border)', flexWrap: 'wrap' }}>
        {[
          { l: 'House · Townhouse', active: true },
          { l: '$500K – $2M', active: true },
          { l: '2+ bed', active: true },
          { l: 'Auction this month', active: false },
        ].map((c, i) => (
          <button key={i} style={{
            background: c.active ? 'var(--pg-accent-soft)' : 'var(--pg-surface)',
            border: '1px solid',
            borderColor: c.active ? 'rgba(229,177,0,0.3)' : 'var(--pg-border)',
            color: c.active ? '#806000' : 'var(--pg-text-dim)',
            borderRadius: 999, padding: '4px 10px',
            fontSize: 11.5, fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {c.l}
            {c.active && <Icon name="x" size={10} strokeWidth={2.2} />}
          </button>
        ))}
        <button style={{ background: 'transparent', border: 'none', color: 'var(--pg-text-faint)', borderRadius: 999, padding: '4px 8px', fontSize: 11.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="plus" size={11} />Add filter
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'var(--pg-text-dim)' }}>
          <span className="pg-mono" style={{ color: 'var(--pg-text)', fontWeight: 500 }}>{properties.length}</span> in view
        </span>
        <span style={{ fontSize: 12, color: 'var(--pg-text-dim)', display: 'flex', alignItems: 'center', gap: 5 }}>
          Sort: Match score <Icon name="chevron-down" size={11} color="var(--pg-text-faint)" />
        </span>
      </div>

      {/* Split view */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* List panel */}
        <div style={{ width: 380, flex: '0 0 380px', borderRight: '1px solid var(--pg-border)', overflow: 'auto', background: 'var(--pg-bg)' }} className="pg-scroll">
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
                      {p.days != null && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--pg-text-faint)' }}>{p.days}d</span>}
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Map */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <MapCanvas properties={properties.map(p => ({
            x: p.longitude ? Math.round(((p.longitude - 140) / 20) * 800 + 50) : 400,
            y: p.latitude ? Math.round(((-25 - p.latitude) / 20) * 600 + 50) : 300,
            score: scoreToMatchPct(p.overallScore),
            underOffer: !!p.underOffer,
          }))} />

          {/* Layer toggle */}
          <div className="pg-card" style={{ position: 'absolute', top: 16, right: 16, padding: 14, width: 200, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <div className="pg-label" style={{ marginBottom: 10 }}>Map Layers</div>
            {[
              { l: 'Flood (1-in-100yr)', c: 'var(--pg-blue)', on: true },
              { l: 'Bushfire (BAL)', c: 'var(--pg-amber)', on: false },
              { l: 'Heritage overlay', c: 'var(--pg-purple)', on: true },
              { l: 'School catchments', c: 'var(--pg-green)', on: false },
              { l: 'Transport', c: 'var(--pg-text-dim)', on: true },
            ].map((layer, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', fontSize: 12, cursor: 'pointer' }}>
                <div style={{ width: 13, height: 13, background: layer.on ? layer.c : 'transparent', border: `1.5px solid ${layer.on ? layer.c : 'var(--pg-text-very-faint)'}`, borderRadius: 3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {layer.on && <Icon name="check" size={9} color="#FFF" strokeWidth={3} />}
                </div>
                <span style={{ color: layer.on ? 'var(--pg-text)' : 'var(--pg-text-dim)' }}>{layer.l}</span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="pg-card" style={{ position: 'absolute', bottom: 16, left: 16, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 16, fontSize: 11.5 }}>
            {[{ l: 'For Sale', c: 'var(--pg-green)' }, { l: 'Under Offer', c: 'var(--pg-amber)' }, { l: 'Top match', c: 'var(--pg-accent)' }].map((item, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--pg-text-dim)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 999, background: item.c }} /> {item.l}
              </span>
            ))}
          </div>

          {/* Zoom */}
          <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', flexDirection: 'column' }}>
            <button className="pg-btn pg-btn-icon" style={{ width: 32, height: 32, borderRadius: '6px 6px 0 0', background: 'var(--pg-surface)', borderBottom: 'none' }}><Icon name="plus" size={13} /></button>
            <button className="pg-btn pg-btn-icon" style={{ width: 32, height: 32, borderRadius: '0 0 6px 6px', background: 'var(--pg-surface)' }}><Icon name="minus" size={13} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapCanvas({ properties }: { properties: Array<{ x: number; y: number; score: number; underOffer: boolean }> }) {
  return (
    <div className="pg-map" style={{ position: 'absolute', inset: 0 }}>
      <svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
        <defs>
          <pattern id="map-dots" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.7" fill="rgba(0,0,0,0.05)" />
          </pattern>
        </defs>
        <rect width="1000" height="700" fill="#F0EEE8" />
        <rect width="1000" height="700" fill="url(#map-dots)" />

        {/* Street grid */}
        <g stroke="rgba(0,0,0,0.06)" strokeWidth="1" fill="none">
          {[120, 200, 290, 360, 430, 620].map(y => <line key={y} x1="0" y1={y} x2="1000" y2={y} />)}
          {[80, 220, 380, 540, 700, 860].map(x => <line key={x} x1={x} y1="0" x2={x} y2="700" />)}
        </g>
        <g stroke="rgba(0,0,0,0.16)" strokeWidth="2.5" fill="none">
          <line x1="0" y1="340" x2="1000" y2="320" />
          <line x1="480" y1="0" x2="500" y2="700" />
        </g>

        {/* Property pins from real data */}
        {properties.map((p, i) => {
          const pinColor = p.underOffer ? 'var(--pg-amber)' : i === 0 ? 'var(--pg-accent)' : 'var(--pg-green)';
          const isBig = i === 0;
          return (
            <g key={i}>
              {isBig && <circle cx={p.x} cy={p.y} r="14" fill={pinColor} opacity="0.18" />}
              <circle cx={p.x} cy={p.y} r={isBig ? 7 : 5} fill={pinColor} stroke="#FFF" strokeWidth="1.5" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
