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
  });
}

export function propertyRowToMatchInput(
  row: Pick<PropertyRow, 'price' | 'suburb' | 'propertyType' | 'bedrooms' | 'bathrooms' | 'parkingSpaces' | 'days'>,
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
  };
}

/** Drizzle WHERE clause for structural hard filters (excludes property type — use propertyTypesMatch in JS). */
export function buildPropertyMatchConditions(criteria: BuyerBrief): SQL | undefined {
  const conditions: SQL[] = [
    gt(propertiesTable.price, 0),
    isNotNull(propertiesTable.suburb),
    isNotNull(propertiesTable.propertyType),
  ];

  if (criteria.budgetMin > 0) {
    conditions.push(gte(propertiesTable.price, criteria.budgetMin));
  }
  if (Number.isFinite(criteria.budgetMax)) {
    conditions.push(lte(propertiesTable.price, criteria.budgetMax));
  }
  if (criteria.minBeds > 0) {
    conditions.push(gte(propertiesTable.bedrooms, criteria.minBeds));
  }
  if (criteria.minBaths > 0) {
    conditions.push(gte(propertiesTable.bathrooms, criteria.minBaths));
  }
  if (criteria.parking === 'required') {
    conditions.push(gt(propertiesTable.parkingSpaces, 0));
  }

  if (criteria.suburbs.length > 0) {
    conditions.push(
      sql`lower(${propertiesTable.suburb}) in (${sql.join(
        criteria.suburbs.map((s) => sql`lower(${s})`),
        sql`, `,
      )})`,
    );
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
