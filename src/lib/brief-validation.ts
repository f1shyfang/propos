interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateStep1(data: { clientName: string; email: string; phone: string }): ValidationResult {
  const errors: string[] = [];
  if (!data.clientName.trim()) errors.push('clientName');
  if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('email');
  if (!data.phone.trim()) errors.push('phone');
  return { valid: errors.length === 0, errors };
}

export function validateStep2(data: { budgetMin: number; budgetMax: number }): ValidationResult {
  const errors: string[] = [];
  if (!data.budgetMin || data.budgetMin <= 0) errors.push('budgetMin');
  if (!data.budgetMax || data.budgetMax <= 0) errors.push('budgetMax');
  if (data.budgetMin > 0 && data.budgetMax > 0 && data.budgetMin >= data.budgetMax) errors.push('budgetRange');
  return { valid: errors.length === 0, errors };
}

export function validateStep3(data: { propertyTypes: string[]; minBeds: number; minBaths: number }): ValidationResult {
  const errors: string[] = [];
  if (!data.propertyTypes.length) errors.push('propertyTypes');
  if (data.minBeds < 0) errors.push('minBeds');
  if (data.minBaths < 0) errors.push('minBaths');
  return { valid: errors.length === 0, errors };
}

export function validateStep4(data: { suburbs: string[] }): ValidationResult {
  const errors: string[] = [];
  if (!data.suburbs.length) errors.push('suburbs');
  return { valid: errors.length === 0, errors };
}
