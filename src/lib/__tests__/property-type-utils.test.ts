import { describe, it, expect } from 'vitest';
import { normalizePropertyType, propertyTypesMatch, suburbMatches } from '../property-type-utils';

describe('normalizePropertyType', () => {
  it('returns canonical labels for brief wizard values', () => {
    expect(normalizePropertyType('Apartment')).toBe('Apartment');
    expect(normalizePropertyType('house')).toBe('House');
  });

  it('maps listing aliases to canonical types', () => {
    expect(normalizePropertyType('unit')).toBe('Villa Unit');
    expect(normalizePropertyType('flat')).toBe('Apartment');
    expect(normalizePropertyType('town house')).toBe('Townhouse');
  });
});

describe('propertyTypesMatch', () => {
  it('matches brief Apartment to listing apartment', () => {
    expect(propertyTypesMatch(['Apartment'], 'apartment')).toBe(true);
  });

  it('matches brief House to listing house', () => {
    expect(propertyTypesMatch(['House'], 'house')).toBe(true);
  });

  it('matches Villa Unit brief to unit listing', () => {
    expect(propertyTypesMatch(['Villa Unit'], 'unit')).toBe(true);
  });

  it('rejects non-matching types', () => {
    expect(propertyTypesMatch(['Apartment'], 'house')).toBe(false);
  });

  it('skips filter when brief has no property types', () => {
    expect(propertyTypesMatch([], 'house')).toBe(true);
  });
});

describe('suburbMatches', () => {
  it('matches case-insensitively', () => {
    expect(suburbMatches(['Surry Hills'], 'surry hills')).toBe(true);
  });

  it('rejects non-listed suburbs', () => {
    expect(suburbMatches(['Surry Hills'], 'Bondi Beach')).toBe(false);
  });

  it('skips filter when brief has no suburbs', () => {
    expect(suburbMatches([], 'Bondi Beach')).toBe(true);
  });
});
