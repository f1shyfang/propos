import { describe, it, expect } from 'vitest';
import {
  validateStatusTransition,
  computePipelineSummary,
  getAttentionItems,
  resolveCreateDealStatus,
  type DealSummaryRow,
} from '../deals';

describe('resolveCreateDealStatus', () => {
  it('defaults to suggested when no initial status', () => {
    expect(resolveCreateDealStatus({})).toBe('suggested');
  });

  it('uses approved when promoting from interested feedback', () => {
    expect(resolveCreateDealStatus({ fromInterestedFeedback: true })).toBe('approved');
  });

  it('accepts explicit initialStatus when valid', () => {
    expect(resolveCreateDealStatus({ initialStatus: 'due_diligence' })).toBe('due_diligence');
  });

  it('prefers explicit initialStatus over feedback flag', () => {
    expect(resolveCreateDealStatus({ initialStatus: 'offer_made', fromInterestedFeedback: true })).toBe('offer_made');
  });
});

describe('validateStatusTransition', () => {
  it('allows forward move to adjacent active stage', () => {
    expect(validateStatusTransition('suggested', 'approved')).toBe(true);
    expect(validateStatusTransition('approved', 'due_diligence')).toBe(true);
    expect(validateStatusTransition('due_diligence', 'offer_made')).toBe(true);
    expect(validateStatusTransition('offer_made', 'under_contract')).toBe(true);
    expect(validateStatusTransition('under_contract', 'unconditional')).toBe(true);
    expect(validateStatusTransition('unconditional', 'settled')).toBe(true);
    expect(validateStatusTransition('under_contract', 'settled')).toBe(true);
  });

  it('allows skip forward within active stages', () => {
    expect(validateStatusTransition('suggested', 'due_diligence')).toBe(true);
  });

  it('rejects backward transitions', () => {
    expect(validateStatusTransition('settled', 'suggested')).toBe(false);
    expect(validateStatusTransition('under_contract', 'offer_made')).toBe(false);
  });

  it('rejects transition from terminal lost/withdrawn', () => {
    expect(validateStatusTransition('lost', 'approved')).toBe(false);
    expect(validateStatusTransition('withdrawn', 'suggested')).toBe(false);
  });

  it('allows same status (no-op)', () => {
    expect(validateStatusTransition('approved', 'approved')).toBe(true);
  });
});

describe('computePipelineSummary', () => {
  const rows: DealSummaryRow[] = [
    { id: 1, status: 'suggested', price: 1_000_000, offerAmount: null },
    { id: 2, status: 'under_contract', price: 2_000_000, offerAmount: 1_900_000 },
    { id: 3, status: 'settled', price: 800_000, offerAmount: null },
    { id: 4, status: 'lost', price: 500_000, offerAmount: null },
  ];

  it('counts active deals excluding settled/lost/withdrawn', () => {
    const summary = computePipelineSummary(rows);
    expect(summary.activeCount).toBe(2);
  });

  it('sums value from price or offerAmount for active deals', () => {
    const summary = computePipelineSummary(rows);
    expect(summary.totalValue).toBe(2_900_000);
  });

  it('counts deals per stage', () => {
    const summary = computePipelineSummary(rows);
    expect(summary.stageCounts.suggested).toBe(1);
    expect(summary.stageCounts.under_contract).toBe(1);
    expect(summary.stageCounts.settled).toBe(1);
  });
});

describe('getAttentionItems', () => {
  it('surfaces settlement within 7 days', () => {
    const inThreeDays = new Date();
    inThreeDays.setDate(inThreeDays.getDate() + 3);
    const rows: DealSummaryRow[] = [{
      id: 10,
      status: 'under_contract',
      price: 1_000_000,
      offerAmount: null,
      settlementDate: inThreeDays.toISOString(),
      exchangeDate: null,
      priority: 'standard',
      address: '12 Smith St',
      suburb: 'Richmond',
      clientName: 'Sarah Chen',
      state: 'NSW',
      isAuction: false,
    }];
    const items = getAttentionItems(rows);
    expect(items.some(i => i.type === 'settlement_soon')).toBe(true);
  });

  it('surfaces urgent priority deals', () => {
    const rows: DealSummaryRow[] = [{
      id: 11,
      status: 'due_diligence',
      price: 1_000_000,
      offerAmount: null,
      settlementDate: null,
      exchangeDate: null,
      priority: 'urgent',
      address: '7 Brunswick St',
      suburb: 'Fitzroy',
      clientName: 'Tom Chen',
      state: 'VIC',
      isAuction: false,
    }];
    const items = getAttentionItems(rows);
    expect(items.some(i => i.type === 'urgent')).toBe(true);
  });
});
