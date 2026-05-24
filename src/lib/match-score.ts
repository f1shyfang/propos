import { propertyTypesMatch, suburbMatches } from '@/lib/property-type-utils';

export interface BuyerBrief {
  budgetMin: number;
  budgetMax: number;
  suburbs: string[];
  propertyTypes: string[];
  minBeds: number;
  minBaths: number;
  parking: 'required' | 'nice_to_have' | 'not_needed';
  mustHaves: string[];
  dealBreakers: string[];
}

export interface PropertyForMatch {
  price: number;
  suburb: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces?: number | null;
  features: string[];
  daysOnMarket?: number | null;
}

// Returns 0-100. Returns 0 if any hard filter fails.
export function computeMatchScore(property: PropertyForMatch, brief: BuyerBrief): number {
  // Hard filters
  if (property.price < brief.budgetMin || property.price > brief.budgetMax) return 0;
  if (!propertyTypesMatch(brief.propertyTypes, property.propertyType)) return 0;
  if (!suburbMatches(brief.suburbs, property.suburb)) return 0;
  if (property.bedrooms < brief.minBeds) return 0;
  if (property.bathrooms < brief.minBaths) return 0;
  if (brief.dealBreakers.some(db => property.features.includes(db))) return 0;
  if (brief.parking === 'required' && !property.parkingSpaces) return 0;

  // Soft scoring (total: 100 points)
  let score = 0;

  // Price proximity to midpoint (30 pts)
  const midpoint = (brief.budgetMin + brief.budgetMax) / 2;
  const range = brief.budgetMax - brief.budgetMin;
  const proximity = 1 - Math.abs(property.price - midpoint) / range;
  score += Math.round(proximity * 30);

  // Must-haves matched (25 pts)
  if (brief.mustHaves.length > 0) {
    const matched = brief.mustHaves.filter(m => property.features.includes(m)).length;
    score += Math.round((matched / brief.mustHaves.length) * 25);
  } else {
    score += 25;
  }

  // Parking match (10 pts)
  if (brief.parking === 'nice_to_have' && property.parkingSpaces) score += 10;
  else if (brief.parking === 'not_needed') score += 10;

  // Days on market recency (10 pts)
  const days = property.daysOnMarket ?? 30;
  if (days <= 7) score += 10;
  else if (days <= 14) score += 7;
  else if (days <= 30) score += 4;
  else score += 1;

  // Features bonus (25 pts)
  const extraFeatures = property.features.filter(f => !brief.dealBreakers.includes(f) && !brief.mustHaves.includes(f));
  const featureBonus = Math.min(25, extraFeatures.length * 5);
  score += featureBonus;

  return Math.min(100, Math.max(0, score));
}
