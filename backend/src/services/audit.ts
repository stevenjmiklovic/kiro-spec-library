import type { Database } from 'bun:sqlite';
import type { AuditOperation } from '@kiro-spec-library/shared';
import { insertAuditEvent } from '../db/queries/audit.js';

export function recordEvent(
  db: Database,
  operation: AuditOperation,
  options?: { specKey?: string; snapshotId?: string; actor?: string },
): void {
  try {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const actor = options?.actor ?? 'system';

    insertAuditEvent(db, {
      id,
      timestamp,
      operation,
      actor,
      specKey: options?.specKey,
      snapshotId: options?.snapshotId,
    });
  } catch (err) {
    console.error('[audit] Failed to record event:', err);
  }
}
