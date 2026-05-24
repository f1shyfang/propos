import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shortlistsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const { shortlistId } = await req.json();
  if (!shortlistId) return NextResponse.json({ error: 'shortlistId required' }, { status: 400 });

  const [row] = await db.select().from(shortlistsTable).where(eq(shortlistsTable.id, Number(shortlistId)));
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (row.feedbackStatus !== 'new') return NextResponse.json({ shortlist: row });

  const [updated] = await db
    .update(shortlistsTable)
    .set({ feedbackStatus: 'viewed', feedbackAt: new Date() })
    .where(eq(shortlistsTable.id, Number(shortlistId)))
    .returning();

  return NextResponse.json({ shortlist: updated });
}
