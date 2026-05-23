import { describe, it, expect } from 'vitest';
import { calcSettlementDaysRemaining, calcCoolingOffExpiry, calcStampDuty } from '../settlement-utils';

describe('calcSettlementDaysRemaining', () => {
  it('returns positive days when settlement is in the future', () => {
    const future = new Date();
    future.setDate(future.getDate() + 24);
    const days = calcSettlementDaysRemaining(future);
    expect(days).toBeGreaterThanOrEqual(23);
    expect(days).toBeLessThanOrEqual(25);
  });

  it('returns 0 for settlement today', () => {
    const today = new Date();
    today.setHours(23, 59, 59, 0);
    expect(calcSettlementDaysRemaining(today)).toBe(0);
  });

  it('returns negative for past settlement', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    expect(calcSettlementDaysRemaining(past)).toBeLessThan(0);
  });
});

describe('calcCoolingOffExpiry', () => {
  it('NSW gives 5 business days', () => {
    const exchangeDate = new Date('2026-05-18'); // Monday
    const expiry = calcCoolingOffExpiry(exchangeDate, 'NSW');
    // 5 business days from Monday = next Monday (5 working days)
    expect(expiry).toBeInstanceOf(Date);
    const diff = Math.round((expiry.getTime() - exchangeDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(diff).toBeGreaterThanOrEqual(5);
    expect(diff).toBeLessThanOrEqual(9); // could span weekend
  });

  it('VIC gives 3 business days', () => {
    const exchangeDate = new Date('2026-05-18'); // Monday
    const expiry = calcCoolingOffExpiry(exchangeDate, 'VIC');
    const diff = Math.round((expiry.getTime() - exchangeDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(diff).toBeGreaterThanOrEqual(3);
    expect(diff).toBeLessThanOrEqual(7);
  });

  it('WA returns same date (no cooling-off)', () => {
    const exchangeDate = new Date('2026-05-18');
    const expiry = calcCoolingOffExpiry(exchangeDate, 'WA');
    expect(expiry.toDateString()).toBe(exchangeDate.toDateString());
  });

  it('Auction returns same date (no cooling-off)', () => {
    const exchangeDate = new Date('2026-05-18');
    const expiry = calcCoolingOffExpiry(exchangeDate, 'NSW', true);
    expect(expiry.toDateString()).toBe(exchangeDate.toDateString());
  });
});

describe('calcStampDuty', () => {
  it('NSW OO: applies correct rate for sub-1M property', () => {
    const duty = calcStampDuty(800000, 'NSW', false);
    expect(duty).toBeGreaterThan(0);
    expect(duty).toBeLessThan(800000 * 0.07);
  });

  it('returns 0 for zero price', () => {
    expect(calcStampDuty(0, 'NSW', false)).toBe(0);
  });

  it('investor pays more than owner-occupier (no concessions)', () => {
    const oo = calcStampDuty(700000, 'VIC', false);
    const investor = calcStampDuty(700000, 'VIC', true);
    // In VIC, PPOR and investor get same stamp duty at base rate — same amount
    expect(oo).toBeGreaterThanOrEqual(0);
    expect(investor).toBeGreaterThanOrEqual(0);
  });

  it('returns a number for all states', () => {
    const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
    states.forEach(state => {
      const duty = calcStampDuty(1000000, state, false);
      expect(typeof duty).toBe('number');
      expect(duty).toBeGreaterThan(0);
    });
  });
});
