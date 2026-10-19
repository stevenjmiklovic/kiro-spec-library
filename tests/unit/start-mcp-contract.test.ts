import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "../..");
const launcherPath = join(root, "scripts", "start-mcp.sh");

function executableLines(script: string): string[] {
  return script
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"));
}

/**
 * Static contract for the MCP stdio launcher. These guard the invariants whose
 * violation historically produced flaky Crew connections and eventual
 * quarantine of the MCP server:
 *   - a bare `bun run` launcher that orphans the real server PID,
 *   - a diagnostic printed to stdout that corrupts the JSON-RPC stream,
 *   - a missing self-heal so a pruned node_modules never recovers,
 *   - a missing cwd anchor so a relative entry path fails from a foreign cwd.
 */
describe("start-mcp launcher supervision + stdio contract", () => {
  test("ends by execing Bun on the entry file without a trailing command", () => {
    const lines = executableLines(readFileSync(launcherPath, "utf8"));

    expect(lines.at(-1)).toBe('exec "$BUN" mcp/src/index.ts');
    // `bun run` forks a supervisor; the gateway would record the wrapper PID
    // and the real server could be orphaned on SIGTERM.
    expect(lines.join("\n")).not.toMatch(/\bbun\s+run\b/);
  });

  test("anchors to the app root so a relative entry path resolves from any cwd", () => {
    const lines = executableLines(readFileSync(launcherPath, "utf8"));

    expect(lines).toContainEqual(
      expect.stringContaining('APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"'),
    );
    expect(lines).toContainEqual('cd "$APP_DIR"');
  });

  test("self-heals a missing node_modules before launching", () => {
    const lines = executableLines(readFileSync(launcherPath, "utf8"));
    const text = lines.join("\n");

    // The primary guard must test for a missing node_modules directory and run
    // `bun install` — this is the fix that prevents re-quarantine.
    expect(text).toMatch(/!\s*-d\s+"?node_modules"?/);
    expect(text).toMatch(/"\$BUN"\s+install/);
  });

  test("never writes a diagnostic to stdout — every echo targets stderr", () => {
    const lines = executableLines(readFileSync(launcherPath, "utf8"));
    const echoes = lines.filter((line) => /(^|\s)echo\b/.test(line));

    // There must be at least one diagnostic (so the guard is observable) and
    // every one of them must be redirected to stderr. A bare stdout echo would
    // corrupt the JSON-RPC frame stream and fail the gateway probe.
    expect(echoes.length).toBeGreaterThan(0);
    for (const echo of echoes) {
      expect(echo).toMatch(/>&2\s*$/);
    }
  });

  test("redirects bun install output to stderr so it cannot pollute stdout", () => {
    const lines = executableLines(readFileSync(launcherPath, "utf8"));
    const installLine = lines.find((line) => /"\$BUN"\s+install/.test(line));

    expect(installLine).toBeDefined();
    expect(installLine).toMatch(/>&2\s*$/);
  });

  test("runs under a strict bash mode", () => {
    const lines = executableLines(readFileSync(launcherPath, "utf8"));
    expect(lines).toContain("set -euo pipefail");
  });
});
