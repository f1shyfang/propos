import { describe, it, expect } from 'vitest';
import { computeMatchScore, type BuyerBrief, type PropertyForMatch } from '../match-score';

const baseBrief: BuyerBrief = {
  budgetMin: 800000,
  budgetMax: 1100000,
  suburbs: ['Surry Hills', 'Newtown', 'Pyrmont'],
  propertyTypes: ['apartment'],
  minBeds: 2,
  minBaths: 1,
  parking: 'nice_to_have',
  mustHaves: ['natural_light', 'near_transport', 'internal_laundry'],
  dealBreakers: ['ground_floor'],
};

const goodProperty: PropertyForMatch = {
  price: 950000,
  suburb: 'Surry Hills',
  propertyType: 'apartment',
  bedrooms: 2,
  bathrooms: 1,
  parkingSpaces: 1,
  features: ['natural_light', 'near_transport', 'internal_laundry', 'balcony'],
  daysOnMarket: 7,
};

describe('computeMatchScore — hard filters', () => {
  it('returns 0 for property priced above budget max', () => {
    const prop: PropertyForMatch = { ...goodProperty, price: 1500000 };
    expect(computeMatchScore(prop, baseBrief)).toBe(0);
  });

  it('returns 0 for property priced below budget min', () => {
    const prop: PropertyForMatch = { ...goodProperty, price: 200000 };
    expect(computeMatchScore(prop, baseBrief)).toBe(0);
  });

  it('returns 0 for wrong property type', () => {
    const prop: PropertyForMatch = { ...goodProperty, propertyType: 'house' };
    expect(computeMatchScore(prop, baseBrief)).toBe(0);
  });

  it('returns 0 for property in wrong suburb', () => {
    const prop: PropertyForMatch = { ...goodProperty, suburb: 'Bondi Beach' };
    expect(computeMatchScore(prop, baseBrief)).toBe(0);
  });

  it('returns 0 when beds fall below minimum', () => {
    const prop: PropertyForMatch = { ...goodProperty, bedrooms: 1 };
    expect(computeMatchScore(prop, baseBrief)).toBe(0);
  });

  it('returns 0 when baths fall below minimum', () => {
    const prop: PropertyForMatch = { ...goodProperty, bathrooms: 0 };
    expect(computeMatchScore(prop, baseBrief)).toBe(0);
  });

  it('returns 0 when a deal-breaker feature is present', () => {
    const prop: PropertyForMatch = { ...goodProperty, features: ['ground_floor', 'natural_light'] };
    expect(computeMatchScore(prop, baseBrief)).toBe(0);
  });
});

describe('computeMatchScore — soft scoring', () => {
  it('returns a score > 60 for a well-matched property', () => {
    expect(computeMatchScore(goodProperty, baseBrief)).toBeGreaterThan(60);
  });

  it('scores higher when all must-haves are present', () => {
    const withAllMustHaves: PropertyForMatch = { ...goodProperty, features: ['natural_light', 'near_transport', 'internal_laundry'] };
    const withNoMustHaves: PropertyForMatch = { ...goodProperty, features: [] };
    expect(computeMatchScore(withAllMustHaves, baseBrief)).toBeGreaterThan(computeMatchScore(withNoMustHaves, baseBrief));
  });

  it('scores higher when price is closer to budget midpoint', () => {
    const midpointPrice: PropertyForMatch = { ...goodProperty, price: 950000 }; // midpoint of 800K-1.1M
    const edgePrice: PropertyForMatch = { ...goodProperty, price: 1090000 };
    expect(computeMatchScore(midpointPrice, baseBrief)).toBeGreaterThan(computeMatchScore(edgePrice, baseBrief));
  });

  it('score is in range 0-100', () => {
    const score = computeMatchScore(goodProperty, baseBrief);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('scores higher for fresh listings vs stale ones', () => {
    const fresh: PropertyForMatch = { ...goodProperty, daysOnMarket: 3 };
    const stale: PropertyForMatch = { ...goodProperty, daysOnMarket: 60 };
    expect(computeMatchScore(fresh, baseBrief)).toBeGreaterThan(computeMatchScore(stale, baseBrief));
  });
});
