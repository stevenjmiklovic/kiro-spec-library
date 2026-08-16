// Single-file database backup/restore (whole-DB disaster recovery).
import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runMigrations } from "../db/migrator.js";

export const DB_FILENAME = "spec-library.db";
const SAFETY_BACKUP_PREFIX = "pre-restore-";
const MAX_SAFETY_BACKUPS = 5;

export class InvalidBackupError extends Error {
  readonly code = "INVALID_BACKUP";
}

/**
 * Serialize a database to bytes that can actually be reopened later.
 *
 * `Database.serialize()` on a connection in WAL journal mode (this app's
 * default, see db/connection.ts) produces bytes that throw `SQLITE_CANTOPEN`
 * on the very first query after deserializing them — a bun:sqlite/WAL
 * interaction, not something specific to this schema. Serializing is
 * synchronous and this app is single-threaded, so briefly switching journal
 * modes around the call is safe: nothing else runs on this connection
 * in between.
 */
function serializeForPortability(db: Database): Uint8Array {
  const mode = db.query<{ journal_mode: string }, []>("PRAGMA journal_mode").get()?.journal_mode;
  if (mode?.toLowerCase() !== "wal") {
    return db.serialize();
  }
  db.exec("PRAGMA journal_mode = DELETE");
  try {
    return db.serialize();
  } finally {
    db.exec("PRAGMA journal_mode = WAL");
  }
}

/** Serialize the live database to bytes, suitable for download. */
export function createBackupBuffer(db: Database): Uint8Array {
  return serializeForPortability(db);
}

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
export async function restoreFromBackup(
  db: Database,
  dataDir: string,
  uploaded: Uint8Array,
): Promise<RestoreResult> {
  const header = new TextDecoder().decode(uploaded.slice(0, 16));
  if (!header.startsWith("SQLite format 3")) {
    throw new InvalidBackupError("Uploaded file is not a SQLite database.");
  }

  let tempDb: Database;
  try {
    tempDb = Database.deserialize(uploaded);
  } catch {
    throw new InvalidBackupError("Uploaded file could not be read as a SQLite database.");
  }

  let migratedBytes: Uint8Array;
  try {
    let tables: Set<string>;
    try {
      tables = new Set(
        tempDb
          .query<{ name: string }, []>("SELECT name FROM sqlite_master WHERE type = 'table'")
          .all()
          .map((row) => row.name),
      );
    } catch (err) {
      // A raw copy of a database file taken while it was open in WAL journal
      // mode carries that mode into the copy, and SQLite can't reopen such a
      // copy standalone (SQLITE_CANTOPEN on the very first query) — the same
      // reason createBackupBuffer() switches journal modes before serializing.
      if (err instanceof Error && "code" in err && err.code === "SQLITE_CANTOPEN") {
        throw new InvalidBackupError(
          "Uploaded file looks like a raw copy of a database taken while it was open (WAL journal mode), which can't be read directly. Use the app's \"Download backup\" feature to produce a restorable file instead of copying the database file directly.",
        );
      }
      throw err;
    }
    if (!tables.has("specs") || !tables.has("metadata_overlays")) {
      throw new InvalidBackupError(
        "Uploaded file doesn't look like a Spec Library backup (missing expected tables).",
      );
    }

    await runMigrations(tempDb);
    migratedBytes = tempDb.serialize();
  } finally {
    tempDb.close();
  }

  // Safety copy of the CURRENT live database, taken via the same consistent
  // serialize() mechanism, before we overwrite anything on disk.
  const safetyDir = join(dataDir, "backups");
  mkdirSync(safetyDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const safetyBackupPath = join(safetyDir, `${SAFETY_BACKUP_PREFIX}${timestamp}.db`);
  writeFileSync(safetyBackupPath, serializeForPortability(db));
  pruneOldSafetyBackups(safetyDir);

  // Remove WAL sidecars so the next process start doesn't try to replay
  // stale WAL frames against the freshly-written main file.
  const dbPath = join(dataDir, DB_FILENAME);
  for (const suffix of ["-wal", "-shm"]) {
    const sidecar = `${dbPath}${suffix}`;
    if (existsSync(sidecar)) rmSync(sidecar, { force: true });
  }

  writeFileSync(dbPath, migratedBytes);

  return { safetyBackupPath };
}

function pruneOldSafetyBackups(safetyDir: string): void {
  const files = readdirSync(safetyDir)
    .filter((f) => f.startsWith(SAFETY_BACKUP_PREFIX) && f.endsWith(".db"))
    .sort();
  const excess = files.length - MAX_SAFETY_BACKUPS;
  for (let i = 0; i < excess; i++) {
    rmSync(join(safetyDir, files[i]!), { force: true });
  }
}
