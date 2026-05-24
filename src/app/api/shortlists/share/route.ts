import { NextRequest, NextResponse } from "next/server";

import { demoShortlists, getShortlistItem, logDemoAction } from "@/lib/demo-data";
import { requireRole } from "@/lib/session";

export async function POST(req: NextRequest) {
  const profile = await requireRole("agent");
  const body = await req.json();
  const briefId = body.brief_id ?? body.briefId;
  const shortlistIds = body.shortlist_ids ?? body.shortlistIds;

  if (!briefId) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "brief_id is required" } },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const items = demoShortlists.filter((item) =>
    item.buyer_brief_id === briefId && (!Array.isArray(shortlistIds) || shortlistIds.includes(item.id)),
  );

  items.forEach((item) => {
    item.shared_at = item.shared_at ?? now;
  });

  logDemoAction({
    user_id: profile.id,
    action_type: "shortlist_share",
    entity_type: "brief",
    entity_id: briefId,
    metadata: { shared_count: items.length },
  });

  return NextResponse.json({
    data: {
      shared_count: items.length,
      items: items.map(getShortlistItem),
    },
  });
}
