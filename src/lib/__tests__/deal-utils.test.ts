import { describe, it, expect } from 'vitest';
import {
  generateDueDiligenceChecklist,
  generateSettlementMilestones,
  DEAL_STATUSES,
  OFFER_SUB_STATES,
  getDealStatusLabel,
  getOfferSubStateLabel,
  calcCoolingOffStatus,
} from '../deal-utils';

describe('DEAL_STATUSES', () => {
  it('contains all pipeline columns including unconditional', () => {
    const required = [
      'suggested', 'approved', 'due_diligence', 'offer_made', 'under_contract',
      'unconditional', 'settled', 'lost', 'withdrawn',
    ];
    required.forEach(s => expect(DEAL_STATUSES).toContain(s));
  });
});

describe('OFFER_SUB_STATES', () => {
  it('contains draft, sent, negotiating, counter_offer, accepted, rejected', () => {
    const required = ['draft', 'sent', 'negotiating', 'counter_offer', 'accepted', 'rejected'];
    required.forEach(s => expect(OFFER_SUB_STATES).toContain(s));
  });
});

describe('getDealStatusLabel', () => {
  it('returns a readable label for each status', () => {
    expect(getDealStatusLabel('suggested')).toBe('Client Suggested');
    expect(getDealStatusLabel('approved')).toBe('Client Approved');
    expect(getDealStatusLabel('due_diligence')).toBe('Due Diligence');
    expect(getDealStatusLabel('offer_made')).toBe('Offer Made');
    expect(getDealStatusLabel('under_contract')).toBe('Under Contract');
    expect(getDealStatusLabel('unconditional')).toBe('Unconditional');
    expect(getDealStatusLabel('settled')).toBe('Settled');
    expect(getDealStatusLabel('lost')).toBe('Lost');
    expect(getDealStatusLabel('withdrawn')).toBe('Withdrawn');
  });

  it('returns the raw value for unknown status', () => {
    expect(getDealStatusLabel('unknown_thing')).toBe('unknown_thing');
  });
});

describe('getOfferSubStateLabel', () => {
  it('formats offer sub-states correctly', () => {
    expect(getOfferSubStateLabel('draft')).toBe('Draft');
    expect(getOfferSubStateLabel('counter_offer')).toBe('Counter Offer');
    expect(getOfferSubStateLabel('accepted')).toBe('Accepted');
  });
});

describe('generateDueDiligenceChecklist', () => {
  it('includes building and pest for all property types', () => {
    const items = generateDueDiligenceChecklist('House', 'NSW');
    const titles = items.map(i => i.title);
    expect(titles.some(t => t.toLowerCase().includes('building'))).toBe(true);
    expect(titles.some(t => t.toLowerCase().includes('pest'))).toBe(true);
  });

  it('adds strata report for Apartment in NSW', () => {
    const items = generateDueDiligenceChecklist('Apartment', 'NSW');
    const titles = items.map(i => i.title);
    expect(titles.some(t => t.toLowerCase().includes('strata'))).toBe(true);
  });

  it('does NOT add strata report for House', () => {
    const items = generateDueDiligenceChecklist('House', 'NSW');
    const titles = items.map(i => i.title);
    expect(titles.every(t => !t.toLowerCase().includes('strata'))).toBe(true);
  });

  it('adds section 32 for VIC', () => {
    const items = generateDueDiligenceChecklist('House', 'VIC');
    const titles = items.map(i => i.title);
    expect(titles.some(t => t.includes('Section 32') || t.includes('section 32'))).toBe(true);
  });

  it('includes contract review for all states', () => {
    ['NSW', 'VIC', 'QLD', 'WA'].forEach(state => {
      const items = generateDueDiligenceChecklist('House', state);
      expect(items.some(i => i.title.toLowerCase().includes('contract'))).toBe(true);
    });
  });

  it('all items have title, assignee and status', () => {
    const items = generateDueDiligenceChecklist('House', 'NSW');
    items.forEach(item => {
      expect(item.title).toBeTruthy();
      expect(item.assignee).toBeTruthy();
      expect(item.status).toBe('pending');
    });
  });

  it('returns at least 5 items for any property type and state', () => {
    const items = generateDueDiligenceChecklist('Townhouse', 'QLD');
    expect(items.length).toBeGreaterThanOrEqual(5);
  });
});

describe('generateSettlementMilestones', () => {
  const exchange = new Date('2026-06-01');
  const settlement = new Date('2026-07-13'); // ~42 days

  it('includes exchange as day 0 milestone', () => {
    const ms = generateSettlementMilestones(exchange, settlement, 'NSW', false);
    const day0 = ms.find(m => m.dayOffset === 0);
    expect(day0).toBeDefined();
    expect(day0!.title.toLowerCase()).toMatch(/exchange|contract/);
  });

  it('includes settlement as a milestone', () => {
    const ms = generateSettlementMilestones(exchange, settlement, 'NSW', false);
    const last = ms[ms.length - 1];
    expect(last.title.toLowerCase()).toMatch(/settlement/);
  });

  it('includes finance approval milestone', () => {
    const ms = generateSettlementMilestones(exchange, settlement, 'NSW', false);
    expect(ms.some(m => m.title.toLowerCase().includes('finance'))).toBe(true);
  });

  it('milestones are in ascending dayOffset order', () => {
    const ms = generateSettlementMilestones(exchange, settlement, 'VIC', false);
    for (let i = 1; i < ms.length; i++) {
      expect(ms[i].dayOffset).toBeGreaterThanOrEqual(ms[i - 1].dayOffset);
    }
  });

  it('all milestones have a dueDate', () => {
    const ms = generateSettlementMilestones(exchange, settlement, 'QLD', false);
    ms.forEach(m => expect(m.dueDate).toBeInstanceOf(Date));
  });

  it('auction deals have no cooling-off milestone', () => {
    const ms = generateSettlementMilestones(exchange, settlement, 'NSW', true);
    expect(ms.every(m => !m.title.toLowerCase().includes('cooling'))).toBe(true);
  });

  it('NSW non-auction has a cooling-off milestone', () => {
    const ms = generateSettlementMilestones(exchange, settlement, 'NSW', false);
    expect(ms.some(m => m.title.toLowerCase().includes('cooling'))).toBe(true);
  });

  it('returns at least 6 milestones', () => {
    const ms = generateSettlementMilestones(exchange, settlement, 'NSW', false);
    expect(ms.length).toBeGreaterThanOrEqual(6);
  });
});

describe('calcCoolingOffStatus', () => {
  it('returns expired for past dates', () => {
    const past = new Date('2020-01-01');
    const result = calcCoolingOffStatus(past);
    expect(result.expired).toBe(true);
    expect(result.daysLeft).toBeLessThanOrEqual(0);
  });

  it('returns not expired for future dates', () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const result = calcCoolingOffStatus(future);
    expect(result.expired).toBe(false);
    expect(result.daysLeft).toBeGreaterThan(0);
  });
});
