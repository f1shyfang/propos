import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buyerBriefsTable, propertiesTable, shortlistsTable } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { scoreToMatchPct, formatPrice } from '@/lib/utils';
import {
  briefRowToCriteria,
  buildPropertyMatchConditions,
  scoreAndRankProperties,
} from '@/lib/match-properties-for-brief';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const briefId = parseInt(id);
  if (isNaN(briefId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const [brief] = await db.select().from(buyerBriefsTable).where(eq(buyerBriefsTable.id, briefId));
  if (!brief) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Get shortlisted properties for this brief
  const shortlistRows = await db
    .select({ s: shortlistsTable, p: propertiesTable })
    .from(shortlistsTable)
    .leftJoin(propertiesTable, eq(shortlistsTable.propertyId, propertiesTable.id))
    .where(eq(shortlistsTable.briefId, briefId))
    .orderBy(desc(shortlistsTable.createdAt));

  const shortlist = shortlistRows.map(row => ({
    shortlistId: row.s.id,
    status: row.s.status,
    feedbackStatus: row.s.feedbackStatus,
    feedbackText: row.s.feedbackText,
    agentNote: row.s.agentNote,
    sharedAt: row.s.sharedAt,
    property: row.p ? {
      id: row.p.id,
      address: row.p.address,
      suburb: row.p.suburb,
      state: row.p.state,
      price: formatPrice(row.p.price, row.p.priceDisplay),
      propertyType: row.p.propertyType,
      bedrooms: row.p.bedrooms,
      bathrooms: row.p.bathrooms,
      parkingSpaces: row.p.parkingSpaces,
      score: scoreToMatchPct(row.p.overallScore),
    } : null,
  }));

  const criteria = briefRowToCriteria(brief);
  const whereClause = buildPropertyMatchConditions(criteria);

  const candidates = await db
    .select()
    .from(propertiesTable)
    .where(whereClause);

  const ranked = scoreAndRankProperties(candidates, criteria, 50);

  const matches = ranked.map(({ row: p, matchScore }) => ({
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
    href: `/properties/${p.id}`,
  }));

  return NextResponse.json({ brief, shortlist, matches });
}
