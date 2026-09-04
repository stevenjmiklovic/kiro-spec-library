import type { Database } from "bun:sqlite";
/**
 * Integration tests for GET /settings/browse — the read-only directory-browse
 * endpoint that powers the SourcesPanel folder-picker.
 *
 * This endpoint is security-sensitive: it exposes filesystem structure, so it
 * MUST stay confined to the user's home directory and never list credential /
 * system directories or symlinks that escape home. These tests build the
 * Elysia app in-process (app.handle(new Request(...))) against a synthetic
 * home directory created under a temp dir, exercising the guards directly.
 *
 * Guards under test (hardened in commit 2af9329 after the Amazon Q review):
 *   - confinement to home (paths outside home -> 403)
 *   - blocked directory names (.ssh, .aws, node_modules, … -> excluded / 403)
 *   - symlink-escape: a symlink whose real target is outside home is dropped
 *   - `.kiro/specs` detection surfaced as hasSpecs
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabase } from "../../backend/src/db/connection.js";
import { runMigrations } from "../../backend/src/db/migrator.js";
import { createRouter } from "../../backend/src/router.js";
import { ArchiverService } from "../../backend/src/services/archiver.js";
import { ScannerService } from "../../backend/src/services/scanner.js";

// The /settings/browse endpoint confines browsing to os.homedir(). To test it
// deterministically we point HOME at a synthetic tree we control, then re-import
// the route module so homedir() resolves to it. Bun's os.homedir() reads $HOME
// on POSIX, which is what CI runs on (the app is macos/linux only).

let homeDir: string;
let outsideDir: string;
let db: Database;
let dbDir: string;
let app: { handle: (req: Request) => Promise<Response> };
let originalHome: string | undefined;

function url(path: string): string {
  return `http://localhost/api${path}`;
}

async function browse(path?: string): Promise<{ status: number; body: any }> {
  const qs = path === undefined ? "" : `?path=${encodeURIComponent(path)}`;
  const res = await app.handle(new Request(url(`/settings/browse${qs}`)));
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

beforeAll(() => {
  // Synthetic home tree:
  //   <home>/
  //     project-a/.kiro/specs/    (hasSpecs: true)
  //     project-b/                (hasSpecs: false)
  //     .ssh/                     (blocked)
  //     .aws/                     (blocked)
  //     node_modules/             (blocked)
  //     escape -> <outside>       (symlink escaping home)
  //   <outside>/                  (sibling of home, outside it)
  const root = mkdtempSync(join(tmpdir(), "browse-test-"));
  homeDir = join(root, "home");
  outsideDir = join(root, "outside");
  mkdirSync(homeDir, { recursive: true });
  mkdirSync(outsideDir, { recursive: true });
  mkdirSync(join(homeDir, "project-a", ".kiro", "specs"), { recursive: true });
  mkdirSync(join(homeDir, "project-b"), { recursive: true });
  mkdirSync(join(homeDir, ".ssh"), { recursive: true });
  mkdirSync(join(homeDir, ".aws"), { recursive: true });
  mkdirSync(join(homeDir, "node_modules"), { recursive: true });
  try {
    symlinkSync(outsideDir, join(homeDir, "escape"), "dir");
  } catch {
    // symlink creation can fail in some sandboxes; the escape test guards for it
  }

  originalHome = process.env.SPEC_LIBRARY_BROWSE_ROOT;
  process.env.SPEC_LIBRARY_BROWSE_ROOT = homeDir;

  dbDir = mkdtempSync(join(tmpdir(), "browse-db-"));
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
    mcpToken: "test-mcp-token",
    enforceMcpAuth: false,
  }) as unknown as { handle: (req: Request) => Promise<Response> };
});

afterAll(() => {
  if (originalHome === undefined) process.env.SPEC_LIBRARY_BROWSE_ROOT = undefined;
  else process.env.SPEC_LIBRARY_BROWSE_ROOT = originalHome;
  try {
    db.close();
  } catch {
    /* ignore */
  }
});

describe("GET /settings/browse", () => {
  test("lists immediate subdirectories of home", async () => {
    const { status, body } = await browse();
    expect(status).toBe(200);
    const names = (body.directories as Array<{ name: string }>).map((d) => d.name);
    expect(names).toContain("project-a");
    expect(names).toContain("project-b");
    // home is the root, so no parent
    expect(body.parent).toBeNull();
  });

  test("flags a directory containing .kiro/specs with hasSpecs", async () => {
    const { body } = await browse();
    const dirs = body.directories as Array<{ name: string; hasSpecs: boolean }>;
    const a = dirs.find((d) => d.name === "project-a");
    const b = dirs.find((d) => d.name === "project-b");
    expect(a?.hasSpecs).toBe(true);
    expect(b?.hasSpecs).toBe(false);
  });

  test("excludes blocked directory names from the listing", async () => {
    const { body } = await browse();
    const names = (body.directories as Array<{ name: string }>).map((d) => d.name);
    expect(names).not.toContain(".ssh");
    expect(names).not.toContain(".aws");
    expect(names).not.toContain("node_modules");
  });

  test("drops a symlink whose real target escapes home", async () => {
    const { body } = await browse();
    const names = (body.directories as Array<{ name: string }>).map((d) => d.name);
    // `escape` points at <outside>, which is not inside home -> must not appear.
    expect(names).not.toContain("escape");
  });

  test("navigating INTO a home subdirectory works and exposes a parent", async () => {
    const { status, body } = await browse(join(homeDir, "project-a"));
    expect(status).toBe(200);
    expect(body.parent).toBe(homeDir);
  });

  test("rejects a path outside home with 403", async () => {
    const { status } = await browse(outsideDir);
    expect(status).toBe(403);
  });

  test("rejects a traversal path that escapes home with 403", async () => {
    const { status } = await browse(join(homeDir, "..", "outside"));
    expect(status).toBe(403);
  });

  test("rejects browsing directly into a blocked directory with 403", async () => {
    const { status } = await browse(join(homeDir, ".ssh"));
    expect(status).toBe(403);
  });

  test("returns 404 for a nonexistent path inside home", async () => {
    const { status } = await browse(join(homeDir, "does-not-exist"));
    expect(status).toBe(404);
  });
});
