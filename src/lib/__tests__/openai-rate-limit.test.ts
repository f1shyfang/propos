import { afterEach, describe, expect, it } from 'vitest';
import {
  checkOpenAiRateLimit,
  resetOpenAiRateLimitsForTests,
} from '../openai-rate-limit';

describe('checkOpenAiRateLimit', () => {
  afterEach(() => {
    resetOpenAiRateLimitsForTests();
  });

  it('allows requests up to the default transcribe limit', () => {
    const now = 1_700_000_000_000;
    for (let i = 0; i < 5; i += 1) {
      expect(checkOpenAiRateLimit('client-a', 'transcribe', now)).toEqual({ allowed: true });
    }
    expect(checkOpenAiRateLimit('client-a', 'transcribe', now)).toEqual({
      allowed: false,
      retryAfterSec: 900,
    });
  });

  it('tracks parse and transcribe buckets separately', () => {
    const now = 1_700_000_000_000;
    for (let i = 0; i < 5; i += 1) {
      expect(checkOpenAiRateLimit('client-a', 'transcribe', now)).toEqual({ allowed: true });
    }
    expect(checkOpenAiRateLimit('client-a', 'parse', now)).toEqual({ allowed: true });
  });

  it('isolates limits per client key', () => {
    const now = 1_700_000_000_000;
    for (let i = 0; i < 5; i += 1) {
      expect(checkOpenAiRateLimit('client-a', 'transcribe', now)).toEqual({ allowed: true });
    }
    expect(checkOpenAiRateLimit('client-b', 'transcribe', now)).toEqual({ allowed: true });
  });

  it('resets the window after it expires', () => {
    const start = 1_700_000_000_000;
    for (let i = 0; i < 5; i += 1) {
      expect(checkOpenAiRateLimit('client-a', 'transcribe', start)).toEqual({ allowed: true });
    }
    expect(checkOpenAiRateLimit('client-a', 'transcribe', start)).toEqual({
      allowed: false,
      retryAfterSec: 900,
    });

    const afterWindow = start + 15 * 60 * 1000 + 1;
    expect(checkOpenAiRateLimit('client-a', 'transcribe', afterWindow)).toEqual({ allowed: true });
  });
});
