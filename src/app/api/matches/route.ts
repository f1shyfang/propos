import { NextRequest, NextResponse } from "next/server";

import { computeDemoMatch, demoBriefs, demoProperties, getPropertySummary } from "@/lib/demo-data";
import { requireRole } from "@/lib/session";

export async function GET(req: NextRequest) {
  await requireRole("agent");

  const briefId = req.nextUrl.searchParams.get("brief_id");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 10);
  const briefs = briefId ? demoBriefs.filter((brief) => brief.id === briefId) : demoBriefs;
  const data = briefs
    .flatMap((brief) =>
      demoProperties.map((property) => {
        const match = computeDemoMatch(property, brief);
        return {
          id: match.id,
          brief_id: brief.id,
          property: getPropertySummary(property),
          match_score: match.match_score,
          match_reasons: match.match_reasons,
          client_name: brief.client_name,
        };
      }),
    )
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit);

  return NextResponse.json({ data });
}
