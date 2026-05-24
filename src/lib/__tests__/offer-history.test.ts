import { describe, expect, it } from 'vitest';
import { buildOfferHistoryEntries, formatOfferEventLabel } from '../offer-history';

describe('buildOfferHistoryEntries', () => {
  it('records offer sub-state changes', () => {
    const entries = buildOfferHistoryEntries(
      { offerAmount: 950_000, offerSubState: 'sent' },
      { offerSubState: 'counter_offer' },
    );
    expect(entries).toEqual([
      {
        eventType: 'sub_state',
        previousValue: 'sent',
        newValue: 'counter_offer',
      },
    ]);
  });

  it('records offer amount changes', () => {
    const entries = buildOfferHistoryEntries(
      { offerAmount: 950_000, offerSubState: 'counter_offer' },
      { offerAmount: 965_000 },
    );
    expect(entries).toEqual([
      {
        eventType: 'amount',
        previousValue: '950000',
        newValue: '965000',
      },
    ]);
  });

  it('returns empty when patch does not change tracked fields', () => {
    expect(
      buildOfferHistoryEntries(
        { offerAmount: 950_000, offerSubState: 'sent' },
        {},
      ),
    ).toEqual([]);
  });
});

describe('formatOfferEventLabel', () => {
  it('humanizes sub-state transitions', () => {
    expect(
      formatOfferEventLabel({
        eventType: 'sub_state',
        previousValue: 'counter_offer',
        newValue: 'accepted',
      }),
    ).toBe('Offer status: Counter Offer → Accepted');
  });
});
