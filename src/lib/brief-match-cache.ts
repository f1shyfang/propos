import { db } from '@/lib/db';
import { briefMatchCacheTable, buyerBriefsTable, propertiesTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { formatPrice, scoreToMatchPct } from '@/lib/utils';
import { normalizePropertyCoords } from '@/lib/geo-utils';
import {
  briefRowToCriteria,
  buildPropertyMatchConditions,
  scoreAndRankProperties,
} from '@/lib/match-properties-for-brief';

export type BriefMatchItem = {
  id: string;
  address: string | null;
  suburb: string | null;
  state: string | null;
  price: string;
  priceRaw: number | null;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  days: number | null;
  score: number;
  overallScore: number;
  underOffer: boolean;
  imageUrl: string | null;
  href: string;
  lat: number | null;
  lng: number | null;
};

const CRITERIA_PARAM_KEYS = ['budgetMin', 'budgetMax', 'minBeds', 'minBaths', 'parking', 'suburbs', 'propertyTypes'] as const;
const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export function buildMatchCriteriaHash(sp: URLSearchParams): string {
  const parts = CRITERIA_PARAM_KEYS
    .filter((key) => sp.has(key))
    .map((key) => `${key}=${sp.get(key)}`);
  return parts.join('|');
}

export function parseMatchOverrides(sp: URLSearchParams): Record<string, unknown> {
  const overrides: Record<string, unknown> = {};
  if (sp.has('budgetMin')) overrides.budgetMin = parseInt(sp.get('budgetMin')!, 10);
  if (sp.has('budgetMax')) overrides.budgetMax = parseInt(sp.get('budgetMax')!, 10);
  if (sp.has('minBeds')) overrides.minBeds = parseInt(sp.get('minBeds')!, 10);
  if (sp.has('minBaths')) overrides.minBaths = parseInt(sp.get('minBaths')!, 10);
  if (sp.has('parking')) overrides.parking = sp.get('parking');
  if (sp.has('suburbs')) overrides.suburbs = sp.get('suburbs')!.split(',').filter(Boolean);
  if (sp.has('propertyTypes')) overrides.propertyTypes = sp.get('propertyTypes')!.split(',').filter(Boolean);
  return overrides;
}

export function isBriefMatchCacheValid(
  computedAt: Date,
  briefUpdatedAt: Date | null,
  now = Date.now(),
): boolean {
  const computedMs = computedAt.getTime();
  if (now - computedMs > CACHE_MAX_AGE_MS) return false;
  if (!briefUpdatedAt) return true;
  return computedMs >= briefUpdatedAt.getTime();
}

export async function invalidateBriefMatchCache(briefId: number): Promise<void> {
  await db.delete(briefMatchCacheTable).where(eq(briefMatchCacheTable.briefId, briefId));
}

async function computeBriefMatches(
  brief: typeof buyerBriefsTable.$inferSelect,
  overrides: Record<string, unknown>,
): Promise<BriefMatchItem[]> {
  const criteria = briefRowToCriteria({ ...brief, ...overrides } as typeof brief);
  const whereClause = buildPropertyMatchConditions(criteria);
  const candidates = await db.select().from(propertiesTable).where(whereClause);
  const allRanked = scoreAndRankProperties(candidates, criteria, candidates.length);

  return allRanked.map(({ row: p, matchScore }) => {
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
}

export async function getOrComputeBriefMatches(
  brief: typeof buyerBriefsTable.$inferSelect,
  criteriaHash: string,
  overrides: Record<string, unknown>,
): Promise<BriefMatchItem[]> {
  const [cached] = await db
    .select()
    .from(briefMatchCacheTable)
    .where(and(
      eq(briefMatchCacheTable.briefId, brief.id),
      eq(briefMatchCacheTable.criteriaHash, criteriaHash),
    ))
    .limit(1);

  if (cached && isBriefMatchCacheValid(cached.computedAt, brief.updatedAt)) {
    return cached.matches as BriefMatchItem[];
  }

  const matches = await computeBriefMatches(brief, overrides);
  const now = new Date();

  await db
    .insert(briefMatchCacheTable)
    .values({
      briefId: brief.id,
      criteriaHash,
      matches,
      total: matches.length,
      computedAt: now,
    })
    .onConflictDoUpdate({
      target: [briefMatchCacheTable.briefId, briefMatchCacheTable.criteriaHash],
      set: {
        matches,
        total: matches.length,
        computedAt: now,
      },
    });

  return matches;
}
