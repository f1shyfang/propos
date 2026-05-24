import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shortlistsTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { validateClientFeedbackStatus } from '@/lib/feedback-utils';
import { buildClientFeedbackUpdate } from '@/lib/core-flow-utils';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const briefId = parseInt(id, 10);
  if (isNaN(briefId)) return NextResponse.json({ error: 'Invalid brief id' }, { status: 400 });

  const { shortlistId, feedbackStatus, feedbackText, feedbackReason } = await req.json();
  if (!shortlistId) return NextResponse.json({ error: 'shortlistId required' }, { status: 400 });

  if (!validateClientFeedbackStatus(feedbackStatus)) {
    return NextResponse.json({ error: 'Invalid feedbackStatus' }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(shortlistsTable)
    .where(and(eq(shortlistsTable.id, Number(shortlistId)), eq(shortlistsTable.briefId, briefId)));

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const update = buildClientFeedbackUpdate({ feedbackStatus, feedbackText, feedbackReason });

  const [updated] = await db
    .update(shortlistsTable)
    .set({ ...update, feedbackAt: new Date() })
    .where(eq(shortlistsTable.id, Number(shortlistId)))
    .returning();

  return NextResponse.json({ shortlist: updated });
}
