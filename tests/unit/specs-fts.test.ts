import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { Database } from "bun:sqlite";
import { createDatabase } from "../../backend/src/db/connection.js";
import { runMigrations } from "../../backend/src/db/migrator.js";
import { putSource } from "../../backend/src/db/queries/sources.js";
import { upsertSpec, syncSpecFts, listSpecs, countSpecs } from "../../backend/src/db/queries/specs.js";
import type { NormalizedSpec } from "../../shared/src/types.js";

let testDir: string;
let db: Database;

function makeSpec(overrides: Partial<NormalizedSpec> = {}): NormalizedSpec {
  return {
    key: "src1::fts-spec",
    sourceId: "src1",
    specId: "fts-spec",
    type: "feature",
    workflow: "requirements-first",
    title: "Retention controls",
    owner: "alice",
    stage: "scoped",
    progress: 50,
    provenance: {
      repository: "test-repo",
      relativePath: ".kiro/specs/fts-spec",
      branch: "main",
      commitHash: "abc123",
      isDirty: false,
    },
    artifacts: { "requirements.md": true, "design.md": false, "tasks.md": false },
    taskCounts: { total: 0, completed: 0 },
    contentDigest: "digest-1",
    indexedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

beforeAll(async () => {
  testDir = mkdtempSync(join(tmpdir(), "specs-fts-test-"));
  db = createDatabase(testDir);
  await runMigrations(db);
  putSource(db, { id: "src1", type: "local", path: "/repos/test", addedAt: new Date().toISOString() });
});

afterAll(() => {
  if (db) db.close();
  rmSync(testDir, { recursive: true, force: true });
});

describe("specs_fts sync and search", () => {
  test("upsertSpec preserves rowid across repeated upserts of the same key", () => {
    const first = upsertSpec(db, makeSpec());
    const second = upsertSpec(db, makeSpec({ title: "Retention controls v2" }));
    expect(second).toBe(first);
  });

  test("syncSpecFts makes a spec findable via listSpecs({ query })", () => {
    const rowid = upsertSpec(db, makeSpec({ key: "src1::fts-findme", specId: "fts-findme" }));
    syncSpecFts(db, rowid, {
      title: "Findme spec",
      content: "This spec documents the widget rendering pipeline.",
      owner: "alice",
      theme: "Platform",
      tags: "widgets rendering",
      repository: "test-repo",
    });

    const results = listSpecs(db, { query: "widget", limit: 10, offset: 0 });
    expect(results.map((s) => s.key)).toContain("src1::fts-findme");

    const count = countSpecs(db, { query: "widget" });
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("resyncing a spec's FTS row replaces its old content (delete-then-insert)", () => {
    const rowid = upsertSpec(db, makeSpec({ key: "src1::fts-resync", specId: "fts-resync" }));
    syncSpecFts(db, rowid, {
      title: "Resync spec",
      content: "alpha content",
      owner: "alice",
      theme: "",
      tags: "",
      repository: "test-repo",
    });
    expect(listSpecs(db, { query: "alpha", limit: 10, offset: 0 }).map((s) => s.key)).toContain(
      "src1::fts-resync",
    );

    syncSpecFts(db, rowid, {
      title: "Resync spec",
      content: "beta content",
      owner: "alice",
      theme: "",
      tags: "",
      repository: "test-repo",
    });
    expect(listSpecs(db, { query: "alpha", limit: 10, offset: 0 }).map((s) => s.key)).not.toContain(
      "src1::fts-resync",
    );
    expect(listSpecs(db, { query: "beta", limit: 10, offset: 0 }).map((s) => s.key)).toContain(
      "src1::fts-resync",
    );
  });

  test("a query containing FTS5-special characters does not throw", () => {
    expect(() => listSpecs(db, { query: 'foo-bar:"baz*', limit: 10, offset: 0 })).not.toThrow();
    expect(() => countSpecs(db, { query: 'foo-bar:"baz*' })).not.toThrow();
  });

  test("query combines with other filters (AND, not OR)", () => {
    const rowid = upsertSpec(
      db,
      makeSpec({ key: "src1::fts-combo", specId: "fts-combo", type: "bugfix" }),
    );
    syncSpecFts(db, rowid, {
      title: "Combo spec",
      content: "combo-only-term",
      owner: "alice",
      theme: "",
      tags: "",
      repository: "test-repo",
    });

    const matchingType = listSpecs(db, { query: "combo-only-term", type: "bugfix", limit: 10, offset: 0 });
    expect(matchingType.map((s) => s.key)).toContain("src1::fts-combo");

    const wrongType = listSpecs(db, { query: "combo-only-term", type: "feature", limit: 10, offset: 0 });
    expect(wrongType.map((s) => s.key)).not.toContain("src1::fts-combo");
  });
});
