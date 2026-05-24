import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buyerBriefsTable, user } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireRole, unauthorizedResponse } from '@/lib/auth-server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireRole('agent');
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const briefId = parseInt(id, 10);
  if (isNaN(briefId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const body = await req.json();
  const { clientUserId, email } = body;

  let targetUserId: string | null = clientUserId ?? null;

  if (!targetUserId && email) {
    const [clientUser] = await db
      .select()
      .from(user)
      .where(and(eq(user.email, String(email).trim().toLowerCase()), eq(user.role, 'client')))
      .limit(1);
    if (!clientUser) {
      return NextResponse.json({ error: 'No client account found for that email' }, { status: 404 });
    }
    targetUserId = clientUser.id;
  }

  if (!targetUserId) {
    return NextResponse.json({ error: 'clientUserId or email required' }, { status: 400 });
  }

  const [brief] = await db
    .update(buyerBriefsTable)
    .set({ clientUserId: targetUserId, agentId: session.user.id })
    .where(eq(buyerBriefsTable.id, briefId))
    .returning();

  if (!brief) return NextResponse.json({ error: 'Brief not found' }, { status: 404 });

  return NextResponse.json({ brief });
}
