import { describe, expect, it } from 'vitest';

import {
  buildBriefMatchesHref,
  buildLegacyBriefMatchesPath,
  buildClientBriefHref,
  buildClientFeedbackUpdate,
  shouldIncludeFeedbackPollItem,
} from '../core-flow-utils';

describe('buildBriefMatchesHref', () => {
  it('routes new briefs to the implemented matches tab', () => {
    expect(buildBriefMatchesHref(42)).toBe('/briefs/42?tab=matches');
  });
});

describe('buildLegacyBriefMatchesPath', () => {
  it('preserves the old nested path for redirects', () => {
    expect(buildLegacyBriefMatchesPath(42)).toBe('/briefs/42/matches');
  });
});

describe('buildClientBriefHref', () => {
  it('builds the public client review link for a brief', () => {
    expect(buildClientBriefHref(7)).toBe('/client-brief/7');
  });
});

describe('shouldIncludeFeedbackPollItem', () => {
  it('includes shared items without feedback on the initial dashboard poll', () => {
    expect(
      shouldIncludeFeedbackPollItem(
        { sharedAt: new Date('2026-05-24T09:00:00.000Z'), feedbackAt: null },
        null,
      ),
    ).toBe(true);
  });

  it('includes viewed or responded items on the initial dashboard poll', () => {
    expect(
      shouldIncludeFeedbackPollItem(
        {
          sharedAt: new Date('2026-05-24T09:00:00.000Z'),
          feedbackAt: new Date('2026-05-24T09:05:00.000Z'),
        },
        null,
      ),
    ).toBe(true);
  });

  it('includes items shared after the incremental cursor', () => {
    expect(
      shouldIncludeFeedbackPollItem(
        { sharedAt: new Date('2026-05-24T09:10:00.000Z'), feedbackAt: null },
        new Date('2026-05-24T09:00:00.000Z'),
      ),
    ).toBe(true);
  });

  it('includes feedback submitted after the incremental cursor', () => {
    expect(
      shouldIncludeFeedbackPollItem(
        {
          sharedAt: new Date('2026-05-24T08:30:00.000Z'),
          feedbackAt: new Date('2026-05-24T09:10:00.000Z'),
        },
        new Date('2026-05-24T09:00:00.000Z'),
      ),
    ).toBe(true);
  });

  it('excludes unchanged shared items on incremental polls', () => {
    expect(
      shouldIncludeFeedbackPollItem(
        {
          sharedAt: new Date('2026-05-24T08:30:00.000Z'),
          feedbackAt: new Date('2026-05-24T08:45:00.000Z'),
        },
        new Date('2026-05-24T09:00:00.000Z'),
      ),
    ).toBe(false);
  });
});

describe('buildClientFeedbackUpdate', () => {
  it('preserves structured not-for-me reasons with comments', () => {
    expect(
      buildClientFeedbackUpdate({
        feedbackStatus: 'not_for_me',
        feedbackText: 'Too much renovation work.',
        feedbackReason: 'Too small',
      }),
    ).toEqual({
      feedbackStatus: 'not_for_me',
      feedbackText: 'Too much renovation work.',
      feedbackReason: 'Too small',
    });
  });

  it('normalizes empty comment and reason values to null', () => {
    expect(
      buildClientFeedbackUpdate({
        feedbackStatus: 'interested',
        feedbackText: '',
        feedbackReason: '',
      }),
    ).toEqual({
      feedbackStatus: 'interested',
      feedbackText: null,
      feedbackReason: null,
    });
  });
});
