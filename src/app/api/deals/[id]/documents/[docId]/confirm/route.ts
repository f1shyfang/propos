import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { dealDocumentsTable } from '@/lib/db/schema';
import { requireAgentForDeal, getDealDocument } from '@/lib/api/deal-documents-auth';
import { headObject } from '@/lib/storage/s3';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const { id, docId } = await params;
  const dealId = Number(id);
  const documentId = Number(docId);

  const auth = await requireAgentForDeal(dealId);
  if ('error' in auth && auth.error) return auth.error;

  const doc = await getDealDocument(dealId, documentId);
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  if (!doc.s3Key) return NextResponse.json({ error: 'Document has no storage key' }, { status: 400 });

  const head = await headObject(doc.s3Key);
  if (!head) {
    await db
      .update(dealDocumentsTable)
      .set({ status: 'failed' })
      .where(eq(dealDocumentsTable.id, documentId));
    return NextResponse.json({ error: 'Upload not found in storage' }, { status: 400 });
  }

  const [updated] = await db
    .update(dealDocumentsTable)
    .set({
      status: 'ready',
      fileSize: head.contentLength ?? doc.fileSize,
    })
    .where(eq(dealDocumentsTable.id, documentId))
    .returning();

  return NextResponse.json({ document: updated });
}
