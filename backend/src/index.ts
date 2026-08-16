// Backend entry point — server startup sequence (Task 12.1)
import { mkdirSync, writeFileSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { createDatabase } from "./db/connection.js";
import { runMigrations } from "./db/migrator.js";
import { createRouter } from "./router.js";
import { ScannerService } from "./services/scanner.js";
import { ArchiverService } from "./services/archiver.js";
import { listSources } from "./db/queries/sources.js";
import { DEFAULT_SCAN_INTERVAL_MS } from "@kiro-spec-library/shared";
import type { Source } from "@kiro-spec-library/shared";

// ─── Configuration ───────────────────────────────────────────────────────────

const port = Number(process.env["PORT"]) || Number(process.env["SPEC_LIBRARY_PORT"]) || 3100;
const dataDir = process.env["SPEC_LIBRARY_DATA_DIR"] || join(process.cwd(), "data");
const archiveDir = join(dataDir, "archive");

// ─── Startup Sequence ────────────────────────────────────────────────────────

console.log("[startup] Kiro Spec Library backend starting...");

// 1. Generate MCP token for inter-process auth
const mcpToken = crypto.randomUUID();
console.log(`[startup] MCP token generated: ${mcpToken.slice(0, 8)}...`);
const enforceMcpAuth = process.env["MCP_AUTH_ENFORCE"] === "1";

// 2. Ensure directories exist
mkdirSync(dataDir, { recursive: true });
mkdirSync(archiveDir, { recursive: true });

// The MCP server runs as a separate OS process with no shared memory, so
// the only way it can learn the real token is by reading it from disk.
const mcpTokenPath = join(dataDir, "mcp-token");
writeFileSync(mcpTokenPath, mcpToken, { mode: 0o600 });
chmodSync(mcpTokenPath, 0o600);

// 3. Open database connection (WAL mode, integrity check)
console.log("[startup] Opening database...");
const db = createDatabase(dataDir);

// 4. Run migrations
console.log("[startup] Running migrations...");
runMigrations(db);

// 5. Initialize services
const archiver = new ArchiverService(db, { archiveDir });
const scanner = new ScannerService(db, dataDir, archiver);

// 6. Readiness flag
let isReady = false;

// 7. Create and start Elysia server
const app = createRouter({
  db,
  scanner,
  archiver,
  ready: () => isReady,
  dataDir,
  mcpToken,
  enforceMcpAuth,
});

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`[startup] Server listening on port ${server.port}`);

// 8. Trigger initial scan (non-blocking)
(async () => {
  try {
    const sources = listSources(db) as unknown as Source[];
    if (sources.length > 0) {
      console.log(`[startup] Triggering initial scan of ${sources.length} source(s)...`);
      await scanner.triggerScan(sources);
      console.log("[startup] Initial scan complete");
    } else {
      console.log("[startup] No sources configured — skipping initial scan");
    }
  } catch (err) {
    console.error("[startup] Initial scan failed:", err);
  } finally {
    isReady = true;
    console.log("[startup] Backend ready");
  }
})();

// 9. Schedule periodic scans
const scanInterval = setInterval(async () => {
  try {
    const sources = listSources(db) as unknown as Source[];
    if (sources.length > 0) {
      await scanner.triggerScan(sources);
    }
  } catch (err) {
    console.error("[scan] Periodic scan failed:", err);
  }
}, DEFAULT_SCAN_INTERVAL_MS);

// 10. Graceful shutdown
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

function shutdown(signal: string): void {
  console.log(`[shutdown] Received ${signal}, shutting down...`);
  clearInterval(scanInterval);
  server.stop();
  db.close();
  console.log("[shutdown] Clean shutdown complete");
  process.exit(0);
}

// Export for testing
export { app, db, mcpToken };
