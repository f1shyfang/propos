import { NextRequest, NextResponse } from 'next/server';
import { requireAgentForDeal } from '@/lib/api/deal-documents-auth';
import { generateInvoiceDocument } from '@/lib/deal-documents';
import { getPresignedDownloadUrl } from '@/lib/storage/s3';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dealId = Number(id);
  const auth = await requireAgentForDeal(dealId);
  if ('error' in auth) return auth.error;

  const uploadedBy = auth.session!.user.name ?? auth.session!.user.email ?? 'agent';

  try {
    const doc = await generateInvoiceDocument(dealId, uploadedBy);
    const downloadUrl = doc.s3Key ? await getPresignedDownloadUrl(doc.s3Key) : null;
    return NextResponse.json({ document: doc, downloadUrl }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
