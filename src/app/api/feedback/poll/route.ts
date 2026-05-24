import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shortlistsTable, propertiesTable, buyerBriefsTable } from '@/lib/db/schema';
import { eq, and, isNotNull, desc } from 'drizzle-orm';
import { formatPrice, scoreToMatchPct } from '@/lib/utils';
import { shouldIncludeFeedbackPollItem } from '@/lib/core-flow-utils';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const sinceRaw = sp.get('since');
  const briefIdParam = sp.get('briefId');
  const since = sinceRaw ? new Date(sinceRaw) : null;
  const briefId = briefIdParam ? parseInt(briefIdParam, 10) : null;

  const conditions = [isNotNull(shortlistsTable.sharedAt)];
  if (briefId != null && !isNaN(briefId)) {
    conditions.push(eq(shortlistsTable.briefId, briefId));
  }

  const rows = await db
    .select({ s: shortlistsTable, p: propertiesTable, b: buyerBriefsTable })
    .from(shortlistsTable)
    .innerJoin(propertiesTable, eq(shortlistsTable.propertyId, propertiesTable.id))
    .innerJoin(buyerBriefsTable, eq(shortlistsTable.briefId, buyerBriefsTable.id))
    .where(and(...conditions))
    .orderBy(desc(shortlistsTable.sharedAt))
    .limit(100);

  const items = rows
    .filter((row) =>
      shouldIncludeFeedbackPollItem(
        { sharedAt: row.s.sharedAt, feedbackAt: row.s.feedbackAt },
        since,
      ),
    )
    .slice(0, 50)
    .map((row) => ({
      shortlistId: row.s.id,
      briefId: row.s.briefId,
      feedbackStatus: row.s.feedbackStatus,
      feedbackText: row.s.feedbackText,
      feedbackReason: row.s.feedbackReason,
      feedbackAt: row.s.feedbackAt,
      sharedAt: row.s.sharedAt,
      clientName: row.b.clientName,
      property: {
        id: row.p.id,
        address: row.p.address,
        suburb: row.p.suburb,
        price: formatPrice(row.p.price, row.p.priceDisplay),
        score: scoreToMatchPct(row.p.overallScore),
      },
    }));

  const lastUpdated = new Date().toISOString();

  return NextResponse.json({ items, lastUpdated });
}
