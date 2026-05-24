import { NextResponse } from "next/server";

import {
  computeDemoMatch,
  demoBriefs,
  demoProperties,
  demoShortlists,
  getPropertySummary,
  getShortlistItem,
} from "@/lib/demo-data";
import { requireRole } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("agent");

  const { id } = await params;
  const brief = demoBriefs.find((item) => item.id === id);
  if (!brief) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Brief not found" } }, { status: 404 });
  }

  const matches = demoProperties
    .map((property) => ({
      id: computeDemoMatch(property, brief).id,
      brief_id: brief.id,
      property: getPropertySummary(property),
      match_score: computeDemoMatch(property, brief).match_score,
      match_reasons: computeDemoMatch(property, brief).match_reasons,
    }))
    .sort((a, b) => b.match_score - a.match_score);

  return NextResponse.json({
    data: {
      id: brief.id,
      client_id: brief.client_id,
      client_name: brief.client_name,
      budget_min: brief.budget_min,
      budget_max: brief.budget_max,
      preferred_suburbs: brief.preferred_suburbs,
      property_types: brief.property_types,
      status: brief.status,
      created_at: brief.created_at,
      match_count: matches.length,
      min_bedrooms: brief.min_bedrooms,
      min_bathrooms: brief.min_bathrooms,
      parking: brief.parking,
      must_haves: brief.must_haves,
      deal_breakers: brief.deal_breakers,
      updated_at: brief.updated_at,
      matches,
      shortlist: demoShortlists.filter((item) => item.buyer_brief_id === brief.id).map(getShortlistItem),
    },
    brief,
    matches,
    shortlist: demoShortlists.filter((item) => item.buyer_brief_id === brief.id).map(getShortlistItem),
  });
}
