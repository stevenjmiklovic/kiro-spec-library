# ADR-010: Require `PORT` and Prohibit a Gateway Fallback Port

**Date:** 2026-09-04
**Status:** Accepted
**Deciders:** JHU Sheridan Libraries platform team
**Supersedes:** N/A

## Context and Problem Statement

The gateway allocates a backend port and passes it through the `PORT` environment variable. A launcher fallback to a hardcoded port when `PORT` is absent could create an un-proxied, un-supervised second backend instance. The gateway neither allocates nor reaps that process, allowing it to survive restarts, race the supervised instance, and contribute to the crash loop.

Local standalone development still needs an intentional way to launch the backend without gateway-provided configuration.

## Decision Drivers

- Prevent an un-proxied or un-supervised backend from binding during gateway launch
- Fail a misconfigured gateway launch loudly instead of silently binding another port
- Preserve an explicit local-development path
- Make the allowed binding behavior easy to test

## Considered Options

1. **Always fall back to a hardcoded port** — prioritize convenience when `PORT` is absent
2. **Require `PORT` under the gateway; allow fallback only with an explicit standalone opt-in**
3. **Infer a gateway port from other environment variables** — attempt to recover silently from missing `PORT`

## Decision Outcome

**Chosen option:** Option 2 — require `PORT` unless `SPEC_LIBRARY_STANDALONE=1` explicitly authorizes the local fallback.

Under gateway launch, `PORT` is mandatory. If it is missing, the launcher emits a diagnostic and exits non-zero. The fallback port remains available only for a human-run standalone launch that sets `SPEC_LIBRARY_STANDALONE=1`.

### Positive Consequences

- Gateway launches bind only the port the gateway allocated and proxies
- A missing `PORT` cannot silently create a second backend instance
- Misconfiguration is immediately visible through a failing launch
- Local development retains a deliberate standalone opt-in

### Negative Consequences / Trade-offs

- A misconfigured gateway launch fails rather than attempting a best-effort startup
- Developers must set `SPEC_LIBRARY_STANDALONE=1` when intentionally using the fallback port

## Links and References

- Implementation: `scripts/start-backend.sh`
- Bugfix spec: `.kiro/specs/gateway-backend-crash-loop-fix/bugfix.md` (requirement 2.3)
- Related: [ADR-009](./ADR-009-harden-bun-exec-launcher.md) (retain and harden the Bun exec launcher)
