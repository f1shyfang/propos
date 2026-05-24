import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cmaRecordsTable, propertiesTable, suburbsTable } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { calculatePricePerSqm } from '@/lib/cma-utils';
import { formatPrice } from '@/lib/utils';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, id));
  if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Fetch suburb crime data
  const [suburb] = p.suburbId
    ? await db.select({
        crimeRank: suburbsTable.crimeRank,
        violentPer1000: suburbsTable.violentPer1000,
        propertyPer1000: suburbsTable.propertyPer1000,
        crimeTrendSummary: suburbsTable.crimeTrendSummary,
      }).from(suburbsTable).where(eq(suburbsTable.suburbId, p.suburbId))
    : [];

  // Fetch nearby schools with distance (km) using PostGIS
  // Correct for swapped lat/lng: valid AU lat is -45 to -10
  const trueLat = (p.latitude != null && p.latitude >= -45 && p.latitude <= -10) ? p.latitude : p.longitude;
  const trueLng = (p.latitude != null && p.latitude >= -45 && p.latitude <= -10) ? p.longitude : p.latitude;

  type SchoolRow = { id: number; name: string; type: string | null; sector: string | null; distanceKm: number };
  let nearbySchools: SchoolRow[] = [];
  if (trueLat != null && trueLng != null) {
    const schoolRows = await db.execute(sql`
      SELECT
        id, name, type, sector,
        round((ST_Distance(
          ST_SetSRID(ST_Point(${trueLng}, ${trueLat}), 4326)::geography,
          ST_SetSRID(ST_Point(longitude, latitude), 4326)::geography
        ) / 1000)::numeric, 2) AS distance_km
      FROM schools
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      ORDER BY distance_km ASC
      LIMIT 5
    `);
    const raw = (schoolRows as unknown as { rows: Array<Record<string, unknown>> }).rows ?? schoolRows;
    nearbySchools = (raw as Array<Record<string, unknown>>).map(r => ({
      id: r.id as number,
      name: r.name as string,
      type: r.type as string | null,
      sector: r.sector as string | null,
      distanceKm: Number(r.distance_km),
    }));
  }

  const cmaRows = await db
    .select()
    .from(cmaRecordsTable)
    .where(eq(cmaRecordsTable.propertyId, p.id))
    .orderBy(desc(cmaRecordsTable.saleDate))
    .limit(4);

  const comparables = cmaRows.map((c) => ({
    address: c.comparableAddress,
    saleDate: c.saleDate,
    salePrice: c.salePrice != null ? formatPrice(c.salePrice, null) : null,
    pricePerSqm: (() => {
      const pps = c.pricePerSqm ?? calculatePricePerSqm(c.salePrice, c.landSizeSqm);
      return pps != null ? `$${pps.toLocaleString('en-AU')}/m²` : null;
    })(),
    bedrooms: c.bedrooms,
    bathrooms: c.bathrooms,
  }));

  const riskSummary: string[] = [];
  if (suburb?.crimeRank != null) {
    const level = suburb.crimeRank <= 30 ? 'lower' : suburb.crimeRank <= 70 ? 'moderate' : 'higher';
    riskSummary.push(`Suburb crime rank ${suburb.crimeRank} (${level} relative to NSW)`);
  }
  if (p.distressScore != null && p.distressScore > 60) {
    riskSummary.push('Elevated distress signals on listing data');
  }
  if (p.confidenceScore != null && p.confidenceScore < 60) {
    riskSummary.push('Lower confidence in automated valuation');
  }
  if (riskSummary.length === 0 && p.confidenceScore != null) {
    riskSummary.push(`Valuation confidence ${p.confidenceScore}/100`);
  }

  return NextResponse.json({
    property: {
      id: p.id,
      address: p.address,
      suburb: p.suburb,
      state: p.state,
      price: formatPrice(p.price, p.priceDisplay),
      priceDisplay: p.priceDisplay,
      propertyType: p.propertyType,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      parkingSpaces: p.parkingSpaces,
      landSize: p.landSize,
      overallScore: p.overallScore,
      appraisedValue: p.appraisedValue,
      grossYield: p.grossYield,
      days: p.days,
      underOffer: p.underOffer,
      confidenceScore: p.confidenceScore,
      rScore: p.rScore,
      sweetspotScore: p.sweetspotScore,
      distressScore: p.distressScore,
      url: p.url,
      crime: suburb ? {
        rank: suburb.crimeRank,
        violentPer1000: suburb.violentPer1000,
        propertyPer1000: suburb.propertyPer1000,
        trendSummary: suburb.crimeTrendSummary,
      } : null,
      nearbySchools,
      comparables,
      riskSummary,
    },
  });
}
