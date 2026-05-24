import { computeMatchScore } from './match-score';
import { briefLikeToCriteria, propertyRowToMatchInput } from './match-properties-for-brief';
import { propertyTypesMatch } from './property-type-utils';

export interface MatchFeedBrief {
  id: number;
  clientName: string;
  budgetMin: number | null;
  budgetMax: number | null;
  suburbs: string[];
  propertyTypes: string[];
  minBeds: number | null;
  minBaths: number | null;
  parking: string | null;
  mustHaves: string[];
  dealBreakers: string[];
  status: string | null;
  buyerType?: string | null;
  purchasePurpose?: string | null;
}

export interface MatchFeedProperty {
  id: string;
  address: string | null;
  suburb: string | null;
  state: string | null;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  landSize?: number | null;
  price: number | null;
  priceDisplay: string | null;
  days: number | null;
}

export interface MatchFeedItem {
  briefId: number;
  briefClientName: string;
  propertyId: string;
  address: string;
  suburb: string;
  state: string | null;
  price: number | null;
  priceDisplay: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  propertyType: string | null;
  days: number | null;
  score: number;
}

const ACTIVE_STATUSES = new Set(['searching', 'active', 'paused']);

export function buildMatchFeedItems(
  briefs: MatchFeedBrief[],
  properties: MatchFeedProperty[],
): MatchFeedItem[] {
  const items: MatchFeedItem[] = [];

  for (const brief of briefs) {
    if (!ACTIVE_STATUSES.has(brief.status ?? '')) continue;

    const criteria = briefLikeToCriteria({
      budgetMin: brief.budgetMin,
      budgetMax: brief.budgetMax,
      suburbs: brief.suburbs,
      propertyTypes: brief.propertyTypes,
      minBeds: brief.minBeds,
      minBaths: brief.minBaths,
      parking: brief.parking,
      mustHaves: brief.mustHaves,
      dealBreakers: brief.dealBreakers,
    });

    for (const prop of properties) {
      if (!prop.suburb || !prop.propertyType || !prop.price) continue;
      if (!propertyTypesMatch(criteria.propertyTypes, prop.propertyType)) continue;

      const score = computeMatchScore(propertyRowToMatchInput(prop), criteria);
      if (score === 0) continue;

      items.push({
        briefId: brief.id,
        briefClientName: brief.clientName,
        propertyId: prop.id,
        address: prop.address ?? prop.id,
        suburb: prop.suburb,
        state: prop.state,
        price: prop.price,
        priceDisplay: prop.priceDisplay,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        parkingSpaces: prop.parkingSpaces,
        propertyType: prop.propertyType,
        days: prop.days,
        score,
      });
    }
  }

  items.sort((a, b) => b.score - a.score);
  return items;
}
