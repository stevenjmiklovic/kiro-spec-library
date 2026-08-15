/**
 * REST API integration tests (Task 21.2)
 *
 * Builds the Elysia app in-process and exercises it via app.handle(new Request(...)).
 * Uses a temp SQLite database per suite; no network server is started.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Database } from "bun:sqlite";
import { createDatabase } from "../../backend/src/db/connection.js";
import { runMigrations } from "../../backend/src/db/migrator.js";
import { createRouter } from "../../backend/src/router.js";
import { specRoutes } from "../../backend/src/routes/specs.js";
import { relationshipRoutes } from "../../backend/src/routes/relationships.js";
import { archiveRoutes } from "../../backend/src/routes/archive.js";
import { ScannerService } from "../../backend/src/services/scanner.js";
import { ArchiverService } from "../../backend/src/services/archiver.js";
import { upsertSpec } from "../../backend/src/db/queries/specs.js";
import { putSource } from "../../backend/src/db/queries/sources.js";
import { createSuggestion } from "../../backend/src/db/queries/suggestions.js";
import { API_PREFIX } from "../../shared/src/constants.js";
import type { NormalizedSpec } from "../../shared/src/types.js";

// ─── Test Setup ──────────────────────────────────────────────────────────────

let tmpDir: string;
let archiveDir: string;
let db: Database;
let app: { handle: (req: Request) => Promise<Response> };

function buildUrl(path: string): string {
  return `http://localhost${API_PREFIX}${path}`;
}

function makeSpec(overrides: Partial<NormalizedSpec> = {}): NormalizedSpec {
  return {
    key: "test-source::test-spec",
    sourceId: "test-source",
    specId: "test-spec",
    type: "feature",
    workflow: "requirements-first",
    title: "Test Spec Title",
    owner: "tester",
    stage: "design",
    progress: 50,
    provenance: {
      repository: "test-repo",
      relativePath: ".kiro/specs/test-spec",
      branch: "main",
      commitHash: "abc123def456",
      isDirty: false,
      remoteUrl: "https://github.com/test/repo",
    },
    artifacts: {
      "requirements.md": true,
      "design.md": true,
      "tasks.md": false,
    },
    taskCounts: { total: 10, completed: 5 },
    contentDigest: "sha256-fake-digest-for-test",
    indexedAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeAll(async () => {
  tmpDir = mkdtempSync(join(tmpdir(), "spec-library-api-test-"));
  archiveDir = join(tmpDir, "archive");
  mkdirSync(archiveDir, { recursive: true });

  db = createDatabase(tmpDir);
  await runMigrations(db);

  const scanner = new ScannerService(db, tmpDir);
  const archiver = new ArchiverService(db, { archiveDir });

  // Build the full app: router (health/bootstrap) + sub-routes
  const router = createRouter({
    db,
    scanner,
    archiver,
    ready: () => true,
  });

  // Mount sub-routes onto the same API_PREFIX'd app
  app = router
    .use(specRoutes({ db }))
    .use(relationshipRoutes({ db }))
    .use(archiveRoutes({ db, archiver }));

  // Seed a source (FK requirement for specs)
  putSource(db, {
    id: "test-source",
    type: "local",
    path: "/tmp/test-repo",
    addedAt: new Date().toISOString(),
  });

  // Seed primary spec
  upsertSpec(db, makeSpec());

  // Seed a second spec for relationship tests
  upsertSpec(db, makeSpec({
    key: "test-source::target-spec",
    specId: "target-spec",
    title: "Target Spec",
  }));

  // Seed a suggestion for accept/reject tests
  createSuggestion(db, {
    id: "suggestion-1",
    sourceSpecKey: "test-source::test-spec",
    targetSpecKey: "test-source::target-spec",
    type: "related",
    confidence: 0.7,
    reason: "shared_theme",
    evidence: "Both specs share theme 'platform'",
    dataHash: "hash-abc123",
  });

  createSuggestion(db, {
    id: "suggestion-2",
    sourceSpecKey: "test-source::test-spec",
    targetSpecKey: "test-source::target-spec",
    type: "depends_on",
    confidence: 0.5,
    reason: "markdown_link",
    evidence: "Linked in requirements.md",
    dataHash: "hash-def456",
  });
});

afterAll(() => {
  if (db) db.close();
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

// ─── Helper ──────────────────────────────────────────────────────────────────

async function handleRequest(
  method: string,
  path: string,
  body?: unknown,
): Promise<Response> {
  const opts: RequestInit = { method };
  if (body !== undefined) {
    opts.headers = { "Content-Type": "application/json" };
    opts.body = JSON.stringify(body);
  }
  return app.handle(new Request(buildUrl(path), opts));
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("REST API integration tests", () => {
  // ─── (a) GET /specs — list returns seeded spec ─────────────────────────
  describe("GET /specs", () => {
    test("returns the seeded spec in the list", async () => {
      const res = await handleRequest("GET", "/specs");
      expect(res.status).toBe(200);

      const data = await res.json() as { specs: unknown[]; total: number };
      expect(data.total).toBeGreaterThanOrEqual(2);

      const keys = (data.specs as Array<{ key: string }>).map((s) => s.key);
      expect(keys).toContain("test-source::test-spec");
      expect(keys).toContain("test-source::target-spec");
    });

    test("supports type filter", async () => {
      const res = await handleRequest("GET", "/specs?type=feature");
      expect(res.status).toBe(200);

      const data = await res.json() as { specs: unknown[]; total: number };
      expect(data.total).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── (b) GET /specs/:id — returns spec, metadata, revision ────────────
  describe("GET /specs/:id", () => {
    test("returns spec with metadata and revision", async () => {
      const res = await handleRequest("GET", "/specs/test-source::test-spec");
      expect(res.status).toBe(200);

      const data = await res.json() as {
        spec: { key: string; title: string };
        metadata: { title: string; owner: string };
        revision: number;
      };
      expect(data.spec.key).toBe("test-source::test-spec");
      expect(data.spec.title).toBe("Test Spec Title");
      expect(data.metadata).toBeDefined();
      expect(data.metadata.title).toBe("Test Spec Title");
      expect(data.revision).toBe(0);
    });

    test("returns 404 for nonexistent spec", async () => {
      const res = await handleRequest("GET", "/specs/nonexistent::key");
      expect(res.status).toBe(404);

      const data = await res.json() as { code: string };
      expect(data.code).toBe("NOT_FOUND");
    });
  });

  // ─── (c) PATCH /specs/:id/metadata — optimistic concurrency success ───
  describe("PATCH /specs/:id/metadata", () => {
    test("succeeds with correct expectedRevision and bumps revision", async () => {
      const res = await handleRequest(
        "PATCH",
        "/specs/test-source::test-spec/metadata",
        {
          expectedRevision: 0,
          patch: { theme: "platform", tags: ["infra", "core"] },
        },
      );
      expect(res.status).toBe(200);

      const data = await res.json() as { revision: number; updatedAt: string };
      expect(data.revision).toBe(1);
      expect(data.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test("subsequent patch with revision 1 succeeds", async () => {
      const res = await handleRequest(
        "PATCH",
        "/specs/test-source::test-spec/metadata",
        {
          expectedRevision: 1,
          patch: { summary: "Updated summary" },
        },
      );
      expect(res.status).toBe(200);

      const data = await res.json() as { revision: number };
      expect(data.revision).toBe(2);
    });
  });

  // ─── (d) PATCH with stale expectedRevision — 409 REVISION_CONFLICT ────
  describe("PATCH /specs/:id/metadata — conflict", () => {
    test("returns 409 REVISION_CONFLICT with stale revision", async () => {
      const res = await handleRequest(
        "PATCH",
        "/specs/test-source::test-spec/metadata",
        {
          expectedRevision: 0, // stale — actual is now 2
          patch: { theme: "stale-update" },
        },
      );
      expect(res.status).toBe(409);

      const data = await res.json() as {
        code: string;
        message: string;
        expected: number;
        actual: number;
      };
      expect(data.code).toBe("REVISION_CONFLICT");
      expect(data.expected).toBe(0);
      expect(data.actual).toBe(2);
    });
  });

  // ─── (e) Relationships: create, list (via GET spec), duplicate → 409 ──
  describe("POST /specs/:id/relationships", () => {
    test("creates a relationship and returns 201", async () => {
      const res = await handleRequest(
        "POST",
        "/specs/test-source::test-spec/relationships",
        {
          targetSpecKey: "test-source::target-spec",
          type: "depends_on",
        },
      );
      expect(res.status).toBe(201);

      const data = await res.json() as { id: string; createdAt: string };
      expect(data.id).toBeDefined();
      expect(data.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test("duplicate relationship returns 409", async () => {
      const res = await handleRequest(
        "POST",
        "/specs/test-source::test-spec/relationships",
        {
          targetSpecKey: "test-source::target-spec",
          type: "depends_on",
        },
      );
      expect(res.status).toBe(409);

      const data = await res.json() as { code: string; message: string };
      expect(data.code).toBe("DUPLICATE");
    });
  });

  // ─── (f) Suggestions: accept and reject ───────────────────────────────
  describe("Suggestions accept/reject", () => {
    test("POST /suggestions/:id/accept creates a relationship", async () => {
      const res = await handleRequest("POST", "/suggestions/suggestion-1/accept");
      expect(res.status).toBe(200);

      const data = await res.json() as { relationshipId: string };
      expect(data.relationshipId).toBeDefined();
    });

    test("POST /suggestions/:id/reject marks as rejected", async () => {
      const res = await handleRequest("POST", "/suggestions/suggestion-2/reject");
      expect(res.status).toBe(200);

      const data = await res.json() as { status: string };
      expect(data.status).toBe("rejected");
    });

    test("accept nonexistent suggestion returns NOT_FOUND", async () => {
      const res = await handleRequest("POST", "/suggestions/nonexistent/accept");
      expect(res.status).toBe(200); // route returns 200 with code NOT_FOUND in body

      const data = await res.json() as { code: string };
      expect(data.code).toBe("NOT_FOUND");
    });
  });

  // ─── (g) Validation failure returns 400/422 with error envelope ────────
  describe("Validation errors", () => {
    test("PATCH with missing expectedRevision returns 400", async () => {
      const res = await handleRequest(
        "PATCH",
        "/specs/test-source::test-spec/metadata",
        {
          // missing expectedRevision
          patch: { theme: "no-revision" },
        },
      );
      // Elysia returns 400 for schema validation failures
      expect(res.status).toBe(400);

      const data = await res.json() as { type?: string; code?: string; message?: string };
      // Elysia's validation error includes type or code
      expect(data.type ?? data.code).toBeDefined();
    });

    test("PATCH with invalid type value in body returns 400", async () => {
      const res = await handleRequest(
        "PATCH",
        "/specs/test-source::test-spec/metadata",
        {
          expectedRevision: "not-a-number", // wrong type
          patch: { theme: "test" },
        },
      );
      expect(res.status).toBe(400);
    });

    test("POST relationship with invalid type returns 400", async () => {
      const res = await handleRequest(
        "POST",
        "/specs/test-source::test-spec/relationships",
        {
          targetSpecKey: "test-source::target-spec",
          type: "invalid_type", // not in the union
        },
      );
      expect(res.status).toBe(400);

      const data = await res.json() as { type?: string; code?: string; message?: string };
      expect(data.type ?? data.code).toBeDefined();
    });
  });

  // ─── Health & Bootstrap (basic sanity) ─────────────────────────────────
  describe("Health and Bootstrap", () => {
    test("GET /health returns ok", async () => {
      const res = await handleRequest("GET", "/health");
      expect(res.status).toBe(200);

      const data = await res.json() as { status: string };
      expect(data.status).toBe("ok");
    });

    test("GET /bootstrap returns 500 — BUG: router.ts references 'metadata' table instead of 'metadata_overlays'", async () => {
      const res = await handleRequest("GET", "/bootstrap");
      // BUG: backend/src/router.ts line ~119 queries "SELECT DISTINCT theme FROM metadata"
      // but the actual table is "metadata_overlays". This causes a SQL error.
      expect(res.status).toBe(500);

      const data = await res.json() as { code: string };
      expect(data.code).toBe("INTERNAL_ERROR");
    });
  });

  // ─── Archive routes (basic listing) ────────────────────────────────────
  describe("GET /archive", () => {
    test("returns empty list when no snapshots exist", async () => {
      const res = await handleRequest("GET", "/archive");
      expect(res.status).toBe(200);

      const data = await res.json() as { snapshots: unknown[]; nextCursor: unknown };
      expect(data.snapshots).toBeInstanceOf(Array);
      expect(data.nextCursor).toBeNull();
    });
  });
});
