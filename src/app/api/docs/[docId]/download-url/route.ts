import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { dealDocumentsTable } from '@/lib/db/schema';
import { requireRole, unauthorizedResponse } from '@/lib/auth-server';
import { getPresignedDownloadUrl, isS3Configured } from '@/lib/storage/s3';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  const session = await requireRole('agent');
  if (!session) return unauthorizedResponse();

  if (!isS3Configured()) {
    return NextResponse.json({ error: 'File storage is not configured' }, { status: 503 });
  }

  const { docId } = await params;
  const [doc] = await db
    .select()
    .from(dealDocumentsTable)
    .where(eq(dealDocumentsTable.id, Number(docId)));

  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  if (doc.status !== 'ready' || !doc.s3Key) {
    return NextResponse.json({ error: 'Document is not available for download' }, { status: 400 });
  }

  const downloadUrl = await getPresignedDownloadUrl(doc.s3Key);
  return NextResponse.json({ downloadUrl, filename: doc.filename, dealId: doc.dealId });
}
