import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buyerBriefsTable, propertiesTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { formatPrice, scoreToMatchPct } from '@/lib/utils';
import { normalizePropertyCoords } from '@/lib/geo-utils';
import {
  briefRowToCriteria,
  buildPropertyMatchConditions,
  scoreAndRankProperties,
} from '@/lib/match-properties-for-brief';

const PAGE_SIZE = 20;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const briefId = parseInt(id);
  if (isNaN(briefId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const sp = req.nextUrl.searchParams;
  const offset = parseInt(sp.get('offset') ?? '0', 10) || 0;
  const all = sp.get('all') === '1';

  const [brief] = await db.select().from(buyerBriefsTable).where(eq(buyerBriefsTable.id, briefId));
  if (!brief) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const overrides: Record<string, unknown> = {};
  if (sp.has('budgetMin')) overrides.budgetMin = parseInt(sp.get('budgetMin')!, 10);
  if (sp.has('budgetMax')) overrides.budgetMax = parseInt(sp.get('budgetMax')!, 10);
  if (sp.has('minBeds')) overrides.minBeds = parseInt(sp.get('minBeds')!, 10);
  if (sp.has('minBaths')) overrides.minBaths = parseInt(sp.get('minBaths')!, 10);
  if (sp.has('parking')) overrides.parking = sp.get('parking');
  if (sp.has('suburbs')) overrides.suburbs = sp.get('suburbs')!.split(',').filter(Boolean);
  if (sp.has('propertyTypes')) overrides.propertyTypes = sp.get('propertyTypes')!.split(',').filter(Boolean);

  const criteria = briefRowToCriteria({ ...brief, ...overrides } as typeof brief);
  const whereClause = buildPropertyMatchConditions(criteria);
  const candidates = await db.select().from(propertiesTable).where(whereClause);
  const allRanked = scoreAndRankProperties(candidates, criteria, candidates.length);
  const total = allRanked.length;
  const pageSize = all ? total : PAGE_SIZE;
  const page = allRanked.slice(offset, offset + pageSize);

  const matches = page.map(({ row: p, matchScore }) => {
    const coords = normalizePropertyCoords(p.latitude, p.longitude);
    return {
    id: p.id,
    address: p.address,
    suburb: p.suburb,
    state: p.state,
    price: formatPrice(p.price, p.priceDisplay),
    priceRaw: p.price,
    propertyType: p.propertyType,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    parkingSpaces: p.parkingSpaces,
    days: p.days,
    score: matchScore,
    overallScore: scoreToMatchPct(p.overallScore),
    underOffer: !!p.underOffer,
    imageUrl: (p.images as string[] | null)?.[0] ?? null,
    href: `/properties/${p.id}`,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
  };
  });

  return NextResponse.json({ matches, total, offset, hasMore: all ? false : offset + pageSize < total });
}
