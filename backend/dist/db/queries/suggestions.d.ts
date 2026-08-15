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
export declare function listPending(db: Database, specKey?: string): SuggestionRow[];
export declare function isRejected(db: Database, sourceKey: string, targetKey: string, type: RelationshipType, dataHash: string): boolean;
//# sourceMappingURL=suggestions.d.ts.map