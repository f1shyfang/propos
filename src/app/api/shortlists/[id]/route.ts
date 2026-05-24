import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shortlistsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logAction } from '@/lib/log-action';
import { requireRole, unauthorizedResponse } from '@/lib/auth-server';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireRole('agent');
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const shortlistId = parseInt(id, 10);
  if (isNaN(shortlistId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(shortlistsTable)
    .where(eq(shortlistsTable.id, shortlistId));

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await db.delete(shortlistsTable).where(eq(shortlistsTable.id, shortlistId));

  logAction({
    userId: session.user.id,
    actionType: 'shortlist_remove',
    entityType: 'shortlist',
    entityId: String(shortlistId),
  });

  return new NextResponse(null, { status: 204 });
}
