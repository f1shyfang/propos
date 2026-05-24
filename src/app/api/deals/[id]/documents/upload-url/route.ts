import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dealDocumentsTable } from '@/lib/db/schema';
import { requireAgentForDeal } from '@/lib/api/deal-documents-auth';
import { sanitizeFilename, getMaxUploadBytes } from '@/lib/doc-utils';
import { buildDealDocumentS3Key } from '@/lib/storage/document-keys';
import { getPresignedUploadUrl } from '@/lib/storage/s3';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dealId = Number(id);
  const auth = await requireAgentForDeal(dealId);
  if ('error' in auth && auth.error) return auth.error;

  const body = await req.json();
  const filename = sanitizeFilename(String(body.filename ?? ''));
  const mimeType = String(body.mimeType ?? 'application/octet-stream');
  const tag = body.tag ? String(body.tag) : 'Other';
  const fileSize = typeof body.fileSize === 'number' ? body.fileSize : null;

  if (!filename) {
    return NextResponse.json({ error: 'filename required' }, { status: 400 });
  }
  if (fileSize != null && fileSize > getMaxUploadBytes()) {
    return NextResponse.json({ error: 'File exceeds 50MB limit' }, { status: 400 });
  }

  const s3Key = buildDealDocumentS3Key(dealId, filename);
  const uploadUrl = await getPresignedUploadUrl(s3Key, mimeType);

  const [doc] = await db
    .insert(dealDocumentsTable)
    .values({
      dealId,
      filename,
      tag,
      s3Key,
      mimeType,
      source: 'upload',
      status: 'pending',
      fileSize,
      uploadedBy: auth.session!.user.name ?? auth.session!.user.email ?? 'agent',
      checklistItemId: body.checklistItemId ? Number(body.checklistItemId) : null,
    })
    .returning();

  return NextResponse.json({
    documentId: doc.id,
    uploadUrl,
    s3Key,
  });
}
