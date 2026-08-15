import type { Database } from "bun:sqlite";
import type { RelationshipType } from "@kiro-spec-library/shared";
export interface RelationshipRow {
    id: string;
    source_spec_key: string;
    target_spec_key: string;
    type: string;
    created_at: string;
}
export declare function createRelationship(db: Database, rel: {
    id: string;
    sourceSpecKey: string;
    targetSpecKey: string;
    type: RelationshipType;
}): void;
export declare function deleteRelationship(db: Database, id: string): void;
export declare function listBySpec(db: Database, specKey: string): RelationshipRow[];
export declare function checkDuplicate(db: Database, sourceSpecKey: string, targetSpecKey: string, type: RelationshipType): boolean;
//# sourceMappingURL=relationships.d.ts.map