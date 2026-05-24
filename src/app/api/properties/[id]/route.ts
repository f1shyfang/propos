import { NextResponse } from "next/server";

import {
  demoCMARecords,
  demoProperties,
  demoRisks,
  demoBriefs,
  computeDemoMatch,
  getPropertySummary,
} from "@/lib/demo-data";
import { requireRole } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("agent");

  const { id } = await params;
  const property = demoProperties.find((item) => item.id === id);
  if (!property) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Property not found" } }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      property: {
        ...getPropertySummary(property),
        floor_area_sqm: property.floor_area_sqm,
        description: property.raw_data.description,
        features: property.raw_data.features,
        listing_source: property.listing_source,
        listing_url: property.listing_url,
        days_on_market: property.raw_data.days_on_market,
      },
      cma_records: demoCMARecords.filter((record) => record.property_id === id),
      risks: demoRisks.filter((risk) => risk.property_id === id),
      match_scores: demoBriefs.map((brief) => ({
        brief_id: brief.id,
        client_name: brief.client_name,
        match_score: computeDemoMatch(property, brief).match_score,
      })),
    },
  });
}
