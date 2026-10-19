import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { McpGatewayHarness, type McpFrame } from "../setup/mcp-gateway-harness.js";

/**
 * Behavioral reproduction of the flaky MCP connections seen under Crew.
 *
 * Each test drives the production `scripts/start-mcp.sh` through a
 * gateway-faithful stdio handshake (initialize + tools/list) and asserts the
 * connection is stable: the server answers, and stdout carries ONLY JSON-RPC.
 * The three historical failure modes — stdout pollution, cwd-dependence, and a
 * pruned node_modules — each get a dedicated test. A regression in any of them
 * reintroduces the probe failures that quarantined the server.
 *
 * These spawn Bun and run `bun install`, so they are slower integration tests.
 */

const EXPECTED_TOOLS = [
  "list_sources",
  "search_specs",
  "get_spec_context",
  "submit_metadata_proposal",
];

function frameById(frames: readonly McpFrame[], id: number): McpFrame | undefined {
  return frames.find((frame) => frame.id === id);
}

function toolNames(toolsListFrame: McpFrame | undefined): string[] {
  const result = (toolsListFrame?.result ?? {}) as { tools?: Array<{ name?: string }> };
  return (result.tools ?? []).map((tool) => tool.name ?? "");
}

describe("MCP stdio probe — stable connection with deps present", () => {
  const harness = new McpGatewayHarness();
  afterAll(() => harness.cleanup());

  test("answers initialize with serverInfo and tools/list with every tool", async () => {
    const probe = await harness.probeFromAppRoot();

    const init = frameById(probe.responses, 1);
    const serverInfo = (init?.result as { serverInfo?: { name?: string } } | undefined)?.serverInfo;
    expect(serverInfo?.name).toBe("spec-library-mcp");

    const names = toolNames(frameById(probe.responses, 2));
    for (const tool of EXPECTED_TOOLS) {
      expect(names).toContain(tool);
    }
  });

  test("stdout is pure JSON-RPC — no banner or log pollutes the stream", async () => {
    const probe = await harness.probeFromAppRoot();

    // The exact failure that corrupted the stream: a non-JSON line on stdout.
    expect(probe.nonJsonStdoutLines).toEqual([]);
    // Every frame on stdout parsed as JSON-RPC.
    expect(probe.responses.length).toBeGreaterThanOrEqual(2);
    for (const frame of probe.responses) {
      expect(frame.jsonrpc).toBe("2.0");
    }
    // The human-readable banner must appear on stderr, never stdout.
    expect(probe.stdout).not.toContain("[mcp]");
    expect(probe.stdout).not.toContain("[start-mcp]");
    expect(probe.stderr).toContain("running on stdio");
  });
});

describe("MCP stdio probe — cwd independence", () => {
  const harness = new McpGatewayHarness();
  afterAll(() => harness.cleanup());

  test("serves clean JSON-RPC when launched from a foreign working directory", async () => {
    // The gateway may spawn the launcher with an arbitrary cwd. A bare relative
    // entry path would fail to resolve; the anchored launcher must not.
    const probe = await harness.probeFromForeignCwd();

    expect(probe.nonJsonStdoutLines).toEqual([]);
    const init = frameById(probe.responses, 1);
    const serverInfo = (init?.result as { serverInfo?: { name?: string } } | undefined)?.serverInfo;
    expect(serverInfo?.name).toBe("spec-library-mcp");
    expect(toolNames(frameById(probe.responses, 2))).toEqual(expect.arrayContaining(EXPECTED_TOOLS));
  });
});

describe("MCP stdio probe — self-heal on a pruned install", () => {
  const harness = new McpGatewayHarness();
  afterAll(() => harness.cleanup());

  test("reinstalls missing node_modules and still serves clean JSON-RPC", async () => {
    // Reproduces the library-install case that quarantined the server: a copy
    // with no node_modules at all. A correct launcher runs `bun install` on
    // stderr and still answers the probe on stdout.
    const probe = await harness.probeWithPrunedDeps();

    // The self-heal ran, and its output stayed on stderr.
    expect(probe.stderr).toMatch(/bun install/i);
    expect(existsSync(join(probe.appCopy, "node_modules"))).toBe(true);

    // The install output did NOT leak onto stdout.
    expect(probe.nonJsonStdoutLines).toEqual([]);

    // And the server served a healthy handshake after healing.
    const init = frameById(probe.responses, 1);
    const serverInfo = (init?.result as { serverInfo?: { name?: string } } | undefined)?.serverInfo;
    expect(serverInfo?.name).toBe("spec-library-mcp");
    expect(toolNames(frameById(probe.responses, 2))).toEqual(expect.arrayContaining(EXPECTED_TOOLS));
  }, 180_000);
});
