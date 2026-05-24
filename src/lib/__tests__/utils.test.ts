import { describe, it, expect } from 'vitest';
import { scoreToMatchPct, formatPrice } from '../utils';

describe('scoreToMatchPct', () => {
  it('returns 50 for null overall score', () => {
    expect(scoreToMatchPct(null)).toBe(50);
  });

  it('clamps maximum at 99', () => {
    expect(scoreToMatchPct(10000)).toBe(99);
  });

  it('clamps minimum at 1', () => {
    expect(scoreToMatchPct(-100)).toBe(1);
  });

  it('converts 8000 to 80', () => {
    expect(scoreToMatchPct(8000)).toBe(80);
  });

  it('rounds fractional results', () => {
    expect(scoreToMatchPct(7550)).toBe(76);
  });
});

describe('formatPrice', () => {
  it('returns POA when price is null and no display', () => {
    expect(formatPrice(null, null)).toBe('POA');
  });

  it('returns POA when price is zero', () => {
    expect(formatPrice(0, null)).toBe('POA');
  });

  it('prefers display string over computed price', () => {
    expect(formatPrice(1000000, '$1.5M - $1.7M')).toBe('$1.5M - $1.7M');
  });

  it('formats millions as expanded value with commas', () => {
    expect(formatPrice(1500000, null)).toBe('$1,500,000');
  });

  it('formats sub-million as expanded value with commas', () => {
    expect(formatPrice(850000, null)).toBe('$850,000');
  });

  it('formats exactly 1 million as expanded value with commas', () => {
    expect(formatPrice(1000000, null)).toBe('$1,000,000');
  });
});
