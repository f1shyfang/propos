import { NextRequest, NextResponse } from "next/server";

import {
  demoBriefs,
  demoProperties,
  demoShortlists,
  getShortlistItem,
  logDemoAction,
  type Shortlist,
} from "@/lib/demo-data";
import { requireRole } from "@/lib/session";

export async function GET(req: NextRequest) {
  await requireRole("agent");

  const briefId = req.nextUrl.searchParams.get("brief_id") ?? req.nextUrl.searchParams.get("briefId");
  if (!briefId) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "brief_id is required" } },
      { status: 400 },
    );
  }

  return NextResponse.json({
    data: demoShortlists.filter((item) => item.buyer_brief_id === briefId).map(getShortlistItem),
  });
}

export async function POST(req: NextRequest) {
  const profile = await requireRole("agent");
  const body = await req.json();
  const briefId = body.brief_id ?? body.briefId;
  const propertyId = body.property_id ?? body.propertyId;

  if (!briefId || !propertyId) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "brief_id and property_id are required" } },
      { status: 400 },
    );
  }

  const brief = demoBriefs.find((item) => item.id === briefId);
  if (!brief) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Brief not found" } }, { status: 404 });
  }
  if (!brief.client_id) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Brief has no linked client" } }, { status: 400 });
  }
  if (!demoProperties.some((item) => item.id === propertyId)) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Property not found" } }, { status: 404 });
  }

  const existing = demoShortlists.find((item) => item.buyer_brief_id === briefId && item.property_id === propertyId);
  if (existing) {
    return NextResponse.json(
      { error: { code: "CONFLICT", message: "Property already exists in shortlist" } },
      { status: 409 },
    );
  }

  const createdAt = new Date().toISOString();
  const shortlist: Shortlist = {
    id: `shortlist-${Date.now()}`,
    buyer_brief_id: briefId,
    property_id: propertyId,
    client_id: brief.client_id,
    agent_note: body.agent_note ?? body.agentNote ?? null,
    shared_at: body.share_now ? createdAt : null,
    viewed_at: null,
    feedback_status: null,
    feedback_text: null,
    feedback_at: null,
    created_at: createdAt,
  };

  demoShortlists.unshift(shortlist);
  logDemoAction({
    user_id: profile.id,
    action_type: "shortlist_add",
    entity_type: "property",
    entity_id: propertyId,
    metadata: { brief_id: briefId },
  });

  return NextResponse.json({ data: getShortlistItem(shortlist) }, { status: 201 });
}
