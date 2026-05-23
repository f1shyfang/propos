import { db } from './db';
import { userActionsTable } from './db/schema';
import { validateUserAction, type UserActionPayload } from './user-action-utils';

export async function logAction(payload: UserActionPayload): Promise<void> {
  const result = validateUserAction(payload);
  if (!result.ok) return; // silently skip invalid payloads — never throw
  try {
    await db.insert(userActionsTable).values({
      userId: payload.userId,
      actionType: payload.actionType,
      entityType: payload.entityType,
      entityId: payload.entityId,
      metadata: payload.metadata ?? {},
    });
  } catch {
    // fire-and-forget — log but never propagate
  }
}
