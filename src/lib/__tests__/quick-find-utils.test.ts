import { describe, it, expect } from 'vitest';
import { filterQuickFindResults, type QuickFindItem } from '../quick-find-utils';

const items: QuickFindItem[] = [
  { id: 'p1', type: 'property', label: '42 Union St, Surry Hills', sublabel: 'Surry Hills NSW · $950K', href: '/properties/p1' },
  { id: 'p2', type: 'property', label: '18 King St, Newtown', sublabel: 'Newtown NSW · $820K', href: '/properties/p2' },
  { id: 'b1', type: 'brief', label: 'Sarah Chen', sublabel: 'Budget $800K–$1.1M · Searching', href: '/briefs/1' },
  { id: 'b2', type: 'brief', label: 'James Webb', sublabel: 'Budget $1.2M–$2M · Searching', href: '/briefs/2' },
  { id: 'd1', type: 'deal', label: '12 Smith St, Richmond', sublabel: 'Under contract · Cho', href: '/deals/1' },
];

describe('filterQuickFindResults', () => {
  it('returns all items when query is empty', () => {
    expect(filterQuickFindResults('', items)).toEqual(items);
  });

  it('returns all items when query is only whitespace', () => {
    expect(filterQuickFindResults('   ', items)).toEqual(items);
  });

  it('matches items by label (case-insensitive)', () => {
    const results = filterQuickFindResults('union', items);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('p1');
  });

  it('matches items by sublabel (case-insensitive)', () => {
    const results = filterQuickFindResults('newtown', items);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('p2');
  });

  it('matches across label and sublabel', () => {
    const results = filterQuickFindResults('sarah', items);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('b1');
  });

  it('returns multiple matching results', () => {
    const results = filterQuickFindResults('NSW', items);
    expect(results).toHaveLength(2);
    const ids = results.map(r => r.id);
    expect(ids).toContain('p1');
    expect(ids).toContain('p2');
  });

  it('returns empty array when no items match', () => {
    expect(filterQuickFindResults('zzznomatch', items)).toHaveLength(0);
  });

  it('returns empty array when items list is empty', () => {
    expect(filterQuickFindResults('surry', [])).toHaveLength(0);
  });

  it('matches partial substrings', () => {
    const results = filterQuickFindResults('1.1', items);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('b1');
  });

  it('matches items by type when type is in query string (via sublabel)', () => {
    const results = filterQuickFindResults('contract', items);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('d1');
  });

  it('preserves original item order among matches', () => {
    const results = filterQuickFindResults('$', items);
    const ids = results.map(r => r.id);
    expect(ids.indexOf('p1')).toBeLessThan(ids.indexOf('p2'));
  });
});
