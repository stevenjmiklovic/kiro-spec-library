import type { Database } from "bun:sqlite";
import type { NormalizedSpec } from "@kiro-spec-library/shared";
export interface SpecRow {
    key: string;
    source_id: string;
    spec_id: string;
    type: string;
    workflow: string;
    title: string;
    owner: string;
    stage: string;
    progress: number;
    repository: string;
    relative_path: string;
    branch: string;
    commit_hash: string;
    is_dirty: number;
    remote_url: string | null;
    total_tasks: number;
    completed_tasks: number;
    content_digest: string;
    indexed_at: string;
}
export interface SpecFilters {
    type?: string;
    stage?: string;
    owner?: string;
    theme?: string;
    repository?: string;
    /** Full-text search term, matched against specs_fts (title/content/owner/theme/tags/repository). */
    query?: string;
    limit: number;
    offset: number;
}
/**
 * Upsert a spec, preserving its rowid across updates (`ON CONFLICT DO UPDATE`
 * rather than `INSERT OR REPLACE`, which deletes+reinserts and would change
 * the rowid). specs_fts is joined to `specs` by matching rowid, so a stable
 * rowid is required for that join — and for `syncSpecFts` below — to stay
 * correct across rescans. Returns the row's rowid for the caller to pass to
 * `syncSpecFts`.
 */
export declare function upsertSpec(db: Database, spec: NormalizedSpec): number;
/**
 * Sync a spec's row into the contentless `specs_fts` table by matching
 * rowid (delete-then-insert — contentless FTS5 tables don't support UPDATE).
 * Call after `upsertSpec` with the rowid it returned.
 */
export declare function syncSpecFts(db: Database, rowid: number, fields: {
    title: string;
    content: string;
    owner: string;
    theme: string;
    tags: string;
    repository: string;
}): void;
export declare function findByKey(db: Database, key: string): SpecRow | null;
export declare function listSpecs(db: Database, filters: SpecFilters): SpecRow[];
export declare function countSpecs(db: Database, filters: Omit<SpecFilters, "limit" | "offset">): number;
//# sourceMappingURL=specs.d.ts.map