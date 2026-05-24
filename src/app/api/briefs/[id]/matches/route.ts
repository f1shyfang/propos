import { NextRequest, NextResponse } from "next/server";

import { computeDemoMatch, demoBriefs, demoProperties, getPropertySummary } from "@/lib/demo-data";
import { requireRole } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("agent");

  const { id } = await params;
  const brief = demoBriefs.find((item) => item.id === id);
  if (!brief) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Brief not found" } }, { status: 404 });
  }

  const minScore = Number(req.nextUrl.searchParams.get("min_score") ?? 50);
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 25);
  const matches = demoProperties
    .map((property) => {
      const match = computeDemoMatch(property, brief);
      return {
        id: match.id,
        brief_id: brief.id,
        property: getPropertySummary(property),
        match_score: match.match_score,
        match_reasons: match.match_reasons,
      };
    })
    .filter((match) => match.match_score >= minScore)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit);

  return NextResponse.json({
    data: matches,
    meta: { total: matches.length },
  });
}
