'use client';

import dynamic from 'next/dynamic';

const PropertyMapInner = dynamic(
  () => import('./property-map').then(m => m.PropertyMap),
  {
    ssr: false,
    loading: () => (
      <div style={{ position: 'absolute', inset: 0, background: '#F4F3EF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A5A099', fontSize: 13 }}>
        Loading map…
      </div>
    ),
  }
);

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

export function PropertyMapLoader({ pins, defaultCenter }: {
  pins: MapPin[];
  defaultCenter: [number, number];
}) {
  return <PropertyMapInner pins={pins} defaultCenter={defaultCenter} />;
}
