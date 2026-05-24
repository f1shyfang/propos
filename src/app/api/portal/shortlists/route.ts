import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shortlistsTable, propertiesTable, buyerBriefsTable } from '@/lib/db/schema';
import { eq, desc, and, isNotNull } from 'drizzle-orm';
import { formatPrice, scoreToMatchPct } from '@/lib/utils';
import { requireRole, unauthorizedResponse } from '@/lib/auth-server';

export async function GET() {
  const session = await requireRole('client');
  if (!session) return unauthorizedResponse();

  const rows = await db
    .select({ s: shortlistsTable, p: propertiesTable, b: buyerBriefsTable })
    .from(shortlistsTable)
    .innerJoin(buyerBriefsTable, eq(shortlistsTable.briefId, buyerBriefsTable.id))
    .leftJoin(propertiesTable, eq(shortlistsTable.propertyId, propertiesTable.id))
    .where(
      and(
        eq(buyerBriefsTable.clientUserId, session.user.id),
        isNotNull(shortlistsTable.sharedAt),
      ),
    )
    .orderBy(desc(shortlistsTable.sharedAt));

  type Group = {
    briefId: number;
    clientName: string;
    agentName: string | null;
    items: Array<{
      shortlistId: number;
      briefId: number | null;
      agentNote: string | null;
      feedbackStatus: string;
      feedbackText: string | null;
      feedbackReason: string | null;
      hasFeedback: boolean;
      sharedAt: Date | null;
      property: {
        id: string;
        address: string | null;
        suburb: string | null;
        state: string | null;
        price: string;
        propertyType: string | null;
        bedrooms: number | null;
        bathrooms: number | null;
        parkingSpaces: number | null;
        score: number;
      } | null;
    }>;
  };

  const groupMap = new Map<number, Group>();

  for (const row of rows) {
    const briefId = row.b?.id ?? 0;
    if (!groupMap.has(briefId)) {
      groupMap.set(briefId, {
        briefId,
        clientName: row.b?.clientName ?? 'Client',
        agentName: null,
        items: [],
      });
    }
    const group = groupMap.get(briefId)!;
    group.items.push({
      shortlistId: row.s.id,
      briefId: row.s.briefId,
      agentNote: row.s.agentNote,
      feedbackStatus: row.s.feedbackStatus ?? 'new',
      feedbackText: row.s.feedbackText,
      feedbackReason: row.s.feedbackReason,
      hasFeedback: row.s.feedbackAt != null,
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
          }
        : null,
    });
  }

  const groups = Array.from(groupMap.values());
  const items = groups.flatMap((g) => g.items);

  return NextResponse.json({ groups, items });
}
