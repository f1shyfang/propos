import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shortlistsTable, propertiesTable, buyerBriefsTable } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { formatPrice, scoreToMatchPct } from '@/lib/utils';

// Returns ALL shortlisted properties for the demo (client portal).
// In production, this would filter by client user ID via RLS.
export async function GET() {
  const rows = await db
    .select({ s: shortlistsTable, p: propertiesTable, b: buyerBriefsTable })
    .from(shortlistsTable)
    .leftJoin(propertiesTable, eq(shortlistsTable.propertyId, propertiesTable.id))
    .leftJoin(buyerBriefsTable, eq(shortlistsTable.briefId, buyerBriefsTable.id))
    .where(eq(shortlistsTable.status, 'shortlisted'))
    .orderBy(desc(shortlistsTable.createdAt));

  const items = rows.map(row => ({
    shortlistId: row.s.id,
    briefId: row.s.briefId,
    clientName: row.b?.clientName ?? 'Client',
    agentNote: row.s.agentNote,
    feedbackStatus: row.s.feedbackStatus ?? 'new',
    feedbackText: row.s.feedbackText,
    feedbackReason: row.s.feedbackReason,
    sharedAt: row.s.sharedAt,
    property: row.p ? {
      id: row.p.id,
      address: row.p.address,
      suburb: row.p.suburb,
      state: row.p.state,
      price: formatPrice(row.p.price, row.p.priceDisplay),
      propertyType: row.p.propertyType,
      bedrooms: row.p.bedrooms,
      bathrooms: row.p.bathrooms,
      parkingSpaces: row.p.parkingSpaces,
      score: scoreToMatchPct(row.p.overallScore),
    } : null,
  }));

  return NextResponse.json({ items });
}
