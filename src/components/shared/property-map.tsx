'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';

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
}

function FitBounds({ pins }: { pins: MapPin[] }) {
  const map = useMap();
  useEffect(() => {
    if (!pins.length) return;
    if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], 14);
      return;
    }
    const lats = pins.map(p => p.lat);
    const lngs = pins.map(p => p.lng);
    map.fitBounds(
      [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
      { padding: [48, 48] }
    );
  }, [map, pins]);
  return null;
}

export function PropertyMap({ pins, defaultCenter }: {
  pins: MapPin[];
  defaultCenter: [number, number];
}) {
  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
      />
      <FitBounds pins={pins} />
      {pins.map((pin, i) => {
        const isTop = i === 0;
        const color = pin.underOffer ? '#F59E0B' : isTop ? '#E5B100' : pin.score >= 80 ? '#16A34A' : '#22C55E';
        return (
          <CircleMarker
            key={pin.id}
            center={[pin.lat, pin.lng]}
            radius={isTop ? 10 : 7}
            pathOptions={{ color: '#FFF', weight: 2, fillColor: color, fillOpacity: 1 }}
            eventHandlers={{ click: () => window.location.href = pin.href }}
          >
            <Popup offset={[0, -4]}>
              <div style={{ minWidth: 160, fontFamily: 'system-ui, sans-serif' }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{pin.address}</div>
                <div style={{ fontSize: 11.5, color: '#666', marginBottom: 6 }}>{pin.suburb}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{pin.price}</span>
                  <span style={{ fontSize: 11, background: color, color: '#FFF', borderRadius: 4, padding: '2px 6px' }}>{pin.score}% match</span>
                </div>
                <a href={pin.href} style={{ display: 'block', marginTop: 8, fontSize: 12, color: '#1A1814', textDecoration: 'underline' }}>View property →</a>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
