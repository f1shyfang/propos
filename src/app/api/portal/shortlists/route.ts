import { NextResponse } from "next/server";

import { demoBriefs, demoShortlists, getShortlistItem } from "@/lib/demo-data";
import { requireRole } from "@/lib/session";

export async function GET() {
  const profile = await requireRole("client");
  const shared = demoShortlists.filter((item) => item.client_id === profile.id && item.shared_at);
  const grouped = demoBriefs
    .map((brief) => ({
      brief: {
        id: brief.id,
        client_name: brief.client_name,
        created_at: brief.created_at,
      },
      items: shared.filter((item) => item.buyer_brief_id === brief.id).map(getShortlistItem),
    }))
    .filter((group) => group.items.length > 0);

  return NextResponse.json({ data: grouped, items: grouped.flatMap((group) => group.items) });
}
