import type { Database } from "bun:sqlite";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import fc from "fast-check";

import { DEFAULT_SCAN_INTERVAL_MS } from "../../shared/src/constants.js";
import { createDatabase } from "../../backend/src/db/connection.js";
import { runMigrations } from "../../backend/src/db/migrator.js";
import { createRouter } from "../../backend/src/router.js";

const root = resolve(import.meta.dir, "../..");
const launcher = join(root, "scripts", "start-backend.sh");
const backendEntry = join(root, "backend", "src", "index.ts");

let dataDir: string;
let db: Database;
let app: ReturnType<typeof createRouter>;

function apiRequest(path: string, token?: string): Promise<Response> {
  const headers = token === undefined ? undefined : { "X-MCP-Token": token };
  return app.handle(new Request(`http://localhost/api${path}`, { headers }));
}

function unusedPort(): number {
  for (let port = 19100; port < 19200; port += 1) {
    const result = Bun.spawnSync(["lsof", "-ti", `tcp:${port}`]);
    if (new TextDecoder().decode(result.stdout).trim() === "") return port;
  }
  throw new Error("Unable to reserve a test port");
}

async function waitForHealth(port: number): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.status === 200) return response;
    } catch (error) {
      lastError = error;
    }
    await Bun.sleep(50);
  }
  throw new Error(`Backend did not become healthy: ${String(lastError)}`);
}

beforeAll(async () => {
  dataDir = mkdtempSync(join(tmpdir(), "gateway-preservation-"));
  db = createDatabase(dataDir);
  await runMigrations(db);
  app = createRouter({
    db,
    scanner: { triggerScan: async () => ({}) } as any,
    archiver: { createSnapshot: async () => ({}) } as any,
    ready: () => true,
    dataDir,
    mcpToken: "preservation-token",
    enforceMcpAuth: true,
  });
});

afterAll(() => {
  db?.close();
  rmSync(dataDir, { recursive: true, force: true });
});

/**
 * Property 2: preservation of behavior outside the gateway-supervised launcher.
 * These assertions establish the unfixed-launcher baseline that Task 3 must retain.
 */
describe("gateway launcher preservation baseline", () => {
  /** Validates: Requirements 3.1 */
  test("API response status and body shape remain stable for public and token-guarded endpoints", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constantFrom("/health", "/bootstrap", "/specs"), async (path) => {
        const anonymous = await apiRequest(path);
        const authenticated = await apiRequest(path, "preservation-token");

        if (path === "/health") {
          expect(anonymous.status).toBe(200);
          expect(await anonymous.json()).toEqual({ status: "ok" });
        } else {
          expect(anonymous.status).toBe(401);
          expect(await anonymous.json()).toMatchObject({ code: "UNAUTHORIZED" });
          expect(authenticated.status).toBe(200);
          expect(await authenticated.json()).toEqual(expect.any(Object));
        }
      }),
      { numRuns: 30 },
    );
  });

  /** Validates: Requirements 3.2 */
  test("migrations preserve the complete SQLite schema and remain idempotent", async () => {
    const before = db
      .query<{ name: string; sql: string | null }, []>(
        "SELECT name, sql FROM sqlite_master WHERE type IN ('table', 'index') ORDER BY name",
      )
      .all();
    const migrationRows = db
      .query<{ number: number; name: string }, []>("SELECT number, name FROM _migrations ORDER BY number")
      .all();

    await runMigrations(db);

    expect(db.query("SELECT name, sql FROM sqlite_master WHERE type IN ('table', 'index') ORDER BY name").all()).toEqual(before);
    expect(db.query("SELECT number, name FROM _migrations ORDER BY number").all()).toEqual(migrationRows);
    expect(migrationRows).toHaveLength(10);
  });

  /** Validates: Requirements 3.3 */
  test("the periodic scanner retains its fifteen-minute schedule", () => {
    expect(DEFAULT_SCAN_INTERVAL_MS).toBe(15 * 60 * 1000);
    const entrypoint = readFileSync(backendEntry, "utf8");
    expect(entrypoint).toContain("}, DEFAULT_SCAN_INTERVAL_MS);");
  });

  /** Validates: Requirements 3.4 */
  test("standalone launch preserves MCP token location, permissions, and health behavior", async () => {
    const port = unusedPort();
    const standaloneDataDir = mkdtempSync(join(tmpdir(), "gateway-standalone-"));
    const env = { ...process.env, SPEC_LIBRARY_STANDALONE: "1", SPEC_LIBRARY_PORT: String(port), SPEC_LIBRARY_DATA_DIR: standaloneDataDir };
    delete env.PORT;

    const launcherProcess = Bun.spawn(["bash", launcher], {
      cwd: root,
      env,
      stdout: "pipe",
      stderr: "pipe",
    });
    try {
      const health = await waitForHealth(port);
      expect(await health.json()).toEqual({ status: "ok" });

      const tokenPath = join(standaloneDataDir, "mcp-token");
      expect(existsSync(tokenPath)).toBe(true);
      expect(statSync(tokenPath).mode & 0o777).toBe(0o600);
      expect(readFileSync(tokenPath, "utf8").trim()).not.toBe("");
    } finally {
      if (launcherProcess.exitCode === null) launcherProcess.kill("SIGTERM");
      await launcherProcess.exited;
      rmSync(standaloneDataDir, { recursive: true, force: true });
    }
  });
});
