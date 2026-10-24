# Requirements — Node backend migration (retire `type: exec`)

## Goal

Migrate the Spec Library backend from a Bun `type: exec` shell-launcher model to a
gateway-native `type: "node"` backend that the KiroCrew gateway runs in-process as
`node backend/dist/index.mjs`. This removes the orphaned/duplicate-instance class
entirely (no shell launcher, no `bun run` fork, gateway records the real runtime
PID) while preserving 100% of the existing behavior, endpoints, data, and tests.

`kiro-spec-library` is the only `type: exec` app among the 18 backend-declaring
Crew apps; every other runs in-process. This spec brings it in line without a
full Python reimplementation, by keeping the TypeScript and swapping only the
Bun-specific runtime pieces.

## Use case (Cockburn)

- **Actor:** the KiroCrew gateway (backend supervisor) and, transitively, the
  dashboard user viewing the Spec Library app.
- **Goal:** run exactly one supervised backend process the gateway can always
  reap, with no orphan surviving restarts.

## Requirements

### 1. Gateway-native Node backend
**User story:** As the gateway, I want to launch the backend directly under `node`
so that the process I supervise is the actual runtime and I can always reap it.

Acceptance criteria (EARS):
- WHEN the app is enabled THE SYSTEM SHALL declare `backend.type: "node"` and
  `backend.entryPoint: "backend/dist/index.mjs"` in `app.json`.
- WHEN the gateway spawns the backend THE SYSTEM SHALL run `node backend/dist/index.mjs`
  with `PORT` supplied in the environment, with NO shell wrapper script.
- WHEN the gateway sends SIGTERM to the recorded PID THE SYSTEM SHALL leave no
  listening process on the port and no orphaned child.
- THE SYSTEM SHALL delete `scripts/start-backend.sh` and remove `backend.type: "exec"`.

### 2. Behavior and API parity
**User story:** As a dashboard user, I want the app to behave identically after the
migration so that no feature regresses.

Acceptance criteria (EARS):
- THE SYSTEM SHALL serve all 41 existing HTTP endpoints across the 10 route modules
  (`archive, audit, backup, knowledge-sync, proposals, relationships, settings,
  specs, sync, text-export`) with unchanged request/response shapes.
- WHEN `GET /api/health` is requested THE SYSTEM SHALL return 200 once ready.
- THE SYSTEM SHALL preserve the `X-KiroCrew-Proxy` HMAC verification and the
  `/apps/kiro-spec-library/api/*` proxy path contract.

### 3. SQLite + FTS5 on the Node driver
**User story:** As a maintainer, I want SQLite/FTS5 to work under Node so full-text
search and all queries behave exactly as under Bun.

Acceptance criteria (EARS):
- THE SYSTEM SHALL replace `bun:sqlite` with `better-sqlite3` (synchronous SQLite),
  keeping every query string — including FTS5 `MATCH`/`bm25` and `json_valid`
  CHECKs — byte-identical where the SQL is unchanged.
- WHEN the backend opens the database THE SYSTEM SHALL confirm the loaded SQLite
  build has FTS5 compiled in, and FAIL CLOSED with a clear error if it does not.
- THE SYSTEM SHALL run the existing 10 migrations unchanged in order.
- IF an existing `spec-library.db` is present THEN THE SYSTEM SHALL open it without
  data loss or re-migration beyond pending migrations.

### 4. Build pipeline on Node
**User story:** As a maintainer, I want a Node-targeted build so the shipped bundle
runs under `node`, not `bun`.

Acceptance criteria (EARS):
- THE SYSTEM SHALL build `backend/dist/index.mjs` for the Node runtime (esbuild or
  `tsc`), NOT `bun build --target=bun`.
- THE SYSTEM SHALL keep `better-sqlite3` external (native module) rather than
  bundling it, and ensure its prebuilt binary is available at runtime.
- THE SYSTEM SHALL keep the committed `dist/` convention (rebuilt bundles committed
  alongside source).

### 5. Tests preserved
**User story:** As a maintainer, I want the full test suite to keep passing so the
migration is provably behavior-preserving.

Acceptance criteria (EARS):
- THE SYSTEM SHALL keep all 688 unit/integration tests and 11 Playwright E2E tests
  passing after the migration.
- WHERE a test depends on `bun:sqlite` or the Bun test runner THE SYSTEM SHALL
  adapt it to the Node runtime/driver without weakening its assertions.
- THE SYSTEM SHALL keep `tsc --build` clean.

### 6. MCP server
**User story:** As the Spectral Librarian agent, I want its MCP server to keep
working so search/context/proposal tools are unchanged.

Acceptance criteria (EARS):
- IF the MCP server (`mcp/src`) uses `bun:sqlite` or a bare `bun` command THEN THE
  SYSTEM SHALL migrate it to the Node driver / a `node` command consistent with the
  backend, keeping its four tools and their I/O identical.
- THE SYSTEM SHALL keep the `mcp.extra_path_dirs` requirement satisfied or removed
  as appropriate once the bare-`bun` command is gone.

## Non-functional requirements

- **No orphans / no flap:** verified by killing the recorded PID and confirming zero
  residual listeners (the acceptance test for Requirement 1).
- **CI:** `ci.yml` must build and test on the Node runtime; the migration is the
  moment to also wire the Playwright E2E suite into CI (currently unrun).
- **Rollback:** a single revert of the migration commit restores the exec model.

## Out of scope

- Any Python rewrite (tracked separately as the larger Option B).
- New features, schema changes, or UI changes.
