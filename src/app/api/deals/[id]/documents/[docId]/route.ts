import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { dealDocumentsTable } from '@/lib/db/schema';
import { requireAgentForDeal, getDealDocument } from '@/lib/api/deal-documents-auth';
import { deleteObject } from '@/lib/storage/s3';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const { id, docId } = await params;
  const dealId = Number(id);
  const documentId = Number(docId);

  const auth = await requireAgentForDeal(dealId);
  if ('error' in auth && auth.error) return auth.error;

  const doc = await getDealDocument(dealId, documentId);
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  if (doc.s3Key && doc.status !== 'legacy') {
    try {
      await deleteObject(doc.s3Key);
    } catch {
      // continue with DB delete if object already gone
    }
  }

  await db.delete(dealDocumentsTable).where(eq(dealDocumentsTable.id, documentId));
  return NextResponse.json({ ok: true });
}
