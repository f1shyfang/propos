import { buildCmaRecordsForProperty } from '@/lib/seed/cma-seed';
import { validateCmaRecord } from '@/lib/cma-utils';

describe('cma-seed', () => {
  const subject = {
    id: 'prop-demo-001',
    address: '42 Union Street, Surry Hills',
    suburb: 'Surry Hills',
    state: 'NSW',
    bedrooms: 2,
    bathrooms: 1,
    landSize: 85,
    price: 950000,
    appraisedValue: 955000,
    overallScore: 89,
  };

  it('builds three valid comparables per property', () => {
    const rows = buildCmaRecordsForProperty(subject);
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.propertyId).toBe(subject.id);
      expect(validateCmaRecord({
        comparableAddress: row.comparableAddress ?? null,
        salePrice: row.salePrice ?? null,
      })).toBe(true);
      expect(row.pricePerSqm).toBeGreaterThan(0);
    }
  });

  it('is deterministic for the same property id', () => {
    const a = buildCmaRecordsForProperty(subject);
    const b = buildCmaRecordsForProperty(subject);
    expect(a).toEqual(b);
  });
});
