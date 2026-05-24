export const SOURCE_TYPES = ['selling_agent', 'direct_vendor', 'word_of_mouth', 'other'] as const;
export const ACCESS_STATUSES = ['not_inspected', 'inspected', 'under_negotiation', 'sold', 'lost'] as const;
export const VENDOR_MOTIVATIONS = ['highly_motivated', 'motivated', 'testing_market', 'unknown'] as const;

export type SourceType = typeof SOURCE_TYPES[number];
export type AccessStatus = typeof ACCESS_STATUSES[number];
export type VendorMotivation = typeof VENDOR_MOTIVATIONS[number];

export interface OffMarketPropertyInput {
  address: string;
  suburb: string;
  state?: string;
  sourceType: SourceType;
  accessStatus: AccessStatus;
  vendorMotivation: VendorMotivation;
  confidential: boolean;
  priceMin?: number;
  priceMax?: number;
  expectedListingDate?: Date;
  internalNotes?: string;
  howSourced?: string;
}

type ValidationResult = { ok: boolean; error?: string };

export function validateOffMarketProperty(input: OffMarketPropertyInput): ValidationResult {
  if (!input.address?.trim()) return { ok: false, error: 'address is required' };
  if (!input.suburb?.trim()) return { ok: false, error: 'suburb is required' };
  if (!(SOURCE_TYPES as readonly string[]).includes(input.sourceType)) {
    return { ok: false, error: `sourceType "${input.sourceType}" is not valid` };
  }
  if (!(ACCESS_STATUSES as readonly string[]).includes(input.accessStatus)) {
    return { ok: false, error: `accessStatus "${input.accessStatus}" is not valid` };
  }
  if (input.priceMin !== undefined && input.priceMax !== undefined && input.priceMin > input.priceMax) {
    return { ok: false, error: 'priceMin cannot exceed priceMax' };
  }
  return { ok: true };
}

export function calcFollowUpOverdue(lastContactedAt: Date, accessStatus: AccessStatus): boolean {
  if (accessStatus === 'sold' || accessStatus === 'lost') return false;
  const daysSince = Math.round((Date.now() - lastContactedAt.getTime()) / (1000 * 60 * 60 * 24));
  return daysSince > 30;
}
