import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { propertiesTable, propertyRisksTable, propertyHistoryTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("agent");

  const { id } = await params;
  const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, id));
  
  if (!property) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Property not found" } }, { status: 404 });
  }
  
  const risks = await db.select().from(propertyRisksTable).where(eq(propertyRisksTable.propertyId, id));
  const cma_records = await db.select().from(propertyHistoryTable).where(eq(propertyHistoryTable.propertyId, id));

  // To bridge the UI's expectations for now
  const uiProperty = {
    ...property,
    propertyFinancials: property.propertyFinancials || {},
    investmentMetrics: property.investmentMetrics || {},
    risks: risks || [],
    cma_records: cma_records || [], // Simulated CMA records from history
  };

  return NextResponse.json({
    data: {
      property: uiProperty,
      cma_records: uiProperty.cma_records,
      risks: uiProperty.risks,
    },
  });
}
