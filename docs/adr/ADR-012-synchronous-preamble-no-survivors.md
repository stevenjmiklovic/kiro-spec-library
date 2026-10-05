# ADR-012: Run a Synchronous Preamble Before `exec` with No Survivors

**Date:** 2026-09-04
**Status:** Accepted
**Deciders:** JHU Sheridan Libraries platform team
**Supersedes:** N/A

## Context and Problem Statement

The launcher must prepare its environment before starting the backend: it exports `PATH`, validates `PORT`, builds stale output, and removes stale port holders. If any preamble step backgrounds work or starts a watcher, that child can survive after the shell is replaced by `exec`. The gateway signals only the recorded Bun PID, so a surviving preamble child can be re-parented, continue listening, and evade the gateway's reaper.

The `kill_port` preamble also needs a settle period after forcefully stopping a stale holder so that the new `Bun.serve` listener does not race a port that has not yet been released.

## Decision Drivers

- Ensure `SIGTERM` leaves no listener or orphaned launcher child behind
- Complete environment preparation before the supervised Bun process starts
- Prevent build or cleanup helpers from becoming unsupervised long-lived processes
- Avoid a stale-port race during startup

## Considered Options

1. **Run build or cleanup helpers in the background** — reduce perceived launcher latency
2. **Run the complete preamble synchronously before `exec`** — prohibit survivors and wait for stale-port cleanup to settle
3. **Move preamble work after the backend starts** — make startup behavior concurrent with the listener

## Decision Outcome

**Chosen option:** Option 2 — complete every preamble action synchronously before the final `exec` and prohibit background survivors.

The launcher performs `PATH` setup, the `PORT` guard, build-if-stale work, and `kill_port` before it execs Bun. No preamble action may use a trailing `&`, `nohup`, or a watcher that outlives the shell. After `kill_port`, the launcher retains the settle delay before Bun binds the port. The exec'd Bun process retains the launcher's process group, while the no-survivor preamble ensures no stray descendant remains to outlive a group-directed signal.

### Positive Consequences

- `SIGTERM` reaches the Bun process directly and its clean-shutdown handler can stop the listener and close the database
- No preamble-spawned child remains to be orphaned after `exec`
- The stale port is given time to release before `Bun.serve` binds
- Startup, shutdown, and ownership behavior are deterministic

### Negative Consequences / Trade-offs

- A stale build adds synchronous startup latency
- Launcher helpers cannot be converted to background watchers without revisiting this decision
- The `kill_port` settle delay adds a small fixed delay when a stale holder is found

## Links and References

- Implementation: `scripts/start-backend.sh`
- Clean shutdown: `backend/src/index.ts`
- Bugfix spec: `.kiro/specs/gateway-backend-crash-loop-fix/bugfix.md` (requirements 2.4 and 2.5)
- Related: [ADR-010](./ADR-010-port-required-no-gateway-fallback.md) (gateway port ownership)
- Related: [ADR-011](./ADR-011-single-exec-no-fork-supervision.md) (single-process supervision)
