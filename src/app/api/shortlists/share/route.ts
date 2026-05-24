import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shortlistsTable, buyerBriefsTable } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { requireRole, unauthorizedResponse } from '@/lib/auth-server';

export async function POST(req: NextRequest) {

  const { briefId, shortlistIds } = await req.json();
  const id = Number(briefId);
  if (!briefId || isNaN(id)) {
    return NextResponse.json({ error: 'briefId required' }, { status: 400 });
  }

  const [brief] = await db
    .select()
    .from(buyerBriefsTable)
    .where(eq(buyerBriefsTable.id, id));

  if (!brief) return NextResponse.json({ error: 'Brief not found' }, { status: 404 });
  if (!brief.clientUserId) {
    return NextResponse.json({ error: 'Brief has no linked client' }, { status: 400 });
  }

  const now = new Date();
  const ids = Array.isArray(shortlistIds)
    ? shortlistIds.map((n: unknown) => Number(n)).filter((n) => !isNaN(n))
    : null;

  const whereClause =
    ids && ids.length > 0
      ? and(eq(shortlistsTable.briefId, id), inArray(shortlistsTable.id, ids))
      : eq(shortlistsTable.briefId, id);

  const updated = await db
    .update(shortlistsTable)
    .set({ sharedAt: now })
    .where(whereClause)
    .returning({ id: shortlistsTable.id });

  return NextResponse.json({
    sharedCount: updated.length,
    sharedAt: now.toISOString(),
  });
}
