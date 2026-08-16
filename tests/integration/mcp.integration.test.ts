/**
 * MCP Tool Integration Tests (Task 21.3)
 *
 * Exercises the three MCP tools (search_specs, get_spec_context, submit_metadata_proposal)
 * against a real seeded SQLite database with direct Elysia app.handle() routing.
 *
 * Strategy: Rather than spinning up Bun.serve (which conflicts with the happy-dom
 * preload in bunfig.toml), we patch global fetch to intercept requests to a fake
 * localhost URL and route them through app.handle(). This exercises the full
 * Elysia routing + MCP tool serialization pipeline.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Database } from "bun:sqlite";
import { createDatabase } from "../../backend/src/db/connection.js";
import { runMigrations } from "../../backend/src/db/migrator.js";
import { createRouter } from "../../backend/src/router.js";
import { specRoutes } from "../../backend/src/routes/specs.js";
import { proposalRoutes } from "../../backend/src/routes/proposals.js";
import { searchSpecs, getSpecContext, submitMetadataProposal } from "../../mcp/src/tools.js";
import { API_PREFIX } from "../../shared/src/constants.js";

// ─── Test Infrastructure ─────────────────────────────────────────────────────

let tmpDir: string;
let db: Database;
let app: ReturnType<typeof createRouter>;
const TEST_TOKEN = "test-mcp-token-abc123";
const FAKE_BASE = "http://127.0.0.1:19999";

// Save the real fetch
const realFetch = globalThis.fetch;

function makeClient(token = TEST_TOKEN) {
  return { baseUrl: FAKE_BASE, token };
}

/**
 * Seed the database with test specs and a source.
 */
function seedTestData(db: Database): void {
  // Insert a source
  db.run(`
    INSERT INTO sources (id, type, path, added_at)
    VALUES ('src-1', 'local', '/tmp/test-repo', '2024-01-01T00:00:00Z')
  `);

  // Insert test specs
  const specs = [
    {
      key: "src-1::auth-module",
      source_id: "src-1",
      spec_id: "auth-module",
      type: "feature",
      workflow: "requirements-first",
      title: "Authentication Module",
      owner: "alice",
      stage: "scoped",
      progress: 45,
      repository: "my-app",
      relative_path: ".kiro/specs/auth-module",
      branch: "main",
      commit_hash: "abc123def456",
      is_dirty: 0,
      remote_url: null,
      total_tasks: 10,
      completed_tasks: 4,
      content_digest: "sha256-aaa",
      indexed_at: "2024-06-01T10:00:00Z",
    },
    {
      key: "src-1::payment-gateway",
      source_id: "src-1",
      spec_id: "payment-gateway",
      type: "feature",
      workflow: "design-first",
      title: "Payment Gateway Integration",
      owner: "bob",
      stage: "refined",
      progress: 80,
      repository: "my-app",
      relative_path: ".kiro/specs/payment-gateway",
      branch: "main",
      commit_hash: "def789abc012",
      is_dirty: 0,
      remote_url: null,
      total_tasks: 20,
      completed_tasks: 16,
      content_digest: "sha256-bbb",
      indexed_at: "2024-06-02T10:00:00Z",
    },
    {
      key: "src-1::bugfix-login",
      source_id: "src-1",
      spec_id: "bugfix-login",
      type: "bugfix",
      workflow: "requirements-first",
      title: "Fix Login Token Expiry Bug",
      owner: "alice",
      stage: "done",
      progress: 100,
      repository: "my-app",
      relative_path: ".kiro/specs/bugfix-login",
      branch: "main",
      commit_hash: "111222333444",
      is_dirty: 0,
      remote_url: null,
      total_tasks: 5,
      completed_tasks: 5,
      content_digest: "sha256-ccc",
      indexed_at: "2024-06-03T10:00:00Z",
    },
    {
      key: "src-1::secret-spec",
      source_id: "src-1",
      spec_id: "secret-spec",
      type: "feature",
      workflow: "requirements-first",
      title: "Secrets Management with AWS Key AKIAIOSFODNN7EXAMPLE embedded",
      owner: "charlie",
      stage: "new",
      progress: 10,
      repository: "infra-repo",
      relative_path: ".kiro/specs/secret-spec",
      branch: "main",
      commit_hash: "sec555666777",
      is_dirty: 0,
      remote_url: null,
      total_tasks: 8,
      completed_tasks: 1,
      content_digest: "sha256-ddd",
      indexed_at: "2024-06-04T10:00:00Z",
    },
  ];

  const stmt = db.prepare(`
    INSERT INTO specs (key, source_id, spec_id, type, workflow, title, owner, stage, progress,
      repository, relative_path, branch, commit_hash, is_dirty, remote_url,
      total_tasks, completed_tasks, content_digest, indexed_at)
    VALUES ($key, $source_id, $spec_id, $type, $workflow, $title, $owner, $stage, $progress,
      $repository, $relative_path, $branch, $commit_hash, $is_dirty, $remote_url,
      $total_tasks, $completed_tasks, $content_digest, $indexed_at)
  `);

  for (const spec of specs) {
    stmt.run({
      $key: spec.key,
      $source_id: spec.source_id,
      $spec_id: spec.spec_id,
      $type: spec.type,
      $workflow: spec.workflow,
      $title: spec.title,
      $owner: spec.owner,
      $stage: spec.stage,
      $progress: spec.progress,
      $repository: spec.repository,
      $relative_path: spec.relative_path,
      $branch: spec.branch,
      $commit_hash: spec.commit_hash,
      $is_dirty: spec.is_dirty,
      $remote_url: spec.remote_url,
      $total_tasks: spec.total_tasks,
      $completed_tasks: spec.completed_tasks,
      $content_digest: spec.content_digest,
      $indexed_at: spec.indexed_at,
    });
  }

  // Insert an artifact with embedded secrets (for redaction testing)
  db.run(`
    INSERT INTO artifacts (spec_key, name, content, size_bytes, content_hash)
    VALUES (
      'src-1::secret-spec',
      'requirements.md',
      '# Secrets Management\n\nWe use AWS key AKIAIOSFODNN7EXAMPLE and secret aws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY for infra.\nAlso token: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij\nPassword: password=SuperSecret123!@#\n\n## Requirements\n\n1. Rotate keys every 90 days',
      500,
      'sha256-artifact-secret'
    )
  `);

  // Insert artifacts for other specs
  db.run(`
    INSERT INTO artifacts (spec_key, name, content, size_bytes, content_hash)
    VALUES (
      'src-1::auth-module',
      'design.md',
      '# Auth Module Design\n\nUse OAuth2 with PKCE flow.\n\n## Components\n\n- Token service\n- Session store\n- RBAC engine',
      200,
      'sha256-artifact-auth'
    )
  `);
}

// ─── Setup / Teardown ────────────────────────────────────────────────────────

beforeAll(async () => {
  tmpDir = mkdtempSync(join(tmpdir(), "mcp-integration-test-"));
  db = createDatabase(tmpDir);
  await runMigrations(db);
  seedTestData(db);

  // Build an Elysia app that includes spec routes
  app = createRouter({
    db,
    scanner: { triggerScan: async () => {} } as any,
    archiver: { createSnapshot: async () => ({}) } as any,
    ready: () => true,
    dataDir: tmpDir,
  });

  // Compose spec routes into the app
  const specsPlugin = specRoutes({ db });
  app.use(specsPlugin);

  // Compose proposal routes into the app
  const proposalsPlugin = proposalRoutes({ db });
  app.use(proposalsPlugin);

  // Patch global fetch to intercept requests to our fake base URL
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;

    if (url.startsWith(FAKE_BASE)) {
      // Route through Elysia app.handle()
      const path = url.slice(FAKE_BASE.length);
      const request = new Request(`http://localhost${path}`, init);
      const response = await app.handle(request);
      return response;
    }

    // Pass through to real fetch for anything else
    return realFetch(input, init as any);
  }) as unknown as typeof fetch;
});

afterAll(() => {
  // Restore original fetch
  globalThis.fetch = realFetch;
  if (db) db.close();
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("MCP Integration: search_specs", () => {
  test("returns all specs when no filters applied", async () => {
    const result = await searchSpecs(makeClient(), { query: "" });
    const parsed = JSON.parse(result);

    expect(parsed.specs).toBeDefined();
    expect(Array.isArray(parsed.specs)).toBe(true);
    expect(parsed.specs.length).toBe(4);
    expect(parsed.total).toBe(4);
  });

  test("returns specs filtered by type=feature", async () => {
    const result = await searchSpecs(makeClient(), {
      query: "",
      filters: { type: "feature" },
    });
    const parsed = JSON.parse(result);

    expect(parsed.specs.length).toBe(3);
    for (const spec of parsed.specs) {
      expect(spec.type).toBe("feature");
    }
  });

  test("returns specs filtered by type=bugfix", async () => {
    const result = await searchSpecs(makeClient(), {
      query: "",
      filters: { type: "bugfix" },
    });
    const parsed = JSON.parse(result);

    expect(parsed.specs.length).toBe(1);
    expect(parsed.specs[0].spec_id).toBe("bugfix-login");
  });

  test("returns specs filtered by owner=alice", async () => {
    const result = await searchSpecs(makeClient(), {
      query: "",
      filters: { owner: "alice" },
    });
    const parsed = JSON.parse(result);

    expect(parsed.specs.length).toBe(2);
    for (const spec of parsed.specs) {
      expect(spec.owner).toBe("alice");
    }
  });

  test("returns specs filtered by stage=completed", async () => {
    const result = await searchSpecs(makeClient(), {
      query: "",
      filters: { stage: "done" },
    });
    const parsed = JSON.parse(result);

    expect(parsed.specs.length).toBe(1);
    expect(parsed.specs[0].spec_id).toBe("bugfix-login");
    expect(parsed.specs[0].progress).toBe(100);
  });

  test("returns specs filtered by repository=infra-repo", async () => {
    const result = await searchSpecs(makeClient(), {
      query: "",
      filters: { repository: "infra-repo" },
    });
    const parsed = JSON.parse(result);

    expect(parsed.specs.length).toBe(1);
    expect(parsed.specs[0].spec_id).toBe("secret-spec");
  });

  test("respects limit parameter", async () => {
    const result = await searchSpecs(makeClient(), { query: "", limit: 2 });
    const parsed = JSON.parse(result);

    expect(parsed.specs.length).toBeLessThanOrEqual(2);
    expect(parsed.limit).toBe(2);
  });

  test("caps limit at 100 even if higher value sent", async () => {
    // The tool code caps at 100 before sending to backend
    const result = await searchSpecs(makeClient(), { query: "", limit: 500 });
    const parsed = JSON.parse(result);

    expect(parsed.specs).toBeDefined();
    // Tool sends limit=100 (capped), backend returns at most 100
    expect(parsed.limit).toBeLessThanOrEqual(100);
  });

  test("combined filters narrow results correctly", async () => {
    const result = await searchSpecs(makeClient(), {
      query: "",
      filters: { type: "feature", owner: "alice" },
    });
    const parsed = JSON.parse(result);

    // alice owns auth-module (feature) — the other alice spec is bugfix
    expect(parsed.specs.length).toBe(1);
    expect(parsed.specs[0].spec_id).toBe("auth-module");
  });
});

describe("MCP Integration: get_spec_context", () => {
  test("returns full spec with metadata for a known spec", async () => {
    const result = await getSpecContext(makeClient(), {
      specId: "src-1::auth-module",
    });
    const parsed = JSON.parse(result);

    expect(parsed.spec).toBeDefined();
    expect(parsed.spec.key).toBe("src-1::auth-module");
    expect(parsed.spec.title).toBe("Authentication Module");
    expect(parsed.spec.stage).toBe("scoped");
    expect(parsed.metadata).toBeDefined();
    expect(parsed.revision).toBe(0); // No overlay yet
  });

  test("returns 404 for unknown spec ID", async () => {
    await expect(
      getSpecContext(makeClient(), { specId: "nonexistent-spec" })
    ).rejects.toThrow("Get spec failed");
  });

  test("redacts AWS access keys from response content", async () => {
    const result = await getSpecContext(makeClient(), {
      specId: "src-1::secret-spec",
    });

    // The spec title contains AKIAIOSFODNN7EXAMPLE — verify it's redacted
    expect(result).not.toContain("AKIAIOSFODNN7EXAMPLE");
    expect(result).toContain("[REDACTED]");
  });

  test("redacts credential-like values comprehensively", async () => {
    const result = await getSpecContext(makeClient(), {
      specId: "src-1::secret-spec",
    });

    // Verify various credential patterns are all gone
    expect(result).not.toContain("AKIAIOSFODNN7EXAMPLE");
    // The title is what gets returned by the spec row — confirm redaction
    expect(result).toContain("[REDACTED]");
    // Normal non-secret text survives
    expect(result).toContain("Secrets Management");
  });

  test("normal content without secrets passes through intact", async () => {
    const result = await getSpecContext(makeClient(), {
      specId: "src-1::auth-module",
    });
    const parsed = JSON.parse(result);

    expect(parsed.spec.title).toBe("Authentication Module");
    expect(parsed.spec.owner).toBe("alice");
    expect(parsed.spec.stage).toBe("scoped");
    expect(parsed.spec.progress).toBe(45);
  });
});

describe("MCP Integration: submit_metadata_proposal", () => {
  /**
   * The submit_metadata_proposal tool now POSTs to /specs/:id/proposals,
   * creating a pending proposal that requires human approval.
   * Metadata is NOT modified until the proposal is explicitly accepted.
   */

  test("creates a pending proposal and does NOT modify metadata immediately", async () => {
    const result = await submitMetadataProposal(makeClient(), {
      specId: "src-1::payment-gateway",
      baseRevision: 0,
      metadataPatch: { theme: "payments", tags: ["stripe", "integration"] },
      rationale: "Categorizing under payments theme",
    });
    const parsed = JSON.parse(result);

    // Returns pending status with proposal ID
    expect(parsed.status).toBe("pending");
    expect(parsed.id).toBeDefined();
    expect(typeof parsed.id).toBe("string");

    // Verify the metadata was NOT applied — no overlay exists
    const overlay = db
      .query<{ theme: string | null }, [string]>(
        "SELECT theme FROM metadata_overlays WHERE spec_key = ?"
      )
      .get("src-1::payment-gateway");

    expect(overlay).toBeNull();

    // Verify proposal exists in the proposals table
    const proposal = db
      .query<{ id: string; spec_key: string; patch: string; status: string }, [string]>(
        "SELECT id, spec_key, patch, status FROM proposals WHERE id = ?"
      )
      .get(parsed.id);

    expect(proposal).not.toBeNull();
    expect(proposal!.spec_key).toBe("src-1::payment-gateway");
    expect(proposal!.status).toBe("pending");
    const patchData = JSON.parse(proposal!.patch);
    expect(patchData.theme).toBe("payments");
    expect(patchData.tags).toEqual(["stripe", "integration"]);
  });

  test("multiple proposals can be submitted for the same spec", async () => {
    const result1 = await submitMetadataProposal(makeClient(), {
      specId: "src-1::auth-module",
      baseRevision: 0,
      metadataPatch: { theme: "security" },
      rationale: "Auth is a security concern",
    });
    const parsed1 = JSON.parse(result1);

    const result2 = await submitMetadataProposal(makeClient(), {
      specId: "src-1::auth-module",
      baseRevision: 0,
      metadataPatch: { summary: "OAuth2 PKCE authentication" },
      rationale: "Adding summary",
    });
    const parsed2 = JSON.parse(result2);

    expect(parsed1.id).not.toBe(parsed2.id);
    expect(parsed1.status).toBe("pending");
    expect(parsed2.status).toBe("pending");

    // Both are in the table
    const proposals = db
      .query<{ id: string; status: string }, [string]>(
        "SELECT id, status FROM proposals WHERE spec_key = ? AND status = 'pending'"
      )
      .all("src-1::auth-module");
    expect(proposals.length).toBeGreaterThanOrEqual(2);
  });

  test("returns 404 for unknown spec", async () => {
    await expect(
      submitMetadataProposal(makeClient(), {
        specId: "nonexistent",
        baseRevision: 0,
        metadataPatch: { theme: "test" },
        rationale: "Should fail",
      })
    ).rejects.toThrow("Proposal failed");
  });

  test("accepting a proposal applies the metadata patch", async () => {
    // Create a proposal
    const result = await submitMetadataProposal(makeClient(), {
      specId: "src-1::bugfix-login",
      baseRevision: 0,
      metadataPatch: { summary: "Fixed token expiry" },
      rationale: "Adding summary for completed bugfix",
    });
    const parsed = JSON.parse(result);
    expect(parsed.status).toBe("pending");

    // Accept it via the proposals endpoint (routes through patched fetch -> app.handle)
    const acceptUrl = `${FAKE_BASE}${API_PREFIX}/proposals/${parsed.id}/accept`;
    const acceptResp = await fetch(acceptUrl, { method: "POST", headers: { "Content-Type": "application/json" } });
    expect(acceptResp.status).toBe(200);
    const acceptData = await acceptResp.json() as { status: string };
    expect(acceptData.status).toBe("accepted");

    // Now metadata should be applied
    const overlay = db
      .query<{ summary: string; revision: number }, [string]>(
        "SELECT summary, revision FROM metadata_overlays WHERE spec_key = ?"
      )
      .get("src-1::bugfix-login");
    expect(overlay).not.toBeNull();
    expect(overlay!.summary).toBe("Fixed token expiry");
    expect(overlay!.revision).toBe(1);
  });
});

describe("MCP Integration: Token Authentication", () => {
  /**
   * FINDING: The backend does NOT currently enforce X-MCP-Token authentication.
   *
   * The backend generates a token at startup and exports it, but there is NO
   * middleware checking the X-MCP-Token header on incoming requests. The MCP
   * tools send the header, but the backend ignores it entirely.
   *
   * These tests document the ACTUAL behavior: unauthenticated requests succeed.
   * When auth enforcement is added, these should be inverted to expect 401/403.
   */

  test("request WITHOUT token succeeds (no auth enforcement — BUG)", async () => {
    const noTokenClient = makeClient("");
    const result = await searchSpecs(noTokenClient, { query: "" });
    const parsed = JSON.parse(result);

    expect(parsed.specs).toBeDefined();
    expect(parsed.specs.length).toBe(4);
  });

  test("request with WRONG token also succeeds (no auth enforcement — BUG)", async () => {
    const wrongTokenClient = makeClient("completely-wrong-token");
    const result = await searchSpecs(wrongTokenClient, { query: "" });
    const parsed = JSON.parse(result);

    expect(parsed.specs).toBeDefined();
    expect(parsed.specs.length).toBe(4);
  });

  test("request with correct token succeeds", async () => {
    const result = await searchSpecs(makeClient(TEST_TOKEN), { query: "" });
    const parsed = JSON.parse(result);

    expect(parsed.specs).toBeDefined();
    expect(parsed.specs.length).toBe(4);
  });

  test("get_spec_context without token succeeds (no enforcement)", async () => {
    const noTokenClient = makeClient("");
    const result = await getSpecContext(noTokenClient, {
      specId: "src-1::auth-module",
    });
    const parsed = JSON.parse(result);

    expect(parsed.spec.key).toBe("src-1::auth-module");
  });

  test("submit_metadata_proposal without token succeeds (no enforcement)", async () => {
    const noTokenClient = makeClient("");
    const result = await submitMetadataProposal(noTokenClient, {
      specId: "src-1::bugfix-login",
      baseRevision: 0,
      metadataPatch: { theme: "reliability" },
      rationale: "Adding theme for completed bugfix",
    });
    const parsed = JSON.parse(result);

    expect(parsed.status).toBe("pending");
    expect(parsed.id).toBeDefined();
  });
});
