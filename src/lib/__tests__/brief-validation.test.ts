import { describe, it, expect } from 'vitest';
import { validateStep1, validateStep2, validateStep3, validateStep4 } from '../brief-validation';

describe('validateStep1 — Client Info', () => {
  it('fails when client name is empty', () => {
    const result = validateStep1({ clientName: '', email: 'a@b.com', phone: '0400 000 000' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('clientName');
  });

  it('fails when email is invalid', () => {
    const result = validateStep1({ clientName: 'Sarah', email: 'notanemail', phone: '0400 000 000' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('email');
  });

  it('fails when phone is empty', () => {
    const result = validateStep1({ clientName: 'Sarah', email: 'sarah@demo.com', phone: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('phone');
  });

  it('passes with valid data', () => {
    const result = validateStep1({ clientName: 'Sarah Chen', email: 'sarah@demo.com', phone: '0400 000 000' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('validateStep2 — Budget & Finance', () => {
  it('fails when budgetMin >= budgetMax', () => {
    const result = validateStep2({ budgetMin: 1000000, budgetMax: 500000 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('budgetRange');
  });

  it('fails when budgetMin is zero', () => {
    const result = validateStep2({ budgetMin: 0, budgetMax: 1000000 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('budgetMin');
  });

  it('passes with valid budget range', () => {
    const result = validateStep2({ budgetMin: 800000, budgetMax: 1100000 });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when budgetMax equals budgetMin', () => {
    const result = validateStep2({ budgetMin: 1000000, budgetMax: 1000000 });
    expect(result.valid).toBe(false);
  });
});

describe('validateStep3 — Property Requirements', () => {
  it('fails when no property types selected', () => {
    const result = validateStep3({ propertyTypes: [], minBeds: 2, minBaths: 1 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('propertyTypes');
  });

  it('fails when minBeds is negative', () => {
    const result = validateStep3({ propertyTypes: ['apartment'], minBeds: -1, minBaths: 1 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('minBeds');
  });

  it('passes with valid requirements', () => {
    const result = validateStep3({ propertyTypes: ['apartment'], minBeds: 2, minBaths: 1 });
    expect(result.valid).toBe(true);
  });
});

describe('validateStep4 — Location', () => {
  it('fails when no suburbs selected', () => {
    const result = validateStep4({ suburbs: [] });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('suburbs');
  });

  it('passes with at least one suburb', () => {
    const result = validateStep4({ suburbs: ['Surry Hills'] });
    expect(result.valid).toBe(true);
  });
});
