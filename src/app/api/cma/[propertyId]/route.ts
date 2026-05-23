import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { propertiesTable } from '@/lib/db/schema';
import { eq, and, gte, lte, ne, sql } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await params;

  const [subject] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, propertyId));
  if (!subject) return NextResponse.json({ error: 'Property not found' }, { status: 404 });

  const landMin = subject.landSize ? Math.round(subject.landSize * 0.7) : null;
  const landMax = subject.landSize ? Math.round(subject.landSize * 1.3) : null;

  const conditions = [
    ne(propertiesTable.id, propertyId),
    eq(propertiesTable.suburb, subject.suburb ?? ''),
    subject.bedrooms ? gte(propertiesTable.bedrooms, subject.bedrooms - 1) : undefined,
    subject.bedrooms ? lte(propertiesTable.bedrooms, subject.bedrooms + 1) : undefined,
    landMin && subject.landSize ? gte(propertiesTable.landSize, landMin) : undefined,
    landMax && subject.landSize ? lte(propertiesTable.landSize, landMax) : undefined,
    gte(propertiesTable.price, 1),
  ].filter(Boolean) as Parameters<typeof and>;

  const comparables = await db.select({
    id: propertiesTable.id,
    address: propertiesTable.address,
    suburb: propertiesTable.suburb,
    state: propertiesTable.state,
    price: propertiesTable.price,
    priceDisplay: propertiesTable.priceDisplay,
    bedrooms: propertiesTable.bedrooms,
    bathrooms: propertiesTable.bathrooms,
    parkingSpaces: propertiesTable.parkingSpaces,
    landSize: propertiesTable.landSize,
    propertyType: propertiesTable.propertyType,
    appraisedValue: propertiesTable.appraisedValue,
  })
    .from(propertiesTable)
    .where(and(...conditions))
    .limit(8);

  // Compute a simple comparability score (0-100)
  const withScore = comparables.map(comp => {
    let score = 70; // base
    if (comp.bedrooms === subject.bedrooms) score += 15;
    if (comp.bathrooms === subject.bathrooms) score += 10;
    if (comp.propertyType === subject.propertyType) score += 5;
    return { ...comp, comparabilityScore: Math.min(100, score) };
  });

  return NextResponse.json({
    subject,
    comparables: withScore,
    estimatedValue: subject.appraisedValue ?? null,
  });
}
