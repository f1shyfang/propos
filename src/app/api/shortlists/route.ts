import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shortlistsTable, buyerBriefsTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { logAction } from '@/lib/log-action';

export async function POST(req: NextRequest) {
  const { briefId, propertyId, agentNote } = await req.json();
  if (!briefId || !propertyId) {
    return NextResponse.json({ error: 'briefId and propertyId required' }, { status: 400 });
  }

  // Check brief exists
  const [brief] = await db.select().from(buyerBriefsTable).where(eq(buyerBriefsTable.id, Number(briefId)));
  if (!brief) return NextResponse.json({ error: 'Brief not found' }, { status: 404 });

  // Upsert: remove if exists, add if not
  const [existing] = await db.select().from(shortlistsTable).where(
    and(eq(shortlistsTable.briefId, Number(briefId)), eq(shortlistsTable.propertyId, String(propertyId)))
  );

  if (existing) {
    await db.delete(shortlistsTable).where(eq(shortlistsTable.id, existing.id));
    logAction({ userId: String(briefId), actionType: 'shortlist_remove', entityType: 'property', entityId: String(propertyId) });
    return NextResponse.json({ action: 'removed', id: existing.id });
  }

  const [shortlist] = await db.insert(shortlistsTable).values({
    briefId: Number(briefId),
    propertyId: String(propertyId),
    agentNote: agentNote ?? null,
    status: 'shortlisted',
    feedbackStatus: 'new',
  }).returning();

  logAction({ userId: String(briefId), actionType: 'shortlist_add', entityType: 'property', entityId: String(propertyId) });
  return NextResponse.json({ action: 'added', shortlist }, { status: 201 });
}
