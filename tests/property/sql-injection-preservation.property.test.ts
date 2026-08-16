/**
 * Property-based tests — Property 2: Preservation
 *
 * Query Results Unchanged for All Inputs
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 *
 * For any call to `listBySourceKeys` or `listPendingBySourceKeys` with any input
 * (empty or non-empty array), the function returns the correct set of rows,
 * preserving the filtering semantics, row shape, and empty-array short-circuit.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import fc from "fast-check";
import { Database } from "bun:sqlite";
import { listBySourceKeys } from "../../backend/src/db/queries/relationships.js";
import { listPendingBySourceKeys } from "../../backend/src/db/queries/suggestions.js";

// ─── Test Infrastructure ─────────────────────────────────────────────────────

let db: Database;

/** Spec keys seeded into the database. */
const SEEDED_SPEC_KEYS = [
  "src1::spec-alpha",
  "src1::spec-beta",
  "src1::spec-gamma",
  "src1::spec-delta",
  "src1::spec-epsilon",
  "src1::spec-zeta",
  "src1::spec-eta",
  "src1::spec-theta",
  "src1::spec-iota",
  "src1::spec-kappa",
];

/** Spec keys used as targets for relationships/suggestions (never as source). */
const TARGET_SPEC_KEYS = [
  "src1::target-one",
  "src1::target-two",
  "src1::target-three",
];

/** All spec keys that exist in the database. */
const ALL_SPEC_KEYS = [...SEEDED_SPEC_KEYS, ...TARGET_SPEC_KEYS];

/** Pre-computed relationships: source_spec_key -> relationship rows */
const SEEDED_RELATIONSHIPS: Array<{
  id: string;
  source_spec_key: string;
  target_spec_key: string;
  type: string;
  created_at: string;
}> = [];

/** Pre-computed suggestions (pending): source_spec_key -> suggestion rows */
const SEEDED_PENDING_SUGGESTIONS: Array<{
  id: string;
  source_spec_key: string;
  target_spec_key: string;
  type: string;
  confidence: number;
  reason: string;
  evidence: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  data_hash: string;
}> = [];

/** Non-pending suggestions (should NOT be returned by listPendingBySourceKeys). */
const SEEDED_NON_PENDING_SUGGESTIONS: typeof SEEDED_PENDING_SUGGESTIONS = [];

function createMinimalSchema(database: Database): void {
  database.exec("PRAGMA foreign_keys = ON");

  // Create minimal tables needed for the queries
  database.exec(`
    CREATE TABLE sources (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('local', 'remote')),
      path TEXT,
      url TEXT,
      branch TEXT,
      web_url_template TEXT,
      added_at TEXT NOT NULL,
      last_scan_at TEXT,
      last_error TEXT,
      last_error_at TEXT
    );

    CREATE TABLE specs (
      key TEXT PRIMARY KEY,
      source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
      spec_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('feature', 'bugfix', 'quick', 'unknown')),
      workflow TEXT NOT NULL CHECK (workflow IN ('requirements-first', 'design-first', 'unknown')),
      title TEXT NOT NULL,
      owner TEXT NOT NULL DEFAULT 'unowned',
      stage TEXT NOT NULL CHECK (stage IN ('requirements', 'bug_analysis', 'design', 'tasks', 'completed')),
      progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
      repository TEXT NOT NULL,
      relative_path TEXT NOT NULL,
      branch TEXT NOT NULL,
      commit_hash TEXT NOT NULL,
      is_dirty INTEGER NOT NULL DEFAULT 0,
      remote_url TEXT,
      total_tasks INTEGER NOT NULL DEFAULT 0,
      completed_tasks INTEGER NOT NULL DEFAULT 0,
      content_digest TEXT NOT NULL,
      indexed_at TEXT NOT NULL,
      UNIQUE(source_id, spec_id)
    );

    CREATE TABLE relationships (
      id TEXT PRIMARY KEY,
      source_spec_key TEXT NOT NULL REFERENCES specs(key) ON DELETE CASCADE,
      target_spec_key TEXT NOT NULL REFERENCES specs(key) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('depends_on', 'blocks', 'supersedes', 'duplicates', 'related')),
      created_at TEXT NOT NULL,
      UNIQUE(source_spec_key, target_spec_key, type)
    );

    CREATE TABLE suggestions (
      id TEXT PRIMARY KEY,
      source_spec_key TEXT NOT NULL REFERENCES specs(key) ON DELETE CASCADE,
      target_spec_key TEXT NOT NULL REFERENCES specs(key) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('depends_on', 'blocks', 'supersedes', 'duplicates', 'related')),
      confidence REAL NOT NULL,
      reason TEXT NOT NULL,
      evidence TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      data_hash TEXT NOT NULL
    );
  `);
}

function seedData(database: Database): void {
  // Insert source
  database.exec(`
    INSERT INTO sources (id, type, path, added_at)
    VALUES ('src1', 'local', '/repos/test', '2026-01-01T00:00:00Z')
  `);

  // Insert all spec records
  const insertSpec = database.prepare(`
    INSERT INTO specs (key, source_id, spec_id, type, workflow, title, owner, stage,
      progress, repository, relative_path, branch, commit_hash, content_digest, indexed_at)
    VALUES (?, 'src1', ?, 'feature', 'requirements-first', ?, 'tester', 'completed',
      100, '/repos/test', '.kiro/specs/test', 'main', 'abc123', 'digest', '2026-01-01T00:00:00Z')
  `);

  for (const key of ALL_SPEC_KEYS) {
    const specId = key.split("::")[1];
    insertSpec.run(key, specId, `Title for ${specId}`);
  }

  // Seed relationships: each source key gets 1-2 relationships to target keys
  const insertRel = database.prepare(`
    INSERT INTO relationships (id, source_spec_key, target_spec_key, type, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const relTypes = ["depends_on", "blocks", "related", "supersedes", "duplicates"];
  let relCounter = 0;

  for (let i = 0; i < SEEDED_SPEC_KEYS.length; i++) {
    const sourceKey = SEEDED_SPEC_KEYS[i];
    // Each source spec gets a relationship to 1 or 2 targets
    const targetCount = (i % 2) + 1;
    for (let t = 0; t < targetCount; t++) {
      const targetKey = TARGET_SPEC_KEYS[t % TARGET_SPEC_KEYS.length];
      const relType = relTypes[relCounter % relTypes.length];
      const rel = {
        id: `rel-${relCounter}`,
        source_spec_key: sourceKey,
        target_spec_key: targetKey,
        type: relType,
        created_at: `2026-01-${String(relCounter + 1).padStart(2, "0")}T00:00:00Z`,
      };
      insertRel.run(rel.id, rel.source_spec_key, rel.target_spec_key, rel.type, rel.created_at);
      SEEDED_RELATIONSHIPS.push(rel);
      relCounter++;
    }
  }

  // Seed suggestions: mix of pending and non-pending
  const insertSuggestion = database.prepare(`
    INSERT INTO suggestions (id, source_spec_key, target_spec_key, type, confidence,
      reason, evidence, status, created_at, resolved_at, data_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let sugCounter = 0;
  for (let i = 0; i < SEEDED_SPEC_KEYS.length; i++) {
    const sourceKey = SEEDED_SPEC_KEYS[i];
    const targetKey = TARGET_SPEC_KEYS[i % TARGET_SPEC_KEYS.length];
    const relType = relTypes[sugCounter % relTypes.length];
    const status = i < 7 ? "pending" : i < 9 ? "accepted" : "rejected";
    const sug = {
      id: `sug-${sugCounter}`,
      source_spec_key: sourceKey,
      target_spec_key: targetKey,
      type: relType,
      confidence: 0.8 - i * 0.05,
      reason: "keyword_overlap",
      evidence: `Evidence for suggestion ${sugCounter}`,
      status,
      created_at: `2026-02-${String(sugCounter + 1).padStart(2, "0")}T00:00:00Z`,
      resolved_at: status !== "pending" ? `2026-02-${String(sugCounter + 10).padStart(2, "0")}T00:00:00Z` : null,
      data_hash: `hash-${sugCounter}`,
    };
    insertSuggestion.run(
      sug.id, sug.source_spec_key, sug.target_spec_key, sug.type,
      sug.confidence, sug.reason, sug.evidence, sug.status,
      sug.created_at, sug.resolved_at, sug.data_hash,
    );
    if (status === "pending") {
      SEEDED_PENDING_SUGGESTIONS.push(sug);
    } else {
      SEEDED_NON_PENDING_SUGGESTIONS.push(sug);
    }
    sugCounter++;
  }
}

beforeAll(() => {
  db = new Database(":memory:");
  createMinimalSchema(db);
  seedData(db);
});

afterAll(() => {
  db.close();
});

// ─── Property 2: Preservation — Query Results Unchanged ──────────────────────

describe("Property 2: Preservation — Query Results Unchanged", () => {
  /**
   * **Validates: Requirements 3.1, 3.2**
   *
   * For all non-empty subsets of seeded spec keys, `listBySourceKeys` returns
   * exactly the rows whose `source_spec_key` is in the input array.
   */
  test("listBySourceKeys returns exactly matching relationship rows for any non-empty subset of keys", () => {
    fc.assert(
      fc.property(
        fc.shuffledSubarray(SEEDED_SPEC_KEYS, { minLength: 1 }),
        (selectedKeys) => {
          const result = listBySourceKeys(db, selectedKeys);

          // Compute expected: all relationships whose source is in selectedKeys
          const expectedIds = SEEDED_RELATIONSHIPS
            .filter((r) => selectedKeys.includes(r.source_spec_key))
            .map((r) => r.id)
            .sort();

          const actualIds = result.map((r) => r.id).sort();

          expect(actualIds).toEqual(expectedIds);

          // Verify row shape: every returned row has the expected properties
          for (const row of result) {
            expect(row).toHaveProperty("id");
            expect(row).toHaveProperty("source_spec_key");
            expect(row).toHaveProperty("target_spec_key");
            expect(row).toHaveProperty("type");
            expect(row).toHaveProperty("created_at");
            // Verify all returned rows have their source_spec_key in the input
            expect(selectedKeys).toContain(row.source_spec_key);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 3.3, 3.4**
   *
   * For all non-empty subsets of seeded spec keys, `listPendingBySourceKeys` returns
   * exactly the rows with `status = 'pending'` whose `source_spec_key` is in the input array.
   */
  test("listPendingBySourceKeys returns exactly matching pending suggestion rows for any non-empty subset of keys", () => {
    fc.assert(
      fc.property(
        fc.shuffledSubarray(SEEDED_SPEC_KEYS, { minLength: 1 }),
        (selectedKeys) => {
          const result = listPendingBySourceKeys(db, selectedKeys);

          // Compute expected: all pending suggestions whose source is in selectedKeys
          const expectedIds = SEEDED_PENDING_SUGGESTIONS
            .filter((s) => selectedKeys.includes(s.source_spec_key))
            .map((s) => s.id)
            .sort();

          const actualIds = result.map((s) => s.id).sort();

          expect(actualIds).toEqual(expectedIds);

          // Verify row shape and status filter
          for (const row of result) {
            expect(row).toHaveProperty("id");
            expect(row).toHaveProperty("source_spec_key");
            expect(row).toHaveProperty("target_spec_key");
            expect(row).toHaveProperty("type");
            expect(row).toHaveProperty("confidence");
            expect(row).toHaveProperty("reason");
            expect(row).toHaveProperty("evidence");
            expect(row).toHaveProperty("status");
            expect(row).toHaveProperty("created_at");
            expect(row).toHaveProperty("data_hash");
            expect(row.status).toBe("pending");
            expect(selectedKeys).toContain(row.source_spec_key);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 3.2, 3.4**
   *
   * For empty arrays, both functions return `[]` immediately.
   */
  test("both functions return empty array for empty input", () => {
    fc.assert(
      fc.property(
        fc.constant([]),
        (emptyArray: string[]) => {
          const relationships = listBySourceKeys(db, emptyArray);
          expect(relationships).toEqual([]);

          const suggestions = listPendingBySourceKeys(db, emptyArray);
          expect(suggestions).toEqual([]);
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * **Validates: Requirements 3.1, 3.3, 3.5**
   *
   * Keys containing SQL metacharacters are handled safely and return correct results.
   * These keys don't match any seeded data, so should return empty arrays.
   */
  test("keys containing SQL metacharacters are handled safely", () => {
    // Arbitrary for keys with SQL metacharacters
    const sqlMetacharArbitrary = fc.tuple(
      fc.constantFrom("'", '"', ";", "--", "' OR '1'='1", "'; DROP TABLE", "/*", "*/"),
      fc.string({ minLength: 0, maxLength: 10 }),
    ).map(([meta, suffix]) => `key-${meta}${suffix}`);

    fc.assert(
      fc.property(
        fc.array(sqlMetacharArbitrary, { minLength: 1, maxLength: 10 }),
        (metaKeys) => {
          // These keys don't exist in the database, so both functions should
          // return empty arrays without errors (no SQL injection)
          const relationships = listBySourceKeys(db, metaKeys);
          expect(relationships).toEqual([]);

          const suggestions = listPendingBySourceKeys(db, metaKeys);
          expect(suggestions).toEqual([]);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 3.1, 3.3**
   *
   * Mixing valid seeded keys with non-existent keys returns only rows for the valid keys.
   */
  test("mixing valid and non-existent keys returns only rows for valid keys", () => {
    fc.assert(
      fc.property(
        fc.shuffledSubarray(SEEDED_SPEC_KEYS, { minLength: 1, maxLength: 5 }),
        fc.array(
          fc.string({ minLength: 5, maxLength: 20 }).map((s) => `nonexist::${s}`),
          { minLength: 1, maxLength: 5 },
        ),
        (validKeys, fakeKeys) => {
          const mixedKeys = [...validKeys, ...fakeKeys];

          const relationships = listBySourceKeys(db, mixedKeys);
          const expectedRelIds = SEEDED_RELATIONSHIPS
            .filter((r) => validKeys.includes(r.source_spec_key))
            .map((r) => r.id)
            .sort();
          expect(relationships.map((r) => r.id).sort()).toEqual(expectedRelIds);

          const suggestions = listPendingBySourceKeys(db, mixedKeys);
          const expectedSugIds = SEEDED_PENDING_SUGGESTIONS
            .filter((s) => validKeys.includes(s.source_spec_key))
            .map((s) => s.id)
            .sort();
          expect(suggestions.map((s) => s.id).sort()).toEqual(expectedSugIds);
        },
      ),
      { numRuns: 100 },
    );
  });
});
