import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { propertiesTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { formatPrice } from '@/lib/utils';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, id));
  if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    property: {
      id: p.id,
      address: p.address,
      suburb: p.suburb,
      state: p.state,
      price: formatPrice(p.price, p.priceDisplay),
      priceDisplay: p.priceDisplay,
      propertyType: p.propertyType,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      parkingSpaces: p.parkingSpaces,
      landSize: p.landSize,
      overallScore: p.overallScore,
      appraisedValue: p.appraisedValue,
      grossYield: p.grossYield,
      days: p.days,
      underOffer: p.underOffer,
      confidenceScore: p.confidenceScore,
      rScore: p.rScore,
      sweetspotScore: p.sweetspotScore,
      distressScore: p.distressScore,
      url: p.url,
    },
  });
}
