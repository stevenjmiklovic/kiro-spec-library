import type { Database } from "bun:sqlite";

interface Migration {
  number: number;
  name: string;
  up(db: Database): void;
}

import { migration as migration001 } from "./migrations/001-core-tables.js";
import { migration as migration002 } from "./migrations/002-fts5-indexes.js";
import { migration as migration003 } from "./migrations/003-performance-indexes.js";
import { migration as migration004 } from "./migrations/004-proposals-table.js";
import { migration as migration005 } from "./migrations/005-schema-improvements.js";
import { migration as migration006 } from "./migrations/006-proposals-rationale-source.js";
import { migration as migration007 } from "./migrations/007-lifecycle-stage-rename.js";
import { migration as migration008 } from "./migrations/008-metadata-reviewed-at.js";
import { migration as migration009 } from "./migrations/009-metadata-schema-completion.js";
import { migration as migration010 } from "./migrations/010-drop-dead-columns.js";

const migrations: Migration[] = [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005,
  migration006,
  migration007,
  migration008,
  migration009,
  migration010,
].sort((a, b) => a.number - b.number);

export async function runMigrations(db: Database): Promise<void> {
  db.run(`
    CREATE TABLE IF NOT EXISTS _migrations (
      number INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);

  const applied = new Set(
    db
      .query<{ number: number }, []>("SELECT number FROM _migrations")
      .all()
      .map((row) => row.number)
  );

  for (const migration of migrations) {
    if (applied.has(migration.number)) {
      continue;
    }

    try {
      db.run("BEGIN");
      migration.up(db);
      db.run(
        "INSERT INTO _migrations (number, name, applied_at) VALUES (?, ?, ?)",
        [migration.number, migration.name, new Date().toISOString()]
      );
      db.run("COMMIT");
      console.log(
        `[migrator] Applied migration ${migration.number}: ${migration.name}`
      );
    } catch (error) {
      db.run("ROLLBACK");
      console.error(
        `[migrator] Failed migration ${migration.number}: ${migration.name}`,
        error
      );
      throw error;
    }
  }
}
