import { migration as migration001 } from "./migrations/001-core-tables.js";
import { migration as migration002 } from "./migrations/002-fts5-indexes.js";
import { migration as migration003 } from "./migrations/003-performance-indexes.js";
import { migration as migration004 } from "./migrations/004-proposals-table.js";
import { migration as migration005 } from "./migrations/005-schema-improvements.js";
import { migration as migration006 } from "./migrations/006-proposals-rationale-source.js";
const migrations = [
    migration001,
    migration002,
    migration003,
    migration004,
    migration005,
    migration006,
].sort((a, b) => a.number - b.number);
export async function runMigrations(db) {
    db.run(`
    CREATE TABLE IF NOT EXISTS _migrations (
      number INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);
    const applied = new Set(db
        .query("SELECT number FROM _migrations")
        .all()
        .map((row) => row.number));
    for (const migration of migrations) {
        if (applied.has(migration.number)) {
            continue;
        }
        try {
            db.run("BEGIN");
            migration.up(db);
            db.run("INSERT INTO _migrations (number, name, applied_at) VALUES (?, ?, ?)", [migration.number, migration.name, new Date().toISOString()]);
            db.run("COMMIT");
            console.log(`[migrator] Applied migration ${migration.number}: ${migration.name}`);
        }
        catch (error) {
            db.run("ROLLBACK");
            console.error(`[migrator] Failed migration ${migration.number}: ${migration.name}`, error);
            throw error;
        }
    }
}
