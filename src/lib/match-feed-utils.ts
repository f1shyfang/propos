import { computeMatchScore } from './match-score';

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

    const briefForMatch = {
      budgetMin: brief.budgetMin ?? 0,
      budgetMax: brief.budgetMax ?? Infinity,
      suburbs: brief.suburbs ?? [],
      propertyTypes: brief.propertyTypes ?? [],
      minBeds: brief.minBeds ?? 0,
      minBaths: brief.minBaths ?? 0,
      parking: (brief.parking as 'required' | 'nice_to_have' | 'not_needed') ?? 'not_needed',
      mustHaves: brief.mustHaves ?? [],
      dealBreakers: brief.dealBreakers ?? [],
    };

    for (const prop of properties) {
      if (!prop.suburb || !prop.propertyType || !prop.price) continue;

      const propForMatch = {
        price: prop.price,
        suburb: prop.suburb,
        propertyType: prop.propertyType,
        bedrooms: prop.bedrooms ?? 0,
        bathrooms: prop.bathrooms ?? 0,
        parkingSpaces: prop.parkingSpaces,
        features: [],
        daysOnMarket: prop.days,
      };

      const score = computeMatchScore(propForMatch, briefForMatch);
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
