import { Database } from "bun:sqlite";
import { join } from "node:path";

/**
 * Creates and configures a SQLite database connection for the spec library.
 *
 * Opens the database at `{dataDir}/spec-library.db` with WAL mode,
 * foreign key enforcement, and startup integrity verification.
 *
 * @param dataDir - Application-owned storage root directory
 * @returns Configured Database instance
 * @throws If the database fails integrity check on startup
 */
export function createDatabase(dataDir: string): Database {
  const dbPath = join(dataDir, "spec-library.db");
  const db = new Database(dbPath, { create: true });

  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  const result = db.query<{ integrity_check: string }, []>(
    "PRAGMA integrity_check"
  ).get();

  if (result?.integrity_check !== "ok") {
    const detail = result?.integrity_check ?? "no result returned";
    db.close();
    throw new Error(
      `Database integrity check failed for "${dbPath}": ${detail}`
    );
  }

  return db;
}

export type { Database };
