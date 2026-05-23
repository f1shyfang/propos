'use client';

import { useState, useCallback, useRef } from 'react';
import { Map, Overlay } from 'pigeon-maps';

const cartoPositron = (x: number, y: number, z: number) =>
  `https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;

export interface PropertyPin {
  id: string;
  lat: number;
  lng: number;
  address: string;
  suburb: string;
  state?: string | null;
  price: string;
  score: number;
  underOffer: boolean;
  href: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  parkingSpaces?: number | null;
  propertyType?: string | null;
  days?: number | null;
}

function MatchRing({ score }: { score: number }) {
  const r = 11, stroke = 2.5, circ = 2 * Math.PI * r;
  const color = score >= 80 ? '#16A34A' : score >= 65 ? '#E5B100' : '#A5A099';
  return (
    <svg width={28} height={28} viewBox="0 0 28 28" style={{ flexShrink: 0 }}>
      <circle cx={14} cy={14} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
      <circle cx={14} cy={14} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
        strokeLinecap="round" transform="rotate(-90 14 14)" />
      <text x={14} y={18} textAnchor="middle" fontSize={8} fontWeight={600} fill={color}>{score}</text>
    </svg>
  );
}

export function PropertiesView({ initialPins, defaultCenter, searchParams }: {
  initialPins: PropertyPin[];
  defaultCenter: [number, number];
  searchParams?: { q?: string; type?: string; beds?: string };
}) {
  const [pins, setPins] = useState<PropertyPin[]>(initialPins);
  const [activePin, setActivePin] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchBounds = useCallback((bounds: { ne: [number, number]; sw: [number, number] }) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const p = new URLSearchParams({
        minLat: String(bounds.sw[0]),
        maxLat: String(bounds.ne[0]),
        minLng: String(bounds.sw[1]),
        maxLng: String(bounds.ne[1]),
        ...(searchParams?.q ? { q: searchParams.q } : {}),
        ...(searchParams?.type ? { type: searchParams.type } : {}),
        ...(searchParams?.beds ? { beds: searchParams.beds } : {}),
      });
      try {
        const res = await fetch(`/api/properties?${p}`);
        const data = await res.json();
        if (data.pins) setPins(data.pins);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [searchParams]);

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      {/* List panel */}
      <div style={{ width: 380, flex: '0 0 380px', borderRight: '1px solid var(--pg-border)', overflow: 'auto', background: 'var(--pg-bg)', position: 'relative' }} className="pg-scroll">
        {loading && (
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(250,250,247,0.92)', backdropFilter: 'blur(6px)', padding: '8px 16px', fontSize: 12, color: 'var(--pg-text-faint)', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--pg-border)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pg-accent)', display: 'inline-block' }} />
            Searching area…
          </div>
        )}
        {!loading && pins.length === 0 && (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--pg-text-dim)' }}>
            <div style={{ fontSize: 14 }}>No properties in this area</div>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--pg-text-faint)' }}>Pan or zoom the map to explore</div>
          </div>
        )}
        {pins.map((p, i) => (
          <a
            key={p.id} href={p.href}
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            onMouseEnter={() => setActivePin(p.id)}
            onMouseLeave={() => setActivePin(null)}
          >
            <div style={{
              display: 'flex', gap: 12, padding: '14px 16px',
              borderBottom: '1px solid var(--pg-border)',
              background: activePin === p.id ? 'var(--pg-accent-soft)' : i === 0 ? 'var(--pg-accent-soft)' : 'transparent',
              borderLeft: activePin === p.id || i === 0 ? '2px solid var(--pg-accent)' : '2px solid transparent',
              transition: 'background 80ms',
            }}>
              {/* Thumbnail placeholder */}
              <div style={{ width: 100, flexShrink: 0, borderRadius: 6, background: `hsl(${(i * 47) % 360}deg 20% 88%)`, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.3)', fontWeight: 500, textTransform: 'capitalize' }}>{p.propertyType ?? 'Property'}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.address}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--pg-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.suburb}, {p.state}</div>
                  </div>
                  <MatchRing score={p.score} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <span style={{ fontFamily: 'var(--pg-font-mono)', fontSize: 13, fontWeight: 500 }}>{p.price}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: 'var(--pg-text-dim)' }}>
                    {p.bedrooms != null && <span>{p.bedrooms}bd</span>}
                    {p.bathrooms != null && <span>{p.bathrooms}ba</span>}
                    {p.parkingSpaces != null && <span>{p.parkingSpaces}pk</span>}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <span style={{ fontSize: 10.5, padding: '1px 6px', borderRadius: 4, background: p.underOffer ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.1)', color: p.underOffer ? '#92400E' : '#166534', fontWeight: 500 }}>
                    {p.underOffer ? 'Under Offer' : 'For Sale'}
                  </span>
                  {p.propertyType && <span style={{ fontSize: 10.5, color: 'var(--pg-text-faint)', textTransform: 'capitalize' }}>{p.propertyType}</span>}
                  {p.days != null && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--pg-text-faint)' }}>{p.days}d</span>}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Map
          provider={cartoPositron}
          defaultCenter={defaultCenter}
          defaultZoom={11}
          boxClassname="pg-map"
          onBoundsChanged={({ bounds }) => fetchBounds(bounds)}
          onClick={() => setActivePin(null)}
        >
          {pins.map((pin, i) => {
            const isTop = i === 0;
            const isActive = activePin === pin.id;
            const color = pin.underOffer ? '#F59E0B' : isTop ? '#E5B100' : '#22C55E';
            const size = isTop ? 20 : 14;
            return (
              <Overlay key={pin.id} anchor={[pin.lat, pin.lng]} offset={[size / 2, size / 2]}>
                <div style={{ position: 'relative' }}>
                  {isActive && (
                    <div
                      onClick={e => e.stopPropagation()}
                      style={{
                        position: 'absolute', bottom: size + 8, left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#FAFAF7', border: '1px solid rgba(20,18,12,0.1)',
                        borderRadius: 10, padding: '12px 14px', minWidth: 190,
                        boxShadow: '0 6px 20px rgba(0,0,0,0.13)', zIndex: 900,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{pin.address}</div>
                      <div style={{ fontSize: 11.5, color: '#888', marginBottom: 8 }}>{pin.suburb}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{pin.price}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 10.5, background: color, color: color === '#E5B100' ? '#1A1814' : '#FFF', borderRadius: 4, padding: '2px 7px', fontWeight: 500 }}>
                          {pin.score}% match
                        </span>
                      </div>
                      {(pin.bedrooms || pin.bathrooms) && (
                        <div style={{ fontSize: 11.5, color: '#888', marginTop: 5, display: 'flex', gap: 8 }}>
                          {pin.bedrooms && <span>{pin.bedrooms} bed</span>}
                          {pin.bathrooms && <span>{pin.bathrooms} bath</span>}
                          {pin.propertyType && <span style={{ textTransform: 'capitalize' }}>{pin.propertyType}</span>}
                        </div>
                      )}
                      <a href={pin.href} style={{ display: 'block', marginTop: 10, fontSize: 12.5, color: '#1A1814', fontWeight: 500, textDecoration: 'none', padding: '6px 10px', background: '#F4F3EF', borderRadius: 6, textAlign: 'center' }}>
                        View property →
                      </a>
                    </div>
                  )}
                  <div
                    onMouseEnter={() => setActivePin(pin.id)}
                    onMouseLeave={() => setActivePin(null)}
                    style={{
                      position: 'relative', zIndex: 1000,
                      width: size, height: size, borderRadius: '50%',
                      background: color, border: `2px solid ${isActive ? '#1A1814' : '#FFF'}`,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                      cursor: 'pointer',
                      transform: isActive ? 'scale(1.4)' : 'scale(1)',
                      transition: 'transform 100ms',
                    }}
                  />
                </div>
              </Overlay>
            );
          })}
        </Map>

        {/* Legend */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 1000, background: '#FFF', border: '1px solid rgba(20,18,12,0.08)', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 16, fontSize: 11.5, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          {[{ l: 'Top match', c: '#E5B100' }, { l: 'For Sale', c: '#22C55E' }, { l: 'Under Offer', c: '#F59E0B' }].map(item => (
            <span key={item.l} style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6B6660' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.c }} />{item.l}
            </span>
          ))}
        </div>

        {loading && (
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: '#FFF', borderRadius: 20, padding: '5px 14px', fontSize: 12, color: '#6B6660', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E5B100', display: 'inline-block' }} />
            Searching area…
          </div>
        )}
      </div>
    </div>
  );
}
