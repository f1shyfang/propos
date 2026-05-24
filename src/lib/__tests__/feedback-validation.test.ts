import { describe, it, expect } from 'vitest';
import {
  validateFeedbackStatus,
  validateClientFeedbackStatus,
  normalizeFeedbackLabel,
  CLIENT_FEEDBACK_STATUSES,
  VALID_FEEDBACK_STATUSES,
} from '../feedback-utils';

// ── validateFeedbackStatus ────────────────────────────────────────────────────

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

// ── validateClientFeedbackStatus ─────────────────────────────────────────────

describe('validateClientFeedbackStatus', () => {
  it('accepts all CLIENT_FEEDBACK_STATUSES', () => {
    for (const s of CLIENT_FEEDBACK_STATUSES) {
      expect(validateClientFeedbackStatus(s)).toBe(true);
    }
  });

  it('accepts interested', () => {
    expect(validateClientFeedbackStatus('interested')).toBe(true);
  });

  it('accepts need_more_info', () => {
    expect(validateClientFeedbackStatus('need_more_info')).toBe(true);
  });

  it('accepts not_for_me', () => {
    expect(validateClientFeedbackStatus('not_for_me')).toBe(true);
  });

  it('rejects system-only status: new', () => {
    // "new" and "viewed" are system-set — clients cannot submit these
    expect(validateClientFeedbackStatus('new')).toBe(false);
  });

  it('rejects system-only status: viewed', () => {
    expect(validateClientFeedbackStatus('viewed')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateClientFeedbackStatus('')).toBe(false);
  });

  it('rejects arbitrary string', () => {
    expect(validateClientFeedbackStatus('love_it')).toBe(false);
  });

  it('is case sensitive', () => {
    expect(validateClientFeedbackStatus('Interested')).toBe(false);
    expect(validateClientFeedbackStatus('NOT_FOR_ME')).toBe(false);
  });
});

// ── CLIENT_FEEDBACK_STATUSES is a subset of VALID_FEEDBACK_STATUSES ───────────

describe('status set relationships', () => {
  it('every CLIENT_FEEDBACK_STATUS is also a valid overall status', () => {
    for (const s of CLIENT_FEEDBACK_STATUSES) {
      expect(VALID_FEEDBACK_STATUSES).toContain(s);
    }
  });

  it('new and viewed are in VALID but not in CLIENT set', () => {
    expect(VALID_FEEDBACK_STATUSES).toContain('new');
    expect(VALID_FEEDBACK_STATUSES).toContain('viewed');
    expect(CLIENT_FEEDBACK_STATUSES).not.toContain('new' as never);
    expect(CLIENT_FEEDBACK_STATUSES).not.toContain('viewed' as never);
  });
});

// ── normalizeFeedbackLabel ────────────────────────────────────────────────────

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

  it('passes through unknown statuses unchanged', () => {
    expect(normalizeFeedbackLabel('unknown_status')).toBe('unknown_status');
  });
});
