import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

/**
 * A faithful, deliberately small model of how the Crew gateway spawns and
 * probes a stdio MCP server. The gateway launches `command` + `args` with an
 * arbitrary cwd, writes JSON-RPC frames (one per line) to the child's stdin,
 * reads JSON-RPC frames back from stdout, and treats ANY non-JSON byte on
 * stdout as a corrupt stream (which fails discovery and, after repeated
 * failures, quarantines the server). stderr is diagnostics-only and ignored by
 * the protocol.
 *
 * The flaky-connection failure modes this harness reproduces:
 *   1. stdout pollution — a banner / install log on stdout corrupts JSON-RPC.
 *   2. cwd-dependence — a bare relative entry path fails to resolve from a
 *      foreign cwd, so the probe never gets a response.
 *   3. missing deps — a pruned `node_modules` (common in a library install)
 *      breaks the `@kiro-spec-library/shared` import and the server never
 *      starts, so every probe times out.
 */

export interface McpProbeResult {
  /** Every parsed JSON-RPC frame read from stdout, in order. */
  readonly responses: McpFrame[];
  /** Raw stdout bytes decoded to text (for stdout-purity assertions). */
  readonly stdout: string;
  /** Raw stderr bytes decoded to text (diagnostics / install logs live here). */
  readonly stderr: string;
  /** Lines on stdout that did NOT parse as JSON — must always be empty. */
  readonly nonJsonStdoutLines: string[];
  /** The child's exit code once stdin closed, if it exited. */
  readonly exitCode: number | null;
}

export interface McpFrame {
  jsonrpc?: string;
  id?: number | string | null;
  result?: Record<string, unknown>;
  error?: Record<string, unknown>;
  [key: string]: unknown;
}

const INITIALIZE = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "harness", version: "0" },
  },
};

const TOOLS_LIST = { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} };

export class McpGatewayHarness {
  private readonly appRoot = resolve(import.meta.dir, "../..");
  private readonly launcherPath = join(this.appRoot, "scripts", "start-mcp.sh");
  private readonly managedDirs: string[] = [];

  /**
   * Probe the production launcher exactly as the gateway does, from the real
   * app root with its installed dependencies present.
   */
  async probeFromAppRoot(timeoutMs = 20_000): Promise<McpProbeResult> {
    return this.spawnAndProbe(this.appRoot, timeoutMs);
  }

  /**
   * Probe the launcher from a DIFFERENT working directory, proving the script
   * anchors itself to the app root instead of depending on the gateway's cwd.
   * `bash scripts/start-mcp.sh` is given an absolute path and spawned with a
   * foreign cwd, mirroring a gateway that resolves the script but runs it from
   * elsewhere.
   */
  async probeFromForeignCwd(timeoutMs = 20_000): Promise<McpProbeResult> {
    const foreignCwd = mkdtempSync(join(tmpdir(), "mcp-foreign-cwd-"));
    this.managedDirs.push(foreignCwd);
    return this.spawnAndProbe(foreignCwd, timeoutMs, this.launcherPath);
  }

  /**
   * Copy the repo WITHOUT node_modules into a throwaway dir (a pruned
   * library-style install), then probe. A correct launcher self-heals with
   * `bun install` and still serves clean JSON-RPC; a broken one never responds.
   * Never touches the real repo's node_modules.
   */
  async probeWithPrunedDeps(timeoutMs = 180_000): Promise<McpProbeResult & { appCopy: string }> {
    const copy = mkdtempSync(join(tmpdir(), "mcp-pruned-deps-"));
    this.managedDirs.push(copy);
    const appCopy = join(copy, "app");
    cpSync(this.appRoot, appCopy, {
      recursive: true,
      filter: (src) => {
        const base = src.split("/").pop();
        return base !== "node_modules" && base !== ".git";
      },
    });
    const result = await this.spawnAndProbe(appCopy, timeoutMs);
    return { ...result, appCopy };
  }

  cleanup(): void {
    for (const dir of this.managedDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  /**
   * Spawn the launcher, write the initialize + tools/list handshake to stdin,
   * close stdin, and collect the full stdout/stderr streams. The gateway talks
   * newline-delimited JSON-RPC, so we parse stdout line by line.
   */
  private async spawnAndProbe(
    cwd: string,
    timeoutMs: number,
    scriptArg = "scripts/start-mcp.sh",
  ): Promise<McpProbeResult> {
    const child = Bun.spawn(["bash", scriptArg], {
      cwd,
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
    });

    const handshake = `${JSON.stringify(INITIALIZE)}\n${JSON.stringify(TOOLS_LIST)}\n`;
    child.stdin.write(handshake);
    await child.stdin.flush();

    const stdoutPromise = new Response(child.stdout).text();
    const stderrPromise = new Response(child.stderr).text();

    // Give the server time to answer both frames, then close stdin so the
    // stdio transport sees EOF and the process exits and the streams drain.
    const settle = (async () => {
      const deadline = Date.now() + timeoutMs;
      // Poll until we have seen two JSON frames on stdout or we hit the budget.
      while (Date.now() < deadline) {
        const soFar = await Promise.race([stdoutPromise, Bun.sleep(100).then(() => null)]);
        if (soFar !== null) break;
      }
    })();

    // Close stdin shortly after writing so an idle server shuts down cleanly.
    await Bun.sleep(1_000);
    await child.stdin.end();
    await settle;

    const timeout = Bun.sleep(timeoutMs).then(() => "timeout" as const);
    await Promise.race([child.exited, timeout]);
    if (child.exitCode === null) child.kill("SIGTERM");

    const [stdout, stderr] = await Promise.all([stdoutPromise, stderrPromise]);
    const { responses, nonJsonStdoutLines } = parseStdout(stdout);

    return { responses, stdout, stderr, nonJsonStdoutLines, exitCode: child.exitCode };
  }
}

/**
 * Parse stdout as newline-delimited JSON. Any non-empty line that does not
 * parse is a protocol-corrupting pollutant and is collected separately so tests
 * can assert there were none.
 */
function parseStdout(stdout: string): { responses: McpFrame[]; nonJsonStdoutLines: string[] } {
  const responses: McpFrame[] = [];
  const nonJsonStdoutLines: string[] = [];
  for (const line of stdout.split("\n")) {
    if (line.trim() === "") continue;
    try {
      responses.push(JSON.parse(line) as McpFrame);
    } catch {
      nonJsonStdoutLines.push(line);
    }
  }
  return { responses, nonJsonStdoutLines };
}
