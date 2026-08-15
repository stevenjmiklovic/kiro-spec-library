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
    limit: number;
    offset: number;
}
export declare function upsertSpec(db: Database, spec: NormalizedSpec): void;
export declare function findByKey(db: Database, key: string): SpecRow | null;
export declare function listSpecs(db: Database, filters: SpecFilters): SpecRow[];
export declare function searchSpecs(db: Database, query: string, limit: number): SpecRow[];
export declare function countSpecs(db: Database, filters: Omit<SpecFilters, "limit" | "offset">): number;
//# sourceMappingURL=specs.d.ts.map