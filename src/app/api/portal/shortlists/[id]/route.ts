import { NextResponse } from "next/server";

import { demoCMARecords, demoProperties, demoRisks, demoShortlists, getPropertySummary, getShortlistItem } from "@/lib/demo-data";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { userActionsTable } from "@/lib/db/schema";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole("client");
  const { id } = await params;
  const shortlist = demoShortlists.find((item) => item.id === id && item.client_id === profile.id && item.shared_at);
  if (!shortlist) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Shared shortlist row not found" } }, { status: 404 });
  }

  shortlist.viewed_at = shortlist.viewed_at ?? new Date().toISOString();
  const property = demoProperties.find((item) => item.id === shortlist.property_id);
  if (!property) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Property not found" } }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      shortlist: getShortlistItem(shortlist),
      property: {
        ...getPropertySummary(property),
        floor_area_sqm: property.floor_area_sqm,
        description: property.raw_data.description,
        features: property.raw_data.features,
        days_on_market: property.raw_data.days_on_market,
      },
      cma_records: demoCMARecords.filter((record) => record.property_id === property.id),
      risks: demoRisks.filter((risk) => risk.property_id === property.id),
    },
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole("client");
  const { id } = await params;
  
  const body = await req.json();
  const { status, comment } = body;
  
  const shortlist = demoShortlists.find((item) => item.id === id && item.client_id === profile.id);
  if (!shortlist) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Shortlist not found" } }, { status: 404 });
  }

  // Update in memory for demo purposes
  shortlist.feedback_status = status;
  if (comment !== undefined) {
    // In a real app this would save to a comments/notes field
    shortlist.agent_note = comment; 
  }

  await db.insert(userActionsTable).values({
    userId: profile.id,
    actionType: "feedback_submit",
    entityType: "shortlist",
    entityId: id,
    metadata: { status, comment }
  }).catch(console.error);

  return NextResponse.json({ success: true, status: shortlist.feedback_status });
}
