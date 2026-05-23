import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shortlistsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logAction } from '@/lib/log-action';

export async function POST(req: NextRequest) {
  const { shortlistId, feedbackStatus, feedbackText, feedbackReason } = await req.json();

  if (!shortlistId) return NextResponse.json({ error: 'shortlistId required' }, { status: 400 });

  const validStatuses = ['new', 'viewed', 'interested', 'need_more_info', 'not_for_me'];
  if (!validStatuses.includes(feedbackStatus)) {
    return NextResponse.json({ error: 'Invalid feedbackStatus' }, { status: 400 });
  }

  const [updated] = await db.update(shortlistsTable)
    .set({
      feedbackStatus,
      feedbackText: feedbackText ?? null,
      feedbackReason: feedbackReason ?? null,
      feedbackAt: new Date(),
    })
    .where(eq(shortlistsTable.id, Number(shortlistId)))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Shortlist item not found' }, { status: 404 });

  logAction({ userId: 'client', actionType: 'feedback_submit', entityType: 'shortlist', entityId: String(shortlistId), metadata: { feedbackStatus } });
  return NextResponse.json({ shortlist: updated });
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const briefId = parseInt(sp.get('briefId') ?? '');
  if (isNaN(briefId)) return NextResponse.json({ error: 'briefId required' }, { status: 400 });

  const items = await db.select().from(shortlistsTable).where(eq(shortlistsTable.briefId, briefId));
  return NextResponse.json({ items });
}
