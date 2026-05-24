import { describe, expect, it } from 'vitest';
import { buildDealDocumentS3Key } from '@/lib/storage/document-keys';
import { sanitizeFilename } from '@/lib/doc-utils';

describe('buildDealDocumentS3Key', () => {
  it('prefixes deal id and preserves extension', () => {
    const key = buildDealDocumentS3Key(42, 'report final.pdf');
    expect(key).toMatch(/^deals\/42\/.+\.pdf$/);
  });
});

describe('sanitizeFilename', () => {
  it('strips path separators and limits length', () => {
    expect(sanitizeFilename('../evil/report.pdf')).toBe('.._evil_report.pdf');
    expect(sanitizeFilename('')).toBe('document');
  });
});
