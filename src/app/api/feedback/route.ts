import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shortlistsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { validateClientFeedbackStatus } from '@/lib/feedback-utils';

export async function POST(req: NextRequest) {
  const { shortlistId, feedbackStatus, feedbackText, feedbackReason } = await req.json();
  if (!shortlistId) return NextResponse.json({ error: 'shortlistId required' }, { status: 400 });
  if (!validateClientFeedbackStatus(feedbackStatus)) {
    return NextResponse.json({ error: 'Invalid feedbackStatus' }, { status: 400 });
  }

  const [updated] = await db
    .update(shortlistsTable)
    .set({ feedbackStatus, feedbackText: feedbackText ?? null, feedbackReason: feedbackReason ?? null, feedbackAt: new Date() })
    .where(eq(shortlistsTable.id, Number(shortlistId)))
    .returning();

  return NextResponse.json({ shortlist: updated });
}

export async function GET(req: NextRequest) {
  const briefId = parseInt(req.nextUrl.searchParams.get('briefId') ?? '', 10);
  if (isNaN(briefId)) return NextResponse.json({ error: 'briefId required' }, { status: 400 });

  const items = await db.select().from(shortlistsTable).where(eq(shortlistsTable.briefId, briefId));
  return NextResponse.json({ items });
}
