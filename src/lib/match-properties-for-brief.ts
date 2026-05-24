import { and, gte, lte, gt, isNotNull, sql, type SQL } from 'drizzle-orm';
import { propertiesTable, buyerBriefsTable } from '@/lib/db/schema';
import { computeMatchScore, type BuyerBrief, type PropertyForMatch } from '@/lib/match-score';
import { propertyTypesMatch, suburbMatches } from '@/lib/property-type-utils';

export { suburbMatches };

export type BriefRow = typeof buyerBriefsTable.$inferSelect;
export type PropertyRow = typeof propertiesTable.$inferSelect;

export type BriefLike = {
  budgetMin?: number | null;
  budgetMax?: number | null;
  suburbs?: string[] | null;
  propertyTypes?: string[] | null;
  minBeds?: number | null;
  minBaths?: number | null;
  parking?: string | null;
  mustHaves?: string[] | null;
  dealBreakers?: string[] | null;
  buyerType?: string | null;
  purchasePurpose?: string | null;
};

export function briefLikeToCriteria(brief: BriefLike): BuyerBrief {
  return {
    budgetMin: brief.budgetMin ?? 0,
    budgetMax: brief.budgetMax ?? Number.POSITIVE_INFINITY,
    suburbs: (brief.suburbs as string[]) ?? [],
    propertyTypes: (brief.propertyTypes as string[]) ?? [],
    minBeds: brief.minBeds ?? 0,
    minBaths: brief.minBaths ?? 0,
    parking: (brief.parking as BuyerBrief['parking']) ?? 'nice_to_have',
    mustHaves: (brief.mustHaves as string[]) ?? [],
    dealBreakers: brief.dealBreakers ?? [],
    buyerType: brief.buyerType,
    purchasePurpose: brief.purchasePurpose,
  };
}

export function briefRowToCriteria(brief: BriefRow): BuyerBrief {
  return briefLikeToCriteria({
    budgetMin: brief.budgetMin,
    budgetMax: brief.budgetMax,
    suburbs: brief.suburbs as string[] | undefined,
    propertyTypes: brief.propertyTypes as string[] | undefined,
    minBeds: brief.minBeds,
    minBaths: brief.minBaths,
    parking: brief.parking,
    mustHaves: brief.mustHaves as string[] | undefined,
    dealBreakers: brief.dealBreakers as string[] | undefined,
    buyerType: brief.buyerType,
    purchasePurpose: brief.purchasePurpose,
  });
}

type PropertyMatchBase = Pick<PropertyRow, 'price' | 'suburb' | 'propertyType' | 'bedrooms' | 'bathrooms' | 'parkingSpaces' | 'days'> & Partial<Pick<PropertyRow, 'landSize'>>;
type PropertyMatchExtras = Partial<Pick<PropertyRow, 'overallScore' | 'appraisedValue' | 'grossYield' | 'underOffer'>>;

export function propertyRowToMatchInput(
  row: PropertyMatchBase & PropertyMatchExtras,
): PropertyForMatch {
  return {
    price: row.price ?? 0,
    suburb: row.suburb ?? '',
    propertyType: row.propertyType ?? '',
    bedrooms: row.bedrooms ?? 0,
    bathrooms: row.bathrooms ?? 0,
    parkingSpaces: row.parkingSpaces,
    features: [],
    daysOnMarket: row.days,
    landSize: row.landSize ?? undefined,
    overallScore: row.overallScore,
    appraisedValue: row.appraisedValue,
    grossYield: row.grossYield ?? undefined,
    underOffer: !!row.underOffer,
  };
}

/**
 * Wide pre-filter for the DB — keeps a large candidate set so the JS ranker
 * can score everything properly. Avoids over-pruning at the DB level.
 *
 * Budget: +25% slack above max so stretch properties are visible.
 * Beds/baths: allow one under the minimum so borderline properties can be scored.
 * Suburbs: not filtered here — the ranker penalises mismatches rather than excluding.
 */
export function buildPropertyMatchConditions(criteria: BuyerBrief): SQL | undefined {
  const conditions: SQL[] = [
    gt(propertiesTable.price, 0),
    isNotNull(propertiesTable.suburb),
    isNotNull(propertiesTable.propertyType),
  ];

  if (criteria.budgetMin > 0) {
    // Allow 20% below min (some listed prices may be guides)
    conditions.push(gte(propertiesTable.price, Math.floor(criteria.budgetMin * 0.8)));
  }
  if (Number.isFinite(criteria.budgetMax)) {
    // Allow 25% above max so stretch properties surface in the ranked list
    conditions.push(lte(propertiesTable.price, Math.ceil(criteria.budgetMax * 1.25)));
  }
  if (criteria.minBeds > 1) {
    // Allow one bed under so borderline properties can be scored
    conditions.push(gte(propertiesTable.bedrooms, criteria.minBeds - 1));
  }
  if (criteria.minBaths > 1) {
    conditions.push(gte(propertiesTable.bathrooms, criteria.minBaths - 1));
  }

  return and(...conditions);
}

export function scoreAndRankProperties<T extends PropertyRow>(
  rows: T[],
  criteria: BuyerBrief,
  limit = 50,
): Array<{ row: T; matchScore: number }> {
  return rows
    .filter((row) => propertyTypesMatch(criteria.propertyTypes, row.propertyType))
    .map((row) => ({
      row,
      matchScore: computeMatchScore(propertyRowToMatchInput(row), criteria),
    }))
    .filter(({ matchScore }) => matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}
