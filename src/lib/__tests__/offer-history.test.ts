import { describe, expect, it } from 'vitest';
import {
  buildOfferHistoryEntries,
  formatOfferEventLabel,
  formatOfferEventShort,
  groupRecentOfferEventsByDeal,
} from '../offer-history';

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

describe('formatOfferEventShort', () => {
  it('abbreviates amount changes', () => {
    expect(
      formatOfferEventShort({
        eventType: 'amount',
        previousValue: '950000',
        newValue: '965000',
      }),
    ).toBe('$950K → $965K');
  });
});

describe('groupRecentOfferEventsByDeal', () => {
  it('keeps at most three events per deal', () => {
    const t = new Date('2026-05-01');
    const grouped = groupRecentOfferEventsByDeal([
      { id: 1, dealId: 10, eventType: 'sub_state', previousValue: 'sent', newValue: 'negotiating', createdAt: t },
      { id: 2, dealId: 10, eventType: 'sub_state', previousValue: 'negotiating', newValue: 'counter_offer', createdAt: t },
      { id: 3, dealId: 10, eventType: 'amount', previousValue: '900000', newValue: '950000', createdAt: t },
      { id: 4, dealId: 10, eventType: 'sub_state', previousValue: 'counter_offer', newValue: 'accepted', createdAt: t },
      { id: 5, dealId: 20, eventType: 'sub_state', previousValue: null, newValue: 'sent', createdAt: t },
    ]);
    expect(grouped[10]).toHaveLength(3);
    expect(grouped[20]).toHaveLength(1);
  });
});
