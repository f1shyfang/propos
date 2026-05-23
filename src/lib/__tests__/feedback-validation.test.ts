import { describe, it, expect } from 'vitest';
import { validateFeedbackStatus, normalizeFeedbackLabel } from '../feedback-utils';

describe('validateFeedbackStatus', () => {
  const validStatuses = ['new', 'viewed', 'interested', 'need_more_info', 'not_for_me'];

  it.each(validStatuses)('accepts valid status: %s', (status) => {
    expect(validateFeedbackStatus(status)).toBe(true);
  });

  it('rejects unknown status', () => {
    expect(validateFeedbackStatus('love_it')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateFeedbackStatus('')).toBe(false);
  });

  it('is case sensitive', () => {
    expect(validateFeedbackStatus('Interested')).toBe(false);
  });
});

describe('normalizeFeedbackLabel', () => {
  it('converts new to New', () => {
    expect(normalizeFeedbackLabel('new')).toBe('New');
  });

  it('converts interested to Interested', () => {
    expect(normalizeFeedbackLabel('interested')).toBe('Interested');
  });

  it('converts need_more_info to Need more info', () => {
    expect(normalizeFeedbackLabel('need_more_info')).toBe('Need more info');
  });

  it('converts not_for_me to Not for me', () => {
    expect(normalizeFeedbackLabel('not_for_me')).toBe('Not for me');
  });

  it('converts viewed to Viewed', () => {
    expect(normalizeFeedbackLabel('viewed')).toBe('Viewed');
  });
});
