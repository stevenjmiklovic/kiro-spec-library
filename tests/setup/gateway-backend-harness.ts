import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

export type LauncherVariant = "hardened" | "pid-divergence" | "hardcoded-fallback" | "preamble-survivor" | "flap";

export interface GatewayLaunch {
  readonly port: number;
  readonly recordedPid: number;
  readonly process: ReturnType<typeof Bun.spawn>;
}

/**
 * A faithful, deliberately small model of the gateway contract: it allocates a
 * gateway-range PORT, records the entry-point PID, polls /api/health, and
 * signals only that recorded PID. Tests use intentionally unsafe launcher
 * variants so this harness can surface the historical counterexamples.
 */
export class GatewayBackendHarness {
  readonly root = mkdtempSync(join(tmpdir(), "gateway-backend-harness-"));
  private readonly appRoot = resolve(import.meta.dir, "../..");
  private readonly launcherPath = join(this.appRoot, "scripts", "start-backend.sh");
  private readonly serverPath = join(this.root, "listener.ts");
  private readonly proxyPath = join(this.root, "gateway-proxy.ts");
  private readonly managedPorts = new Set<number>();
  private readonly proxyPort: number;
  private readonly proxyProcess: ReturnType<typeof Bun.spawn>;

  constructor() {
    this.proxyPort = this.allocateProxyPort();
    writeFileSync(
      this.proxyPath,
      `const port = Number(process.env.PROXY_PORT);
const prefix = "/apps/kiro-spec-library";
Bun.serve({
  port,
  fetch: (request) => {
    const url = new URL(request.url);
    const targetPort = url.searchParams.get("__gatewayTargetPort");
    if (!url.pathname.startsWith(prefix) || !targetPort) return new Response("Not found", { status: 404 });
    url.searchParams.delete("__gatewayTargetPort");
    return fetch(\`http://127.0.0.1:\${targetPort}\${url.pathname.slice(prefix.length)}\${url.search}\`);
  },
});
`,
    );
    this.proxyProcess = Bun.spawn([process.execPath, this.proxyPath], {
      env: { ...process.env, PROXY_PORT: String(this.proxyPort) },
      stdout: "ignore",
      stderr: "ignore",
    });

    writeFileSync(
      this.serverPath,
      `const port = Number(process.env.PORT ?? process.argv[2]);
const server = Bun.serve({ port, fetch: () => Response.json({ status: "ok" }) });
process.on("SIGTERM", () => { server.stop(true); process.exit(0); });
process.on("SIGINT", () => { server.stop(true); process.exit(0); });
`,
    );
  }

  allocateGatewayPort(): number {
    for (let port = 9100; port <= 9200; port += 1) {
      if (this.listenerPid(port) === undefined) return port;
    }
    throw new Error("No free gateway-style port in the 9100–9200 range");
  }

  private allocateProxyPort(): number {
    for (let port = 9300; port <= 9400; port += 1) {
      if (this.listenerPid(port) === undefined) return port;
    }
    throw new Error("No free gateway-proxy port in the 9300–9400 range");
  }

  launch(variant: LauncherVariant, port = this.allocateGatewayPort()): GatewayLaunch {
    const isHardened = variant === "hardened";
    const script = isHardened ? this.launcherPath : this.writeVariant(variant);
    const env: Record<string, string | undefined> = {
      ...process.env,
      PORT: String(port),
      ...(isHardened ? { SPEC_LIBRARY_DATA_DIR: join(this.root, `data-${port}`) } : {}),
    };
    if (variant === "hardcoded-fallback") {
      delete env.PORT;
      env.KIROCREW_BOUND_PORT = String(port);
      delete env.SPEC_LIBRARY_STANDALONE;
    }

    const launchedProcess = Bun.spawn(["bash", script], {
      cwd: isHardened ? this.appRoot : this.root,
      env,
      stdout: "ignore",
      stderr: "ignore",
    });
    const listenerPort = variant === "hardcoded-fallback" ? 3100 : port;
    this.managedPorts.add(listenerPort);
    return { port: listenerPort, recordedPid: launchedProcess.pid, process: launchedProcess };
  }

  launchWithoutGatewayPort(port: number): GatewayLaunch {
    const env: Record<string, string | undefined> = {
      ...process.env,
      KIROCREW_BOUND_PORT: String(port),
      SPEC_LIBRARY_DATA_DIR: join(this.root, `missing-port-${port}`),
    };
    delete env.PORT;
    delete env.SPEC_LIBRARY_STANDALONE;
    const launchedProcess = Bun.spawn(["bash", this.launcherPath], {
      cwd: this.appRoot,
      env,
      stdout: "ignore",
      stderr: "ignore",
    });
    this.managedPorts.add(3100);
    return { port, recordedPid: launchedProcess.pid, process: launchedProcess };
  }

  async waitForHealth(port: number, timeoutMs = 2_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        if ((await fetch(`http://127.0.0.1:${port}/api/health`)).status === 200) return;
      } catch {
        // The intentionally unfixed variant has not bound its listener yet.
      }
      await Bun.sleep(25);
    }
    throw new Error(`Backend on port ${port} did not become healthy within ${timeoutMs}ms`);
  }

  listenerPids(port: number): number[] {
    const result = Bun.spawnSync(["lsof", "-tiTCP:" + port, "-sTCP:LISTEN"]);
    return new TextDecoder()
      .decode(result.stdout)
      .trim()
      .split("\n")
      .map(Number)
      .filter((pid) => Number.isSafeInteger(pid) && pid > 0);
  }

  listenerPid(port: number): number | undefined {
    return this.listenerPids(port)[0];
  }

  async requestThroughProxy(port: number, path: string): Promise<Response> {
    return fetch(
      `http://127.0.0.1:${this.proxyPort}/apps/kiro-spec-library${path}${path.includes("?") ? "&" : "?"}__gatewayTargetPort=${port}`,
    );
  }

  descendantPids(parentPid: number): number[] {
    const output = new TextDecoder().decode(Bun.spawnSync(["ps", "-axo", "pid=,ppid="]).stdout);
    const childrenByParent = new Map<number, number[]>();
    for (const line of output.split("\n")) {
      const [pid, ppid] = line.trim().split(/\s+/).map(Number);
      if (!Number.isSafeInteger(pid) || !Number.isSafeInteger(ppid)) continue;
      childrenByParent.set(ppid, [...(childrenByParent.get(ppid) ?? []), pid]);
    }

    const descendants: number[] = [];
    const pending = [...(childrenByParent.get(parentPid) ?? [])];
    while (pending.length > 0) {
      const pid = pending.pop()!;
      descendants.push(pid);
      pending.push(...(childrenByParent.get(pid) ?? []));
    }
    return descendants;
  }

  survivingPids(pids: readonly number[]): number[] {
    return [...new Set(pids)].filter((pid) => {
      try {
        process.kill(pid, 0);
        return true;
      } catch {
        return false;
      }
    });
  }

  async sigterm(launch: GatewayLaunch): Promise<void> {
    try {
      process.kill(launch.recordedPid, "SIGTERM");
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("ESRCH")) throw error;
    }
    await Bun.sleep(100);
  }

  async observeRestartFlaps(port: number, windowMs = 250): Promise<number> {
    const launch = this.launch("hardened", port);
    try {
      await this.waitForHealth(port);
      await Bun.sleep(windowMs);
      return launch.process.exitCode === null ? 0 : 1;
    } finally {
      await this.sigterm(launch);
    }
  }

  cleanup(): void {
    this.proxyProcess.kill("SIGTERM");
    for (const port of this.managedPorts) {
      const pid = this.listenerPid(port);
      if (pid !== undefined) {
        try {
          process.kill(pid, "SIGKILL");
        } catch {
          // The process exited between lsof and kill.
        }
      }
    }
    rmSync(this.root, { recursive: true, force: true });
  }

  private writeVariant(variant: LauncherVariant): string {
    const script = join(this.root, `${variant}.sh`);
    const bun = process.execPath;
    const variants: Record<LauncherVariant, string> = {
      "pid-divergence": `#! /usr/bin/env bash\n"${bun}" "${this.serverPath}" &\nchild=$!\nwait "$child"\n`,
      "hardcoded-fallback": `#! /usr/bin/env bash\n# Historical defect: ignores missing gateway PORT and squats 3100.\nPORT=3100 exec "${bun}" "${this.serverPath}"\n`,
      "preamble-survivor": `#! /usr/bin/env bash\n# Historical defect: background preamble child survives when gateway signals this shell.\n"${bun}" "${this.serverPath}" &\nexec sleep 30\n`,
      flap: `#! /usr/bin/env bash\n# Historical defect: recorded wrapper exits after leaving an unrecorded listener.\n"${bun}" "${this.serverPath}" &\nexit 0\n`,
    };
    writeFileSync(script, variants[variant]);
    chmodSync(script, 0o755);
    return script;
  }
}
