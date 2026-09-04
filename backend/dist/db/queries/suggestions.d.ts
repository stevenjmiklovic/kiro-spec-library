import type { Database } from "bun:sqlite";
import type { RelationshipType, SuggestionReason } from "@kiro-spec-library/shared";
export interface SuggestionRow {
    id: string;
    source_spec_key: string;
    target_spec_key: string;
    type: string;
    confidence: number;
    reason: string;
    evidence: string;
    status: string;
    created_at: string;
    resolved_at: string | null;
    data_hash: string;
}
export interface RejectionRow {
    id: string;
    source_spec_key: string;
    target_spec_key: string;
    type: string;
    data_hash: string;
    rejected_at: string;
}
export declare function createSuggestion(db: Database, suggestion: {
    id: string;
    sourceSpecKey: string;
    targetSpecKey: string;
    type: RelationshipType;
    confidence: number;
    reason: SuggestionReason;
    evidence: string;
    dataHash: string;
}): void;
export declare function acceptSuggestion(db: Database, id: string): void;
export declare function rejectSuggestion(db: Database, id: string, dataHash: string): void;
/** Whether a suggestion between this source/target/type already exists, in any status. */
export declare function suggestionExists(db: Database, sourceSpecKey: string, targetSpecKey: string, type: RelationshipType): boolean;
/** Directly record a rejection dedup entry (used by the textual export's apply path). */
export declare function createRejection(db: Database, rejection: {
    sourceSpecKey: string;
    targetSpecKey: string;
    type: RelationshipType;
    dataHash: string;
    rejectedAt: string;
}): void;
export declare function listPending(db: Database, specKey?: string): SuggestionRow[];
/** Every suggestion in the database (any status), for full-library export. */
export declare function listAllSuggestions(db: Database): SuggestionRow[];
/** Every dismissed-suggestion dedup record, for full-library export. */
export declare function listAllRejections(db: Database): RejectionRow[];
/** Bulk-fetch pending suggestions whose source is one of the given spec keys (for graph edge building). */
export declare function listPendingBySourceKeys(db: Database, specKeys: string[]): SuggestionRow[];
export declare function isRejected(db: Database, sourceKey: string, targetKey: string, type: RelationshipType, dataHash: string): boolean;
//# sourceMappingURL=suggestions.d.ts.map