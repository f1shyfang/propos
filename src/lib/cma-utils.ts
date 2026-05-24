export type CmaComparableInput = {
  salePrice: number | null;
  landSizeSqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  distanceKm: number | null;
};

export type ValueRange = {
  average: number;
  low: number;
  high: number;
};

export function calculatePricePerSqm(salePrice: number | null, landSizeSqm: number | null): number | null {
  if (!salePrice || !landSizeSqm || landSizeSqm <= 0) return null;
  const raw = salePrice / landSizeSqm;
  return Math.round(raw * 10) / 10;
}

export function estimateValueRange(comparables: Array<{ salePrice: number | null }>): ValueRange | null {
  const prices = comparables.map(c => c.salePrice).filter((p): p is number => p != null && p > 0);
  if (!prices.length) return null;
  const average = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  return {
    average,
    low: Math.round(average * 0.95),
    high: Math.round(average * 1.05),
  };
}

export function calculateComparabilityScore(subject: CmaComparableInput, comparable: CmaComparableInput): number {
  let score = 100;

  if (subject.bedrooms != null && comparable.bedrooms != null) {
    score -= Math.abs(subject.bedrooms - comparable.bedrooms) * 10;
  }

  if (subject.bathrooms != null && comparable.bathrooms != null) {
    score -= Math.abs(subject.bathrooms - comparable.bathrooms) * 8;
  }

  if (subject.landSizeSqm != null && comparable.landSizeSqm != null && subject.landSizeSqm > 0) {
    const diffPct = Math.abs(subject.landSizeSqm - comparable.landSizeSqm) / subject.landSizeSqm;
    score -= Math.round(diffPct * 50);
  }

  if (comparable.distanceKm != null && comparable.distanceKm > 1) {
    score -= Math.round((comparable.distanceKm - 1) * 10);
  }

  return Math.min(100, Math.max(0, score));
}

export function validateCmaRecord(record: { comparableAddress: string | null; salePrice: number | null }): boolean {
  return Boolean(record.comparableAddress && record.salePrice && record.salePrice > 0);
}
