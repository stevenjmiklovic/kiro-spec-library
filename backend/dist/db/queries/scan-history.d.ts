import type { Database } from "bun:sqlite";
import type { ScanStatus } from "@kiro-spec-library/shared";
export interface ScanRow {
    run_id: string;
    started_at: string;
    completed_at: string | null;
    status: string;
    specs_discovered: number;
    errors: string | null;
}
export declare function insertScan(db: Database, scan: {
    runId: string;
    startedAt: string;
    status: ScanStatus;
}): void;
export declare function updateScan(db: Database, runId: string, update: {
    completedAt?: string;
    status?: ScanStatus;
    specsDiscovered?: number;
    errors?: string;
}): void;
export declare function getScan(db: Database, runId: string): ScanRow | null;
//# sourceMappingURL=scan-history.d.ts.map