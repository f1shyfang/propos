import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dealDocumentsTable, dealsTable, propertiesTable, buyerBriefsTable } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get('tag');
  const dealIdParam = searchParams.get('dealId');

  const query = db
    .select({
      id: dealDocumentsTable.id,
      dealId: dealDocumentsTable.dealId,
      filename: dealDocumentsTable.filename,
      tag: dealDocumentsTable.tag,
      fileSize: dealDocumentsTable.fileSize,
      uploadedBy: dealDocumentsTable.uploadedBy,
      clientVisible: dealDocumentsTable.clientVisible,
      createdAt: dealDocumentsTable.createdAt,
      dealStatus: dealsTable.status,
      propertyAddress: propertiesTable.address,
      propertySuburb: propertiesTable.suburb,
      clientName: buyerBriefsTable.clientName,
    })
    .from(dealDocumentsTable)
    .leftJoin(dealsTable, eq(dealDocumentsTable.dealId, dealsTable.id))
    .leftJoin(propertiesTable, eq(dealsTable.propertyId, propertiesTable.id))
    .leftJoin(buyerBriefsTable, eq(dealsTable.briefId, buyerBriefsTable.id))
    .orderBy(desc(dealDocumentsTable.createdAt));

  const conditions = [];
  if (tag) conditions.push(eq(dealDocumentsTable.tag, tag));
  if (dealIdParam) conditions.push(eq(dealDocumentsTable.dealId, Number(dealIdParam)));

  const docs = await (conditions.length > 0 ? query.where(and(...conditions)) : query);

  return NextResponse.json({ docs });
}
