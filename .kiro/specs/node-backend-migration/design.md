# Design — Node backend migration

## Current implementation findings

- Backend: ~6,600 LOC TypeScript in `backend/src`. Framework **Elysia** + **TypeBox**,
  storage **`bun:sqlite`**, built with `bun build --target=bun --outfile=backend/dist/index.mjs`.
- 41 endpoints across 10 route modules; 10 services; 10 migrations + 9 query modules.
- SQLite features in use: FTS5 (`MATCH`, `bm25`), `json_valid` CHECKs.
- Launched today via `backend.type: "exec"` → `scripts/start-backend.sh` → `exec bun backend/dist/index.mjs`.
- Gateway supervisor (`kiro_crew/apps/backend.py`) has a first-class `type: "node"`
  branch: `cmd = [node_bin, entry_str]`, `env` includes `PORT` and `NODE_ENV=production`,
  and it runs `npm install --production` if `package.json` exists and `node_modules`
  is missing. It records the spawned PID and reaps it via `_reap_stale_app_backends`.

## Architecture (C4 — Container)

```
Dashboard UI ──/apps/kiro-spec-library/api/*──▶ Gateway proxy (HMAC)
                                                     │
                                          node backend/dist/index.mjs  (type:"node")
                                                     │  Elysia (Node adapter) or Hono
                                          better-sqlite3 ──▶ spec-library.db (+FTS5)
```

The one process the gateway launches IS the Node runtime and the listener — no
shell, no `bun run` launcher, nothing to orphan.

## Design decisions (ADR-style)

### ADR-N1: `type: "node"` over Python `routes:` in-process
- **Context:** every other Crew backend is in-process Python and cannot orphan; we
  are the lone `exec` app. Two ways out: rewrite to Python (~1–2 wk) or move to the
  gateway's `type: "node"` path (~1–2 d) keeping the TypeScript.
- **Decision:** `type: "node"`. It removes the exec/orphan model for a fraction of
  the cost and discards no working code.
- **Consequences:** we still run a separate (Node) process the gateway supervises,
  but with the correct single-PID shape it is always reapable — matching how the
  gateway supervises its other spawned (non-Python) backends.

### ADR-N2: `bun:sqlite` → `better-sqlite3`
- **Context:** `bun:sqlite` is Bun-only; Node needs a driver. `better-sqlite3` is
  the closest analogue — synchronous, prepared statements, same call shape — so the
  query modules change minimally. (This driver was the intended one in the original
  `requirements.md`.)
- **Decision:** adopt `better-sqlite3`. Isolate the driver behind `db/connection.ts`
  so `db.prepare(...).run/get/all` call sites stay unchanged where possible.
- **Consequences:** native module — needs a prebuilt binary per platform (macOS
  arm64/x64, Linux x64) with **FTS5 compiled in**. Add a startup assertion that
  `SELECT sqlite_compileoption_used('ENABLE_FTS5')` returns 1 and fail closed
  otherwise. Keep it external in the bundle (`--external better-sqlite3`).

### ADR-N3: Elysia on Node vs. swap to Hono
- **Context:** Elysia targets Bun; it has a Node adapter (`@elysiajs/node`) but it is
  less battle-tested than on Bun.
- **Decision:** first attempt Elysia via its Node adapter to minimize churn (routes
  unchanged). If the adapter proves unreliable under the gateway proxy, fall back to
  porting the thin HTTP layer to **Hono** (Node-first, minimal route rewrite) — the
  route *handlers* and services are framework-light and portable either way.
- **Consequences:** the router wiring (`router.ts`) is the only file materially
  affected; handlers stay put. This is the one decision that could expand scope, so
  it is a spike in Task 2.

### ADR-N4: build with esbuild, keep dist committed
- **Context:** `bun build --target=bun` emits Bun-flavored output.
- **Decision:** build with `esbuild` (`--platform=node --format=esm --bundle
  --external:better-sqlite3 --outfile=backend/dist/index.mjs`), keep the committed-`dist`
  convention.
- **Consequences:** `package.json` gains an esbuild build script; `start-backend.sh`
  is deleted; `app.json.backend` becomes `{type:"node", entryPoint:"backend/dist/index.mjs", healthCheck:"/api/health", port:"auto"}`.

### ADR-N5: test runner
- **Decision:** keep Bun as the *local dev* test runner where convenient, but make CI
  authoritative on Node: run the suite under `node --test` (or vitest) so the shipped
  runtime is what CI validates. Wire the Playwright E2E suite into `ci.yml` at the
  same time (it is currently unrun — the gap that let two E2E bugs ship).

## Correctness properties to preserve

- Every FTS5/bm25 query returns identical result ordering to the Bun build for the
  same DB fixture.
- Normalizer determinism, sidecar round-trip, TF-IDF similarity bounds — the existing
  property tests must pass unchanged under Node.
- Killing the gateway-recorded PID leaves zero residual listeners (the anti-orphan
  invariant).

## Testing strategy

- Unit/property/integration under Node runtime + `better-sqlite3`.
- A dedicated **anti-orphan test**: spawn via the gateway path (or a faithful shell
  equivalent), SIGTERM the recorded PID, assert no listener remains.
- Playwright E2E unchanged (harness is backend-independent) and now CI-gated.
- Migration test: open a pre-existing `spec-library.db` and assert no data loss.
