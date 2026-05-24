import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cmaRecordsTable, propertiesTable } from '@/lib/db/schema';
import { calculatePricePerSqm } from '@/lib/cma-utils';
import { desc, eq } from 'drizzle-orm';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [property] = await db.select({ id: propertiesTable.id })
    .from(propertiesTable)
    .where(eq(propertiesTable.id, id))
    .limit(1);

  if (!property) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const rows = await db.select()
    .from(cmaRecordsTable)
    .where(eq(cmaRecordsTable.propertyId, id))
    .orderBy(desc(cmaRecordsTable.saleDate));

  const data = rows.map(row => ({
    id: row.id.toString(),
    comparable_address: row.comparableAddress ?? null,
    sale_price: row.salePrice ?? null,
    sale_date: row.saleDate ? row.saleDate.toISOString() : null,
    bedrooms: row.bedrooms ?? null,
    bathrooms: row.bathrooms ?? null,
    land_size_sqm: row.landSizeSqm ?? null,
    distance_km: row.distanceKm ?? null,
    price_per_sqm: row.pricePerSqm ?? calculatePricePerSqm(row.salePrice, row.landSizeSqm),
    notes: row.notes ?? null,
  }));

  return NextResponse.json({ data });
}
