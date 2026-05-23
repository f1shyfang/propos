export const ACTION_TYPES = [
  'shortlist_add',
  'shortlist_remove',
  'feedback_submit',
  'brief_create',
  'property_view',
  'compare_view',
] as const;

export const ENTITY_TYPES = ['property', 'brief', 'shortlist'] as const;

export type ActionType = typeof ACTION_TYPES[number];
export type EntityType = typeof ENTITY_TYPES[number];

export interface UserActionPayload {
  userId: string;
  actionType: ActionType;
  entityType: EntityType;
  entityId: string;
  metadata?: Record<string, unknown>;
}

type ValidationResult = { ok: true } | { ok: false; error: string };

export function validateUserAction(payload: UserActionPayload): ValidationResult {
  if (!payload.userId) return { ok: false, error: 'userId is required' };
  if (!payload.entityId) return { ok: false, error: 'entityId is required' };
  if (!(ACTION_TYPES as readonly string[]).includes(payload.actionType)) {
    return { ok: false, error: `actionType "${payload.actionType}" is not valid` };
  }
  if (!(ENTITY_TYPES as readonly string[]).includes(payload.entityType)) {
    return { ok: false, error: `entityType "${payload.entityType}" is not valid` };
  }
  return { ok: true };
}
