import { NextRequest, NextResponse } from 'next/server';
import { requireAgentForDeal, getDealDocument } from '@/lib/api/deal-documents-auth';
import { getPresignedDownloadUrl } from '@/lib/storage/s3';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> },
) {
  const { id, documentId } = await params;
  const dealId = Number(id);
  const auth = await requireAgentForDeal(dealId);
  if ('error' in auth) return auth.error;

  const doc = await getDealDocument(dealId, Number(documentId));
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  if (!doc.s3Key || doc.status !== 'ready') {
    return NextResponse.json({ error: 'Document is not available for download' }, { status: 400 });
  }

  const downloadUrl = await getPresignedDownloadUrl(doc.s3Key);
  return NextResponse.json({ downloadUrl, filename: doc.filename, mimeType: doc.mimeType });
}
