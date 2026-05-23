import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { offMarketPropertiesTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const allowed = ['accessStatus', 'vendorMotivation', 'internalNotes', 'priceMin', 'priceMax', 'sellingAgentName', 'sellingAgentPhone', 'sellingAgentEmail', 'expectedListingDate', 'confidential'];
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }
  if (body.touchLastContacted) updates.lastContactedAt = new Date();

  const [updated] = await db.update(offMarketPropertiesTable).set(updates).where(eq(offMarketPropertiesTable.id, Number(id))).returning();
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ property: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(offMarketPropertiesTable).where(eq(offMarketPropertiesTable.id, Number(id)));
  return NextResponse.json({ ok: true });
}
