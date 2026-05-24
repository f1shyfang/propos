'use client';

import { useState, useCallback, useRef } from 'react';
import { Map, Overlay } from 'pigeon-maps';
import { osm } from 'pigeon-maps/providers';

interface MapPin {
  id: string;
  lat: number;
  lng: number;
  address: string;
  suburb: string;
  price: string;
  score: number;
  underOffer: boolean;
  href: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  propertyType?: string | null;
}

export function PropertyMap({ initialPins, defaultCenter, searchParams }: {
  initialPins: MapPin[];
  defaultCenter: [number, number];
  searchParams?: { q?: string; type?: string; beds?: string };
}) {
  const [pins, setPins] = useState<MapPin[]>(initialPins);
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

  const center = defaultCenter;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {loading && (
        <div style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, background: '#FFF', borderRadius: 20, padding: '5px 14px',
          fontSize: 12, color: 'var(--pg-text-dim)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--pg-accent)', display: 'inline-block', animation: 'pulse 1s infinite' }} />
          Searching area…
        </div>
      )}
      <Map
        provider={osm}
        center={center}
        defaultZoom={11}
        boxClassname="pg-map"
        onBoundsChanged={({ bounds }) => fetchBounds(bounds)}
      >
        {pins.map((pin, i) => {
          const isTop = i === 0;
          const color = pin.underOffer ? '#F59E0B' : isTop ? '#E5B100' : '#22C55E';
          const size = isTop ? 20 : 14;
          return (
            <Overlay key={pin.id} anchor={[pin.lat, pin.lng]} offset={[size / 2, size / 2]}>
              <div style={{ position: 'relative' }}>
                {activePin === pin.id && (
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{
                      position: 'absolute', bottom: size + 8, left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#FAFAF7', border: '1px solid rgba(20,18,12,0.1)',
                      borderRadius: 10, padding: '12px 14px', minWidth: 190,
                      boxShadow: '0 6px 20px rgba(0,0,0,0.13)', zIndex: 900,
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
                  onClick={() => setActivePin(activePin === pin.id ? null : pin.id)}
                  style={{
                    position: 'relative', zIndex: 1000,
                    width: size, height: size, borderRadius: '50%',
                    background: color, border: '2px solid #FFF',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                    cursor: 'pointer',
                    transform: activePin === pin.id ? 'scale(1.3)' : 'scale(1)',
                    transition: 'transform 100ms',
                  }}
                />
              </div>
            </Overlay>
          );
        })}
      </Map>
    </div>
  );
}
