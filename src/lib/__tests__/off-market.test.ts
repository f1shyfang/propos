import { describe, it, expect } from 'vitest';
import {
  validateOffMarketProperty,
  SOURCE_TYPES,
  ACCESS_STATUSES,
  VENDOR_MOTIVATIONS,
  calcFollowUpOverdue,
  type OffMarketPropertyInput,
} from '../off-market-utils';

describe('SOURCE_TYPES', () => {
  it('contains expected source types', () => {
    expect(SOURCE_TYPES).toContain('selling_agent');
    expect(SOURCE_TYPES).toContain('direct_vendor');
    expect(SOURCE_TYPES).toContain('word_of_mouth');
    expect(SOURCE_TYPES).toContain('other');
  });
});

describe('ACCESS_STATUSES', () => {
  it('contains all access states', () => {
    const expected = ['not_inspected', 'inspected', 'under_negotiation', 'sold', 'lost'];
    expected.forEach(s => expect(ACCESS_STATUSES).toContain(s));
  });
});

describe('VENDOR_MOTIVATIONS', () => {
  it('contains all motivation levels', () => {
    const expected = ['highly_motivated', 'motivated', 'testing_market', 'unknown'];
    expected.forEach(m => expect(VENDOR_MOTIVATIONS).toContain(m));
  });
});

describe('validateOffMarketProperty', () => {
  const valid: OffMarketPropertyInput = {
    address: '12 Smith St',
    suburb: 'Richmond',
    state: 'VIC',
    sourceType: 'selling_agent',
    accessStatus: 'not_inspected',
    vendorMotivation: 'unknown',
    confidential: false,
  };

  it('accepts a valid payload', () => {
    expect(validateOffMarketProperty(valid)).toEqual({ ok: true });
  });

  it('rejects missing address', () => {
    const r = validateOffMarketProperty({ ...valid, address: '' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/address/i);
  });

  it('rejects missing suburb', () => {
    const r = validateOffMarketProperty({ ...valid, suburb: '' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/suburb/i);
  });

  it('rejects invalid sourceType', () => {
    const r = validateOffMarketProperty({ ...valid, sourceType: 'alien' as never });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/sourceType/i);
  });

  it('rejects invalid accessStatus', () => {
    const r = validateOffMarketProperty({ ...valid, accessStatus: 'flying' as never });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/accessStatus/i);
  });

  it('accepts optional fields', () => {
    const r = validateOffMarketProperty({
      ...valid,
      priceMin: 900000, priceMax: 1100000,
      expectedListingDate: new Date('2026-09-01'),
      internalNotes: 'Vendor wants quick sale',
    });
    expect(r.ok).toBe(true);
  });

  it('rejects when priceMin > priceMax', () => {
    const r = validateOffMarketProperty({ ...valid, priceMin: 1200000, priceMax: 900000 });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/price/i);
  });
});

describe('calcFollowUpOverdue', () => {
  it('returns overdue for last contact > 30 days ago', () => {
    const old = new Date();
    old.setDate(old.getDate() - 35);
    expect(calcFollowUpOverdue(old, 'inspected')).toBe(true);
  });

  it('returns not overdue for recent contact', () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 10);
    expect(calcFollowUpOverdue(recent, 'inspected')).toBe(false);
  });

  it('returns false for sold/lost properties regardless of last contact', () => {
    const old = new Date();
    old.setDate(old.getDate() - 60);
    expect(calcFollowUpOverdue(old, 'sold')).toBe(false);
    expect(calcFollowUpOverdue(old, 'lost')).toBe(false);
  });
});
