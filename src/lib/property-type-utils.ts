import { PROPERTY_TYPES } from '@/lib/brief-field-options';

/** Canonical brief wizard label for a property type string (listing or brief). */
export function normalizePropertyType(type: string): string | null {
  const lower = type.toLowerCase().trim();
  for (const allowed of PROPERTY_TYPES) {
    if (allowed.toLowerCase() === lower) return allowed;
  }
  if (lower.includes('unit') || lower.includes('villa')) return 'Villa Unit';
  if (lower.includes('apartment') || lower.includes('flat')) return 'Apartment';
  if (lower.includes('townhouse') || lower.includes('town house')) return 'Townhouse';
  if (lower.includes('house')) return 'House';
  if (lower.includes('duplex')) return 'Duplex';
  if (lower.includes('acreage')) return 'Acreage';
  if (lower.includes('land')) return 'Vacant Land';
  return null;
}

function canonicalKey(type: string): string {
  return (normalizePropertyType(type) ?? type).toLowerCase();
}

/** True when listing type satisfies any brief property type (with aliases). */
export function propertyTypesMatch(briefTypes: string[], dbType: string | null | undefined): boolean {
  if (briefTypes.length === 0) return true;
  if (!dbType) return false;
  const dbKey = canonicalKey(dbType);
  return briefTypes.some((bt) => canonicalKey(bt) === dbKey);
}

/** Exact case-insensitive suburb match; empty brief list skips the filter.
 *  Handles "STATE - Suburb Name" format stored from the UI dropdown. */
export function suburbMatches(briefSuburbs: string[], propertySuburb: string | null | undefined): boolean {
  if (briefSuburbs.length === 0) return true;
  if (!propertySuburb) return false;
  const lower = propertySuburb.toLowerCase();
  return briefSuburbs.some((s) => {
    const normalized = s.includes(' - ') ? s.split(' - ').slice(1).join(' - ') : s;
    return normalized.toLowerCase() === lower;
  });
}
