import { describe, it, expect } from 'vitest';
import { briefLikeToCriteria, scoreAndRankProperties } from '../match-properties-for-brief';
import type { PropertyRow } from '../match-properties-for-brief';

function makeProperty(overrides: Partial<PropertyRow>): PropertyRow {
  return {
    id: 'p1',
    lgaId: null,
    suburbId: null,
    lgaName: null,
    address: '1 Test St',
    suburb: 'Surry Hills',
    state: 'NSW',
    propertyType: 'apartment',
    bedrooms: 2,
    bathrooms: 1,
    parkingSpaces: 1,
    landSize: null,
    price: 950000,
    priceDisplay: null,
    latitude: null,
    longitude: null,
    url: null,
    created: null,
    days: 7,
    appraisedValue: null,
    appraisedRent: null,
    grossYield: null,
    sa1Yield: null,
    sa1Rent: null,
    confidenceScore: null,
    rScore: null,
    overallScore: null,
    overallPerc: null,
    sweetspot: null,
    sweetspotScore: null,
    distress: null,
    distressScore: null,
    ownerOccupiers: null,
    privateRenters: null,
    ooPerc: null,
    underOffer: null,
    suburbCode: null,
    images: [],
    ...overrides,
  };
}

const baseCriteria = briefLikeToCriteria({
  budgetMin: 800000,
  budgetMax: 1100000,
  suburbs: ['Surry Hills'],
  propertyTypes: ['Apartment'],
  minBeds: 2,
  minBaths: 1,
  parking: 'required',
});

describe('scoreAndRankProperties', () => {
  it('includes properties that satisfy structural constraints', () => {
    const ranked = scoreAndRankProperties([makeProperty({})], baseCriteria);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].matchScore).toBeGreaterThan(0);
  });

  it('excludes properties below min beds', () => {
    const ranked = scoreAndRankProperties(
      [makeProperty({ bedrooms: 1 })],
      baseCriteria,
    );
    expect(ranked).toHaveLength(0);
  });

  it('excludes properties without required parking', () => {
    const ranked = scoreAndRankProperties(
      [makeProperty({ parkingSpaces: 0 })],
      baseCriteria,
    );
    expect(ranked).toHaveLength(0);
  });

  it('excludes properties outside budget', () => {
    const ranked = scoreAndRankProperties(
      [makeProperty({ price: 1_500_000 })],
      baseCriteria,
    );
    expect(ranked).toHaveLength(0);
  });

  it('excludes properties in wrong suburb', () => {
    const ranked = scoreAndRankProperties(
      [makeProperty({ suburb: 'Bondi Beach' })],
      baseCriteria,
    );
    expect(ranked).toHaveLength(0);
  });

  it('excludes properties with non-matching type', () => {
    const ranked = scoreAndRankProperties(
      [makeProperty({ propertyType: 'house' })],
      baseCriteria,
    );
    expect(ranked).toHaveLength(0);
  });

  it('sorts by match score descending', () => {
    const mid = makeProperty({ id: 'mid', price: 950000 });
    const edge = makeProperty({ id: 'edge', price: 1_090_000 });
    const ranked = scoreAndRankProperties([edge, mid], baseCriteria);
    expect(ranked[0].row.id).toBe('mid');
    expect(ranked[0].matchScore).toBeGreaterThanOrEqual(ranked[1].matchScore);
  });
});

describe('briefLikeToCriteria — empty constraints', () => {
  it('allows any suburb when suburbs list is empty', () => {
    const criteria = briefLikeToCriteria({
      budgetMin: 800000,
      budgetMax: 1100000,
      suburbs: [],
      propertyTypes: ['Apartment'],
      minBeds: 2,
      minBaths: 1,
    });
    const ranked = scoreAndRankProperties(
      [makeProperty({ suburb: 'Bondi Beach' })],
      criteria,
    );
    expect(ranked).toHaveLength(1);
  });

  it('allows any property type when types list is empty', () => {
    const criteria = briefLikeToCriteria({
      budgetMin: 800000,
      budgetMax: 1100000,
      suburbs: ['Surry Hills'],
      propertyTypes: [],
      minBeds: 2,
      minBaths: 1,
    });
    const ranked = scoreAndRankProperties(
      [makeProperty({ propertyType: 'house' })],
      criteria,
    );
    expect(ranked).toHaveLength(1);
  });
});
