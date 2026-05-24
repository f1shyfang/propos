import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { propertiesTable } from "@/lib/db/schema";
import { inArray, like, gte, lte, and, desc } from "drizzle-orm";
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

  const conditions = [];

  if (ids?.length) {
    conditions.push(inArray(propertiesTable.id, ids));
  } else {
    if (suburb) conditions.push(like(propertiesTable.suburb, `%${suburb}%`));
    if (propertyType) conditions.push(like(propertiesTable.propertyType, `%${propertyType}%`));
    if (minPrice) conditions.push(gte(propertiesTable.price, minPrice));
    if (maxPrice) conditions.push(lte(propertiesTable.price, maxPrice));
    if (minBeds) conditions.push(gte(propertiesTable.bedrooms, minBeds));
    if (minBaths) conditions.push(gte(propertiesTable.bathrooms, minBaths));
  }

  const offset = (page - 1) * limit;

  const rows = await db.select()
    .from(propertiesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(propertiesTable.price))
    .limit(limit)
    .offset(offset);

  // We need to also know the total. For brevity, we return a rough meta.
  const data = rows.map(r => ({
    id: r.id,
    canonical_address: r.address,
    suburb: r.suburb,
    state: r.state,
    property_type: r.propertyType,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    car_spaces: r.parkingSpaces,
    listing_price: r.price,
    listing_price_text: r.priceDisplay,
    main_image_url: r.images && r.images.length > 0 ? r.images[0] : null,
    land_size_sqm: r.landSize,
  }));

  return NextResponse.json({
    data,
    meta: {
      page,
      limit,
      total: data.length === limit ? offset + limit + 1 : offset + data.length, // approximation
      has_more: data.length === limit,
    },
  });
}
