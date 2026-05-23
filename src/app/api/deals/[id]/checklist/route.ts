import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dealChecklistItemsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await db.select().from(dealChecklistItemsTable).where(eq(dealChecklistItemsTable.dealId, Number(id)));
  return NextResponse.json({ items });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { itemId, completed } = await req.json();
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 });

  const [item] = await db
    .update(dealChecklistItemsTable)
    .set({
      status: completed ? 'completed' : 'pending',
      completedAt: completed ? new Date() : null,
    })
    .where(eq(dealChecklistItemsTable.id, Number(itemId)))
    .returning();

  return NextResponse.json({ item });
}
