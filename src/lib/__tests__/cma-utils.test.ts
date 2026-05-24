import { calculateComparabilityScore, calculatePricePerSqm, estimateValueRange, validateCmaRecord } from '@/lib/cma-utils';

describe('cma-utils', () => {
  describe('calculatePricePerSqm', () => {
    it('returns null when inputs are missing', () => {
      expect(calculatePricePerSqm(null, 400)).toBeNull();
      expect(calculatePricePerSqm(900000, null)).toBeNull();
    });

    it('returns rounded price per sqm', () => {
      expect(calculatePricePerSqm(500000, 250)).toBe(2000);
      expect(calculatePricePerSqm(333333, 321)).toBe(1038.4);
    });
  });

  describe('estimateValueRange', () => {
    it('returns null when no comparable prices exist', () => {
      expect(estimateValueRange([{ salePrice: null }])).toBeNull();
    });

    it('computes average and +/-5% bounds', () => {
      const range = estimateValueRange([{ salePrice: 800000 }, { salePrice: 1000000 }]);
      expect(range).toEqual({
        average: 900000,
        low: 855000,
        high: 945000,
      });
    });
  });

  describe('calculateComparabilityScore', () => {
    it('returns 100 for identical comps', () => {
      const subject = { salePrice: 900000, landSizeSqm: 300, bedrooms: 3, bathrooms: 2, distanceKm: 0.4 };
      const comparable = { salePrice: 900000, landSizeSqm: 300, bedrooms: 3, bathrooms: 2, distanceKm: 0.4 };
      expect(calculateComparabilityScore(subject, comparable)).toBe(100);
    });

    it('reduces score as comps diverge', () => {
      const subject = { salePrice: 900000, landSizeSqm: 300, bedrooms: 3, bathrooms: 2, distanceKm: 0.4 };
      const comparable = { salePrice: 1200000, landSizeSqm: 450, bedrooms: 5, bathrooms: 3, distanceKm: 2.2 };
      expect(calculateComparabilityScore(subject, comparable)).toBeLessThan(80);
    });

    it('clamps score to 0-100', () => {
      const subject = { salePrice: 900000, landSizeSqm: 100, bedrooms: 2, bathrooms: 1, distanceKm: 0.4 };
      const comparable = { salePrice: 2000000, landSizeSqm: 1000, bedrooms: 10, bathrooms: 6, distanceKm: 12 };
      expect(calculateComparabilityScore(subject, comparable)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validateCmaRecord', () => {
    it('requires address and sale price', () => {
      expect(validateCmaRecord({ comparableAddress: null, salePrice: 900000 })).toBe(false);
      expect(validateCmaRecord({ comparableAddress: '1 Test St', salePrice: null })).toBe(false);
      expect(validateCmaRecord({ comparableAddress: '1 Test St', salePrice: 900000 })).toBe(true);
    });
  });
});
