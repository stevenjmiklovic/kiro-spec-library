# Gateway Backend Crash-Loop Fix — Bugfix Design

## Overview

The `kiro-spec-library` backend, launched by the KiroCrew gateway as a
`backend.type: "exec"` process via `scripts/start-backend.sh`, flaps in a
restart loop: roughly once a minute the gateway judges the backend down and
re-spawns it, surfacing "⚡ Spec Library backend was down — restarted it" on
the dashboard. The crash-loop is the *symptom*; the *defect* is a weak
supervision/PID contract in the shell launcher — the PID the gateway records
in `app_backends.pids.json` can diverge from the live `bun` runtime / HTTP
listener, an un-proxied second instance can bind a hardcoded port, or a child
spawned by the launcher's preamble can survive `SIGTERM` and be re-parented to
launchd.

The fix stays on the Bun runtime and keeps `backend.type: "exec"` with
`scripts/start-backend.sh` as the entry point. We keep `Bun.serve` and
`bun:sqlite` and do **not** migrate to `type: "node"` (that is the separately
tracked `node-backend-migration` spec, explicitly not the path here). Instead
we harden the launcher's supervision/PID contract so that the recorded PID is
*structurally guaranteed* to be the real `bun` listener: a single
`exec "$BUN" "$DIST"` as the final action with nothing after it, no
intermediate fork/subshell/`bun run` that could become the recorded PID, no
hardcoded-port fallback under gateway launch, and a preamble (build-if-stale,
`kill_port`) that runs strictly before `exec` and leaves no survivor.

The current launcher already does the right things in outline — it exports
`PATH`, requires `PORT` (with a `SPEC_LIBRARY_STANDALONE=1` human opt-in),
builds-if-stale, kills stale port holders, and `exec`s `bun` directly. This
bugfix makes that contract airtight rather than rewriting the runtime, and adds
a regression test that proves recorded-PID == listener-PID, clean teardown, and
no flap, plus parity checks proving `F(X) = F'(X)` for all non-buggy inputs.

## Glossary

- **Bug_Condition (C)**: The backend is launched and supervised by the gateway
  through the `type: "exec"` shell launcher (`X.backendType = "exec"` AND
  `X.entryPoint = "scripts/start-backend.sh"`), where a weak supervision/PID
  contract can let the recorded PID diverge from the real listener, allow an
  un-supervised second instance, or let an orphan survive `SIGTERM`.
- **Property (P)**: One supervised process whose recorded PID *is* the live
  `bun` runtime and `Bun.serve` listener; zero extra instances;
  `/api/health` 200 once ready; no restart flap; and `SIGTERM` leaves zero
  listeners and zero orphaned children.
- **Preservation**: All app behavior for non-buggy inputs is unchanged —
  `/apps/kiro-spec-library/api/*` responses (routes, shapes, and the
  `X-MCP-Token` guard that exempts `/health`), the `bun:sqlite` data store and
  archive snapshots and migrations, the periodic scan schedule, and the on-disk
  MCP token path/permissions.
- **Supervised PID**: The PID the gateway records in `app_backends.pids.json`
  for this backend; the gateway health-checks it, signals it on restart, and
  reaps it via `_reap_stale_app_backends` (which reaps *only* the recorded PID).
- **bun listener PID**: The PID of the `bun` process actually running
  `backend/dist/index.mjs` and holding the `Bun.serve` TCP listener on `PORT`.
- **`exec`**: The shell builtin that *replaces* the current shell process image
  with the named program, keeping the same PID. `exec "$BUN" "$DIST"` makes the
  shell's PID become the `bun` PID, so supervised PID == bun listener PID.
- **`start-backend.sh`**: The launcher at `scripts/start-backend.sh` that is the
  `backend.entryPoint`; its preamble prepares the environment and the final
  `exec` becomes the supervised process.
- **PORT**: The gateway-allocated port (auto, 9100–9200) passed as an env var;
  the launcher binds it and the gateway proxies `/apps/kiro-spec-library/api/*`
  to it.
- **`isReady`**: The readiness flag in `backend/src/index.ts`, false until the
  initial scan finishes; gates `/api/health` (503 while starting, 200 ready).

## Bug Details

### Bug Condition

The bug class manifests whenever the backend is launched and supervised by the
gateway through the `type: "exec"` shell launcher. The weak supervision/PID
contract means the launcher can reach the runtime through an intermediate
process so the recorded PID is not the live `bun` listener, can fall back to a
hardcoded port and create an un-proxied second instance, or can leave a
preamble-spawned child that survives `SIGTERM`. Any of these makes the gateway
judge the backend down and re-spawn it on a ~1-minute cadence.

**Formal Specification:**

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type BackendLaunch   // a gateway launch/supervision of the app backend
  OUTPUT: boolean

  // Triggered whenever the backend is launched via the type:"exec" shell
  // launcher, where a weak supervision/PID contract lets the recorded PID
  // diverge from the real bun listener, an un-supervised instance be created,
  // or an orphan survive SIGTERM.
  RETURN X.backendType = "exec"
         AND X.entryPoint = "scripts/start-backend.sh"
END FUNCTION
```

### Examples

- **PID divergence (recorded != listener):** A `bun run`-style launcher starts a
  supervisor and forks the script as a child. The gateway records the launcher
  PID; the real `Bun.serve` listener is the forked child. On `SIGTERM` the child
  is orphaned and re-parented to launchd and keeps listening. *Expected:* the
  recorded PID is the `bun` listener and dies on `SIGTERM`.
- **Un-proxied second instance:** A gateway re-spawn arrives with
  `KIROCREW_BOUND_PORT` set but `PORT` unset; a silent fallback binds a
  hardcoded `3100`. The gateway never allocated, proxies to, or reaps it, so it
  races the supervised instance and flaps ~every minute. *Expected:* with no
  `PORT` and no `SPEC_LIBRARY_STANDALONE=1`, the launcher refuses to start.
- **Preamble survivor:** A build-if-stale or `kill_port` step that backgrounds a
  process (trailing `&`, a watcher) leaves a child alive after `exec`; the
  gateway signals only the exec'd `bun`, so the survivor lingers. *Expected:*
  the entire preamble completes synchronously before `exec` and spawns no
  surviving background process.
- **Clean single-process teardown (edge case — correct):** With a single
  `exec "$BUN" "$DIST"` and a synchronous preamble, `SIGTERM` reaches the exec'd
  `bun` directly; its `index.ts` handler clears the scan interval, stops the
  server, closes the DB, and exits — leaving zero listeners and zero orphans.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

- Every `/apps/kiro-spec-library/api/*` endpoint continues to return the same
  responses with 100% API parity — routes, request/response shapes, and the
  `X-MCP-Token` guard that exempts `/health` (`router.ts` `onBeforeHandle`).
- The `bun:sqlite` data store continues to preserve 100% data parity — existing
  database contents, archive snapshots, and migrations behave identically.
- The periodic scan continues to run on the existing schedule
  (`DEFAULT_SCAN_INTERVAL_MS`, the 15-minute `setInterval` in `index.ts`) with
  unchanged behavior.
- The MCP server continues to read the on-disk MCP token at the same path
  (`<dataDir>/mcp-token`) with the same `0o600` permissions, preserving
  inter-process auth.
- Standalone/dev launch via `SPEC_LIBRARY_STANDALONE=1` continues to work as the
  only human opt-in to the fallback port.

**Scope:**

All inputs where `NOT isBugCondition(X)` holds — any execution that is not a
gateway-supervised launch of the `type: "exec"` `start-backend.sh` backend —
must be completely unaffected by this fix. This includes:

- In-process API handling and routing (the Elysia app and all sub-routes)
- Database reads/writes, migrations, and archive snapshotting
- The scanner's schedule and behavior
- The MCP server process and its token-based authentication

The expected *correct* behavior for buggy inputs is defined in the Correctness
Properties section (Property 1); this section fixes what must **not** change.

## Hypothesized Root Cause

Based on the bug analysis and the launcher's own documented incident history,
the most likely issues are:

1. **Intermediate process becomes the recorded PID**: A `bun run`-style launcher
   (or any fork/subshell wrapping the runtime) makes the gateway record a
   supervisor/wrapper PID instead of the live `Bun.serve` listener. The current
   launcher avoids this with `exec "$BUN" "$DIST"`, but the contract is not yet
   defended against regressions (e.g. someone adding a command after `exec`, or
   switching to `bun run`).
   - The gateway's `_reap_stale_app_backends` reaps only the recorded PID, so any
     un-recorded child is never reaped.

2. **Hardcoded-port fallback under gateway launch**: A re-spawn with
   `KIROCREW_BOUND_PORT` set but `PORT` unset silently binding `3100` creates an
   un-proxied, un-supervised second instance. The launcher now requires `PORT`
   and refuses otherwise, but the invariant (never bind a fallback under gateway
   launch) must be stated and tested so it is not weakened.

3. **Preamble spawns a survivor**: A build-if-stale or `kill_port` step that
   backgrounds work (trailing `&`, a watcher) leaves a child alive after `exec`.
   Because `exec` replaces the shell, the gateway signals only `bun`; a
   backgrounded survivor is never signaled.

4. **`kill_port` race / process-group leakage**: `kill_port` uses
   `lsof -ti` + `kill -9` with a `sleep 0.3`. A `kill -9` can leave a brief
   window where the port is still bound, or `exec`'s `bun` may spawn a child that
   is not in a clean process group, so a stray child could outlive the signaled
   leader on teardown. The exec'd process being a process-group leader bounds the
   blast radius of a group-directed signal.

## Correctness Properties

Property 1: Bug Condition — Single supervised process is the real bun listener

_For any_ launch where the bug condition holds (`isBugCondition` returns true —
a gateway-supervised `type: "exec"` launch via `scripts/start-backend.sh`), the
hardened launcher SHALL run exactly one supervised process whose recorded PID is
the actual `bun` runtime and `Bun.serve` HTTP listener, SHALL create zero extra
backend instances, SHALL respond to `/api/health` with HTTP 200 once ready,
SHALL NOT cause the gateway to enter a restart loop, and on `SIGTERM` SHALL
leave zero processes listening on the port and zero orphaned child processes.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation — All non-launch app behavior is unchanged

_For any_ input where the bug condition does NOT hold (`isBugCondition` returns
false), the fixed code SHALL produce exactly the same result as the original
code — identical `/apps/kiro-spec-library/api/*` responses and the
`X-MCP-Token`/`/health` guard, identical `bun:sqlite` data store contents,
archive snapshots and migrations, identical periodic-scan schedule and behavior,
and an identical on-disk MCP token path and permissions — preserving all API,
data, scan, and inter-process-auth behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Assuming the root-cause analysis is correct, all changes are confined to the
launcher's supervision/PID contract; no runtime, `Bun.serve`, `bun:sqlite`,
router, or data-store code changes.

**File**: `scripts/start-backend.sh`

**Contract**: The script's single job is to prepare the environment synchronously
and then *become* the `bun` listener via one final `exec`. Every element below
exists to guarantee **supervised PID == bun listener PID**.

**Specific Changes**:

1. **Single `exec "$BUN" "$DIST"` as the FINAL action**: The last line of the
   script is `exec "$BUN" "$DIST"` with **no command after it**. `exec` replaces
   the shell process image with `bun`, keeping the same PID — so the PID the
   gateway recorded for the launched script *is* the `bun` runtime and
   `Bun.serve` listener. There is no `bun run` (which forks a supervised child),
   no subshell `( ... )`, no pipeline, and no `&` on the exec line — any of which
   would make an intermediate process the recorded PID. *(Guarantees 2.1; keeps
   Bun / `type: "exec"` per 2.2.)*

2. **Preamble runs strictly BEFORE `exec`, with no survivors**: `PATH` export,
   the `PORT` guard, build-if-stale, and `kill_port` all execute before `exec`
   and must complete synchronously. No step may background a process (no trailing
   `&`, no spawned watcher, no `nohup ... &`); if a build is needed it runs
   synchronously (`"$BUN" build ...`) and finishes before `exec`. After `exec`,
   the shell no longer exists, so any backgrounded child would be orphaned —
   forbidding background work in the preamble closes that door. *(Guarantees 2.4;
   supports 2.1.)*

3. **PORT required — no fallback under gateway launch**: Keep the existing guard:
   if `PORT` is unset, bind the fallback *only* when `SPEC_LIBRARY_STANDALONE=1`
   (the human opt-in the gateway never sets); otherwise print the diagnostic and
   `exit 1`. The gateway always allocates `PORT`, so under gateway launch the
   fallback is unreachable and no un-proxied second instance can be created.
   *(Guarantees 2.3; preserves the `SPEC_LIBRARY_STANDALONE=1` opt-in per 3-scope.)*

4. **Clean SIGTERM path**: Because `exec` makes the gateway signal the `bun`
   process directly (same PID), the existing `SIGTERM` handler in
   `backend/src/index.ts` runs — `clearInterval(scanInterval)`, `server.stop()`,
   `db.close()`, `process.exit(0)`. The design requires the preamble leave no
   re-parentable child so there is nothing else to signal. *(Guarantees 2.4, 2.5.)*

5. **Bound the `kill_port` race and process-group blast radius**: `kill_port`
   runs before `exec` and must settle before `exec` binds the port — keep the
   post-kill settle (the existing `sleep 0.3`) and ensure it reliably frees the
   port so `Bun.serve` does not fail to bind on a `kill -9` race. The hardened
   contract documents that the exec'd `bun` is the process-group leader (an
   `exec`'d process keeps the shell's process group), so a group-directed signal
   from the gateway reaches no stray descendant — and the preamble, by spawning
   no survivor, guarantees there is no descendant to begin with. *(Supports 2.4.)*

**Non-changes (explicit)**: `backend.type` stays `"exec"`; `app.json`'s backend
block (entryPoint, `port: "auto"`, `healthCheck: /api/health`), `dependencies.commands`
(`git`, `bun`), and `setup.onInstall` are unchanged; `Bun.serve`, `bun:sqlite`,
the Elysia router, the MCP token flow, and the scan schedule are untouched.

### Container / Component View (C4)

The hardened launch path and the single point where recorded PID must equal the
listener PID:

```text
KiroCrew gateway supervisor  (port 5476 — platform, not in this repo)
  • allocates PORT (auto 9100–9200)
  • records launched PID in app_backends.pids.json   ◀─ "supervised PID"
  • proxies /apps/kiro-spec-library/api/*  ──▶  backend PORT
  • polls /api/health; on PID death or health fail → restart + notify
  • _reap_stale_app_backends reaps ONLY the recorded PID
        │ spawns backend.entryPoint with PORT in env
        ▼
scripts/start-backend.sh   (the launched process; its PID == supervised PID)
  preamble (ALL before exec, synchronous, no survivors):
    export PATH → PORT guard (require PORT unless SPEC_LIBRARY_STANDALONE=1)
    → build-if-stale (synchronous) → kill_port (lsof+kill -9, settle)
        │ exec "$BUN" "$DIST"   ◀── FINAL action; replaces shell image,
        ▼                            KEEPS THE SAME PID
bun  (backend/dist/index.mjs)
  ★ this PID == supervised PID == bun listener PID  ◀── the invariant
        │ Bun.serve({ port: PORT })
        ▼
Bun.serve HTTP listener on PORT
  • GET /api/health → 503 while !isReady, 200 once ready
  • SIGTERM handler: clearInterval → server.stop → db.close → exit(0)
        │ bun:sqlite
        ▼
bun:sqlite store (<dataDir>/… + archive snapshots)
```

The `★` line is the guarantee the whole contract exists to produce: because the
preamble runs before `exec` and spawns no survivor, and `exec` keeps the PID, the
process the gateway records, health-checks, signals, and reaps is exactly the
`bun` process holding the `Bun.serve` listener.

## Testing Strategy

### Validation Approach

A two-phase approach: first surface counterexamples that demonstrate the bug on
the unhardened launcher, then verify the hardened launcher upholds the contract
and preserves all non-launch behavior. The flagship addition is an
anti-flap / anti-orphan test for the Bun launcher, analogous to the
`node-backend-migration` spec's task 9 but exercising the Bun `exec` path.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE hardening.
Confirm or refute the root-cause hypotheses; if refuted, re-hypothesize.

**Test Plan**: Spawn the backend via the gateway path (or a faithful equivalent:
a harness that sets `PORT` as the gateway does, records the launched PID, polls
`/api/health`, and sends `SIGTERM` to the recorded PID). Run against launcher
variants that reproduce each hypothesized cause and observe failures.

**Test Cases**:

1. **PID-divergence variant**: launch through a `bun run`-style/forking wrapper;
   assert recorded PID != `lsof` listener PID on `PORT` (will fail/diverge on the
   unhardened variant).
2. **Hardcoded-fallback variant**: launch with `KIROCREW_BOUND_PORT` set but
   `PORT` unset and no `SPEC_LIBRARY_STANDALONE`; assert a second instance binds
   the fallback `3100` (reproduces the un-proxied second instance).
3. **Preamble-survivor variant**: launch with a backgrounded preamble step;
   `SIGTERM` the recorded PID and assert a child still listens on `PORT` (orphan
   re-parented, will fail on the variant).
4. **Flap observation (edge case)**: supervise for an observation window and
   count restart notifications; assert > 0 on the unhardened variants.

**Expected Counterexamples**:

- Recorded PID is a wrapper/supervisor, not the `Bun.serve` listener.
- A second un-proxied instance binds a hardcoded port.
- A `SIGTERM`-orphaned child keeps listening.
- Possible causes: `bun run`/fork launcher, silent port fallback, backgrounded
  preamble step, `kill_port` race.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the hardened
launcher produces the expected behavior.

**Pseudocode:**

```pascal
FOR ALL X WHERE isBugCondition(X) DO
  result := launchAndSupervise_fixed(X)
  ASSERT result.supervisedPid = result.bunListenerPid    // recorded PID IS the bun listener
     AND result.extraInstances = 0                        // no second instance
     AND result.healthStatusWhenReady = 200               // /api/health 200 once ready
     AND result.restartFlap = false                       // no loop-restart
     AND afterSigterm(result).listenersOnPort = 0         // SIGTERM leaves zero listeners
     AND afterSigterm(result).orphanedChildren = 0        // and zero orphaned children
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the
fixed code produces the same result as the original.

**Pseudocode:**

```pascal
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT originalBehavior(X) = fixedBehavior(X)   // API, data, scan, MCP auth unchanged
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation
because it generates many inputs across the API/data domain, catches edge cases
manual tests miss, and gives strong guarantees that non-launch behavior is
unchanged. Since the fix touches only `scripts/start-backend.sh` and no
TypeScript, existing backend tests should pass byte-for-byte; parity is also
asserted directly.

**Test Plan**: Observe behavior on the current code first (API responses, DB
contents, scan schedule, MCP token path/permissions), then assert the hardened
launcher reproduces it identically.

**Test Cases**:

1. **API parity**: for a representative set of `/apps/kiro-spec-library/api/*`
   endpoints, assert identical status, body shape, and the `X-MCP-Token`/`/health`
   exemption before and after the fix.
2. **Data parity**: assert identical `bun:sqlite` contents, archive snapshots,
   and post-migration schema before and after.
3. **Scan parity**: assert the periodic scan runs on the same
   `DEFAULT_SCAN_INTERVAL_MS` schedule with unchanged behavior.
4. **MCP token parity**: assert the token file is written to the same
   `<dataDir>/mcp-token` path with `0o600` permissions, preserving inter-process
   auth.
5. **Standalone opt-in parity**: assert `SPEC_LIBRARY_STANDALONE=1` still binds
   the fallback port for local dev.

### Unit Tests

- `start-backend.sh` PORT guard: unset `PORT` + no `SPEC_LIBRARY_STANDALONE`
  exits non-zero and binds nothing; `SPEC_LIBRARY_STANDALONE=1` binds the
  fallback; gateway-style `PORT` binds exactly that port.
- Launcher structure assertions: the final line is `exec "$BUN" "$DIST"` with no
  trailing command, no `bun run`, and no `&`/background construct in the preamble
  (a static check guarding the contract against regression).
- `/api/health`: returns 503 while `isReady` is false and 200 once ready.

### Property-Based Tests

- Generate many gateway-style launches (varying allocated `PORT`) and assert
  recorded PID == `Bun.serve` listener PID and `extraInstances = 0` every time.
- Generate many non-launch API/data operations and assert `F(X) = F'(X)` for
  responses, store contents, and MCP token path/permissions.

### Integration Tests

- **Anti-flap / anti-orphan (flagship, analogous to node-backend-migration task
  9)**: spawn via the gateway path (or faithful equivalent), record the PID,
  assert recorded PID == the PID listening on `PORT`; send `SIGTERM` and assert
  zero listeners remain on the port and zero orphaned children survive; observe
  for a window and assert `/api/health` stays 200 with zero restarts.
- Full launch → health-ready → serve a real API request through the proxy path →
  `SIGTERM` → clean exit, with no second instance at any point.
- Standalone (`SPEC_LIBRARY_STANDALONE=1`) launch serves and shuts down cleanly.

## Architecture Decision Records

The significant choices below are recorded in `design.md` here and should be
mirrored as `docs/adr/ADR-0NN-*.md` files in the repo's existing MADR-style ADR
format (see `docs/adr/ADR-008-gateway-sdk-routing-adapter.md`) when implemented.

### ADR: Harden the Bun `type: "exec"` launcher rather than migrate to `type: "node"`

- **Context**: The crash-loop is a supervision/PID-contract defect in the shell
  launcher, not a Bun runtime defect. A separate `node-backend-migration` spec
  proposes moving to `type: "node"`, but that is a larger, higher-risk change
  that swaps `Bun.serve` and `bun:sqlite`.
- **Decision**: Stay on Bun; keep `backend.type: "exec"`, `scripts/start-backend.sh`,
  `Bun.serve`, and `bun:sqlite`. Fix the bug by making the launcher's
  supervision/PID contract airtight.
- **Consequences**: Minimal blast radius (one shell script), no runtime/data
  migration, and full API/data/scan/MCP parity. `node-backend-migration` remains
  separately tracked and is explicitly not resolved by this bugfix. Trade-off:
  the guarantee lives in shell discipline, so it is defended with structural
  tests rather than a type system.

### ADR: PORT required — no hardcoded fallback under gateway launch

- **Context**: A re-spawn with `KIROCREW_BOUND_PORT` set but `PORT` unset
  previously fell back to `3100`, creating an un-proxied, un-supervised second
  instance that flapped ~every minute.
- **Decision**: Require `PORT`. Bind the fallback only on the explicit human
  opt-in `SPEC_LIBRARY_STANDALONE=1`; otherwise refuse and `exit 1`.
- **Consequences**: Under the gateway the fallback is unreachable, so no second
  instance can be created (Requirement 2.3). Local dev keeps a single opt-in. A
  misconfigured gateway re-spawn now fails loudly instead of silently squatting a
  port.

### ADR: Single-`exec`, no-fork supervision contract

- **Context**: `bun run` (or any fork/subshell) makes the gateway record a
  wrapper PID; the `Bun.serve` listener becomes a child that can be orphaned on
  `SIGTERM` and is never reaped (the reaper reaps only the recorded PID).
- **Decision**: The launcher's final action is a single `exec "$BUN" "$DIST"`
  with no command after it and no `bun run`/subshell/pipeline/`&` that could
  become the recorded PID.
- **Consequences**: The recorded PID *is* the `bun` listener (Requirement 2.1),
  so health checks, signals, and reaping all target the real process. Guarded by
  a structural test to prevent regression.

### ADR: Preamble before `exec`, with no survivors

- **Context**: A preamble step that backgrounds work (trailing `&`, a watcher)
  leaves a child alive after `exec`; since `exec` replaces the shell, the gateway
  signals only `bun` and the survivor lingers / is re-parented to launchd.
- **Decision**: All preamble (`PATH` export, PORT guard, build-if-stale,
  `kill_port`) runs strictly before `exec` and completes synchronously; no step
  may spawn a surviving background process. The exec'd `bun` is the process-group
  leader so no stray descendant can outlive a group-directed signal.
- **Consequences**: `SIGTERM` leaves zero listeners and zero orphaned children
  (Requirements 2.4, 2.5); teardown runs `index.ts`'s clean-shutdown handler.
  Trade-off: a needed build runs synchronously in the launch path, adding
  startup latency when `dist` is stale — acceptable because it is build-if-stale,
  not every launch.

## Requirements Traceability

| Design element | bugfix.md clause |
| --- | --- |
| Single final `exec "$BUN" "$DIST"`, no fork/`bun run` → recorded PID == listener | 2.1 |
| Stay on Bun, `type: "exec"`, `Bun.serve`, `bun:sqlite`; harden not migrate | 2.2 |
| PORT required, no fallback under gateway launch | 2.3 |
| Preamble before `exec`, no survivor; clean `SIGTERM` → 0 listeners / 0 orphans | 2.4 |
| `/api/health` 200 once ready, no restart loop | 2.5 |
| API parity test (routes, shapes, `X-MCP-Token`/`/health` guard) | 3.1 |
| Data parity test (`bun:sqlite`, snapshots, migrations) | 3.2 |
| Scan-schedule parity test (`DEFAULT_SCAN_INTERVAL_MS`) | 3.3 |
| MCP token path/permissions parity test (`<dataDir>/mcp-token`, `0o600`) | 3.4 |
