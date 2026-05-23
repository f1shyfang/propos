import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

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

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const minLat = parseFloat(sp.get('minLat') ?? '');
  const maxLat = parseFloat(sp.get('maxLat') ?? '');
  const minLng = parseFloat(sp.get('minLng') ?? '');
  const maxLng = parseFloat(sp.get('maxLng') ?? '');
  const q = sp.get('q')?.trim() ?? '';
  const type = sp.get('type')?.trim() ?? '';
  const beds = parseInt(sp.get('beds') ?? '0') || 0;

  if ([minLat, maxLat, minLng, maxLng].some(isNaN)) {
    return NextResponse.json({ error: 'Invalid bounds' }, { status: 400 });
  }

  // Correct for swapped lat/lng in the DB:
  // Valid AU lat: -45 to -10, valid AU lng: 112 to 155
  // If a row has latitude in the lng range, columns are swapped.
  const rows = await db.execute(sql`
    SELECT
      id, address, suburb, state, property_type,
      bedrooms, bathrooms, parking_spaces,
      price, price_display, overall_score, under_offer, days,
      CASE WHEN latitude BETWEEN -45 AND -10 THEN latitude ELSE longitude END AS true_lat,
      CASE WHEN latitude BETWEEN -45 AND -10 THEN longitude ELSE latitude END AS true_lng
    FROM properties
    WHERE
      price > 0
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
      AND ST_Within(
        ST_SetSRID(
          ST_Point(
            CASE WHEN latitude BETWEEN -45 AND -10 THEN longitude ELSE latitude END,
            CASE WHEN latitude BETWEEN -45 AND -10 THEN latitude ELSE longitude END
          ),
          4326
        ),
        ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
      )
      ${q ? sql`AND (address ILIKE ${'%' + q + '%'} OR suburb ILIKE ${'%' + q + '%'} OR lga_name ILIKE ${'%' + q + '%'})` : sql``}
      ${type ? sql`AND property_type ILIKE ${'%' + type + '%'}` : sql``}
      ${beds ? sql`AND bedrooms >= ${beds}` : sql``}
    ORDER BY overall_score DESC
    LIMIT 60
  `);

  const rawRows = (rows as unknown as { rows: Array<Record<string, unknown>> }).rows ?? rows;
  const pins = (rawRows as Array<Record<string, unknown>>).map(p => ({
    id: p.id as string,
    lat: Number(p.true_lat),
    lng: Number(p.true_lng),
    address: (p.address as string) ?? '—',
    suburb: (p.suburb as string) ?? '—',
    price: formatPrice(p.price as number | null, p.price_display as string | null),
    score: scoreToMatchPct(p.overall_score as number | null),
    underOffer: !!p.under_offer,
    href: `/properties/${p.id}`,
    bedrooms: p.bedrooms as number | null,
    bathrooms: p.bathrooms as number | null,
    parkingSpaces: p.parking_spaces as number | null,
    propertyType: p.property_type as string | null,
    days: p.days as number | null,
  }));

  return NextResponse.json({ pins, count: pins.length });
}
