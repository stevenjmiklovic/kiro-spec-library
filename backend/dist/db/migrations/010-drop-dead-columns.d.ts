import type { Database } from 'bun:sqlite';
/**
 * Drops columns/tables confirmed fully unused (docs/known-issues.md's
 * "Dead columns / tables / exports" section): never written by any query,
 * never read by any route/UI, and — for the two legal-hold-related columns
 * on snapshots/metadata_overlays — superseded by the `supersedes`
 * relationship graph per ADR-005 (whose UI/API-layer code was removed in
 * an earlier migration on this branch).
 */
export declare const migration: {
    number: number;
    name: string;
    up(db: Database): void;
};
//# sourceMappingURL=010-drop-dead-columns.d.ts.map