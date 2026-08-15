import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ArchiverService } from "../../backend/src/services/archiver.js";
import { createDatabase } from "../../backend/src/db/connection.js";
import { runMigrations } from "../../backend/src/db/migrator.js";
import { putSource } from "../../backend/src/db/queries/sources.js";
import { upsertSpec } from "../../backend/src/db/queries/specs.js";
import type { NormalizedSpec } from "../../shared/src/types.js";
import type { ResolvedMetadata } from "../../backend/src/services/metadata.js";
import type { Database } from "bun:sqlite";

let testDir: string;
let archiveDir: string;
let db: Database;
let archiver: ArchiverService;

function makeCompletedSpec(key: string = "src1::my-spec"): NormalizedSpec {
  return {
    key,
    sourceId: "src1",
    specId: "my-spec",
    type: "feature",
    workflow: "requirements-first",
    title: "My Feature",
    owner: "alice",
    stage: "completed",
    progress: 100,
    provenance: {
      repository: "/repos/test",
      relativePath: ".kiro/specs/my-spec",
      branch: "main",
      commitHash: "abc123def",
      isDirty: false,
    },
    artifacts: { "requirements.md": true, "design.md": true, "tasks.md": true },
    taskCounts: { total: 5, completed: 5 },
    contentDigest: "deadbeef",
    indexedAt: "2026-01-01T00:00:00Z",
  };
}

function makeMeta(): ResolvedMetadata {
  return {
    title: "My Feature",
    owner: "alice",
    theme: "Infrastructure",
    tags: ["backend", "api"],
    approvers: [],
    retentionPolicy: { type: "project_lifetime" },
  };
}

const artifacts = [
  { name: "requirements.md", content: "# My Feature\n\nRequirements here." },
  { name: "design.md", content: "# Design\n\nArchitecture decisions." },
  { name: "tasks.md", content: "- [x] task1\n- [x] task2\n- [x] task3\n- [x] task4\n- [x] task5" },
];

beforeAll(() => {
  testDir = mkdtempSync(join(tmpdir(), "archiver-test-"));
  archiveDir = join(testDir, "archive");
  db = createDatabase(testDir);
  runMigrations(db);

  // Insert a source and spec so FK constraints pass
  putSource(db, {
    id: "src1",
    type: "local",
    path: "/repos/test",
    addedAt: "2026-01-01T00:00:00Z",
  });
  upsertSpec(db, makeCompletedSpec());

  archiver = new ArchiverService(db, { archiveDir });
});

afterAll(() => {
  db.close();
  rmSync(testDir, { recursive: true, force: true });
});

describe("ArchiverService", () => {
  describe("maybeCreateSnapshot", () => {
    test("creates snapshot for newly completed spec", async () => {
      const spec = makeCompletedSpec();
      const snapshot = await archiver.maybeCreateSnapshot(spec, makeMeta(), artifacts);
      expect(snapshot).not.toBeNull();
      expect(snapshot!.specKey).toBe("src1::my-spec");
      expect(snapshot!.contentDigest).toBeTruthy();
      expect(snapshot!.artifacts.length).toBe(3);
    });

    test("duplicate digest detection (no re-archive)", async () => {
      const spec = makeCompletedSpec();
      // Second call with same content should return null
      const snapshot = await archiver.maybeCreateSnapshot(spec, makeMeta(), artifacts);
      expect(snapshot).toBeNull();
    });

    test("returns null for non-completed spec", async () => {
      const spec = makeCompletedSpec();
      spec.stage = "tasks";
      const snapshot = await archiver.maybeCreateSnapshot(spec, makeMeta(), artifacts);
      expect(snapshot).toBeNull();
    });

    test("hash verification on write", async () => {
      const spec = makeCompletedSpec("src1::hash-test");
      upsertSpec(db, { ...makeCompletedSpec(), key: "src1::hash-test", specId: "hash-test" });
      const snapshot = await archiver.maybeCreateSnapshot(
        spec,
        makeMeta(),
        [{ name: "requirements.md", content: "unique content for hash test" }],
      );
      expect(snapshot).not.toBeNull();
      // Each stored artifact should have a valid hash
      for (const a of snapshot!.artifacts) {
        expect(a.contentHash).toMatch(/^[a-f0-9]{64}$/);
        expect(a.sizeBytes).toBeGreaterThan(0);
      }
    });
  });

  describe("isEligibleForPurge", () => {
    test("rejects permanent retention", () => {
      const result = archiver.isEligibleForPurge({
        retention_policy: JSON.stringify({ type: "permanent" }),
        created_at: "2020-01-01T00:00:00Z",
      });
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain("permanent");
    });

    test("rejects unexpired custom_date", () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const result = archiver.isEligibleForPurge({
        retention_policy: JSON.stringify({
          type: "custom_date",
          customDate: future.toISOString(),
        }),
        created_at: "2020-01-01T00:00:00Z",
      });
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain("expires");
    });

    test("rejects unexpired active_plus_2_years", () => {
      const recent = new Date();
      recent.setMonth(recent.getMonth() - 6); // Only 6 months old
      const result = archiver.isEligibleForPurge({
        retention_policy: JSON.stringify({ type: "active_plus_2_years" }),
        created_at: recent.toISOString(),
      });
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain("expires");
    });

    test("allows project_lifetime", () => {
      const result = archiver.isEligibleForPurge({
        retention_policy: JSON.stringify({ type: "project_lifetime" }),
        created_at: "2020-01-01T00:00:00Z",
      });
      expect(result.eligible).toBe(true);
    });

    test("allows expired custom_date", () => {
      const past = new Date();
      past.setFullYear(past.getFullYear() - 1);
      const result = archiver.isEligibleForPurge({
        retention_policy: JSON.stringify({
          type: "custom_date",
          customDate: past.toISOString(),
        }),
        created_at: "2020-01-01T00:00:00Z",
      });
      expect(result.eligible).toBe(true);
    });

    test("rejects when no retention policy set", () => {
      const result = archiver.isEligibleForPurge({
        retention_policy: null,
        created_at: "2020-01-01T00:00:00Z",
      });
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain("No retention policy");
    });
  });

  describe("purge", () => {
    test("rejects wrong confirmation text", async () => {
      // First create a snapshot we can try to purge
      const spec = makeCompletedSpec("src1::purge-test");
      upsertSpec(db, { ...makeCompletedSpec(), key: "src1::purge-test", specId: "purge-test" });
      const snapshot = await archiver.maybeCreateSnapshot(
        spec,
        { ...makeMeta(), retentionPolicy: { type: "project_lifetime" } },
        [{ name: "requirements.md", content: "purge test content" }],
      );
      expect(snapshot).not.toBeNull();

      await expect(
        archiver.purge(snapshot!.id, "WRONG TEXT"),
      ).rejects.toThrow("Invalid confirmation text");
    });

    test("succeeds with correct confirmation and eligible snapshot", async () => {
      const spec = makeCompletedSpec("src1::purge-ok");
      upsertSpec(db, { ...makeCompletedSpec(), key: "src1::purge-ok", specId: "purge-ok" });
      const snapshot = await archiver.maybeCreateSnapshot(
        spec,
        { ...makeMeta(), retentionPolicy: { type: "project_lifetime" } },
        [{ name: "requirements.md", content: "will be purged" }],
      );
      expect(snapshot).not.toBeNull();

      const confirmText = `PURGE ${snapshot!.id}`;
      await archiver.purge(snapshot!.id, confirmText);

      // Should now be purged — retrieving should throw
      await expect(archiver.retrieveSnapshot(snapshot!.id)).rejects.toThrow("purged");
    });
  });
});
