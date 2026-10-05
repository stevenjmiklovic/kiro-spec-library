import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { GatewayBackendHarness } from "../setup/gateway-backend-harness.js";

/**
 * Bug-condition exploration for gateway-supervised exec launchers.
 *
 * The same gateway-faithful harness that reproduced historical unsafe launcher
 * variants now runs the hardened production launcher. It records the entry
 * point PID, checks the live listener, and signals that PID exactly as the
 * gateway does.
 *
 * Validates: Requirements 2.1, 2.3, 2.4, 2.5
 */
describe("gateway backend crash-loop — hardened launcher", () => {
  let gateway: GatewayBackendHarness;

  beforeAll(() => {
    gateway = new GatewayBackendHarness();
  });

  afterAll(() => {
    gateway.cleanup();
  });

  test("recorded gateway PID is the listener PID", async () => {
    const launch = gateway.launch("hardened");
    try {
      await gateway.waitForHealth(launch.port);
      expect(gateway.listenerPid(launch.port)).toBe(launch.recordedPid);
    } finally {
      await gateway.sigterm(launch);
    }
  });

  test("missing gateway PORT exits without creating a 3100 listener", async () => {
    const launch = gateway.launchWithoutGatewayPort(gateway.allocateGatewayPort());
    await launch.process.exited;

    expect(launch.process.exitCode).not.toBe(0);
    expect(gateway.listenerPid(3100)).toBeUndefined();
  });

  test("SIGTERM leaves no listener behind", async () => {
    const launch = gateway.launch("hardened");
    try {
      await gateway.waitForHealth(launch.port);
      await gateway.sigterm(launch);
      expect(gateway.listenerPid(launch.port)).toBeUndefined();
    } finally {
      await gateway.sigterm(launch);
    }
  });

  test("supervision observes zero restart/down events", async () => {
    const restarts = await gateway.observeRestartFlaps(gateway.allocateGatewayPort());
    expect(restarts).toBe(0);
  });

  test("flagship: proxy traffic remains healthy with one listener and tears down cleanly", async () => {
    const launch = gateway.launch("hardened");
    const observedChildren: number[] = [];

    try {
      await gateway.waitForHealth(launch.port);
      const deadline = Date.now() + 250;
      let healthChecks = 0;

      while (Date.now() < deadline) {
        const response = await gateway.requestThroughProxy(launch.port, "/api/bootstrap");
        expect(response.status).toBe(200);
        expect(gateway.listenerPids(launch.port)).toEqual([launch.recordedPid]);
        expect(launch.process.exitCode).toBeNull();
        observedChildren.push(...gateway.descendantPids(launch.recordedPid));
        healthChecks += 1;
        await Bun.sleep(25);
      }

      expect(healthChecks).toBeGreaterThan(0);
      await gateway.sigterm(launch);
      expect(gateway.listenerPids(launch.port)).toEqual([]);
      expect(gateway.survivingPids(observedChildren)).toEqual([]);
    } finally {
      await gateway.sigterm(launch);
    }
  });
});
