import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dealDocumentsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const documents = await db.select().from(dealDocumentsTable).where(eq(dealDocumentsTable.dealId, Number(id)));
  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { filename, tag, fileSize, uploadedBy, clientVisible } = await req.json();
  if (!filename) return NextResponse.json({ error: 'filename required' }, { status: 400 });

  const [doc] = await db.insert(dealDocumentsTable).values({
    dealId: Number(id),
    filename,
    tag: tag ?? null,
    fileSize: fileSize ?? null,
    uploadedBy: uploadedBy ?? 'agent',
    clientVisible: clientVisible ?? false,
  }).returning();

  return NextResponse.json({ document: doc }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { documentId, clientVisible, tag } = await req.json();
  if (!documentId) return NextResponse.json({ error: 'documentId required' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof clientVisible === 'boolean') updates.clientVisible = clientVisible;
  if (tag !== undefined) updates.tag = tag;

  const [doc] = await db.update(dealDocumentsTable).set(updates).where(eq(dealDocumentsTable.id, Number(documentId))).returning();
  return NextResponse.json({ document: doc });
}
