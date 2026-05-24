import { describe, expect, it } from 'vitest';
import {
  buildMatchCriteriaHash,
  isBriefMatchCacheValid,
} from '@/lib/brief-match-cache';

describe('buildMatchCriteriaHash', () => {
  it('returns empty string when no filter params', () => {
    const sp = new URLSearchParams('offset=0');
    expect(buildMatchCriteriaHash(sp)).toBe('');
  });

  it('builds stable hash from filter params', () => {
    const sp = new URLSearchParams('budgetMin=500000&suburbs=Richmond,Fitzroy');
    expect(buildMatchCriteriaHash(sp)).toBe('budgetMin=500000|suburbs=Richmond,Fitzroy');
  });
});

describe('isBriefMatchCacheValid', () => {
  const now = new Date('2026-05-24T12:00:00Z').getTime();

  it('is valid when computed after brief update and within max age', () => {
    const computedAt = new Date('2026-05-24T11:00:00Z');
    const briefUpdatedAt = new Date('2026-05-24T10:00:00Z');
    expect(isBriefMatchCacheValid(computedAt, briefUpdatedAt, now)).toBe(true);
  });

  it('is invalid when brief was updated after cache', () => {
    const computedAt = new Date('2026-05-24T09:00:00Z');
    const briefUpdatedAt = new Date('2026-05-24T10:00:00Z');
    expect(isBriefMatchCacheValid(computedAt, briefUpdatedAt, now)).toBe(false);
  });

  it('is invalid when cache is older than max age', () => {
    const computedAt = new Date('2026-05-23T00:00:00Z');
    const briefUpdatedAt = new Date('2026-05-20T00:00:00Z');
    expect(isBriefMatchCacheValid(computedAt, briefUpdatedAt, now)).toBe(false);
  });
});
