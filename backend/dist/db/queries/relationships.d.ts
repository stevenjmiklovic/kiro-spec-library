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
/** Every relationship in the database, for full-library export. */
export declare function listAllRelationships(db: Database): RelationshipRow[];
/** Bulk-fetch relationships whose source is one of the given spec keys (for graph edge building). */
export declare function listBySourceKeys(db: Database, specKeys: string[]): RelationshipRow[];
export interface SupersessionRow {
    target_spec_key: string;
    successor_spec_key: string;
    successor_title: string;
}
/**
 * For each of the given spec keys, find the spec (if any) that supersedes
 * it — i.e. a `supersedes` relationship whose target is that key. Used to
 * derive the Archive view's "Disposition" (Active vs. Superseded) per
 * ADR-005, which replaced the legal-hold columns with this relationship.
 */
export declare function listSupersessionsByTargetKeys(db: Database, specKeys: string[]): SupersessionRow[];
/**
 * Replace every outgoing relationship for `sourceSpecKey` with exactly the
 * given set (delete then re-insert, in one transaction). Used by the
 * textual/git export's apply path, where a spec's relationships file is the
 * source of truth for that spec's outgoing relationships.
 */
export declare function replaceOutgoingRelationships(db: Database, sourceSpecKey: string, relationships: Array<{
    targetSpecKey: string;
    type: RelationshipType;
}>): void;
export declare function checkDuplicate(db: Database, sourceSpecKey: string, targetSpecKey: string, type: RelationshipType): boolean;
//# sourceMappingURL=relationships.d.ts.map