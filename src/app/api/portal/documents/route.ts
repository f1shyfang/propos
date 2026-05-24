import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dealDocumentsTable, dealsTable, buyerBriefsTable, propertiesTable } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireRole } from "@/lib/session";

export async function GET() {
  const profile = await requireRole("client");

  // Fetch documents for the client's deals where clientVisible is true
  const documents = await db
    .select({
      id: dealDocumentsTable.id,
      filename: dealDocumentsTable.filename,
      tag: dealDocumentsTable.tag,
      fileSize: dealDocumentsTable.fileSize,
      createdAt: dealDocumentsTable.createdAt,
      propertyAddress: propertiesTable.address,
      dealStatus: dealsTable.status,
    })
    .from(dealDocumentsTable)
    .innerJoin(dealsTable, eq(dealDocumentsTable.dealId, dealsTable.id))
    .innerJoin(buyerBriefsTable, eq(dealsTable.briefId, buyerBriefsTable.id))
    .innerJoin(propertiesTable, eq(dealsTable.propertyId, propertiesTable.id))
    .where(
      and(
        eq(buyerBriefsTable.email, profile.email),
        eq(dealDocumentsTable.clientVisible, true)
      )
    )
    .orderBy(desc(dealDocumentsTable.createdAt));

  return NextResponse.json({ documents });
}
