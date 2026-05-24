import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { propertyOutreachTable } from '@/lib/db/schema';
import { getOutreachTemplate } from '@/lib/outreach-templates';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db
    .select()
    .from(propertyOutreachTable)
    .where(eq(propertyOutreachTable.propertyId, id))
    .orderBy(desc(propertyOutreachTable.createdAt))
    .limit(20);

  return NextResponse.json({ outreach: rows });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: propertyId } = await params;
  const body = await req.json();
  const { templateId, briefId, recipientLabel } = body;

  if (!templateId || !getOutreachTemplate(templateId)) {
    return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
  }

  const [row] = await db
    .insert(propertyOutreachTable)
    .values({
      propertyId,
      briefId: briefId != null ? Number(briefId) : null,
      templateId,
      recipientLabel: recipientLabel?.trim() || 'Listing agent',
      status: 'logged',
    })
    .returning();

  return NextResponse.json({ outreach: row }, { status: 201 });
}
