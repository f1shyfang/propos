import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { dealOfferEventsTable } from '@/lib/db/schema';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dealId = Number(id);

  const events = await db
    .select()
    .from(dealOfferEventsTable)
    .where(eq(dealOfferEventsTable.dealId, dealId))
    .orderBy(desc(dealOfferEventsTable.createdAt));

  return NextResponse.json({ events });
}
