import { describe, it, expect } from 'vitest';
import { validateUserAction, ACTION_TYPES, ENTITY_TYPES, type UserActionPayload } from '../user-action-utils';

describe('ACTION_TYPES', () => {
  it('contains all required action types', () => {
    const required = [
      'shortlist_add', 'shortlist_remove', 'feedback_submit',
      'brief_create', 'property_view', 'compare_view',
    ];
    required.forEach(t => expect(ACTION_TYPES).toContain(t));
  });
});

describe('ENTITY_TYPES', () => {
  it('contains property, brief, shortlist', () => {
    expect(ENTITY_TYPES).toContain('property');
    expect(ENTITY_TYPES).toContain('brief');
    expect(ENTITY_TYPES).toContain('shortlist');
  });
});

describe('validateUserAction', () => {
  const valid: UserActionPayload = {
    userId: 'agent-1',
    actionType: 'shortlist_add',
    entityType: 'property',
    entityId: 'prop-123',
  };

  it('accepts a valid payload', () => {
    expect(validateUserAction(valid)).toEqual({ ok: true });
  });

  it('rejects missing userId', () => {
    const r = validateUserAction({ ...valid, userId: '' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/userId/i);
  });

  it('rejects missing entityId', () => {
    const r = validateUserAction({ ...valid, entityId: '' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/entityId/i);
  });

  it('rejects unknown actionType', () => {
    const r = validateUserAction({ ...valid, actionType: 'fly_to_moon' as never });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/actionType/i);
  });

  it('rejects unknown entityType', () => {
    const r = validateUserAction({ ...valid, entityType: 'dragon' as never });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/entityType/i);
  });

  it('accepts optional metadata', () => {
    const r = validateUserAction({ ...valid, metadata: { score: 88, reason: 'test' } });
    expect(r.ok).toBe(true);
  });

  it('accepts all valid action types', () => {
    ACTION_TYPES.forEach(t => {
      const r = validateUserAction({ ...valid, actionType: t });
      expect(r.ok).toBe(true);
    });
  });

  it('accepts all valid entity types', () => {
    ENTITY_TYPES.forEach(t => {
      const r = validateUserAction({ ...valid, entityType: t });
      expect(r.ok).toBe(true);
    });
  });
});
