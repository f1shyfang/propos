import { NextRequest, NextResponse } from "next/server";

import { demoShortlists, getShortlistItem } from "@/lib/demo-data";
import { requireRole } from "@/lib/session";

export async function GET(req: NextRequest) {
  await requireRole("agent");

  const briefId = req.nextUrl.searchParams.get("brief_id") ?? req.nextUrl.searchParams.get("briefId");
  const since = req.nextUrl.searchParams.get("since");

  let items = demoShortlists.filter((item) => item.shared_at);
  if (briefId) items = items.filter((item) => item.buyer_brief_id === briefId);
  if (since) {
    const sinceTime = new Date(since).getTime();
    items = items.filter((item) => item.feedback_at && new Date(item.feedback_at).getTime() >= sinceTime);
  }

  items.sort((a, b) => new Date(b.feedback_at ?? b.shared_at ?? b.created_at).getTime() - new Date(a.feedback_at ?? a.shared_at ?? a.created_at).getTime());

  return NextResponse.json({
    data: {
      items: items.map(getShortlistItem),
      last_updated: new Date().toISOString(),
    },
  });
}
