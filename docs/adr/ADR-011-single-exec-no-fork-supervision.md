# ADR-011: Use a Single `exec` with No Fork in the Supervision Contract

**Date:** 2026-09-04
**Status:** Accepted
**Deciders:** JHU Sheridan Libraries platform team
**Supersedes:** N/A

## Context and Problem Statement

The gateway records the PID of `scripts/start-backend.sh`, health-checks it indirectly through the backend port, and reaps only that recorded PID. A `bun run`-style wrapper, subshell, pipeline, or other intermediate process can cause the recorded PID to refer to a wrapper while the `Bun.serve` listener runs as an unrecorded child. Signaling the wrapper can then orphan the listener, leaving the gateway unable to supervise or reap the real process.

The launcher must make the shell process become the Bun process that owns the listener.

## Decision Drivers

- Guarantee that the gateway-recorded PID is the Bun runtime and HTTP listener
- Prevent a wrapper process from becoming the object of gateway supervision
- Ensure gateway health checks, signals, and reaping target the real backend process
- Make the invariant mechanically testable

## Considered Options

1. **Launch through `bun run` or another wrapper** — delegate script invocation to a child process
2. **Use a final direct `exec "$BUN" "$DIST"`** — replace the launcher shell with the Bun runtime
3. **Supervise a process group while retaining a wrapper** — add broader process-management behavior outside the launcher

## Decision Outcome

**Chosen option:** Option 2 — make `exec "$BUN" "$DIST"` the launcher's single final action.

The launcher must have no command after that `exec` and must not introduce `bun run`, a subshell, a pipeline, or backgrounding that could create an intermediate supervised process. `exec` replaces the shell image while preserving its PID, so the PID recorded by the gateway is the Bun runtime that owns the `Bun.serve` listener.

### Positive Consequences

- The supervised PID and listener PID are the same process
- Gateway signals and stale-process reaping reach the process that actually serves HTTP
- The listener cannot survive as an unrecorded child of a wrapper
- A static contract test can detect prohibited wrapper and trailing-command changes

### Negative Consequences / Trade-offs

- Post-launch shell cleanup or logging cannot run after the final `exec`
- Future launcher edits must preserve a deliberately strict shell shape

## Links and References

- Implementation: `scripts/start-backend.sh`
- Regression test: `tests/unit/start-backend-contract.test.ts`
- Bugfix spec: `.kiro/specs/gateway-backend-crash-loop-fix/bugfix.md` (requirement 2.1)
- Related: [ADR-009](./ADR-009-harden-bun-exec-launcher.md) (retain and harden the Bun exec launcher)
