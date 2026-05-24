import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dealsTable, buyerBriefsTable, propertiesTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("agent");

  const resolvedParams = await params;
  const dealId = Number(resolvedParams.id);

  const [deal] = await db.select({
    id: dealsTable.id,
    offerAmount: dealsTable.offerAmount,
    settlementDate: dealsTable.settlementDate,
    conditions: dealsTable.offerConditions,
    clientName: buyerBriefsTable.clientName,
    propertyAddress: propertiesTable.address,
    suburb: propertiesTable.suburb,
    state: propertiesTable.state,
    listingAgentName: dealsTable.listingAgentName,
  })
  .from(dealsTable)
  .leftJoin(buyerBriefsTable, eq(dealsTable.briefId, buyerBriefsTable.id))
  .leftJoin(propertiesTable, eq(dealsTable.propertyId, propertiesTable.id))
  .where(eq(dealsTable.id, dealId));

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const formatter = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
  const amountStr = formatter.format(deal.offerAmount ?? 0);
  const dateStr = deal.settlementDate ? new Date(deal.settlementDate).toLocaleDateString("en-AU") : "TBD";
  const conditionsStr = deal.conditions && deal.conditions.length > 0 
    ? deal.conditions.map((c: string) => `• ${c}`).join("\n") 
    : "• Standard contract terms";

  const template = `Dear ${deal.listingAgentName || "Selling Agent"},

RE: Offer for ${deal.propertyAddress}, ${deal.suburb} ${deal.state}

On behalf of my clients, ${deal.clientName}, I am pleased to submit a formal offer for the above property.

Offer Details:
- Purchase Price: ${amountStr}
- Settlement: ${dateStr}

Conditions of Offer:
${conditionsStr}

My clients have their finance formally approved and are prepared to proceed swiftly. Please let me know the vendor's thoughts at your earliest convenience.

Kind regards,

Jess Morgan
Bayside Buyer's Agency
0400 000 000
jess@bayside.com.au`;

  return NextResponse.json({ text: template });
}
