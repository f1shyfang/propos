import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dealMilestonesTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const milestones = await db.select().from(dealMilestonesTable)
    .where(eq(dealMilestonesTable.dealId, Number(id)))
    .orderBy(dealMilestonesTable.sortOrder, dealMilestonesTable.dayOffset);
  return NextResponse.json({ milestones });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { milestoneId, completed, notes } = await req.json();
  if (!milestoneId) return NextResponse.json({ error: 'milestoneId required' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof completed === 'boolean') {
    updates.status = completed ? 'completed' : 'pending';
    updates.completedAt = completed ? new Date() : null;
  }
  if (notes !== undefined) updates.notes = notes;

  const [milestone] = await db
    .update(dealMilestonesTable)
    .set(updates)
    .where(eq(dealMilestonesTable.id, Number(milestoneId)))
    .returning();

  return NextResponse.json({ milestone });
}
