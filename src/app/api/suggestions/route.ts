import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buyerBriefsTable, propertiesTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { buildMatchFeedItems } from '@/lib/match-feed-utils';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const briefIdParam = searchParams.get('briefId');

  const [briefs, properties] = await Promise.all([
    briefIdParam
      ? db.select().from(buyerBriefsTable).where(eq(buyerBriefsTable.id, Number(briefIdParam)))
      : db.select().from(buyerBriefsTable),
    db
      .select({
        id: propertiesTable.id,
        address: propertiesTable.address,
        suburb: propertiesTable.suburb,
        state: propertiesTable.state,
        propertyType: propertiesTable.propertyType,
        bedrooms: propertiesTable.bedrooms,
        bathrooms: propertiesTable.bathrooms,
        parkingSpaces: propertiesTable.parkingSpaces,
        price: propertiesTable.price,
        priceDisplay: propertiesTable.priceDisplay,
        days: propertiesTable.days,
      })
      .from(propertiesTable),
  ]);

  const feedBriefs = briefs.map(b => ({
    id: b.id,
    clientName: b.clientName,
    budgetMin: b.budgetMin,
    budgetMax: b.budgetMax,
    suburbs: (b.suburbs as string[]) ?? [],
    propertyTypes: (b.propertyTypes as string[]) ?? [],
    minBeds: b.minBeds,
    minBaths: b.minBaths,
    parking: b.parking,
    mustHaves: (b.mustHaves as string[]) ?? [],
    dealBreakers: (b.dealBreakers as string[]) ?? [],
    status: b.status,
  }));

  const items = buildMatchFeedItems(feedBriefs, properties);

  const activeBriefs = briefs
    .filter(b => ['searching', 'active', 'paused'].includes(b.status ?? ''))
    .map(b => ({ id: b.id, clientName: b.clientName }));

  return NextResponse.json({ items, briefs: activeBriefs });
}
