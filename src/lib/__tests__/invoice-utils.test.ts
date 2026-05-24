import { describe, expect, it } from 'vitest';
import { calcBuyersAgentFee } from '../invoice-utils';

describe('calcBuyersAgentFee', () => {
  it('calculates 1.5% of purchase price by default', () => {
    expect(calcBuyersAgentFee(1_000_000)).toBe(15_000);
  });

  it('uses offer amount when provided', () => {
    expect(calcBuyersAgentFee(null, 950_000)).toBe(14_250);
  });
});
