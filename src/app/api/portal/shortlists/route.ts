import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shortlistsTable, propertiesTable, buyerBriefsTable } from '@/lib/db/schema';
import { eq, desc, isNotNull } from 'drizzle-orm';
import { formatPrice, scoreToMatchPct } from '@/lib/utils';

export async function GET() {
  const rows = await db
    .select({ s: shortlistsTable, p: propertiesTable, b: buyerBriefsTable })
    .from(shortlistsTable)
    .innerJoin(buyerBriefsTable, eq(shortlistsTable.briefId, buyerBriefsTable.id))
    .leftJoin(propertiesTable, eq(shortlistsTable.propertyId, propertiesTable.id))
    .where(isNotNull(shortlistsTable.sharedAt))
    .orderBy(desc(shortlistsTable.sharedAt));

  const groupMap = new Map<number, { briefId: number; clientName: string; agentName: string | null; items: unknown[] }>();

  for (const row of rows) {
    const bId = row.b?.id ?? 0;
    if (!groupMap.has(bId)) {
      groupMap.set(bId, { briefId: bId, clientName: row.b?.clientName ?? 'Client', agentName: null, items: [] });
    }
    groupMap.get(bId)!.items.push({
      shortlistId: row.s.id,
      briefId: row.s.briefId,
      agentNote: row.s.agentNote,
      feedbackStatus: row.s.feedbackStatus ?? 'new',
      feedbackText: row.s.feedbackText,
      feedbackReason: row.s.feedbackReason,
      hasFeedback: row.s.feedbackAt != null,
      sharedAt: row.s.sharedAt,
      property: row.p ? {
        id: row.p.id, address: row.p.address, suburb: row.p.suburb, state: row.p.state,
        price: formatPrice(row.p.price, row.p.priceDisplay), propertyType: row.p.propertyType,
        bedrooms: row.p.bedrooms, bathrooms: row.p.bathrooms, parkingSpaces: row.p.parkingSpaces,
        score: scoreToMatchPct(row.p.overallScore),
      } : null,
    });
  }

  const groups = Array.from(groupMap.values());
  const items = groups.flatMap((g) => g.items);
  return NextResponse.json({ groups, items });
}
