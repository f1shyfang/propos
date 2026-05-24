import { NextRequest, NextResponse } from "next/server";

import { demoProperties, getPropertySummary } from "@/lib/demo-data";
import { requireRole } from "@/lib/session";

export async function GET(req: NextRequest) {
  await requireRole("agent");

  const searchParams = req.nextUrl.searchParams;
  const ids = searchParams.get("ids")?.split(",").map((id) => id.trim()).filter(Boolean);
  const suburb = searchParams.get("suburb")?.toLowerCase();
  const propertyType = searchParams.get("property_type")?.toLowerCase() ?? searchParams.get("type")?.toLowerCase();
  const minPrice = Number(searchParams.get("min_price") ?? 0);
  const maxPrice = Number(searchParams.get("max_price") ?? 0);
  const minBeds = Number(searchParams.get("min_beds") ?? searchParams.get("beds") ?? 0);
  const minBaths = Number(searchParams.get("min_baths") ?? 0);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 25)));

  let rows = [...demoProperties];

  if (ids?.length) {
    rows = rows.filter((property) => ids.includes(property.id));
  } else {
    if (suburb) rows = rows.filter((property) => property.suburb.toLowerCase().includes(suburb));
    if (propertyType) rows = rows.filter((property) => property.property_type.toLowerCase().includes(propertyType));
    if (minPrice) rows = rows.filter((property) => property.listing_price >= minPrice);
    if (maxPrice) rows = rows.filter((property) => property.listing_price <= maxPrice);
    if (minBeds) rows = rows.filter((property) => property.bedrooms >= minBeds);
    if (minBaths) rows = rows.filter((property) => property.bathrooms >= minBaths);
  }

  rows.sort((a, b) => b.listing_price - a.listing_price);

  const total = rows.length;
  const offset = (page - 1) * limit;
  const data = rows.slice(offset, offset + limit).map(getPropertySummary);

  return NextResponse.json({
    data,
    meta: {
      page,
      limit,
      total,
      has_more: offset + limit < total,
    },
  });
}
