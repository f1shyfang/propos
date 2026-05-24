import { NextRequest, NextResponse } from "next/server";

import { demoShortlists, getShortlistItem, logDemoAction, type FeedbackStatus } from "@/lib/demo-data";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { userActionsTable } from "@/lib/db/schema";

const allowed = new Set(["interested", "need_more_info", "not_for_me"]);

export async function POST(req: NextRequest) {
  const profile = await requireRole("client");
  const body = await req.json();
  const shortlistId = body.shortlist_id ?? body.shortlistId;
  const feedbackStatus = body.feedback_status ?? body.feedbackStatus;

  if (!shortlistId || !allowed.has(feedbackStatus)) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "shortlist_id and valid feedback_status are required" } },
      { status: 400 },
    );
  }

  const shortlist = demoShortlists.find((item) => item.id === shortlistId && item.client_id === profile.id && item.shared_at);
  if (!shortlist) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Shared shortlist row not found" } }, { status: 404 });
  }

  const now = new Date().toISOString();
  shortlist.viewed_at = now;
  shortlist.feedback_status = feedbackStatus as FeedbackStatus;
  shortlist.feedback_text = body.feedback_text ?? body.feedbackText ?? null;
  shortlist.feedback_at = now;

  await db.insert(userActionsTable).values({
    userId: profile.id,
    actionType: "feedback_submit",
    entityType: "shortlist",
    entityId: shortlist.id,
    metadata: { feedback_status: shortlist.feedback_status }
  }).catch(console.error);

  logDemoAction({
    user_id: profile.id,
    action_type: "feedback_submit",
    entity_type: "shortlist",
    entity_id: shortlist.id,
    metadata: { feedback_status: shortlist.feedback_status },
  });

  return NextResponse.json({ data: getShortlistItem(shortlist), shortlist: getShortlistItem(shortlist) });
}
