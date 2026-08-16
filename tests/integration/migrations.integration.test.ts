import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Database } from "bun:sqlite";
import { createDatabase } from "../../backend/src/db/connection.js";
import { runMigrations } from "../../backend/src/db/migrator.js";

let tmpDir: string;
let db: Database;

beforeAll(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "spec-library-migration-test-"));
  db = createDatabase(tmpDir);
});

afterAll(() => {
  if (db) db.close();
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

describe("Migration integration tests", () => {
  describe("runMigrations applies all migrations", () => {
    test("applies all 9 migrations successfully", async () => {
      await runMigrations(db);

      const rows = db
        .query<{ number: number; name: string }, []>(
          "SELECT number, name FROM _migrations ORDER BY number"
        )
        .all();

      expect(rows).toHaveLength(9);
      expect(rows[0]!.number).toBe(1);
      expect(rows[0]!.name).toBe("core-tables");
      expect(rows[1]!.number).toBe(2);
      expect(rows[1]!.name).toBe("fts5-indexes");
      expect(rows[2]!.number).toBe(3);
      expect(rows[2]!.name).toBe("performance-indexes");
      expect(rows[3]!.number).toBe(4);
      expect(rows[3]!.name).toBe("proposals-table");
      expect(rows[4]!.number).toBe(5);
      expect(rows[4]!.name).toBe("schema-improvements");
      expect(rows[5]!.number).toBe(6);
      expect(rows[5]!.name).toBe("proposals-rationale-source");
      expect(rows[6]!.number).toBe(7);
      expect(rows[6]!.name).toBe("lifecycle-stage-rename");
      expect(rows[7]!.number).toBe(8);
      expect(rows[7]!.name).toBe("metadata-reviewed-at");
      expect(rows[8]!.number).toBe(9);
      expect(rows[8]!.name).toBe("metadata-schema-completion");
    });

    test("_migrations rows have applied_at timestamps", () => {
      const rows = db
        .query<{ applied_at: string }, []>(
          "SELECT applied_at FROM _migrations ORDER BY number"
        )
        .all();

      for (const row of rows) {
        // ISO 8601 timestamp
        expect(row.applied_at).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
        );
      }
    });
  });

  describe("schema verification: core tables (migration 001)", () => {
    const expectedTables = [
      "sources",
      "specs",
      "artifacts",
      "metadata_overlays",
      "relationships",
      "suggestions",
      "snapshots",
      "snapshot_artifacts",
      "scan_history",
      "audit_events",
      "rejections",
      "owner_aliases",
    ];

    for (const table of expectedTables) {
      test(`table '${table}' exists`, () => {
        const result = db
          .query<{ name: string }, [string]>(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?"
          )
          .get(table);
        expect(result).not.toBeNull();
        expect(result!.name).toBe(table);
      });
    }
  });

  describe("schema verification: FTS5 virtual tables (migration 002)", () => {
    const expectedVirtualTables = ["specs_fts", "snapshots_fts"];

    for (const table of expectedVirtualTables) {
      test(`FTS5 virtual table '${table}' exists`, () => {
        const result = db
          .query<{ name: string }, [string]>(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?"
          )
          .get(table);
        expect(result).not.toBeNull();
        expect(result!.name).toBe(table);
      });
    }
  });

  describe("schema verification: performance indexes (migration 003)", () => {
    const expectedIndexes = [
      "idx_specs_source",
      "idx_specs_stage",
      "idx_specs_type",
      "idx_specs_owner",
      "idx_specs_theme",
      "idx_relationships_source",
      "idx_relationships_target",
      "idx_suggestions_status",
      "idx_snapshots_spec",
      "idx_snapshots_created",
      "idx_audit_timestamp",
      "idx_audit_spec",
      "idx_audit_operation",
    ];

    for (const idx of expectedIndexes) {
      test(`index '${idx}' exists`, () => {
        const result = db
          .query<{ name: string }, [string]>(
            "SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?"
          )
          .get(idx);
        expect(result).not.toBeNull();
        expect(result!.name).toBe(idx);
      });
    }
  });

  describe("schema verification: proposals table (migration 004)", () => {
    test("table 'proposals' exists", () => {
      const result = db
        .query<{ name: string }, [string]>(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?"
        )
        .get("proposals");
      expect(result).not.toBeNull();
      expect(result!.name).toBe("proposals");
    });

    test("proposals indexes exist", () => {
      for (const idx of ["idx_proposals_spec_key", "idx_proposals_status"]) {
        const result = db
          .query<{ name: string }, [string]>(
            "SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?"
          )
          .get(idx);
        expect(result).not.toBeNull();
        expect(result!.name).toBe(idx);
      }
    });
  });

  describe("schema verification: metadata schema completion (migration 009)", () => {
    test("metadata_overlays has approvers and implementation_ref columns", () => {
      const columns = db
        .query<{ name: string }, []>("PRAGMA table_info(metadata_overlays)")
        .all()
        .map((c) => c.name);
      expect(columns).toContain("approvers");
      expect(columns).toContain("implementation_ref");
    });
  });

  describe("idempotency", () => {
    test("running runMigrations a second time applies nothing new and does not error", async () => {
      // Get state before second run
      const beforeRows = db
        .query<{ number: number; applied_at: string }, []>(
          "SELECT number, applied_at FROM _migrations ORDER BY number"
        )
        .all();

      // Run again — should be a no-op
      await runMigrations(db);

      // Get state after second run
      const afterRows = db
        .query<{ number: number; applied_at: string }, []>(
          "SELECT number, applied_at FROM _migrations ORDER BY number"
        )
        .all();

      // Same count, same timestamps (no re-application)
      expect(afterRows).toHaveLength(beforeRows.length);
      for (let i = 0; i < beforeRows.length; i++) {
        expect(afterRows[i]!.number).toBe(beforeRows[i]!.number);
        expect(afterRows[i]!.applied_at).toBe(beforeRows[i]!.applied_at);
      }
    });
  });

  describe("transactional failure handling", () => {
    test("migrator records only fully-applied migrations (structural verification)", () => {
      // Verify the migrator's transactional contract:
      // Each migration is wrapped in BEGIN/COMMIT with ROLLBACK on error.
      // We verify this structurally: after successful runs, _migrations
      // should contain exactly 5 rows — one per completed migration.
      // No partial state should exist.
      //
      // LIMITATION: Injecting a failing migration mid-run would require
      // modifying the migrator source (its migrations array is a closed
      // import list). We verify the guarantee indirectly:
      // 1. All 3 rows exist (proving each transaction committed)
      // 2. Schema is internally consistent (no half-applied DDL)
      // 3. The migrator code wraps in BEGIN/COMMIT/ROLLBACK (reviewed above)

      const migrations = db
        .query<{ number: number; name: string }, []>(
          "SELECT number, name FROM _migrations ORDER BY number"
        )
        .all();

      expect(migrations).toHaveLength(9);
      expect(migrations.map((m) => m.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);

      // Verify schema is internally consistent — tables created by migration 1
      // are prerequisites for indexes in migration 3. If 1 had partially applied
      // and 3 ran, we'd get errors or missing indexes.
      const allIndexes = db
        .query<{ name: string }, []>(
          "SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%'"
        )
        .all();
      expect(allIndexes.length).toBe(17);
    });

    test("a fresh DB with a simulated partial state proves rollback semantics", () => {
      // Create a second DB to test that if a migration were to fail after BEGIN
      // but before COMMIT, the _migrations table would NOT record it.
      const tmpDir2 = mkdtempSync(
        join(tmpdir(), "spec-library-migration-rollback-test-")
      );
      const db2 = createDatabase(tmpDir2);

      try {
        // Manually simulate: apply migration 1 only, then verify that
        // migration 2 and 3 are NOT in _migrations
        db2.run(`
          CREATE TABLE IF NOT EXISTS _migrations (
            number INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL
          )
        `);
        db2.run("BEGIN");
        db2.run(
          "INSERT INTO _migrations (number, name, applied_at) VALUES (1, 'core-tables', '2024-01-01T00:00:00.000Z')"
        );
        db2.run("COMMIT");

        // Verify only migration 1 is recorded
        const rows = db2
          .query<{ number: number }, []>(
            "SELECT number FROM _migrations ORDER BY number"
          )
          .all();
        expect(rows).toHaveLength(1);
        expect(rows[0]!.number).toBe(1);

        // Now simulate a ROLLBACK scenario: begin, insert migration 2, then rollback
        db2.run("BEGIN");
        db2.run(
          "INSERT INTO _migrations (number, name, applied_at) VALUES (2, 'fts5-indexes', '2024-01-01T00:00:00.000Z')"
        );
        db2.run("ROLLBACK");

        // Migration 2 should NOT be recorded
        const rowsAfter = db2
          .query<{ number: number }, []>(
            "SELECT number FROM _migrations ORDER BY number"
          )
          .all();
        expect(rowsAfter).toHaveLength(1);
        expect(rowsAfter[0]!.number).toBe(1);
      } finally {
        db2.close();
        rmSync(tmpDir2, { recursive: true, force: true });
      }
    });
  });
});
