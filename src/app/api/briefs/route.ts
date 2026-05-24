import { NextRequest, NextResponse } from "next/server";

import { demoBriefs, getMatchScores, type BuyerBrief } from "@/lib/demo-data";
import { requireRole } from "@/lib/session";

function briefSummary(brief: BuyerBrief) {
  return {
    id: brief.id,
    client_id: brief.client_id,
    client_name: brief.client_name,
    budget_min: brief.budget_min,
    budget_max: brief.budget_max,
    preferred_suburbs: brief.preferred_suburbs,
    property_types: brief.property_types,
    status: brief.status,
    created_at: brief.created_at,
    match_count: getMatchScores(brief.id).filter((match) => match.match_score > 0).length,
  };
}

export async function GET() {
  await requireRole("agent");

  return NextResponse.json({
    data: demoBriefs.map(briefSummary),
  });
}

export async function POST(req: NextRequest) {
  const profile = await requireRole("agent");
  const body = await req.json();

  const clientName = String(body.client_name ?? body.clientName ?? "").trim();
  const budgetMin = Number(body.budget_min ?? body.budgetMin);
  const budgetMax = Number(body.budget_max ?? body.budgetMax);
  const propertyTypes = body.property_types ?? body.propertyTypes ?? [];
  const preferredSuburbs = body.preferred_suburbs ?? body.suburbs ?? [];

  const details: { field: string; issue: string }[] = [];
  if (!clientName) details.push({ field: "client_name", issue: "required" });
  if (!Number.isFinite(budgetMin) || budgetMin <= 0) details.push({ field: "budget_min", issue: "must_be_positive" });
  if (!Number.isFinite(budgetMax) || budgetMax < budgetMin) details.push({ field: "budget_max", issue: "must_be_greater_than_or_equal_budget_min" });
  if (!Array.isArray(propertyTypes) || propertyTypes.length === 0) details.push({ field: "property_types", issue: "at_least_one_required" });
  if (!Array.isArray(preferredSuburbs) || preferredSuburbs.length === 0) details.push({ field: "preferred_suburbs", issue: "at_least_one_required" });

  if (details.length) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Brief validation failed.", details } },
      { status: 400 },
    );
  }

  const createdAt = new Date().toISOString();
  const brief: BuyerBrief = {
    id: `brief-${Date.now()}`,
    agent_id: profile.id,
    client_id: "profile-sarah",
    client_name: clientName,
    status: "active",
    budget_min: budgetMin,
    budget_max: budgetMax,
    property_types: propertyTypes.map((item: string) => item.toLowerCase()),
    preferred_suburbs: preferredSuburbs,
    min_bedrooms: Number(body.min_bedrooms ?? body.minBeds ?? 1),
    min_bathrooms: Number(body.min_bathrooms ?? body.minBaths ?? 1),
    parking: body.parking ?? "nice_to_have",
    must_haves: body.must_haves ?? body.mustHaves ?? [],
    deal_breakers: body.deal_breakers ?? body.dealBreakers ?? [],
    finance_status: "pre_approved",
    created_at: createdAt,
    updated_at: createdAt,
  };

  demoBriefs.unshift(brief);

  return NextResponse.json({ data: briefSummary(brief), brief: { id: brief.id } }, { status: 201 });
}
