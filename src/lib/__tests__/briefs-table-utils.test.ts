import { describe, expect, it } from 'vitest';
import {
  CRM_DEMO_BRIEFS,
  filterBriefRows,
  formatBudgetRange,
  getDisplayBriefRows,
  isTestNoiseBrief,
  paginateBriefRows,
  sortBriefRows,
  type BriefTableRow,
} from '../briefs-table-utils';

const rows: BriefTableRow[] = [
  {
    id: 1,
    clientName: 'Sarah & Tom',
    email: 'sarah@example.com',
    budgetMin: 800000,
    budgetMax: 1100000,
    suburbs: ['Surry Hills', 'Newtown'],
    status: 'searching',
    propertyTypes: ['Apartment'],
    createdAt: '2026-05-24T00:00:00.000Z',
  },
  {
    id: 2,
    clientName: 'Mina Patel',
    email: 'mina@example.com',
    budgetMin: 1200000,
    budgetMax: 1800000,
    suburbs: ['Marrickville'],
    status: 'paused',
    propertyTypes: ['House'],
    createdAt: '2026-05-20T00:00:00.000Z',
  },
  {
    id: 3,
    clientName: 'E2E mpj generated',
    email: 'test@example.com',
    budgetMin: null,
    budgetMax: 900000,
    suburbs: ['Pyrmont'],
    status: 'searching',
    propertyTypes: ['Unit'],
    createdAt: '2026-05-19T00:00:00.000Z',
  },
];

describe('briefs table utilities', () => {
  it('formats budget ranges compactly', () => {
    expect(formatBudgetRange(800000, 1100000)).toBe('$800K - $1.1M');
    expect(formatBudgetRange(null, 900000)).toBe('up to $900K');
    expect(formatBudgetRange(null, null)).toBe('—');
  });

  it('detects obvious generated test rows', () => {
    expect(isTestNoiseBrief(rows[0])).toBe(false);
    expect(isTestNoiseBrief(rows[2])).toBe(true);
  });

  it('uses demo rows if every database row is filtered as test noise', () => {
    const displayRows = getDisplayBriefRows([rows[2]]);
    expect(displayRows.rows).toEqual(CRM_DEMO_BRIEFS);
    expect(displayRows.usingDemoRows).toBe(true);
    expect(displayRows.hiddenTestRows).toBe(1);
  });

  it('filters by search, status, and property type', () => {
    expect(filterBriefRows(rows, { search: 'surry', status: 'all', propertyType: 'all' }).map((r) => r.id)).toEqual([1]);
    expect(filterBriefRows(rows, { search: '', status: 'paused', propertyType: 'all' }).map((r) => r.id)).toEqual([2]);
    expect(filterBriefRows(rows, { search: '', status: 'all', propertyType: 'House' }).map((r) => r.id)).toEqual([2]);
  });

  it('sorts by client, budget, and created date', () => {
    expect(sortBriefRows(rows, { key: 'client', direction: 'asc' }).map((r) => r.clientName)).toEqual([
      'E2E mpj generated',
      'Mina Patel',
      'Sarah & Tom',
    ]);
    expect(sortBriefRows(rows, { key: 'budget', direction: 'desc' }).map((r) => r.id)).toEqual([2, 1, 3]);
    expect(sortBriefRows(rows, { key: 'created', direction: 'asc' }).map((r) => r.id)).toEqual([3, 2, 1]);
  });

  it('paginates rows and reports ranges', () => {
    const result = paginateBriefRows(rows, 1, 2);
    expect(result.rows.map((r) => r.id)).toEqual([1, 2]);
    expect(result.from).toBe(1);
    expect(result.to).toBe(2);
    expect(result.totalPages).toBe(2);
  });
});
