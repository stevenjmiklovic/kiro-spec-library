# ADR-007: MCP Token Authentication with Opt-In Enforcement

**Date:** 2026-08-16
**Status:** Accepted
**Deciders:** JHU Sheridan Libraries platform team
**Supersedes:** N/A

## Context and Problem Statement

The MCP server exposes three tools (`search_specs`, `get_spec_context`, `submit_metadata_proposal`) over the same HTTP port as the backend REST API. The backend generated an MCP token at startup but nothing verified it — the separately-spawned MCP process had no reliable way to obtain the real value. Any process on localhost could call MCP endpoints without authentication, which is acceptable in single-user dev but undesirable when the gateway manages multiple apps on shared infrastructure.

## Decision Drivers

- MCP endpoints mutate state (proposals) and should be authenticated
- The UI shares the same port and authenticates via session cookie — a mandatory token header would break the UI until a cookie-to-token bridge exists
- The gateway may eventually provide its own auth layer, making app-level enforcement redundant
- The mechanism must be testable in isolation without the gateway running

## Considered Options

1. **Mandatory token on all routes** — backend rejects any request without a valid `Authorization: Bearer <token>` header
2. **Opt-in enforcement gated on environment variable** — mechanism is built and tested but only enforced when `MCP_AUTH_ENFORCE=1`
3. **Gateway-only auth** — defer entirely to the gateway's proxy-level HMAC verification
4. **mTLS between MCP process and backend** — certificate-based mutual auth

## Decision Outcome

**Chosen option:** Option 2 — Opt-in enforcement via `MCP_AUTH_ENFORCE=1`, because it ships the full mechanism (token file, header validation, per-route guard) without breaking the UI in environments where the gateway hasn't yet integrated token forwarding.

### Implementation

- Backend writes a random token to `<dataDir>/mcp-token` (mode 0600) at startup
- MCP process reads the token file as fallback to `SPEC_LIBRARY_MCP_TOKEN` env var
- `router.ts` has a `onBeforeHandle` guard (exempting `/health`) gated on `RouterDeps.enforceMcpAuth`
- Guard reads `Authorization: Bearer <token>` via `request.headers.get()` (not Elysia's destructured `headers` — that triggered a body-schema validation quirk in Elysia 1.4.29)
- `MCP_AUTH_ENFORCE=1` activates enforcement; absent or `0` leaves it open

### Positive Consequences

- Full auth pipeline is built, tested, and ready to flip on
- No breaking change to the UI or dev workflows
- MCP integration tests validate both the enforced and unenforced paths
- Clean upgrade path: set the env var when the gateway supports token passthrough

### Negative Consequences / Trade-offs

- Unenforced by default means localhost callers can still hit MCP endpoints without auth
- Two code paths (enforced/unenforced) increase test surface
- Token file on disk is a secret management concern (mitigated by 0600 perms and dataDir isolation)

## Links and References

- Implementation: `backend/src/router.ts` (onBeforeHandle guard), `backend/src/index.ts` (token generation)
- Tests: `tests/integration/mcp.integration.test.ts`
- Related: Gateway HMAC signing (`X-KiroCrew-Proxy` header) provides transport-level auth at the proxy layer
