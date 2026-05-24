import { describe, expect, it } from 'vitest';
import { validateM4aFile, validateM4aUpload } from '@/lib/intake/validate-m4a';

describe('validateM4aFile', () => {
  it('accepts valid m4a files', () => {
    const file = new File(['audio'], 'meeting.m4a', { type: 'audio/m4a' });
    expect(validateM4aFile(file)).toEqual({ valid: true });
  });

  it('rejects non-m4a extension', () => {
    const file = new File(['audio'], 'meeting.mp3', { type: 'audio/mpeg' });
    const result = validateM4aFile(file);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/\.m4a/);
  });

  it('rejects oversized files', () => {
    const big = new Array(26 * 1024 * 1024).fill('a').join('');
    const file = new File([big], 'large.m4a', { type: 'audio/m4a' });
    const result = validateM4aFile(file);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/25 MB/);
  });
});

describe('validateM4aUpload', () => {
  it('validates by filename and size', () => {
    expect(validateM4aUpload('notes.m4a', 1024, 'audio/m4a')).toEqual({ valid: true });
    expect(validateM4aUpload('notes.wav', 1024).valid).toBe(false);
  });
});
