import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userActionsTable, buyerBriefsTable, dealsTable, propertiesTable } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { requireRole } from "@/lib/session";

export async function GET() {
  const profile = await requireRole("client");

  // Get briefs for the client
  const briefs = await db.select({ id: buyerBriefsTable.id }).from(buyerBriefsTable).where(eq(buyerBriefsTable.email, profile.email));
  const briefIds = briefs.map(b => b.id);

  if (briefIds.length === 0) {
    return NextResponse.json({ activity: [] });
  }

  // Get deals for those briefs
  const deals = await db.select({ id: dealsTable.id, propertyId: dealsTable.propertyId }).from(dealsTable).where(inArray(dealsTable.briefId, briefIds));
  const dealIds = deals.map(d => d.id);

  // Ideally, userActionsTable should log actions with entityType 'brief' or 'deal'. We fetch actions related to this client's entities.
  // For demo purposes, we will fetch recent actions where entityType is 'deal' and entityId is in dealIds.
  
  const activity = dealIds.length > 0 ? await db
    .select({
      id: userActionsTable.id,
      actionType: userActionsTable.actionType,
      entityType: userActionsTable.entityType,
      entityId: userActionsTable.entityId,
      metadata: userActionsTable.metadata,
      createdAt: userActionsTable.createdAt,
    })
    .from(userActionsTable)
    .where(inArray(userActionsTable.entityId, dealIds.map(String)))
    .orderBy(desc(userActionsTable.createdAt))
    .limit(50) : [];

  return NextResponse.json({ activity });
}
