import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "../..");
const launcher = join(root, "scripts", "start-backend.sh");
const managedProcesses: ReturnType<typeof Bun.spawn>[] = [];
const managedDataDirs: string[] = [];

function listenerPids(port: number): number[] {
  const result = Bun.spawnSync(["lsof", "-tiTCP:" + port, "-sTCP:LISTEN"]);
  return new TextDecoder()
    .decode(result.stdout)
    .trim()
    .split("\n")
    .map(Number)
    .filter((pid) => Number.isSafeInteger(pid) && pid > 0);
}

function unusedPort(excluded: readonly number[] = []): number {
  for (let port = 19300; port < 19400; port += 1) {
    if (!excluded.includes(port) && listenerPids(port).length === 0) return port;
  }
  throw new Error("Unable to reserve a controlled test port");
}

function launch(env: Record<string, string | undefined>): ReturnType<typeof Bun.spawn> {
  const dataDir = mkdtempSync(join(tmpdir(), "start-backend-port-guard-"));
  managedDataDirs.push(dataDir);
  const child = Bun.spawn(["bash", launcher], {
    cwd: root,
    env: { ...process.env, ...env, SPEC_LIBRARY_DATA_DIR: dataDir },
    stdout: "ignore",
    stderr: "ignore",
  });
  managedProcesses.push(child);
  return child;
}

async function waitForListener(port: number): Promise<void> {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    if (listenerPids(port).length > 0) return;
    await Bun.sleep(25);
  }
  throw new Error(`Backend did not listen on port ${port}`);
}

afterEach(async () => {
  for (const child of managedProcesses.splice(0)) {
    if (child.exitCode === null) child.kill("SIGTERM");
    await child.exited;
  }
  for (const dataDir of managedDataDirs.splice(0)) {
    rmSync(dataDir, { recursive: true, force: true });
  }
});

describe("start-backend PORT guard", () => {
  /** Validates: Requirements 2.3 */
  test("refuses a launch without PORT or standalone opt-in and binds no fallback port", async () => {
    const configuredFallback = unusedPort();
    const defaultFallbackBefore = listenerPids(3100);
    const configuredFallbackBefore = listenerPids(configuredFallback);
    const process = launch({ SPEC_LIBRARY_PORT: String(configuredFallback), PORT: undefined, SPEC_LIBRARY_STANDALONE: undefined });

    await process.exited;

    expect(process.exitCode).not.toBe(0);
    expect(listenerPids(3100)).toEqual(defaultFallbackBefore);
    expect(listenerPids(configuredFallback)).toEqual(configuredFallbackBefore);
  });

  /** Validates: Requirements 2.3 */
  test("binds the explicit standalone fallback when PORT is unset", async () => {
    const fallbackPort = unusedPort();
    const process = launch({ SPEC_LIBRARY_STANDALONE: "1", SPEC_LIBRARY_PORT: String(fallbackPort), PORT: undefined });

    await waitForListener(fallbackPort);

    expect(listenerPids(fallbackPort)).toEqual([process.pid]);
  });

  /** Validates: Requirements 2.3 */
  test("binds exactly the gateway-provided PORT and no configured fallback", async () => {
    const gatewayPort = unusedPort();
    const fallbackPort = unusedPort([gatewayPort]);
    const process = launch({ PORT: String(gatewayPort), SPEC_LIBRARY_PORT: String(fallbackPort), SPEC_LIBRARY_STANDALONE: undefined });

    await waitForListener(gatewayPort);

    expect(listenerPids(gatewayPort)).toEqual([process.pid]);
    expect(listenerPids(fallbackPort)).toEqual([]);
  });
});
