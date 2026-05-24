import { eq, and, ne, gte, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  dealsTable,
  buyerBriefsTable,
  propertiesTable,
  dealDocumentsTable,
} from '@/lib/db/schema';
import { buildDealDocumentS3Key } from '@/lib/storage/document-keys';
import { putObject } from '@/lib/storage/s3';
import { renderOfferLetterPdf, renderCmaReportPdf, renderInvoicePdf } from '@/lib/pdf/render';
import { calcBuyersAgentFee } from '@/lib/invoice-utils';
import type { CmaComparable } from '@/lib/pdf/cma-report';

export async function loadDealForDocuments(dealId: number) {
  const [row] = await db
    .select({
      id: dealsTable.id,
      offerAmount: dealsTable.offerAmount,
      offerConditions: dealsTable.offerConditions,
      settlementDate: dealsTable.settlementDate,
      exchangeDate: dealsTable.exchangeDate,
      listingAgentName: dealsTable.listingAgentName,
      propertyId: propertiesTable.id,
      address: propertiesTable.address,
      suburb: propertiesTable.suburb,
      state: propertiesTable.state,
      landSize: propertiesTable.landSize,
      bedrooms: propertiesTable.bedrooms,
      bathrooms: propertiesTable.bathrooms,
      propertyType: propertiesTable.propertyType,
      appraisedValue: propertiesTable.appraisedValue,
      clientName: buyerBriefsTable.clientName,
    })
    .from(dealsTable)
    .leftJoin(buyerBriefsTable, eq(dealsTable.briefId, buyerBriefsTable.id))
    .leftJoin(propertiesTable, eq(dealsTable.propertyId, propertiesTable.id))
    .where(eq(dealsTable.id, dealId));
  return row ?? null;
}

async function fetchCmaComparables(propertyId: string, subject: {
  suburb: string | null;
  landSize: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  propertyType: string | null;
}) {
  const landMin = subject.landSize ? Math.round(subject.landSize * 0.7) : null;
  const landMax = subject.landSize ? Math.round(subject.landSize * 1.3) : null;

  const conditions = [
    ne(propertiesTable.id, propertyId),
    eq(propertiesTable.suburb, subject.suburb ?? ''),
    subject.bedrooms ? gte(propertiesTable.bedrooms, subject.bedrooms - 1) : undefined,
    subject.bedrooms ? lte(propertiesTable.bedrooms, subject.bedrooms + 1) : undefined,
    landMin && subject.landSize ? gte(propertiesTable.landSize, landMin) : undefined,
    landMax && subject.landSize ? lte(propertiesTable.landSize, landMax) : undefined,
    gte(propertiesTable.price, 1),
  ].filter(Boolean);

  const comparables = await db
    .select({
      address: propertiesTable.address,
      bedrooms: propertiesTable.bedrooms,
      bathrooms: propertiesTable.bathrooms,
      price: propertiesTable.price,
      priceDisplay: propertiesTable.priceDisplay,
      landSize: propertiesTable.landSize,
      propertyType: propertiesTable.propertyType,
    })
    .from(propertiesTable)
    .where(and(...conditions))
    .limit(8);

  return comparables.map((comp) => {
    let score = 70;
    if (comp.bedrooms === subject.bedrooms) score += 15;
    if (comp.bathrooms === subject.bathrooms) score += 10;
    if (comp.propertyType === subject.propertyType) score += 5;
    return {
      ...comp,
      comparabilityScore: Math.min(100, score),
    } satisfies CmaComparable;
  });
}

export async function generateOfferDocument(dealId: number, uploadedBy: string) {
  const deal = await loadDealForDocuments(dealId);
  if (!deal) throw new Error('Deal not found');

  const buffer = await renderOfferLetterPdf({
    clientName: deal.clientName ?? 'Purchaser',
    propertyAddress: deal.address ?? 'Property',
    suburb: deal.suburb,
    state: deal.state,
    offerAmount: deal.offerAmount,
    offerConditions: deal.offerConditions ?? [],
    settlementDate: deal.settlementDate?.toISOString() ?? null,
    exchangeDate: deal.exchangeDate?.toISOString() ?? null,
    listingAgentName: deal.listingAgentName,
    date: new Date(),
  });

  const filename = `offer-letter-${deal.address?.replace(/[^\w]+/g, '-').slice(0, 40) ?? dealId}.pdf`;
  const s3Key = buildDealDocumentS3Key(dealId, filename);
  await putObject(buffer, s3Key, 'application/pdf');

  const now = new Date();
  const [doc] = await db
    .insert(dealDocumentsTable)
    .values({
      dealId,
      filename,
      tag: 'Offer Letter',
      s3Key,
      mimeType: 'application/pdf',
      source: 'generated_offer',
      status: 'ready',
      fileSize: buffer.length,
      uploadedBy,
      generatedAt: now,
    })
    .returning();

  return doc;
}

export async function generateCmaDocument(dealId: number, uploadedBy: string) {
  const deal = await loadDealForDocuments(dealId);
  if (!deal?.propertyId) throw new Error('Deal not found');

  const [subject] = await db
    .select()
    .from(propertiesTable)
    .where(eq(propertiesTable.id, deal.propertyId));
  if (!subject) throw new Error('Property not found');

  const comparables = await fetchCmaComparables(deal.propertyId, {
    suburb: subject.suburb ?? deal.suburb,
    landSize: subject.landSize ?? deal.landSize,
    bedrooms: subject.bedrooms ?? deal.bedrooms,
    bathrooms: subject.bathrooms ?? deal.bathrooms,
    propertyType: subject.propertyType ?? deal.propertyType,
  });

  const buffer = await renderCmaReportPdf({
    subjectAddress: deal.address ?? 'Subject property',
    suburb: deal.suburb,
    state: deal.state,
    estimatedValue: subject.appraisedValue ?? deal.appraisedValue,
    comparables,
  });

  const filename = `cma-${deal.address?.replace(/[^\w]+/g, '-').slice(0, 40) ?? dealId}.pdf`;
  const s3Key = buildDealDocumentS3Key(dealId, filename);
  await putObject(buffer, s3Key, 'application/pdf');

  const now = new Date();
  const [doc] = await db
    .insert(dealDocumentsTable)
    .values({
      dealId,
      filename,
      tag: 'CMA Report',
      s3Key,
      mimeType: 'application/pdf',
      source: 'generated_cma',
      status: 'ready',
      fileSize: buffer.length,
      uploadedBy,
      generatedAt: now,
    })
    .returning();

  return doc;
}

export async function generateInvoiceDocument(dealId: number, uploadedBy: string) {
  const deal = await loadDealForDocuments(dealId);
  if (!deal) throw new Error('Deal not found');

  const [priceRow] = await db
    .select({ price: propertiesTable.price, offerAmount: dealsTable.offerAmount })
    .from(dealsTable)
    .leftJoin(propertiesTable, eq(dealsTable.propertyId, propertiesTable.id))
    .where(eq(dealsTable.id, dealId));

  const feeAmount = calcBuyersAgentFee(
    priceRow?.price ?? null,
    priceRow?.offerAmount ?? deal.offerAmount,
  );
  if (feeAmount <= 0) {
    throw new Error('Set an offer amount or property price before generating an invoice');
  }

  const buffer = await renderInvoicePdf({
    clientName: deal.clientName ?? 'Client',
    propertyAddress: deal.address ?? 'Property',
    suburb: deal.suburb,
    state: deal.state,
    feeAmount,
    purchaseReference: priceRow?.offerAmount ?? priceRow?.price ?? null,
    date: new Date(),
  });

  const filename = `invoice-${deal.address?.replace(/[^\w]+/g, '-').slice(0, 40) ?? dealId}.pdf`;
  const s3Key = buildDealDocumentS3Key(dealId, filename);
  await putObject(buffer, s3Key, 'application/pdf');

  const now = new Date();
  const [doc] = await db
    .insert(dealDocumentsTable)
    .values({
      dealId,
      filename,
      tag: 'Invoice',
      s3Key,
      mimeType: 'application/pdf',
      source: 'generated_invoice',
      status: 'ready',
      fileSize: buffer.length,
      uploadedBy,
      generatedAt: now,
    })
    .returning();

  return doc;
}
