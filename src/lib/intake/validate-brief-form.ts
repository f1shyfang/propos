import { validateStep1, validateStep2, validateStep3, validateStep4 } from '@/lib/brief-validation';
import type { BriefFormPayload } from '@/lib/brief-field-options';

export function validateBriefForm(form: BriefFormPayload): { valid: boolean; errors: string[] } {
  const errors = new Set<string>();

  for (const e of validateStep1({ clientName: form.clientName, email: form.email, phone: form.phone }).errors) {
    errors.add(e);
  }
  for (const e of validateStep2({ budgetMin: Number(form.budgetMin), budgetMax: Number(form.budgetMax) }).errors) {
    errors.add(e);
  }
  for (const e of validateStep3({ propertyTypes: form.propertyTypes, minBeds: form.minBeds, minBaths: form.minBaths }).errors) {
    errors.add(e);
  }
  for (const e of validateStep4({ suburbs: form.suburbs }).errors) {
    errors.add(e);
  }

  return { valid: errors.size === 0, errors: [...errors] };
}
