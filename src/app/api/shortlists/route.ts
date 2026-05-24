import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shortlistsTable, buyerBriefsTable, propertiesTable } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { logAction } from '@/lib/log-action';
import { requireRole, unauthorizedResponse } from '@/lib/auth-server';
import { formatPrice, scoreToMatchPct } from '@/lib/utils';

function mapShortlistRow(row: { s: typeof shortlistsTable.$inferSelect; p: typeof propertiesTable.$inferSelect | null }) {
  return {
    shortlistId: row.s.id,
    briefId: row.s.briefId,
    status: row.s.status,
    feedbackStatus: row.s.feedbackStatus,
    feedbackText: row.s.feedbackText,
    feedbackReason: row.s.feedbackReason,
    feedbackAt: row.s.feedbackAt,
    agentNote: row.s.agentNote,
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
  };
}

export async function GET(req: NextRequest) {
  const session = await requireRole('agent');
  if (!session) return unauthorizedResponse();

  const briefId = parseInt(req.nextUrl.searchParams.get('briefId') ?? '', 10);
  if (isNaN(briefId)) {
    return NextResponse.json({ error: 'briefId required' }, { status: 400 });
  }

  const rows = await db
    .select({ s: shortlistsTable, p: propertiesTable })
    .from(shortlistsTable)
    .leftJoin(propertiesTable, eq(shortlistsTable.propertyId, propertiesTable.id))
    .where(eq(shortlistsTable.briefId, briefId))
    .orderBy(desc(shortlistsTable.createdAt));

  return NextResponse.json({ items: rows.map(mapShortlistRow) });
}

export async function POST(req: NextRequest) {
  const session = await requireRole('agent');
  if (!session) return unauthorizedResponse();

  const { briefId, propertyId, agentNote } = await req.json();
  if (!briefId || !propertyId) {
    return NextResponse.json({ error: 'briefId and propertyId required' }, { status: 400 });
  }

  const [brief] = await db
    .select()
    .from(buyerBriefsTable)
    .where(eq(buyerBriefsTable.id, Number(briefId)));
  if (!brief) return NextResponse.json({ error: 'Brief not found' }, { status: 404 });

  const [existing] = await db
    .select()
    .from(shortlistsTable)
    .where(
      and(
        eq(shortlistsTable.briefId, Number(briefId)),
        eq(shortlistsTable.propertyId, String(propertyId)),
      ),
    );

  if (existing) {
    return NextResponse.json({ error: 'Property already on shortlist' }, { status: 409 });
  }

  const [shortlist] = await db
    .insert(shortlistsTable)
    .values({
      briefId: Number(briefId),
      propertyId: String(propertyId),
      agentNote: agentNote ?? null,
      status: 'shortlisted',
      feedbackStatus: 'new',
    })
    .returning();

  logAction({
    userId: session.user.id,
    actionType: 'shortlist_add',
    entityType: 'property',
    entityId: String(propertyId),
  });

  return NextResponse.json({ shortlist }, { status: 201 });
}
