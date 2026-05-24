import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buyerBriefsTable, propertiesTable, shortlistsTable } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { scoreToMatchPct, formatPrice } from '@/lib/utils';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const briefId = parseInt(id);
  if (isNaN(briefId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const [brief] = await db.select().from(buyerBriefsTable).where(eq(buyerBriefsTable.id, briefId));
  if (!brief) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Get shortlisted properties for this brief
  const shortlistRows = await db
    .select({ s: shortlistsTable, p: propertiesTable })
    .from(shortlistsTable)
    .leftJoin(propertiesTable, eq(shortlistsTable.propertyId, propertiesTable.id))
    .where(eq(shortlistsTable.briefId, briefId))
    .orderBy(desc(shortlistsTable.createdAt));

  const shortlist = shortlistRows.map(row => ({
    shortlistId: row.s.id,
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
      imageUrl: (row.p.images as string[] | null)?.[0] ?? null,
    } : null,
  }));

  return NextResponse.json({ brief, shortlist });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const briefId = parseInt(id);
  if (isNaN(briefId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json();
  const allowed = ['suburbs', 'propertyTypes', 'budgetMin', 'budgetMax', 'minBeds', 'minBaths', 'parking', 'mustHaves', 'dealBreakers', 'status', 'clientName', 'email', 'phone', 'contactMethod', 'engagementType', 'preApprovalStatus', 'buyerType', 'urgency', 'purchasePurpose', 'auctionWillingness', 'roadmap'];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  const [updated] = await db
    .update(buyerBriefsTable)
    .set({ ...update, updatedAt: new Date() })
    .where(eq(buyerBriefsTable.id, briefId))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ brief: updated });
}
