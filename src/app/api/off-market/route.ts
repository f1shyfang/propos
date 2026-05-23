import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { offMarketPropertiesTable } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { validateOffMarketProperty } from '@/lib/off-market-utils';

export async function GET() {
  const properties = await db.select().from(offMarketPropertiesTable).orderBy(desc(offMarketPropertiesTable.createdAt));
  return NextResponse.json({ properties });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const validation = validateOffMarketProperty(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const [property] = await db.insert(offMarketPropertiesTable).values({
    address: body.address.trim(),
    suburb: body.suburb.trim(),
    state: body.state ?? null,
    propertyType: body.propertyType ?? null,
    bedrooms: body.bedrooms ? Number(body.bedrooms) : null,
    bathrooms: body.bathrooms ? Number(body.bathrooms) : null,
    parkingSpaces: body.parkingSpaces ? Number(body.parkingSpaces) : null,
    landSize: body.landSize ? Number(body.landSize) : null,
    priceMin: body.priceMin ? Number(body.priceMin) : null,
    priceMax: body.priceMax ? Number(body.priceMax) : null,
    sourceType: body.sourceType,
    sellingAgentName: body.sellingAgentName ?? null,
    sellingAgentPhone: body.sellingAgentPhone ?? null,
    sellingAgentEmail: body.sellingAgentEmail ?? null,
    howSourced: body.howSourced ?? null,
    accessStatus: body.accessStatus,
    vendorMotivation: body.vendorMotivation,
    expectedListingDate: body.expectedListingDate ? new Date(body.expectedListingDate) : null,
    internalNotes: body.internalNotes ?? null,
    confidential: body.confidential ?? false,
    lastContactedAt: new Date(),
  }).returning();

  return NextResponse.json({ property }, { status: 201 });
}
