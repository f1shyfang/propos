'use client';

import { useState, useMemo } from 'react';
import { Map, Overlay } from 'pigeon-maps';
import { Icon } from '@/components/shared/icon';
import { MatchScore } from '@/components/shared/match-score';
import { PropertyThumb } from '@/components/shared/property-thumb';
import { centerFromPins, DEFAULT_MAP_CENTER } from '@/lib/geo-utils';
import { cartoVoyager } from '@/lib/map-tiles';

export interface BriefMatchPin {
  id: string;
  lat: number | null;
  lng: number | null;
  address: string;
  suburb: string | null;
  state: string | null;
  price: string;
  score: number;
  underOffer: boolean;
  href: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  parkingSpaces?: number | null;
  propertyType?: string | null;
  imageUrl?: string | null;
}

interface BriefMatchesMapViewProps {
  matches: BriefMatchPin[];
  shortlistedIds: Set<string>;
  compareIds: string[];
  shortlisting: string | null;
  onToggleCompare: (id: string) => void;
  onToggleShortlist: (id: string) => void;
  loading?: boolean;
  total?: number | null;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function BriefMatchesMapView({
  matches,
  shortlistedIds,
  compareIds,
  shortlisting,
  onToggleCompare,
  onToggleShortlist,
  loading,
  total,
  onLoadMore,
  hasMore,
}: BriefMatchesMapViewProps) {
  const [activePin, setActivePin] = useState<string | null>(null);
  const mapPins = useMemo(
    () => matches.filter(m => m.lat != null && m.lng != null),
    [matches],
  );
  const defaultCenter = useMemo(
    () => mapPins.length > 0
      ? centerFromPins(mapPins.map(p => ({ lat: p.lat as number, lng: p.lng as number })))
      : DEFAULT_MAP_CENTER,
    [mapPins],
  );
  const topMatchId = matches[0]?.id;

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0, borderTop: '1px solid var(--pg-border)' }}>
      <div
        style={{
          width: 380,
          flex: '0 0 380px',
          borderRight: '1px solid var(--pg-border)',
          overflow: 'auto',
          background: 'var(--pg-bg)',
        }}
        className="pg-scroll"
      >
        {loading && matches.length === 0 && (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--pg-text-dim)', fontSize: 13 }}>
            Finding matches…
          </div>
        )}
        {!loading && mapPins.length === 0 && matches.length > 0 && (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--pg-text-dim)' }}>
            <div style={{ fontSize: 14 }}>No mappable properties</div>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--pg-text-faint)' }}>
              Matches need coordinates to appear on the map
            </div>
          </div>
        )}
        {matches.map((m, i) => {
          const inShortlist = shortlistedIds.has(m.id);
          const inCompare = compareIds.includes(m.id);
          const hasCoords = m.lat != null && m.lng != null;
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                gap: 10,
                padding: '14px 16px',
                borderBottom: '1px solid var(--pg-border)',
                background: activePin === m.id ? 'var(--pg-accent-soft)' : i === 0 ? 'var(--pg-accent-soft)' : 'transparent',
                borderLeft: activePin === m.id || i === 0 ? '2px solid var(--pg-accent)' : '2px solid transparent',
                transition: 'background 80ms',
                opacity: hasCoords ? 1 : 0.55,
              }}
              onMouseEnter={() => hasCoords && setActivePin(m.id)}
              onMouseLeave={() => setActivePin(null)}
            >
              <input
                type="checkbox"
                checked={inCompare}
                onChange={() => onToggleCompare(m.id)}
                disabled={!inCompare && compareIds.length >= 3}
                title={!inCompare && compareIds.length >= 3 ? 'Max 3 for comparison' : 'Compare'}
                style={{ accentColor: 'var(--pg-accent)', cursor: 'pointer', marginTop: 12, flexShrink: 0 }}
              />
              <a href={m.href} style={{ display: 'flex', gap: 11, flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}>
                <PropertyThumb seed={i % 6} height={72} imageUrl={m.imageUrl} style={{ width: 100, flexShrink: 0, borderRadius: 6 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.address}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--pg-text-dim)' }}>{m.suburb}, {m.state}</div>
                    </div>
                    <MatchScore score={m.score} size={28} stroke={2.5} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontFamily: 'var(--pg-font-mono)', fontSize: 13, fontWeight: 500 }}>{m.price}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--pg-text-dim)' }}>
                      {m.bedrooms != null && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="bed" size={11} />{m.bedrooms}</span>}
                      {m.bathrooms != null && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="bath" size={11} />{m.bathrooms}</span>}
                      {m.parkingSpaces != null && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="car" size={11} />{m.parkingSpaces}</span>}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <span style={{
                      fontSize: 10.5, padding: '1px 6px', borderRadius: 4,
                      background: m.underOffer ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.1)',
                      color: m.underOffer ? '#92400E' : '#166534', fontWeight: 500,
                    }}>
                      {m.underOffer ? 'Under Offer' : 'For Sale'}
                    </span>
                    {m.propertyType && <span style={{ fontSize: 10.5, color: 'var(--pg-text-faint)', textTransform: 'capitalize' }}>{m.propertyType}</span>}
                  </div>
                </div>
              </a>
              <button
                type="button"
                onClick={() => onToggleShortlist(m.id)}
                disabled={shortlisting === m.id}
                className={`pg-btn pg-btn-sm ${inShortlist ? 'pg-btn-accent' : ''}`}
                style={{ alignSelf: 'center', flexShrink: 0 }}
              >
                <Icon name="bookmark" size={11} />
              </button>
            </div>
          );
        })}
        {hasMore && onLoadMore && (
          <div style={{ padding: 16, textAlign: 'center' }}>
            <button type="button" className="pg-btn pg-btn-sm" disabled={loading} onClick={onLoadMore}>
              {loading ? 'Loading…' : `Load more${total != null ? ` (${total - matches.length} remaining)` : ''}`}
            </button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <Map
            key={mapPins.length > 0 ? `pins-${mapPins.length}` : 'empty'}
            provider={cartoVoyager}
            defaultCenter={defaultCenter}
            defaultZoom={11}
            boxClassname="pg-map"
            onClick={() => setActivePin(null)}
          >
            {[...mapPins].sort((a, b) => a.id === activePin ? 1 : b.id === activePin ? -1 : 0).map((pin) => {
              const isTop = topMatchId === pin.id;
              const isActive = activePin === pin.id;
              const color = pin.underOffer ? '#F59E0B' : isTop ? '#E5B100' : '#22C55E';
              const size = isTop ? 20 : 14;
              return (
                <Overlay key={pin.id} anchor={[pin.lat as number, pin.lng as number]} offset={[size / 2, size / 2]}>
                  <div style={{ position: 'relative' }}>
                    {isActive && (
                      <div onClick={e => e.stopPropagation()} style={{
                        position: 'absolute', bottom: size + 8, left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#FAFAF7', border: '1px solid rgba(20,18,12,0.1)',
                        borderRadius: 10, padding: '12px 14px', minWidth: 190,
                        boxShadow: '0 6px 20px rgba(0,0,0,0.13)', zIndex: 900, whiteSpace: 'nowrap',
                      }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{pin.address}</div>
                        <div style={{ fontSize: 11.5, color: '#888', marginBottom: 8 }}>{pin.suburb}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{pin.price}</span>
                          <span style={{
                            marginLeft: 'auto', fontSize: 10.5, background: color,
                            color: color === '#E5B100' ? '#1A1814' : '#FFF',
                            borderRadius: 4, padding: '2px 7px', fontWeight: 500,
                          }}>{pin.score}% match</span>
                        </div>
                        {(pin.bedrooms || pin.bathrooms) && (
                          <div style={{ fontSize: 11.5, color: '#888', marginTop: 5, display: 'flex', gap: 8 }}>
                            {pin.bedrooms && <span>{pin.bedrooms} bed</span>}
                            {pin.bathrooms && <span>{pin.bathrooms} bath</span>}
                            {pin.propertyType && <span style={{ textTransform: 'capitalize' }}>{pin.propertyType}</span>}
                          </div>
                        )}
                        <a href={pin.href} style={{
                          display: 'block', marginTop: 10, fontSize: 12.5, color: '#1A1814', fontWeight: 500,
                          textDecoration: 'none', padding: '6px 10px', background: '#F4F3EF', borderRadius: 6, textAlign: 'center',
                        }}>
                          View property →
                        </a>
                      </div>
                    )}
                    <div
                      onClick={e => { e.stopPropagation(); setActivePin(activePin === pin.id ? null : pin.id); }}
                      style={{
                        position: 'relative', zIndex: 1000,
                        width: size, height: size, borderRadius: '50%',
                        background: color, border: `2px solid ${isActive ? '#1A1814' : '#FFF'}`,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.25)', cursor: 'pointer',
                        transform: isActive ? 'scale(1.4)' : 'scale(1)',
                        transition: 'transform 100ms',
                      }}
                    />
                  </div>
                </Overlay>
              );
            })}
          </Map>
        </div>

        <div style={{
          position: 'absolute', bottom: 16, left: 16, zIndex: 1000,
          background: '#FFF', border: '1px solid rgba(20,18,12,0.08)', borderRadius: 8,
          padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 16, fontSize: 11.5,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          {[{ l: 'Top match', c: '#E5B100' }, { l: 'For Sale', c: '#22C55E' }, { l: 'Under Offer', c: '#F59E0B' }].map(item => (
            <span key={item.l} style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6B6660' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.c }} />{item.l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
