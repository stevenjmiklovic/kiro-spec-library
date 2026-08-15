import { insertAuditEvent } from '../db/queries/audit.js';
export function recordEvent(db, operation, options) {
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
    }
    catch (err) {
        console.error('[audit] Failed to record event:', err);
    }
}
