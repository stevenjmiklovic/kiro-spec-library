import type { Database } from "bun:sqlite";
import type { AuditOperation } from "@kiro-spec-library/shared";
export interface AuditRow {
    id: string;
    operation: string;
    spec_key: string | null;
    snapshot_id: string | null;
    actor: string;
    timestamp: string;
    created_at: string;
}
export interface AuditFilters {
    specKey?: string;
    operation?: AuditOperation;
    actor?: string;
    after?: string;
    before?: string;
    limit: number;
}
export declare function insertAuditEvent(db: Database, event: {
    id: string;
    operation: AuditOperation;
    specKey?: string;
    snapshotId?: string;
    actor: string;
    timestamp: string;
}): void;
export declare function queryAuditEvents(db: Database, filters: AuditFilters): AuditRow[];
//# sourceMappingURL=audit.d.ts.map