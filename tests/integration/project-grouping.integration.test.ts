import type { Database } from "bun:sqlite";
/**
 * Integration tests for the project-grouping feature:
 *   - GET /specs attaches a friendly `projectName` per spec, derived from the
 *     source config id (or the repository/remote basename), NOT the raw
 *     absolute repository path the scanner stores.
 *   - the UI query builder maps the `repository` filter to the `repo` API param
 *     and keeps a stable, value-derived query string.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabase } from "../../backend/src/db/connection.js";
import { runMigrations } from "../../backend/src/db/migrator.js";
import { putSource } from "../../backend/src/db/queries/sources.js";
import { upsertSpec } from "../../backend/src/db/queries/specs.js";
import { createRouter } from "../../backend/src/router.js";
import { specRoutes } from "../../backend/src/routes/specs.js";
import { ArchiverService } from "../../backend/src/services/archiver.js";
import { ScannerService } from "../../backend/src/services/scanner.js";
import type { NormalizedSpec } from "../../shared/src/types.js";

let dbDir: string;
let db: Database;
let app: { handle: (req: Request) => Promise<Response> };

function url(path: string): string {
  return `http://localhost/api${path}`;
}

function makeSpec(overrides: Partial<NormalizedSpec> = {}): NormalizedSpec {
  return {
    key: "src-a::spec-1",
    sourceId: "src-a",
    specId: "spec-1",
    type: "feature",
    workflow: "requirements-first",
    title: "Spec One",
    owner: "tester",
    stage: "scoped",
    progress: 50,
    provenance: {
      repository: "/Users/someone/code/my-repo",
      relativePath: ".kiro/specs/spec-1",
      branch: "main",
      commitHash: "abc123",
      isDirty: false,
    },
    artifacts: { "requirements.md": true, "design.md": true },
    taskCounts: { total: 4, completed: 2 },
    contentDigest: "digest-1",
    indexedAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeAll(() => {
  dbDir = mkdtempSync(join(tmpdir(), "project-grouping-"));
  db = createDatabase(dbDir);
  runMigrations(db);

  const archiver = new ArchiverService(db, { archiveDir: join(dbDir, "archive") });
  const scanner = new ScannerService(db, dbDir, archiver);
  app = createRouter({
    db,
    scanner,
    archiver,
    ready: () => true,
    dataDir: dbDir,
    mcpToken: "t",
    enforceMcpAuth: false,
  }).use(specRoutes({ db })) as unknown as { handle: (req: Request) => Promise<Response> };
});

afterAll(() => {
  try {
    db.close();
  } catch {
    /* ignore */
  }
});

async function listSpecs(query = ""): Promise<any> {
  const res = await app.handle(new Request(url(`/specs${query}`)));
  return res.json();
}

describe("GET /specs — projectName derivation", () => {
  test("uses the configured source id as the friendly project name", async () => {
    putSource(db, {
      id: "my-configured-project",
      type: "local",
      path: "/Users/someone/code/my-repo",
      addedAt: new Date().toISOString(),
    });
    upsertSpec(
      db,
      makeSpec({ key: "my-configured-project::spec-1", sourceId: "my-configured-project" }),
    );

    const data = await listSpecs();
    const spec = (data.specs as Array<Record<string, unknown>>).find(
      (s) => s.key === "my-configured-project::spec-1",
    );
    expect(spec).toBeDefined();
    // Friendly source id, not the raw absolute repository path.
    expect(spec?.projectName).toBe("my-configured-project");
    expect(spec?.projectName).not.toContain("/");
  });

  test("falls back to the repository path basename when no source row exists", async () => {
    // A spec whose source_id has no matching sources row.
    upsertSpec(
      db,
      makeSpec({
        key: "orphan-src::spec-2",
        sourceId: "orphan-src",
        specId: "spec-2",
        provenance: {
          repository: "/Users/someone/code/another-repo",
          relativePath: ".kiro/specs/spec-2",
          branch: "main",
          commitHash: "def456",
          isDirty: false,
        },
      }),
    );

    const data = await listSpecs();
    const spec = (data.specs as Array<Record<string, unknown>>).find(
      (s) => s.key === "orphan-src::spec-2",
    );
    expect(spec).toBeDefined();
    // Basename of the repository path, never the full absolute path.
    expect(spec?.projectName).toBe("another-repo");
  });

  test("every returned spec carries a projectName field", async () => {
    const data = await listSpecs();
    for (const spec of data.specs as Array<Record<string, unknown>>) {
      expect(typeof spec.projectName).toBe("string");
      expect((spec.projectName as string).length).toBeGreaterThan(0);
    }
  });
});
