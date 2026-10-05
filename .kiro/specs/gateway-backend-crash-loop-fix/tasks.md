# Implementation Plan

## Overview

This plan hardens `scripts/start-backend.sh`'s supervision/PID contract while staying on Bun, following an explore -> preserve -> fix -> validate flow: first reproduce the crash-loop on the unhardened launcher, lock in parity for all non-launch behavior, then apply the single launcher fix and validate it against both test sets.

Scope guard (do not deviate): stay on Bun, keep `backend.type: "exec"` and
`scripts/start-backend.sh`, keep `Bun.serve` and `bun:sqlite`. The ONLY
production code change is hardening `scripts/start-backend.sh` per the design's
five contract elements. No task migrates to `type: "node"` or touches
`Bun.serve`/`bun:sqlite`/`router.ts`. All test and script work lives under
`tests/` and `scripts/`; harness helpers for launching the backend the
gateway way go under `tests/setup/`.

## Tasks

- [x] 1. Write bug condition exploration test — reproduce the crash-loop on the unhardened launcher

  - **Property 1: Bug Condition** - Supervised PID / listener divergence, un-proxied second instance, and SIGTERM orphan
  - **IMPORTANT**: Write this test BEFORE hardening `scripts/start-backend.sh`. Do NOT fix the script or the test when it fails.
  - **CRITICAL**: This test MUST FAIL / demonstrate the bug on the unhardened launcher variants — failure confirms the bug exists.
  - **NOTE**: This test encodes the expected behavior from Property 1; it will validate the fix once it passes in task 3.2.
  - **GOAL**: Surface the counterexamples the design lists so the root cause is understood before any change.
  - Add a gateway-faithful harness under `tests/setup/` that launches the backend the way the gateway does: sets `PORT` (gateway-style, 9100–9200 range), records the launched PID (the script's own PID, as the gateway would in `app_backends.pids.json`), polls `/api/health` until ready, and sends `SIGTERM` to the recorded PID.
  - Add a bug-reproduction integration test under `tests/integration/` (e.g. `gateway-backend-crash-loop.integration.test.ts`) that runs the harness against launcher variants reproducing each hypothesized cause from the design's Examples / Exploratory section:
    - **PID-divergence variant**: launch through a `bun run`-style/forking wrapper; assert recorded PID != the `lsof -ti tcp:$PORT` listener PID (diverges on the unhardened fork path). (_Reproduces design Example "PID divergence"; 2.1_)
    - **Hardcoded-fallback variant**: launch with `KIROCREW_BOUND_PORT` set but `PORT` unset and no `SPEC_LIBRARY_STANDALONE`; assert a second instance binds the hardcoded fallback `3100` (un-proxied second instance). (_Reproduces design Example "Un-proxied second instance"; 2.3_)
    - **Preamble-survivor variant**: launch with a backgrounded preamble step (trailing `&`); `SIGTERM` the recorded PID and assert a child still listens on `PORT` (orphan re-parented). (_Reproduces design Example "Preamble survivor"; 2.4_)
    - **Flap observation (edge case)**: supervise for an observation window and count restart/down events; assert > 0 on the unhardened variants. (_Reproduces design "Flap observation"; 2.5_)
  - Run the test on the UNFIXED launcher variants.
  - **EXPECTED OUTCOME**: Test FAILS / demonstrates the counterexamples (this is correct — it proves the bug exists).
  - Document each counterexample found (recorded PID is a wrapper not the `Bun.serve` listener; a second un-proxied instance on `3100`; a `SIGTERM`-orphaned child still listening) to confirm the root-cause hypotheses.
  - Mark complete when the test is written, run against the unhardened variants, and the failures are documented.
  - _Requirements: 2.1, 2.3, 2.4, 2.5_

- [x] 2. Write preservation property tests (BEFORE hardening the launcher)

  - **Property 2: Preservation** - API / data / scan / MCP-auth parity for all non-launch behavior
  - **IMPORTANT**: Follow observation-first methodology — observe behavior on the CURRENT code first, then assert the hardened launcher reproduces it identically. Since the fix touches only `scripts/start-backend.sh` and no TypeScript, these must pass byte-for-byte before and after.
  - Observe and record current behavior, then write tests asserting it holds (property-based where the input domain fits):
    - **API parity**: for a representative set of `/apps/kiro-spec-library/api/*` endpoints, assert identical status and body shape, and the `X-MCP-Token` guard that exempts `/health` (`router.ts` `onBeforeHandle`). Extend/reuse `tests/integration/api.integration.test.ts`. (_3.1_)
    - **Data parity**: assert identical `bun:sqlite` contents, archive snapshots, and post-migration schema. Reuse `tests/integration/migrations.integration.test.ts` as the migration baseline. (_3.2_)
    - **Scan-schedule parity**: assert the periodic scan runs on the existing `DEFAULT_SCAN_INTERVAL_MS` schedule (the 15-minute `setInterval` in `index.ts`) with unchanged behavior. (_3.3_)
    - **MCP token parity**: assert the token file is written to the same `<dataDir>/mcp-token` path with `0o600` permissions, preserving inter-process auth. Reuse `tests/integration/mcp.integration.test.ts` / the security property suite. (_3.4_)
    - **Standalone opt-in parity**: assert `SPEC_LIBRARY_STANDALONE=1` still binds the fallback port for local dev (the only human opt-in). (_3-scope standalone opt-in_)
  - Prefer property-based tests (fast-check, matching the existing `tests/property/` suites) for the API/data domain so many inputs assert `F(X) = F'(X)`.
  - Run tests on the UNFIXED code.
  - **EXPECTED OUTCOME**: Tests PASS (this confirms the baseline behavior to preserve).
  - Mark complete when tests are written, run, and passing on the unfixed code.
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix the crash-loop — harden the launcher's supervision/PID contract

  - [x] 3.1 Harden `scripts/start-backend.sh` per the design's five contract elements
    - Ensure a single final `exec "$BUN" "$DIST"` as the LAST action with nothing after it, and no `bun run`, subshell `( ... )`, pipeline, or `&` on the exec line — so no intermediate process can become the recorded PID (recorded PID == `bun` runtime == `Bun.serve` listener). (_Design Change 1_) (_2.1_)
    - Keep the runtime on Bun with `backend.type: "exec"` and `scripts/start-backend.sh` as entry point; keep `Bun.serve` and `bun:sqlite`; harden the contract rather than migrate. Make no change to `app.json`'s backend block, `Bun.serve`, `bun:sqlite`, or `router.ts`. (_Design Change / Non-changes_) (_2.2_)
    - Keep the PORT guard: require `PORT`; bind the fallback ONLY when `SPEC_LIBRARY_STANDALONE=1`; otherwise print the diagnostic and `exit 1`. No hardcoded-port fallback is reachable under gateway launch. (_Design Change 3_) (_2.3_)
    - Ensure the entire preamble (PATH export, PORT guard, build-if-stale, `kill_port`) runs strictly BEFORE `exec` and completes synchronously, with no step backgrounding a process (no trailing `&`, no `nohup ... &`, no spawned watcher); a needed build runs synchronously via `"$BUN" build ...` and finishes before `exec`. (_Design Change 2_) (_2.4_)
    - Ensure `kill_port` settles (keep the post-kill `sleep 0.3`) so it reliably frees the port before `Bun.serve` binds, avoiding a `kill -9` race; document that the exec'd `bun` is the process-group leader so a group-directed signal reaches no stray descendant. (_Design Change 5_) (_2.4_)
    - Preserve the clean `SIGTERM` path: because `exec` keeps the PID, the gateway signals `bun` directly and `backend/src/index.ts`'s handler (`clearInterval` → `server.stop()` → `db.close()` → `process.exit(0)`) runs; the no-survivor preamble leaves nothing else to signal. (_Design Change 4_) (_2.4, 2.5_)
    - _Bug_Condition: isBugCondition(X) where X.backendType = "exec" AND X.entryPoint = "scripts/start-backend.sh"_
    - _Expected_Behavior: Property 1 — supervisedPid == bunListenerPid, extraInstances == 0, health 200 when ready, restartFlap == false, SIGTERM leaves 0 listeners / 0 orphans_
    - _Preservation: Preservation Requirements from design (API, data, scan, MCP-auth parity)_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 Verify the bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Single supervised process is the real bun listener
    - **IMPORTANT**: Re-run the SAME test from task 1 against the hardened launcher — do NOT write a new test.
    - Run the exploration test / harness from task 1 against the hardened `scripts/start-backend.sh`.
    - **EXPECTED OUTCOME**: Test PASSES — recorded PID == the PID listening on `PORT`, zero extra instances, `/api/health` 200 once ready, no flap, and `SIGTERM` leaves zero listeners and zero orphaned children.
    - _Requirements: 2.1, 2.3, 2.4, 2.5_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - API / data / scan / MCP-auth parity
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests.
    - Run the preservation property tests from task 2 against the hardened launcher.
    - **EXPECTED OUTCOME**: Tests PASS — no regressions in API responses, data store contents, scan schedule, or MCP token path/permissions.
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Add the structural regression guard for the launcher contract

  - **Property 1: Bug Condition** - Static contract assertion guarding against regression
  - Add a static-check unit test under `tests/unit/` (e.g. `start-backend-contract.test.ts`) that reads `scripts/start-backend.sh` and asserts the supervision/PID contract so it cannot silently regress:
    - the final non-comment line is exactly `exec "$BUN" "$DIST"` with no trailing command after it;
    - the script contains no `bun run` launcher form;
    - the preamble contains no backgrounding construct (`&` at end of a command, `nohup ... &`, spawned watcher) that could leave a survivor.
  - Run against the hardened script and confirm it passes; it must fail if any future edit reintroduces a fork/`bun run`/background construct or a command after `exec`.
  - _Requirements: 2.1_

- [x] 5. Add the anti-flap / anti-orphan integration test (flagship)

  - **Property 1: Bug Condition** - Recorded PID == listener; clean teardown; no restart flap
  - Add a flagship integration test under `tests/integration/` (analogous to the `node-backend-migration` spec's task 9, but exercising the Bun `exec` path) using the task-1 harness:
    - spawn via the gateway path (or faithful equivalent), record the PID, assert recorded PID == the PID listening on `PORT` (`lsof -ti tcp:$PORT`);
    - send `SIGTERM` and assert zero listeners remain on the port and zero orphaned child processes survive;
    - observe for a window and assert `/api/health` stays 200 with zero restarts across the observation window;
    - serve a real API request through the proxy path during the window, and assert no second instance exists at any point.
  - Run against the hardened launcher and confirm green.
  - _Requirements: 2.1, 2.4, 2.5_

- [x] 6. Add PORT-guard unit tests

  - **Property 1: Bug Condition** - No fallback under gateway launch; single opt-in; exact gateway PORT
  - Add unit tests under `tests/unit/` driving `scripts/start-backend.sh` with controlled env:
    - `PORT` unset AND no `SPEC_LIBRARY_STANDALONE` → script exits non-zero and binds nothing (no listener appears on any fallback port);
    - `SPEC_LIBRARY_STANDALONE=1` (PORT unset) → binds the fallback (`SPEC_LIBRARY_PORT` or `3100`);
    - gateway-style `PORT` set → binds exactly that port and no other.
  - Run and confirm green against the hardened launcher.
  - _Requirements: 2.3_

- [x] 7. Add the `/api/health` readiness unit test

  - **Property 1: Bug Condition** - Readiness gating prevents restart loop
  - Add a unit/integration test asserting `/api/health` returns HTTP 503 while `isReady` is false (initial scan not finished) and HTTP 200 once ready, and that the gateway health-check therefore does not enter a restart loop. Reuse `backend/src/index.ts`'s `isReady` flag; make no production change to the readiness logic.
  - Run and confirm green.
  - _Requirements: 2.5_

- [x] 8. Checkpoint — confirm counterexamples resolved and the full suite is green

  - **Property 1 + Property 2** - Fix and preservation both hold
  - Confirm the task-1 counterexample tests now PASS against the hardened launcher (bug resolved) and the task-2 preservation tests still PASS (no regressions).
  - Run the full existing test suite (unit, integration, property, e2e as configured) and confirm all green.
  - Run `tsc --build` (and `bun run typecheck` where applicable) and confirm a clean type-check with no errors.
  - Clean up any temporary files, ports, or processes left by the harness.
  - Ask the user if any question or ambiguity arises.
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4_

- [x] 9. Record ADRs and changelog

  - Mirror the design's four ADRs as MADR-style files under `docs/adr/` following the existing format (see `docs/adr/ADR-008-gateway-sdk-routing-adapter.md`), numbered after ADR-008 (ADR-009…ADR-012):
    - **Harden the Bun `type: "exec"` launcher rather than migrate to `type: "node"`** — include the relationship to the separately tracked `node-backend-migration` spec (explicitly not resolved by this bugfix).
    - **PORT required — no hardcoded fallback under gateway launch.**
    - **Single-`exec`, no-fork supervision contract.**
    - **Preamble before `exec`, with no survivors.**
  - Add a changelog fragment to `CHANGELOG.md` under a new version heading in the Keep a Changelog / SemVer style used by the file (a "Fixed" entry describing the crash-loop resolution), and note the version bump (patch-level, e.g. `0.2.3`).
  - Follow Kiro Markdown Discipline (MD047 single trailing newline, MD012 no consecutive blank lines, MD032 blank lines around lists) and verify diagnostics on each edited markdown file.
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

## Notes

- The plan follows an explore-first/preserve-first methodology: the bug-condition exploration test (task 1) and the preservation property tests (task 2) are both written and run against the UNFIXED launcher before any fix is applied.
- The only production change is the shell launcher `scripts/start-backend.sh`; no TypeScript, `Bun.serve`, `bun:sqlite`, `router.ts`, or `app.json` backend block is modified.
- The scope guard holds throughout: this bugfix hardens the Bun `type: "exec"` contract and deliberately does not migrate to `type: "node"` (tracked separately by the `node-backend-migration` spec).
