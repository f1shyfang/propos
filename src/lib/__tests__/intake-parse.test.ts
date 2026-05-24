import { describe, expect, it } from 'vitest';
import { normalizeParsedBrief, parseBudgetValue } from '@/lib/intake/parse-brief-from-transcript';

describe('parseBudgetValue', () => {
  it('parses numeric values', () => {
    expect(parseBudgetValue(800000)).toBe('800000');
    expect(parseBudgetValue('1100000')).toBe('1100000');
  });

  it('parses shorthand million and thousand', () => {
    expect(parseBudgetValue('1.2m')).toBe('1200000');
    expect(parseBudgetValue('800k')).toBe('800000');
  });

  it('returns empty for invalid input', () => {
    expect(parseBudgetValue('')).toBe('');
    expect(parseBudgetValue(null)).toBe('');
  });
});

describe('normalizeParsedBrief', () => {
  it('maps LLM output to brief form fields', () => {
    const result = normalizeParsedBrief({
      clientName: 'Sarah Chen',
      email: 'sarah@example.com',
      phone: '0400 111 222',
      budgetMin: 800000,
      budgetMax: '1.1m',
      propertyTypes: ['apartment', 'Townhouse'],
      suburbs: ['surry hills', 'newtown'],
      mustHaves: ['natural_light', 'garage'],
      dealBreakers: ['ground_floor'],
      urgency: '3 months',
      purchasePurpose: 'PPOR',
      auctionWillingness: true,
    });

    expect(result.parsed.clientName).toBe('Sarah Chen');
    expect(result.parsed.email).toBe('sarah@example.com');
    expect(result.parsed.budgetMin).toBe('800000');
    expect(result.parsed.budgetMax).toBe('1100000');
    expect(result.parsed.propertyTypes).toContain('Apartment');
    expect(result.parsed.propertyTypes).toContain('Townhouse');
    expect(result.parsed.suburbs).toContain('Surry Hills');
    expect(result.parsed.mustHaves).toContain('natural_light');
    expect(result.confidence.clientName).toBe('high');
  });

  it('flags missing required fields', () => {
    const result = normalizeParsedBrief({
      clientName: 'Alex',
      email: null,
      phone: null,
      budgetMin: null,
      budgetMax: null,
      propertyTypes: [],
      suburbs: [],
    });

    expect(result.missingFields).toContain('email');
    expect(result.missingFields).toContain('phone');
    expect(result.missingFields).toContain('budgetMin');
    expect(result.missingFields).toContain('suburbs');
  });
});
