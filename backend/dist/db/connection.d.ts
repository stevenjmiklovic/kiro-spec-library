import { Database } from "bun:sqlite";
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
export declare function createDatabase(dataDir: string): Database;
export type { Database };
//# sourceMappingURL=connection.d.ts.map