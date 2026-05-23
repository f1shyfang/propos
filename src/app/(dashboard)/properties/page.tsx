import { db } from '@/lib/db';
import { propertiesTable } from '@/lib/db/schema';
import { desc, gt, isNotNull } from 'drizzle-orm';
import { PropertiesView } from '@/components/shared/properties-view';
import type { PropertyPin } from '@/components/shared/properties-view';

function scoreToMatchPct(overall: number | null): number {
  if (!overall) return 50;
  return Math.min(99, Math.max(1, Math.round(overall / 100)));
}

function formatPrice(price: number | null, display: string | null): string {
  if (display) return display;
  if (!price || price === 0) return 'POA';
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  return `$${(price / 1000).toFixed(0)}K`;
}

export const dynamic = 'force-dynamic';

export default async function PropertiesPage() {
  // Initial load — top 60 by score. Filters are applied client-side via API.
  const properties = await db.select()
    .from(propertiesTable)
    .where(gt(propertiesTable.price, 0))
    .orderBy(desc(propertiesTable.overallScore))
    .limit(60);

  const initialPins: PropertyPin[] = properties
    .filter(p => p.latitude && p.longitude)
    .map(p => {
      const rawLat = p.latitude!;
      const rawLng = p.longitude!;
      const isSwapped = rawLat > 0 && rawLng < 0;
      return {
        id: p.id,
        lat: isSwapped ? rawLng : rawLat,
        lng: isSwapped ? rawLat : rawLng,
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
    <PropertiesView initialPins={initialPins} defaultCenter={defaultCenter} />
  );
}
