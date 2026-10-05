# ADR-009: Harden the Bun `type: "exec"` Launcher Rather Than Migrate to `type: "node"`

**Date:** 2026-09-04
**Status:** Accepted
**Deciders:** JHU Sheridan Libraries platform team
**Supersedes:** N/A

## Context and Problem Statement

The gateway-supervised backend entered a restart loop because the shell launcher's supervision/PID contract could let the gateway-recorded PID diverge from the Bun runtime and HTTP listener. A separately tracked `node-backend-migration` spec proposes moving the backend to `type: "node"`, but that migration would replace the current Bun runtime, `Bun.serve`, and `bun:sqlite` while expanding the bugfix's scope and risk.

The incident is a launcher-supervision problem, not evidence that Bun is unsuitable. The backend already uses `backend.type: "exec"` with `scripts/start-backend.sh`, and the launcher can establish the required contract when it synchronously prepares the environment and then directly execs the Bun entry point.

## Decision Drivers

- Resolve the gateway restart loop with the smallest production-code change
- Ensure the gateway supervises the real HTTP listener process
- Preserve API, data-store, scan-schedule, and MCP-token behavior
- Avoid coupling this targeted bugfix to a runtime and data-access migration

## Considered Options

1. **Migrate to `type: "node"`** — replace the Bun runtime as part of the crash-loop fix
2. **Harden the existing Bun `type: "exec"` launcher** — retain the runtime and enforce its PID contract
3. **Leave the launcher unchanged** — rely on operational restarts to recover from failures

## Decision Outcome

**Chosen option:** Option 2 — retain Bun and harden the `type: "exec"` launcher.

The backend remains on Bun with `backend.type: "exec"`, `scripts/start-backend.sh`, `Bun.serve`, and `bun:sqlite`. The launcher is hardened so that its recorded, supervised PID is structurally the real Bun listener process. The separately tracked `node-backend-migration` spec remains independent and is explicitly not resolved by this bugfix.

### Positive Consequences

- Limits the production change to the launcher's supervision/PID contract
- Preserves the proven Bun runtime, HTTP server, and SQLite integration
- Avoids a concurrent migration risk while restoring gateway stability
- Retains API, data, scan, and MCP-auth behavior without changes

### Negative Consequences / Trade-offs

- Correctness depends on disciplined shell structure rather than a type system
- Structural regression tests are required to prevent a future wrapper or fork from weakening the contract
- A future Node migration may still be evaluated independently

## Links and References

- Implementation: `scripts/start-backend.sh`
- Bugfix spec: `.kiro/specs/gateway-backend-crash-loop-fix/`
- Related: separately tracked `node-backend-migration` spec
- Related: [ADR-001](./ADR-001-bun-workspace-monorepo.md) (workspace architecture)
