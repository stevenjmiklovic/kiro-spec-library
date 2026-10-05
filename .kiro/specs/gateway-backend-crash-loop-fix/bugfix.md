# Bugfix Requirements Document

## Introduction

> **Correction (actual root cause and fix).** The crash-loop notifications were *not* caused by the gateway's supervision of the backend. They were emitted by a separate userspace cron job (`spec-library-backend-watchdog`, id `b52e51e1`, every 60s) whose health probe targeted the wrong URL — `http://localhost:3100/apps/kiro-spec-library/api/v1/health` — while the gateway-managed backend was healthy on its allocated port (9103) at `/api/health`. The probe failed every minute regardless of backend health, launched a redundant standalone instance, and posted "backend was down — restarted it," even though the supervised PID never changed. **The fix was to remove that redundant watchdog cron (`kirocrew cron remove b52e51e1`); the gateway already supervises the backend natively.** The launcher-hardening work below is sound defensive hardening but did not address the observed flap.

The Spec Library plugin (`kiro-spec-library`) crashes and restarts in a continuous loop. The KiroCrew dashboard surfaces this to the user as a recurring notification, roughly once per minute: "⚡ Spec Library backend was down — restarted it." The app is effectively unstable and its API is intermittently unavailable while the gateway tears down and re-spawns the backend.

The crash-loop *symptom* is the gateway's restart flap. The underlying *defect* is in the supervision/PID contract of the app's `backend.type: "exec"` launcher, `scripts/start-backend.sh`: the launcher can let the PID the gateway supervises diverge from the actual Bun JS runtime / HTTP listener, or allow an un-supervised second instance to survive restarts. The gateway (port 5476 — the platform, not editable in this repo) supervises each backend by the PID recorded in `app_backends.pids.json`, proxies `/apps/kiro-spec-library/api/*` to it, and health-checks `/api/health`; when the recorded PID dies or health fails, it restarts the backend and emits the notification.

The fix direction is to **stay on the Bun runtime** and keep `backend.type: "exec"`, and to **harden the supervision/PID contract in `scripts/start-backend.sh`** so the gateway always supervises exactly one process whose recorded PID is the real `bun` runtime and HTTP listener. The launcher already does the right things in outline — it uses `exec "$BUN" "$DIST"` (not `bun run`), guards against a missing `PORT`, and kills stale port holders before exec — so this bugfix makes that contract airtight rather than rewriting the runtime. We explicitly do NOT migrate to `type: "node"`, and do NOT swap `Bun.serve` or `bun:sqlite`; the separate `node-backend-migration` spec is NOT the chosen path for this bugfix.

## Bug Analysis

### Reproduction

1. Install/enable `kiro-spec-library` in a KiroCrew gateway (port 5476) with `backend.type: "exec"` and `entryPoint: scripts/start-backend.sh`.
2. Let the gateway supervise the backend: it spawns the script, records a PID in `app_backends.pids.json`, proxies `/apps/kiro-spec-library/api/*` to the backend, and polls `/api/health`.
3. Observe the dashboard over several minutes.

**Observed:** The "backend was down — restarted it" notification fires on a roughly 1-minute cadence as the gateway repeatedly judges the backend down and re-spawns it.

### Root Cause

The gateway supervises the PID it recorded for the launched process and restarts the backend when either that PID dies or `/api/health` fails. The supervised PID is produced by `scripts/start-backend.sh`, whose own header documents two prior incidents sharing one failure family — the supervised PID and the real listener diverge, or an un-proxied/un-supervised second instance is created:

- A gateway re-spawn with `KIROCREW_BOUND_PORT` set but `PORT` unset previously fell back to a hardcoded port, creating a backend the gateway never allocated, never proxies to, and never reaps — which flapped "~every minute."
- A `bun run`-style launcher forks the script as a child; the gateway records the launcher PID, so on `SIGTERM` the forked child can be orphaned and re-parented to launchd, surviving restarts and racing the correctly-supervised instance. `_reap_stale_app_backends` only reaps the recorded PID, so an un-recorded child is never reaped.

The common root cause is a weak supervision/PID contract in the shell launcher: nothing structurally guarantees that the recorded PID is the live `bun` listener, that no second instance can bind an un-allocated port, or that a `SIGTERM` to the recorded PID leaves zero listeners and zero orphaned children. The launcher's current `exec bun` form and PORT-required guard address the known cases but must be hardened into an airtight contract so no intermediate fork/subshell can become the recorded PID and no preamble step (build-if-stale, `kill_port`) can spawn a survivor.

### Impact

- User-visible instability: a recurring (~1/min) failure notification on the dashboard.
- Intermittent API unavailability during each teardown/re-spawn window.
- Risk of orphaned/duplicate backend instances squatting ports and racing the supervised instance, surviving gateway restarts.

### Current Behavior (Defect)

1.1 WHEN the gateway supervises the `type: "exec"` backend launched via `scripts/start-backend.sh` THEN the gateway periodically judges the backend down and restarts it, emitting the "backend was down — restarted it" notification on a roughly 1-minute cadence

1.2 WHEN the shell launcher reaches the runtime through an intermediate fork, subshell, or `bun run`-style launcher THEN the PID recorded in `app_backends.pids.json` is not reliably the actual `bun` JS runtime and HTTP listener, so the supervised PID and the live listener can diverge

1.3 WHEN the backend is launched without a gateway-allocated `PORT` (e.g. a re-spawn with `KIROCREW_BOUND_PORT` set but `PORT` unset, or a hand-launch) THEN the system can fall back to a hardcoded port and create an un-proxied, un-supervised second backend instance that survives gateway restarts and races the supervised instance

1.4 WHEN the gateway sends `SIGTERM` to the recorded PID THEN a forked/orphaned child process (or a survivor spawned by the launcher's preamble) can be re-parented to launchd and continue listening, leaving a stale listener on the port that the gateway's reaper (which only reaps the recorded PID) never cleans up

### Expected Behavior (Correct)

2.1 WHEN the gateway supervises the backend THEN the system SHALL run exactly one supervised process whose recorded PID is the actual `bun` runtime and HTTP listener — reached via a single `exec "$BUN"` with no intermediate fork, subshell, or `bun run`-style launcher that could become the recorded PID — so the gateway no longer judges it down and no restart-flap notification is emitted under normal operation

2.2 WHEN the backend is launched THEN the system SHALL remain on the Bun runtime with `backend.type: "exec"` and `scripts/start-backend.sh` as the entry point, keeping `Bun.serve` and `bun:sqlite`, and SHALL harden the launcher's supervision/PID contract rather than migrating to `type: "node"`

2.3 WHEN the backend is launched under the gateway THEN the system SHALL bind only the gateway-allocated `PORT` and SHALL NOT fall back to a hardcoded port under gateway launch, so no additional un-proxied or un-supervised backend instance is ever created

2.4 WHEN the gateway sends `SIGTERM` to the recorded PID THEN the system SHALL terminate cleanly, leaving zero processes listening on the port and zero orphaned child processes — the exec'd `bun` is the process the gateway signals directly, and the build-if-stale and `kill_port` preamble SHALL run strictly BEFORE `exec` and SHALL NOT leave any surviving background process

2.5 WHEN the backend has completed startup THEN the system SHALL respond to `/api/health` with HTTP 200 once ready, and the gateway SHALL NOT enter a restart loop

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a client calls any `/apps/kiro-spec-library/api/*` endpoint THEN the system SHALL CONTINUE TO return the same responses with 100% API parity (routes, request/response shapes, and the `X-MCP-Token` guard that exempts `/health`)

3.2 WHEN the backend reads or writes its data store THEN the system SHALL CONTINUE TO preserve 100% data parity (existing database contents, archive snapshots, and migrations behave identically)

3.3 WHEN the backend performs its periodic scan THEN the system SHALL CONTINUE TO run the scan on the existing schedule with unchanged behavior

3.4 WHEN the MCP server reads the on-disk MCP token to authenticate THEN the system SHALL CONTINUE TO generate and expose the token with the same path and permissions, preserving inter-process auth

## Bug Condition Methodology

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type BackendLaunch   // a launch/supervision of the app backend by the gateway
  OUTPUT: boolean

  // The bug class is triggered whenever the backend is launched via the
  // type:"exec" shell launcher, where a weak supervision/PID contract lets the
  // recorded PID diverge from the real bun listener, or an un-supervised
  // instance be created, or an orphan survive SIGTERM.
  RETURN X.backendType = "exec"
         AND X.entryPoint = "scripts/start-backend.sh"
END FUNCTION
```

### Property Specification (Fix Checking)

```pascal
// Property: Fix Checking — one supervised process = the real bun listener;
// no second instance; clean teardown; no flap. F' is the HARDENED Bun exec
// launcher (still type:"exec", still Bun), NOT a node migration.
FOR ALL X WHERE isBugCondition(X) DO
  result ← launchAndSupervise'(X)
  ASSERT result.supervisedPid = result.bunListenerPid        // recorded PID IS the real bun runtime/listener
     AND result.extraInstances = 0                           // no un-proxied/un-supervised second instance
     AND result.healthStatusWhenReady = 200                  // /api/health returns 200 once ready
     AND result.restartFlap = false                          // gateway does not loop-restart
     AND afterSigterm(result).listenersOnPort = 0            // SIGTERM leaves zero listeners
     AND afterSigterm(result).orphanedChildren = 0           // and zero orphaned children
END FOR
```

### Preservation Goal (Preservation Checking)

```pascal
// Property: Preservation Checking — all app behavior/API/data is identical for non-buggy inputs
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)   // API responses, data store contents, scan behavior, and MCP auth unchanged
END FOR
```

**Definitions**
- **F**: the original app behavior under the unhardened `type: "exec"` shell launcher, where the supervision/PID contract can break.
- **F'**: the fixed app behavior under the **hardened** `type: "exec"` Bun launcher — same runtime (Bun, `Bun.serve`, `bun:sqlite`), same entry point (`scripts/start-backend.sh`), with an airtight supervision/PID contract. F' is NOT the `node-backend-migration` path.
- **Counterexample**: the gateway supervising `scripts/start-backend.sh` and recording a PID that is not the live `bun`/`Bun.serve` listener (via an intermediate fork/`bun run` launcher), or a hardcoded-port fallback spawning an un-proxied second instance, or a `SIGTERM`-orphaned child re-parented to launchd — any of which makes the gateway judge the backend down and re-spawn it ~once per minute.
- **Resolution**: harden the launcher while staying on Bun — guarantee a single `exec "$BUN" "$DIST"` with no intermediate process that could become the recorded PID, no hardcoded-port fallback under gateway launch, and a preamble (build-if-stale, `kill_port`) that runs before `exec` and leaves no survivors, so the recorded PID is always the real listener and `SIGTERM` leaves zero listeners and zero orphans.
