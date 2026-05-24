import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shortlistsTable, propertiesTable, buyerBriefsTable } from '@/lib/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { formatPrice, scoreToMatchPct } from '@/lib/utils';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const briefId = parseInt(id, 10);
  if (isNaN(briefId)) return NextResponse.json({ error: 'Invalid brief id' }, { status: 400 });

  const [brief] = await db
    .select()
    .from(buyerBriefsTable)
    .where(eq(buyerBriefsTable.id, briefId));

  if (!brief) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const rows = await db
    .select({ s: shortlistsTable, p: propertiesTable })
    .from(shortlistsTable)
    .leftJoin(propertiesTable, eq(shortlistsTable.propertyId, propertiesTable.id))
    .where(and(eq(shortlistsTable.briefId, briefId), isNotNull(shortlistsTable.sharedAt)));

  const items = rows.map((row) => ({
    shortlistId: row.s.id,
    agentNote: row.s.agentNote,
    feedbackStatus: row.s.feedbackStatus ?? 'new',
    feedbackText: row.s.feedbackText,
    feedbackReason: row.s.feedbackReason,
    sharedAt: row.s.sharedAt,
    property: row.p
      ? {
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
          imageUrl: (row.p.images as string[] | null)?.[0] ?? null,
        }
      : null,
  }));

  return NextResponse.json({
    brief: {
      id: brief.id,
      clientName: brief.clientName,
      suburbs: brief.suburbs,
      budgetMin: brief.budgetMin,
      budgetMax: brief.budgetMax,
      roadmap: brief.roadmap,
    },
    items,
  });
}
