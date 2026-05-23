import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buyerBriefsTable, propertiesTable, shortlistsTable } from '@/lib/db/schema';
import { eq, desc, and, gte, lte, inArray } from 'drizzle-orm';
import { computeMatchScore } from '@/lib/match-score';
import { scoreToMatchPct, formatPrice } from '@/lib/utils';

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

  // Get matched properties (scored against brief)
  const suburbs = (brief.suburbs as string[]) ?? [];
  const propTypes = (brief.propertyTypes as string[]) ?? [];

  let candidates = await db.select().from(propertiesTable)
    .where(
      and(
        brief.budgetMin ? gte(propertiesTable.price, brief.budgetMin) : undefined,
        brief.budgetMax ? lte(propertiesTable.price, brief.budgetMax) : undefined,
      )
    )
    .orderBy(desc(propertiesTable.overallScore))
    .limit(200);

  // Apply suburb and type filters in JS (case-insensitive)
  if (suburbs.length > 0) {
    candidates = candidates.filter(p =>
      suburbs.some(s => p.suburb?.toLowerCase().includes(s.toLowerCase()))
    );
  }
  if (propTypes.length > 0) {
    candidates = candidates.filter(p =>
      propTypes.some(t => p.propertyType?.toLowerCase().includes(t.toLowerCase()))
    );
  }

  const matches = candidates.map(p => {
    const briefForMatch = {
      budgetMin: brief.budgetMin ?? 0,
      budgetMax: brief.budgetMax ?? 99_000_000,
      suburbs: suburbs.length ? suburbs : [p.suburb ?? ''],
      propertyTypes: propTypes.length ? propTypes : [p.propertyType ?? ''],
      minBeds: brief.minBeds ?? 0,
      minBaths: brief.minBaths ?? 0,
      parking: (brief.parking as 'required' | 'nice_to_have' | 'not_needed') ?? 'nice_to_have',
      mustHaves: (brief.mustHaves as string[]) ?? [],
      dealBreakers: (brief.dealBreakers as string[]) ?? [],
    };
    const propertyForMatch = {
      price: p.price ?? 0,
      suburb: p.suburb ?? '',
      propertyType: p.propertyType ?? '',
      bedrooms: p.bedrooms ?? 0,
      bathrooms: p.bathrooms ?? 0,
      parkingSpaces: p.parkingSpaces,
      features: [],
      daysOnMarket: p.days,
    };
    const matchScore = computeMatchScore(propertyForMatch, briefForMatch);
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
      href: `/properties/${p.id}`,
    };
  })
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

  return NextResponse.json({ brief, shortlist, matches });
}
