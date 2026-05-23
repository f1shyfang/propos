import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shortlistsTable, propertiesTable, buyerBriefsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  // Join shortlists → properties + briefs, return rows for the dashboard feed
  const rows = await db
    .select({
      shortlistId: shortlistsTable.id,
      feedbackStatus: shortlistsTable.feedbackStatus,
      feedbackText: shortlistsTable.feedbackText,
      createdAt: shortlistsTable.createdAt,
      feedbackAt: shortlistsTable.feedbackAt,
      propertyId: propertiesTable.id,
      address: propertiesTable.address,
      suburb: propertiesTable.suburb,
      state: propertiesTable.state,
      price: propertiesTable.price,
      priceDisplay: propertiesTable.priceDisplay,
      overallScore: propertiesTable.overallScore,
      briefId: buyerBriefsTable.id,
      clientName: buyerBriefsTable.clientName,
    })
    .from(shortlistsTable)
    .innerJoin(propertiesTable, eq(shortlistsTable.propertyId, propertiesTable.id))
    .innerJoin(buyerBriefsTable, eq(shortlistsTable.briefId, buyerBriefsTable.id))
    .orderBy(shortlistsTable.createdAt)
    .limit(20);

  return NextResponse.json({ rows });
}
