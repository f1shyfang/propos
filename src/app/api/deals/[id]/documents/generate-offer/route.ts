import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { buyerBriefsTable, dealDocumentsTable, dealsTable, propertiesTable } from '@/lib/db/schema';
import { requireAgentForDeal } from '@/lib/api/deal-documents-auth';
import { renderOfferLetterPdf } from '@/lib/pdf/render';
import { buildDealDocumentS3Key } from '@/lib/storage/document-keys';
import { putObject, getPresignedDownloadUrl } from '@/lib/storage/s3';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dealId = Number(id);
  const auth = await requireAgentForDeal(dealId);
  if ('error' in auth) return auth.error;

  const [row] = await db
    .select({
      offerAmount: dealsTable.offerAmount,
      offerConditions: dealsTable.offerConditions,
      offerSubState: dealsTable.offerSubState,
      exchangeDate: dealsTable.exchangeDate,
      settlementDate: dealsTable.settlementDate,
      address: propertiesTable.address,
      suburb: propertiesTable.suburb,
      state: propertiesTable.state,
      clientName: buyerBriefsTable.clientName,
      listingAgentName: dealsTable.listingAgentName,
    })
    .from(dealsTable)
    .leftJoin(propertiesTable, eq(dealsTable.propertyId, propertiesTable.id))
    .leftJoin(buyerBriefsTable, eq(dealsTable.briefId, buyerBriefsTable.id))
    .where(eq(dealsTable.id, dealId));

  if (!row) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

  const pdfBuffer = await renderOfferLetterPdf({
    clientName: row.clientName ?? 'Client',
    propertyAddress: row.address ?? 'Property',
    suburb: row.suburb,
    state: row.state,
    offerAmount: row.offerAmount,
    offerConditions: (row.offerConditions as string[] | null) ?? [],
    settlementDate: row.settlementDate?.toISOString() ?? null,
    exchangeDate: row.exchangeDate?.toISOString() ?? null,
    listingAgentName: row.listingAgentName,
    date: new Date(),
  });

  const filename = `offer-letter-${dealId}.pdf`;
  const s3Key = buildDealDocumentS3Key(dealId, filename);
  await putObject(pdfBuffer, s3Key, 'application/pdf');

  const [doc] = await db
    .insert(dealDocumentsTable)
    .values({
      dealId,
      filename,
      tag: 'Offer Letter',
      s3Key,
      mimeType: 'application/pdf',
      fileSize: pdfBuffer.length,
      source: 'generated_offer',
      status: 'ready',
      uploadedBy: 'agent',
      clientVisible: false,
      generatedAt: new Date(),
    })
    .returning();

  const downloadUrl = await getPresignedDownloadUrl(s3Key);
  return NextResponse.json({ document: doc, downloadUrl }, { status: 201 });
}
