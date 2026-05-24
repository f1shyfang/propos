import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { shortlistsTable, propertiesTable, buyerBriefsTable } from "@/lib/db/schema";
import { eq, isNotNull, and } from "drizzle-orm";

export async function GET() {
  const profile = await requireRole("client");
  
  const results = await db
    .select({
      id: shortlistsTable.id,
      agent_note: shortlistsTable.agentNote,
      feedback_status: shortlistsTable.feedbackStatus,
      property: {
        id: propertiesTable.id,
        canonical_address: propertiesTable.canonicalAddress,
        suburb: propertiesTable.suburb,
        state: propertiesTable.state,
        bedrooms: propertiesTable.bedrooms,
        bathrooms: propertiesTable.bathrooms,
        car_spaces: propertiesTable.parkingSpaces,
        listing_price_text: propertiesTable.listingPriceText,
        images: propertiesTable.images,
      },
      brief: {
        id: buyerBriefsTable.id,
        client_name: buyerBriefsTable.clientName,
        created_at: buyerBriefsTable.createdAt,
      }
    })
    .from(shortlistsTable)
    .innerJoin(propertiesTable, eq(shortlistsTable.propertyId, propertiesTable.id))
    .innerJoin(buyerBriefsTable, eq(shortlistsTable.briefId, buyerBriefsTable.id))
    .where(
      and(
        isNotNull(shortlistsTable.sharedAt),
        eq(buyerBriefsTable.email, profile.email)
      )
    );
  
  const groupedMap = new Map();
  for (const row of results) {
    if (!groupedMap.has(row.brief.id)) {
      groupedMap.set(row.brief.id, { brief: row.brief, items: [] });
    }
    const item = {
      id: String(row.id),
      agent_note: row.agent_note,
      feedback_status: row.feedback_status,
      property: row.property,
    };
    groupedMap.get(row.brief.id).items.push(item);
  }

  const grouped = Array.from(groupedMap.values());
  const items = results.map(row => ({
      id: String(row.id),
      agent_note: row.agent_note,
      feedback_status: row.feedback_status,
      property: row.property,
  }));

  return NextResponse.json({ data: grouped, items });
}
