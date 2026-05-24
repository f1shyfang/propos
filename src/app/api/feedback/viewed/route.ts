import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shortlistsTable, buyerBriefsTable } from '@/lib/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { requireRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  const session = await requireRole('client');
  if (!session) return unauthorizedResponse();

  const { shortlistId } = await req.json();
  if (!shortlistId) {
    return NextResponse.json({ error: 'shortlistId required' }, { status: 400 });
  }

  const [row] = await db
    .select({ s: shortlistsTable })
    .from(shortlistsTable)
    .innerJoin(buyerBriefsTable, eq(shortlistsTable.briefId, buyerBriefsTable.id))
    .where(
      and(
        eq(shortlistsTable.id, Number(shortlistId)),
        eq(buyerBriefsTable.clientUserId, session.user.id),
        isNotNull(shortlistsTable.sharedAt),
      ),
    );

  if (!row) return forbiddenResponse();

  if (row.s.feedbackStatus !== 'new') {
    return NextResponse.json({ shortlist: row.s });
  }

  const [updated] = await db
    .update(shortlistsTable)
    .set({ feedbackStatus: 'viewed' })
    .where(eq(shortlistsTable.id, Number(shortlistId)))
    .returning();

  return NextResponse.json({ shortlist: updated });
}
