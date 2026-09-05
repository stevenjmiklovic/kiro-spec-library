import type { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabase } from "../../backend/src/db/connection.js";
import { runMigrations } from "../../backend/src/db/migrator.js";
import { upsertOverlay } from "../../backend/src/db/queries/metadata.js";
import { getOverlay } from "../../backend/src/db/queries/metadata.js";
import { createRelationship } from "../../backend/src/db/queries/relationships.js";
import { putSource } from "../../backend/src/db/queries/sources.js";
import { syncSpecFts, upsertSpec } from "../../backend/src/db/queries/specs.js";
import { findByKey } from "../../backend/src/db/queries/specs.js";
import {
  buildSpecKnowledgeDoc,
  readSpecArtifactBodies,
  syncOneSpecToKnowledgeLibrary,
  syncSpecsToKnowledgeLibrary,
} from "../../backend/src/services/knowledge-sync.js";
import type { NormalizedSpec } from "../../shared/src/types.js";

let testDir: string;
let db: Database;

function makeSpec(overrides: Partial<NormalizedSpec> = {}): NormalizedSpec {
  return {
    key: overrides.key ?? "src1::demo",
    sourceId: "src1",
    specId: overrides.specId ?? "demo",
    type: "feature",
    workflow: "requirements-first",
    title: "Demo Spec",
    owner: "alice",
    stage: "in-flight",
    progress: 40,
    provenance: {
      repository: "test-repo",
      relativePath: ".kiro/specs/demo",
      branch: "main",
      commitHash: "abc123",
      isDirty: false,
    },
    artifacts: { "requirements.md": true, "design.md": true, "tasks.md": true },
    taskCounts: { total: 10, completed: 4 },
    contentDigest: "digest-1",
    indexedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function insertSpec(spec: NormalizedSpec): void {
  const rowid = upsertSpec(db, spec);
  syncSpecFts(db, rowid, {
    title: spec.title,
    content: "",
    owner: spec.owner,
    theme: "",
    tags: "",
    repository: spec.provenance.repository,
  });
}

beforeEach(async () => {
  testDir = mkdtempSync(join(tmpdir(), "knowledge-sync-test-"));
  db = createDatabase(testDir);
  await runMigrations(db);
  putSource(db, {
    id: "src1",
    type: "local",
    path: "/repos/test",
    addedAt: new Date().toISOString(),
  });
});

afterEach(() => {
  if (db) db.close();
  rmSync(testDir, { recursive: true, force: true });
});

describe("readSpecArtifactBodies + buildSpecKnowledgeDoc bodies", () => {
  test("folds requirements/design/tasks bodies under friendly headings", async () => {
    insertSpec(makeSpec());
    const spec = findByKey(db, "src1::demo")!;
    const files: Record<string, string> = {
      "/repos/test/.kiro/specs/demo/requirements.md": "# Reqs\nThe system SHALL do X.",
      "/repos/test/.kiro/specs/demo/design.md": "# Design\nUses a Router module.",
      "/repos/test/.kiro/specs/demo/tasks.md": "# Tasks\n- [x] 1. build it",
    };
    // spec.relative_path is ".kiro/specs/demo"; repoPath is the source path.
    const bodies = await readSpecArtifactBodies(spec, "/repos/test", {
      fileReader: async (p) => files[p] ?? null,
    });
    expect(bodies.truncated).toBe(false);
    expect(Object.keys(bodies.contents).sort()).toEqual([
      "design.md",
      "requirements.md",
      "tasks.md",
    ]);

    const doc = buildSpecKnowledgeDoc(spec, getOverlay(db, spec.key), [], bodies);
    expect(doc.content).toContain("## Requirements");
    expect(doc.content).toContain("The system SHALL do X.");
    expect(doc.content).toContain("## Design");
    expect(doc.content).toContain("Uses a Router module.");
    expect(doc.content).toContain("## Tasks");
    expect(doc.content).toContain("build it");
  });

  test("missing bodies are skipped, not fatal; doc still builds from metadata", async () => {
    insertSpec(makeSpec());
    const spec = findByKey(db, "src1::demo")!;
    const bodies = await readSpecArtifactBodies(spec, "/repos/test", {
      fileReader: async () => null, // no files exist
    });
    expect(bodies.contents).toEqual({});
    const doc = buildSpecKnowledgeDoc(spec, getOverlay(db, spec.key), [], bodies);
    expect(doc.content).toContain("Spec ID: demo");
    expect(doc.content).not.toContain("## Requirements");
  });

  test("a path with a traversal component is rejected and flags truncation", async () => {
    // relative_path itself carrying '..' must not let a read escape the root.
    insertSpec(makeSpec({ specId: "evil", key: "src1::evil" }));
    // Force a traversing relative_path directly in the row.
    db.prepare("UPDATE specs SET relative_path = $rp WHERE key = $k").run({
      $rp: "../../etc",
      $k: "src1::evil",
    });
    const spec = findByKey(db, "src1::evil")!;
    let readCalls = 0;
    const bodies = await readSpecArtifactBodies(spec, "/repos/test", {
      fileReader: async () => {
        readCalls++;
        return "SHOULD NOT BE READ";
      },
    });
    expect(readCalls).toBe(0); // validatePath rejected before any read
    expect(bodies.truncated).toBe(true);
    expect(bodies.contents).toEqual({});
  });
});

describe("buildSpecKnowledgeDoc", () => {
  test("names related specs by exact spec_id so they connect in the graph", () => {
    insertSpec(
      makeSpec({ key: "src1::player-presence-awareness", specId: "player-presence-awareness" }),
    );
    insertSpec(
      makeSpec({ key: "src1::harbormaster-personality", specId: "harbormaster-personality" }),
    );
    createRelationship(db, {
      id: crypto.randomUUID(),
      sourceSpecKey: "src1::player-presence-awareness",
      targetSpecKey: "src1::harbormaster-personality",
      type: "depends_on",
    });

    const spec = findByKey(db, "src1::player-presence-awareness");
    expect(spec).not.toBeNull();
    const doc = buildSpecKnowledgeDoc(spec!, getOverlay(db, spec!.key), [
      {
        targetSpecId: "harbormaster-personality",
        targetRepository: "test-repo",
        type: "depends_on",
      },
    ]);

    expect(doc.title).toContain("player-presence-awareness");
    // Both spec ids must appear verbatim: shared-name matching is the ONLY
    // cross-document connector in the Knowledge Library graph.
    expect(doc.content).toContain("player-presence-awareness");
    expect(doc.content).toContain("harbormaster-personality");
    expect(doc.content).toContain("depends_on");
  });

  test("includes overlay metadata (owner/theme/tags/summary) when present", () => {
    insertSpec(makeSpec());
    upsertOverlay(
      db,
      "src1::demo",
      {
        title: "Curated Title",
        owner: "bob",
        theme: "identity",
        tags: ["auth", "crypto"],
        summary: "A spec about tokens.",
      },
      0,
    );
    const spec = findByKey(db, "src1::demo");
    const doc = buildSpecKnowledgeDoc(spec!, getOverlay(db, spec!.key), []);
    expect(doc.content).toContain("Curated Title");
    expect(doc.content).toContain("bob");
    expect(doc.content).toContain("identity");
    expect(doc.content).toContain("auth, crypto");
    expect(doc.content).toContain("A spec about tokens.");
  });
});

describe("syncSpecsToKnowledgeLibrary", () => {
  test("posts one agent-document per spec and counts added/duplicate", async () => {
    insertSpec(
      makeSpec({
        key: "src1::a",
        specId: "a",
        provenance: {
          repository: "test-repo",
          relativePath: ".kiro/specs/a",
          branch: "main",
          commitHash: "abc123",
          isDirty: false,
        },
      }),
    );
    insertSpec(
      makeSpec({
        key: "src1::b",
        specId: "b",
        provenance: {
          repository: "test-repo",
          relativePath: ".kiro/specs/b",
          branch: "main",
          commitHash: "abc123",
          isDirty: false,
        },
      }),
    );

    const posted: Array<{ source_uri: string; title: string; content: string }> = [];
    let call = 0;
    const fetchImpl = (async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      posted.push({ source_uri: body.source_uri, title: body.title, content: body.content });
      // First spec is new, second is reported as duplicate.
      const status = call++ === 0 ? "added" : "duplicate";
      return new Response(JSON.stringify({ status, items: 1 }), { status: 200 });
    }) as unknown as typeof fetch;

    // Hermetic body reader: 'a' has a requirements body, 'b' has none.
    const files: Record<string, string> = {
      "/repos/test/.kiro/specs/a/requirements.md": "# A\nThe A system SHALL run.",
    };
    const result = await syncSpecsToKnowledgeLibrary(db, {
      fetchImpl,
      fileReader: async (p) => files[p] ?? null,
    });
    expect(result.attempted).toBe(2);
    expect(result.added).toBe(1);
    expect(result.duplicate).toBe(1);
    expect(result.failed).toBe(0);
    // source_uri is the stable per-spec identity.
    expect(posted.map((p) => p.source_uri).sort()).toEqual([
      "spec-library://test-repo/a",
      "spec-library://test-repo/b",
    ]);
    // Spec 'a' carried its requirements body through to the pushed document.
    const aDoc = posted.find((p) => p.source_uri.endsWith("/a"));
    expect(aDoc?.content).toContain("The A system SHALL run.");
  });

  test("stops and flags disabled when the gateway returns 403 auto_add_documents_disabled", async () => {
    insertSpec(makeSpec({ key: "src1::a", specId: "a" }));
    insertSpec(makeSpec({ key: "src1::b", specId: "b" }));

    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      return new Response(
        JSON.stringify({ error: "turned off", code: "auto_add_documents_disabled" }),
        { status: 403 },
      );
    }) as unknown as typeof fetch;

    const result = await syncSpecsToKnowledgeLibrary(db, { fetchImpl });
    expect(result.disabled).toBe(true);
    expect(calls).toBe(1); // stopped after the first 403, did not hammer every spec
    expect(result.errors[0]?.error).toContain("turned off");
  });

  test("aborts the run on a network-level failure reaching the gateway", async () => {
    insertSpec(makeSpec({ key: "src1::a", specId: "a" }));
    insertSpec(makeSpec({ key: "src1::b", specId: "b" }));

    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      throw new Error("connect ECONNREFUSED 127.0.0.1:5476");
    }) as unknown as typeof fetch;

    const result = await syncSpecsToKnowledgeLibrary(db, { fetchImpl });
    expect(result.failed).toBe(1);
    expect(calls).toBe(1); // aborted, didn't retry every spec against a dead gateway
    expect(result.errors[0]?.error).toContain("gateway unreachable");
  });
});

describe("syncOneSpecToKnowledgeLibrary", () => {
  test("returns null when the spec key is unknown", async () => {
    const result = await syncOneSpecToKnowledgeLibrary(db, "src1::nope", {
      fetchImpl: (async () => new Response("{}", { status: 200 })) as unknown as typeof fetch,
    });
    expect(result).toBeNull();
  });

  test("pushes one spec (added) with its body and returns its spec_id", async () => {
    insertSpec(makeSpec());
    const files: Record<string, string> = {
      "/repos/test/.kiro/specs/demo/design.md": "# Design\nThe demo uses a Router.",
    };
    let postedBody = "";
    const fetchImpl = (async (_url: string, init?: RequestInit) => {
      postedBody = String(init?.body);
      return new Response(JSON.stringify({ status: "added", items: 2 }), { status: 200 });
    }) as unknown as typeof fetch;

    const result = await syncOneSpecToKnowledgeLibrary(db, "src1::demo", {
      fetchImpl,
      fileReader: async (p) => files[p] ?? null,
    });
    expect(result?.status).toBe("added");
    expect(result?.specId).toBe("demo");
    expect(JSON.parse(postedBody).source_uri).toBe("spec-library://test-repo/demo");
    expect(JSON.parse(postedBody).content).toContain("The demo uses a Router.");
  });

  test("reports duplicate for an unchanged spec", async () => {
    insertSpec(makeSpec());
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ status: "duplicate" }), {
        status: 200,
      })) as unknown as typeof fetch;
    const result = await syncOneSpecToKnowledgeLibrary(db, "src1::demo", {
      fetchImpl,
      fileReader: async () => null,
    });
    expect(result?.status).toBe("duplicate");
  });

  test("surfaces disabled when the gateway returns 403", async () => {
    insertSpec(makeSpec());
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ error: "off", code: "auto_add_documents_disabled" }), {
        status: 403,
      })) as unknown as typeof fetch;
    const result = await syncOneSpecToKnowledgeLibrary(db, "src1::demo", {
      fetchImpl,
      fileReader: async () => null,
    });
    expect(result?.status).toBe("disabled");
    expect(result?.error).toContain("off");
  });

  test("surfaces failed on a non-ok gateway response", async () => {
    insertSpec(makeSpec());
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ error: "boom" }), { status: 500 })) as unknown as typeof fetch;
    const result = await syncOneSpecToKnowledgeLibrary(db, "src1::demo", {
      fetchImpl,
      fileReader: async () => null,
    });
    expect(result?.status).toBe("failed");
    expect(result?.error).toContain("boom");
  });
});
