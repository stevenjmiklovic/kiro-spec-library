import { Database } from "bun:sqlite";
export declare const DB_FILENAME = "spec-library.db";
export declare class InvalidBackupError extends Error {
    readonly code = "INVALID_BACKUP";
}
/** Serialize the live database to bytes, suitable for download. */
export declare function createBackupBuffer(db: Database): Uint8Array;
export interface RestoreResult {
    /** Absolute path of the safety copy taken of the live database before overwriting it. */
    safetyBackupPath: string;
}
/**
 * Validate an uploaded backup, bring it up to the current schema, and write
 * it to the live database file path.
 *
 * The currently-running process keeps its already-open handle to the OLD
 * file content (standard POSIX semantics: replacing a path doesn't affect
 * processes with the file already open) — this only prepares what the
 * backend will load on its NEXT start, so a restart is required for the
 * restored data to take effect. That's a deliberate simplification: the live
 * `Database` handle is threaded by reference into every route/service
 * closure at startup, so hot-swapping it in place would require a much more
 * invasive indirection layer across the whole backend for a rarely-used,
 * inherently-disruptive operation.
 */
export declare function restoreFromBackup(db: Database, dataDir: string, uploaded: Uint8Array): Promise<RestoreResult>;
//# sourceMappingURL=backup.d.ts.map