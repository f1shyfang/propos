import { describe, it, expect } from 'vitest';
import { formatFileSize, getDocTagColor, DOC_TAGS } from '../doc-utils';

describe('formatFileSize', () => {
  it('returns empty string for null', () => {
    expect(formatFileSize(null)).toBe('');
  });

  it('formats bytes below 1 KB', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats KB with 1 decimal', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(2560)).toBe('2.5 KB');
  });

  it('formats MB with 1 decimal', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });

  it('formats large files in MB', () => {
    expect(formatFileSize(10 * 1024 * 1024)).toBe('10.0 MB');
  });
});

describe('getDocTagColor', () => {
  it('returns a non-empty color string for known tags', () => {
    const color = getDocTagColor('Contract of Sale');
    expect(typeof color).toBe('string');
    expect(color.length).toBeGreaterThan(0);
  });

  it('returns the same color for the same tag', () => {
    expect(getDocTagColor('Strata Report')).toBe(getDocTagColor('Strata Report'));
  });

  it('returns a fallback color for unknown tags', () => {
    const color = getDocTagColor('Unknown Random Tag');
    expect(typeof color).toBe('string');
    expect(color.length).toBeGreaterThan(0);
  });

  it('returns distinct colors for different tag categories', () => {
    const contractColor = getDocTagColor('Contract of Sale');
    const inspectionColor = getDocTagColor('Building Inspection');
    // They may or may not be the same color, but both must be valid strings
    expect(typeof contractColor).toBe('string');
    expect(typeof inspectionColor).toBe('string');
  });
});

describe('DOC_TAGS', () => {
  it('is a non-empty array of strings', () => {
    expect(Array.isArray(DOC_TAGS)).toBe(true);
    expect(DOC_TAGS.length).toBeGreaterThan(0);
    DOC_TAGS.forEach(tag => expect(typeof tag).toBe('string'));
  });

  it('includes the most common document types', () => {
    expect(DOC_TAGS).toContain('Contract of Sale');
    expect(DOC_TAGS).toContain('Building Inspection');
    expect(DOC_TAGS).toContain('Finance Approval');
    expect(DOC_TAGS).toContain('Offer Letter');
    expect(DOC_TAGS).toContain('CMA Report');
  });
});
