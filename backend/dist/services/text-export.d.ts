import type { Database } from "bun:sqlite";
export declare function buildTextExportZip(db: Database): Uint8Array;
export interface ApplyTextExportResult {
    specsUpdated: string[];
    specsSkipped: string[];
    relationshipsApplied: number;
    suggestionsAdded: number;
    rejectionsAdded: number;
    proposalsAdded: number;
    errors: string[];
}
export declare function applyTextExportZip(db: Database, zipBytes: Uint8Array): ApplyTextExportResult;
//# sourceMappingURL=text-export.d.ts.map