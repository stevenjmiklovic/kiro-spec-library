import type { Database } from "bun:sqlite";
import type { Source } from "@kiro-spec-library/shared";
export interface SourceRow {
    id: string;
    type: string;
    path: string | null;
    url: string | null;
    branch: string | null;
    web_url_template: string | null;
    added_at: string;
}
export declare function listSources(db: Database): Source[];
export declare function putSource(db: Database, source: {
    id: string;
    type: "local" | "remote";
    path?: string | null;
    url?: string | null;
    branch?: string | null;
    webUrlTemplate?: string | null;
    addedAt: string;
}): void;
export declare function deleteSource(db: Database, id: string): void;
/**
 * Replace the ENTIRE source set with `sources`, atomically. The UI's
 * `Save & rescan` promises "Saving replaces the entire source list", so a
 * source the user removed in the panel must actually disappear from the DB —
 * an upsert-only PUT left removed sources behind. Runs in a transaction so a
 * mid-write failure can't leave a half-applied set.
 */
export declare function replaceSources(db: Database, sources: Array<{
    id: string;
    type: "local" | "remote";
    path?: string | null;
    url?: string | null;
    branch?: string | null;
    webUrlTemplate?: string | null;
    addedAt: string;
}>): void;
//# sourceMappingURL=sources.d.ts.map