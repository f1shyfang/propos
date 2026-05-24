import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shortlistsTable, propertiesTable, buyerBriefsTable } from '@/lib/db/schema';
import { eq, desc, isNotNull } from 'drizzle-orm';
import { requireRole, unauthorizedResponse } from '@/lib/auth-server';

export async function GET() {

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
    .where(isNotNull(shortlistsTable.sharedAt))
    .orderBy(desc(shortlistsTable.feedbackAt), desc(shortlistsTable.sharedAt))
    .limit(20);

  return NextResponse.json({ rows });
}
