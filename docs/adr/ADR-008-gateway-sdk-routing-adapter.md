# ADR-008: Gateway SDK Routing Adapter with Direct Fetch

**Date:** 2026-08-16
**Status:** Accepted
**Deciders:** JHU Sheridan Libraries platform team
**Supersedes:** N/A

## Context and Problem Statement

The KiroCrew gateway provides an App SDK with `useAppApi()` returning `{ get, post, patch, del }` methods. These methods internally call `new URL(path)` to normalize the path before fetching, which decodes `%2F` back to `/`. Spec keys in this project contain path separators (e.g., `counter-table::.kiro/specs/foo`), and when URL-encoded in path segments they get silently decoded by the SDK — routing requests to the wrong endpoint.

Additionally, the gateway's proxy route pattern (`/apps/{name}/api/{path:.*}`) requires the UI to pass full gateway-relative paths, not app-relative ones. Components throughout the app use simple relative paths like `/specs` or `/specs/:id/metadata`.

## Decision Drivers

- Spec keys contain characters (`/`, `:`) that break URL normalization in the SDK's methods
- The gateway proxy expects paths like `/apps/kiro-spec-library/api/specs` but app components think in terms of `/specs`
- Dev/standalone mode (no gateway) needs to hit `http://127.0.0.1:{port}/api/specs` directly
- The adapter must work transparently for all app components without per-call path construction

## Considered Options

1. **Use SDK methods directly** — encode keys carefully and accept the decoding quirk
2. **Wrap SDK into a `fetch()`-compatible interface** — `wrapGatewayApi` prepends the proxy prefix and uses native `fetch` for all requests
3. **Patch the SDK methods** — monkey-patch `get`/`post` to skip URL normalization
4. **Request SDK fix upstream** — file a bug and wait for a new SDK release

## Decision Outcome

**Chosen option:** Option 2 — `wrapGatewayApi` adapter that exposes a single `fetch(path, init)` method, prepends `/apps/kiro-spec-library/api` to relative paths, and uses native `globalThis.fetch` with `credentials: 'include'` (same-origin cookie auth).

### Implementation

```typescript
// ui/src/hooks/useCrewIntegration.tsx
function wrapGatewayApi(gatewayApi: GatewayAppApi): CrewAppApi {
  return {
    async fetch(path: string, init?: RequestInit): Promise<Response> {
      const proxyPath = path.startsWith('/apps/')
        ? path
        : `/apps/kiro-spec-library/api${path}`;
      return globalThis.fetch(proxyPath, { ...init, credentials: 'include' });
    },
  };
}
```

App components call `api.fetch('/specs')` and the adapter handles gateway routing. In standalone/dev mode (no gateway SDK), the mock implementation tries direct backend access on ports 9102, 9150, 3100 with `/api` prefix.

### Positive Consequences

- All components use simple relative paths — no gateway awareness needed
- URL-encoded spec keys remain intact (no `new URL()` normalization)
- Same-origin cookie provides authentication automatically via the gateway session
- Dev mode works without the gateway by falling back to direct port access
- Single point of change if the gateway routing pattern evolves

### Negative Consequences / Trade-offs

- Bypasses the SDK's permission validation (the SDK normally checks `permissions.api` before fetching) — though same-origin `fetch` still goes through the gateway's route matching
- Tightly couples the adapter to the app name (`kiro-spec-library`) in the prefix string
- If the SDK fixes the URL normalization quirk, we could potentially switch back — but the adapter's simplicity makes this low-priority

## Links and References

- Implementation: `ui/src/hooks/useCrewIntegration.tsx`
- Gateway routing: `.kiro/steering/gateway-sdk-routing.md` (workspace steering doc)
- Permissions: `app.json` → `permissions.api` array
- Related: [ADR-001](./ADR-001-bun-workspace-monorepo.md) (workspace architecture)
