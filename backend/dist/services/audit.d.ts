import type { Database } from 'bun:sqlite';
import type { AuditOperation } from '@kiro-spec-library/shared';
export declare function recordEvent(db: Database, operation: AuditOperation, options?: {
    specKey?: string;
    snapshotId?: string;
    actor?: string;
}): void;
//# sourceMappingURL=audit.d.ts.map