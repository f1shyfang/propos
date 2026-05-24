import { NextRequest, NextResponse } from 'next/server';
import { requireAgentForDeal } from '@/lib/api/deal-documents-auth';
import { generateOfferDocument, generateCmaDocument } from '@/lib/deal-documents';
import { getPresignedDownloadUrl } from '@/lib/storage/s3';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dealId = Number(id);
  const auth = await requireAgentForDeal(dealId);
  if ('error' in auth && auth.error) return auth.error;

  const body = await req.json();
  const type = body.type as string;
  const uploadedBy = auth.session!.user.name ?? auth.session!.user.email ?? 'agent';

  try {
    let doc;
    if (type === 'offer') {
      doc = await generateOfferDocument(dealId, uploadedBy);
    } else if (type === 'cma') {
      doc = await generateCmaDocument(dealId, uploadedBy);
    } else {
      return NextResponse.json({ error: 'type must be offer or cma' }, { status: 400 });
    }

    const downloadUrl = doc.s3Key ? await getPresignedDownloadUrl(doc.s3Key) : null;
    return NextResponse.json({ document: doc, downloadUrl }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
