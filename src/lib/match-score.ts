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
  buyerType?: string | null;
  purchasePurpose?: string | null;
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
  landSize?: number | null;
  overallScore?: number | null;
  appraisedValue?: number | null;
  grossYield?: number | null;
  underOffer?: boolean;
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

  // Soft scoring
  let score = 0;

  // Price proximity to midpoint (30 pts)
  const midpoint = (brief.budgetMin + brief.budgetMax) / 2;
  const range = brief.budgetMax - brief.budgetMin;
  const proximity = 1 - Math.abs(property.price - midpoint) / range;
  score += Math.round(proximity * 30);

  // Must-haves matched (25 pts) — only awarded when brief actually specifies must-haves
  if (brief.mustHaves.length > 0) {
    const matched = brief.mustHaves.filter(m => property.features.includes(m)).length;
    score += Math.round((matched / brief.mustHaves.length) * 25);
  }

  // Extra beds / baths above minimum (15 pts)
  const extraBeds = Math.max(0, property.bedrooms - brief.minBeds);
  const extraBaths = Math.max(0, property.bathrooms - brief.minBaths);
  score += Math.min(15, extraBeds * 5 + extraBaths * 7);

  // Land size bonus (10 pts) — meaningful for house-like types
  if (property.landSize && property.landSize > 0) {
    const pt = property.propertyType.toLowerCase();
    const isHouseLike = ['house', 'townhouse', 'villa', 'duplex', 'semi-detached', 'acreage', 'terrace'].includes(pt);
    if (isHouseLike) {
      score += Math.min(10, Math.round(property.landSize / 100));
    }
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

  // Property CMA quality (up to 10 pts)
  if (property.overallScore != null && property.overallScore > 0) {
    score += Math.min(10, Math.round((property.overallScore / 10000) * 10));
  }

  // Buyer-type fit (up to 10 pts)
  const buyerType = brief.buyerType?.toLowerCase() ?? '';
  const purpose = brief.purchasePurpose?.toLowerCase() ?? '';
  let buyerBonus = 0;
  if (buyerType === 'investor' || purpose === 'investment') {
    const yieldVal = property.grossYield ?? 0;
    if (yieldVal >= 4) buyerBonus = 10;
    else if (yieldVal >= 3) buyerBonus = 7;
    else if (yieldVal >= 2) buyerBonus = 4;
    else buyerBonus = 1;
  } else if (buyerType === 'downsizer') {
    const pt = property.propertyType.toLowerCase();
    if (['apartment', 'unit', 'studio', 'terrace'].includes(pt)) buyerBonus = 7;
    else if (['townhouse', 'duplex', 'semi-detached'].includes(pt)) buyerBonus = 4;
    if (property.landSize && property.landSize < 300) buyerBonus += 3;
  } else {
    // owner-occupier, first-home, default
    if (!property.underOffer) buyerBonus += 5;
  }
  score += Math.min(10, buyerBonus);

  // Value gap — listed price vs appraised value (up to ±10 pts)
  if (property.appraisedValue && property.appraisedValue > 0) {
    const gap = (property.appraisedValue - property.price) / property.appraisedValue;
    score += Math.min(10, Math.max(-10, Math.round(gap * 30)));
  }

  // Under offer penalty
  if (property.underOffer) score -= 8;

  return Math.min(100, Math.max(0, score));
}
