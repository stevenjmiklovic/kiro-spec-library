import type { Database } from "bun:sqlite";
/**
 * Integration tests for the Sources management flow behind the panel's
 * "Save & rescan" button. These pin the regressions reported when the feature
 * looked ephemeral:
 *
 *   1. GET/PUT /settings/sources must return the canonical camelCase `Source`
 *      shape (`addedAt`, `webUrlTemplate`) — NOT raw snake_case DB rows. The
 *      panel forwards the PUT response straight into POST /sync, whose request
 *      schema requires a non-optional `addedAt`; leaking `added_at` made /sync
 *      422 and no scan ever ran.
 *   2. The exact panel round-trip (PUT then POST /sync with the returned
 *      sources) must be accepted (202), reproducing the "no scan takes place"
 *      report at the boundary that broke.
 *   3. PUT replaces the ENTIRE set (the UI copy promises this), so a removed
 *      source must actually disappear — an upsert-only PUT left it behind,
 *      which read as "the source I removed came back / never changed".
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabase } from "../../backend/src/db/connection.js";
import { runMigrations } from "../../backend/src/db/migrator.js";
import { createRouter } from "../../backend/src/router.js";
import { ArchiverService } from "../../backend/src/services/archiver.js";
import { ScannerService } from "../../backend/src/services/scanner.js";

let dbDir: string;
let db: Database;
let app: { handle: (req: Request) => Promise<Response> };

function url(path: string): string {
  return `http://localhost/api${path}`;
}

function jsonReq(path: string, method: string, body: unknown): Request {
  return new Request(url(path), {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeAll(() => {
  dbDir = mkdtempSync(join(tmpdir(), "sources-int-"));
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
  }) as unknown as { handle: (req: Request) => Promise<Response> };
});

afterAll(() => {
  try {
    db.close();
  } catch {
    /* ignore */
  }
});

describe("Sources — Save & rescan round-trip", () => {
  test("PUT /settings/sources persists and returns the canonical camelCase shape", async () => {
    const putRes = await app.handle(
      jsonReq("/settings/sources", "PUT", [
        {
          id: "my-repo",
          type: "local",
          path: "/Users/someone/code/my-repo",
          addedAt: "2026-09-04T00:00:00.000Z",
        },
      ]),
    );
    expect(putRes.status).toBe(200);
    const putBody = (await putRes.json()) as { sources: Array<Record<string, unknown>> };
    expect(putBody.sources).toHaveLength(1);
    const s = putBody.sources[0];
    if (!s) throw new Error("expected one source");

    // Canonical camelCase — this is what the UI Source type AND /sync expect.
    expect(s.id).toBe("my-repo");
    expect(s.type).toBe("local");
    expect(s.path).toBe("/Users/someone/code/my-repo");
    expect(s.addedAt).toBe("2026-09-04T00:00:00.000Z");
    // Raw DB columns must NOT leak through.
    expect(s).not.toHaveProperty("added_at");
    expect(s).not.toHaveProperty("web_url_template");

    // And a fresh GET returns the same shape (reopen-the-panel path).
    const getRes = await app.handle(new Request(url("/settings/sources")));
    const getBody = (await getRes.json()) as { sources: Array<Record<string, unknown>> };
    expect(getBody.sources).toHaveLength(1);
    expect(getBody.sources[0]).toHaveProperty("addedAt");
    expect(getBody.sources[0]).not.toHaveProperty("added_at");
  });

  test("POST /sync accepts the sources returned by PUT (the panel's exact payload)", async () => {
    // Re-put to get a clean, known set, then feed the RESPONSE straight to /sync
    // exactly as SourcesPanel.handleSaveAndRescan does.
    const putRes = await app.handle(
      jsonReq("/settings/sources", "PUT", [
        {
          id: "my-repo",
          type: "local",
          path: "/Users/someone/code/my-repo",
          addedAt: "2026-09-04T00:00:00.000Z",
        },
      ]),
    );
    const { sources } = (await putRes.json()) as { sources: unknown[] };

    const syncRes = await app.handle(jsonReq("/sync", "POST", { sources }));
    // Before the fix this was 422 (missing camelCase `addedAt`) and no scan ran.
    expect(syncRes.status).toBe(202);
    const syncBody = (await syncRes.json()) as { runId?: string };
    expect(typeof syncBody.runId).toBe("string");
  });

  test("PUT replaces the entire set — removed sources are deleted", async () => {
    // Seed two sources.
    await app.handle(
      jsonReq("/settings/sources", "PUT", [
        { id: "repo-a", type: "local", path: "/x/a", addedAt: "2026-09-04T00:00:00.000Z" },
        { id: "repo-b", type: "local", path: "/x/b", addedAt: "2026-09-04T00:00:01.000Z" },
      ]),
    );

    // Save with only repo-a (repo-b removed in the panel).
    const putRes = await app.handle(
      jsonReq("/settings/sources", "PUT", [
        { id: "repo-a", type: "local", path: "/x/a", addedAt: "2026-09-04T00:00:00.000Z" },
      ]),
    );
    const body = (await putRes.json()) as { sources: Array<{ id: string }> };
    expect(body.sources.map((s) => s.id)).toEqual(["repo-a"]);
    // repo-b must be gone, not lingering from an upsert-only PUT.
    expect(body.sources.some((s) => s.id === "repo-b")).toBe(false);
  });
});
