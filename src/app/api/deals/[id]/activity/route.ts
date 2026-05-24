import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userActionsTable, dealsTable, buyerBriefsTable } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dealId = parseInt(id, 10);
  
  if (isNaN(dealId)) {
    return NextResponse.json({ error: "Invalid deal ID" }, { status: 400 });
  }

  const [deal] = await db.select({
    clientId: buyerBriefsTable.clientId
  }).from(dealsTable)
  .leftJoin(buyerBriefsTable, eq(dealsTable.briefId, buyerBriefsTable.id))
  .where(eq(dealsTable.id, dealId));

  if (!deal || !deal.clientId) {
    return NextResponse.json({ actions: [] });
  }

  const actions = await db.select()
    .from(userActionsTable)
    .where(eq(userActionsTable.userId, deal.clientId))
    .orderBy(desc(userActionsTable.createdAt))
    .limit(20);

  return NextResponse.json({ activity: actions });
}
