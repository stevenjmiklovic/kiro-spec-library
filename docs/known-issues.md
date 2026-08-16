# Known issues — half-finished, unwired, or silently broken

Audit taken 2026-08-16. Each item includes enough detail to act on it without
re-investigating from scratch. Not prioritized into a roadmap — just a
complete, verified punch list.

## Silently broken — looks like it works, doesn't

- **Search does nothing.** The Relationship view's search box and the MCP
  `search_specs` tool both build a query param (`q` / `query`), but
  `GET /specs` (`backend/src/routes/specs.ts`) never declares or reads either
  one — it's silently discarded. The FTS5 tables from migration
  `002-fts5-indexes.ts` exist but nothing ever inserts into them;
  `db/queries/specs.ts`'s `searchSpecs()` has zero callers. Verified live:
  `GET /specs?q=totallynonmatchingqueryxyz` still returns all specs. Only the
  dropdown filters (type/stage/owner/theme/repository) actually filter
  anything. (The Archive view's search box is unaffected — it does its own
  client-side substring filter, unrelated to FTS5.)

- **"Mark as reviewed" and legal-hold edits don't persist.** The PATCH
  `/specs/:id/metadata` Elysia body schema
  (`backend/src/routes/specs.ts`) doesn't include `reviewedAt` or
  `legalHold`, so Elysia silently strips them from the request — but
  `useSpecDetail.ts`'s `save()` optimistically merges the patch into local
  state regardless, so the UI shows the change immediately. Reload and it's
  gone. Verified live: a PATCH with those fields returns `200` with a bumped
  revision, but the persisted `metadata_overlays` row has `reviewed_at: null`.

- **`GET /bootstrap` always returns 500.** `router.ts`'s bootstrap handler
  queries a table named `metadata`; the actual table is `metadata_overlays`.
  Breaks spec counts, archive counts, last-sync status, and all filter
  facets wherever this endpoint is used. There's a test
  (`tests/integration/api.integration.test.ts:419`) that asserts this 500 as
  expected behavior — the fix is a one-line table-name correction plus
  updating that test to assert 200.

- **Auto-metadata population silently fails for a subset of specs.**
  `services/auto-metadata.ts` writes `approvers`/`implementationRef` into
  `metadata_overlays` via `upsertOverlay`, but that table has no
  `approvers`/`implementation_ref` columns (no migration ever added them,
  despite both being declared on `MetadataOverlay`/`ResolvedMetadata` in
  `shared/src/types.ts`). Because `upsertOverlay` runs as one
  `db.transaction()`, the whole overlay write — including the parts that
  would have succeeded — is dropped whenever a spec has secondary git
  contributors or a PR/issue link in its content. `scanner.ts` catches and
  only logs this. Reproduced live: `upsertOverlay(db, key, { approvers: [...] }, 0)`
  throws `"table metadata_overlays has no column named approvers"`.

- **Archive view's "Disposition" status is wrong forever.**
  `ArchiveView.tsx`'s snapshot detail shows Status =
  `legalHoldActive ? 'Superseded' : 'Active'`, but `legal_hold_active` is
  never written anywhere (see below) — it's permanently `0`. Per
  `docs/adr/ADR-005-supersession-replaces-legal-hold.md`, this should derive
  from the `supersedes` relationship graph instead; someone renamed the
  *labels* to the new vocabulary but left the *data source* pointed at the
  dead legal-hold columns. Every snapshot will show "Active," never
  "Superseded."

## Security

- **MCP token auth isn't enforced.** `backend/src/index.ts` generates
  `mcpToken` and `mcp/src/tools.ts` sends it as `X-MCP-Token` on every
  request, but no middleware in `router.ts` or any route file ever reads or
  validates that header. Any process that can reach the backend's port can
  call every endpoint, token or not. Asserted as expected in
  `tests/integration/mcp.integration.test.ts:522-550`
  (`describe("MCP Integration: Token Authentication")`, both tests titled
  "... (no auth enforcement — BUG)").

## Built but never invoked

- **Suggestion engine never runs.** `services/suggester.ts` (TF-IDF, cosine
  similarity, markdown-link/shared-tag/theme/repo-proximity heuristics —
  the engine behind `docs/adr/ADR-003-tfidf-suggestion-engine.md`) has zero
  callers anywhere, including `scanner.ts`. Unit-tested in isolation
  (`tests/unit/suggester.test.ts`) but nothing generates a real suggestion
  in a running deployment; `createSuggestion` is only ever called from
  `services/text-export.ts`'s import path (re-applying a previous export).

- **Snapshots are never auto-created.** `services/archiver.ts`'s
  `maybeCreateSnapshot` still has no callers — `scanner.ts` never invokes it
  after normalizing a completed spec. Read/purge (`routes/archive.ts`,
  `ArchiveView.tsx`) are correctly wired and work fine on whatever snapshots
  happen to exist; nothing ever adds one automatically.

- **"Mine" scope filter is a no-op.** `RelationshipView.tsx`'s
  `getLocalAliases()` reads `localStorage['kiro-spec-library:aliases']`, but
  nothing anywhere ever writes that key — no settings UI, no onboarding.
  Since the filter only applies when `aliases.length > 0`, "Mine" currently
  behaves identically to "Team." Parallels the dead `owner_aliases` DB table
  below — both halves of "map git authors to a person" were built
  independently and neither was finished.

## Unwired routes

- `routes/import-export.ts` (`GET /export`, `POST /import/preview`,
  `POST /import/apply`) — zero callers in `ui/src/**` or MCP. Fully dead
  from the outside; superseded in spirit by `routes/text-export.ts`, which
  *is* wired to `BackupPanel.tsx`.
- `routes/audit.ts` (`GET /audit`) — fully built, filterable audit-log
  query, zero consumers anywhere (not UI, not MCP).
- `routes/sync.ts` (`POST /sync`, `GET /sync/:runId`) — no manual "rescan
  now" affordance anywhere; only the startup scan and the 15-minute interval
  in `index.ts` ever trigger a scan.
- `routes/settings.ts` (`GET`/`PUT /settings/sources`) — no "manage
  sources" UI; adding a repository is a manual `curl PUT` per the README.
  MCP's `list_sources` does read from it. Intentional per the README, but
  worth naming as the one UX gap in an otherwise UI-complete app.

## Housekeeping / documentation drift

- **`shared/dist` is stale**, missing everything added in the
  backup/text-export session (`TextExport*` schemas, `MetadataOverlay.reviewedAt`,
  four new `AuditOperation` values). Because `backend/tsconfig.json`
  references `../shared` as a project reference, `bun run typecheck` in
  `backend/` resolves against the stale committed `.d.ts` files and produces
  ~17 spurious errors, burying the one real one (see below). Needs
  `shared`'s build re-run and the output recommitted.
- **`backend/src/db/queries/specs.ts:104`** — `needsJoin` local variable in
  `listSpecs()` is computed but never read (the join happens unconditionally
  below it); confirmed via `tsc --noEmit`. The similarly-named `needsJoin` in
  `countSpecs()` (line ~162) is used correctly — only the `listSpecs` one is
  dead.
- **MCP's `search_specs` tool schema** (`mcp/src/index.ts`) still advertises
  the pre-migration-007 stage vocabulary (`"completed"`, `"requirements"`,
  etc.) instead of the current `new/scoped/refined/in-flight/done`. An agent
  following the tool's own schema gets zero matches.
- **`docs/adr/ADR-006-schema-migration-005-improvements.md`** doesn't match
  what `005-schema-improvements.ts` actually does (describes cascade/index
  changes to a `relationships`/`tags` shape that isn't what the migration
  contains).
- **No `ErrorBoundary` anywhere in `ui/src`.** `App.tsx:18` has a comment
  ("Temporarily skip the ErrorBoundary — render AppProvider directly")
  pointing at a component that doesn't exist in this codebase. An uncaught
  render error is currently a blank screen.
- **Audit log has a blind spot for metadata edits.** `metadata_created` /
  `metadata_updated` / `metadata_deleted` are declared in `AuditOperation`
  but `recordEvent` is never called for them — the PATCH
  `/specs/:id/metadata` route records nothing. Every relationship,
  suggestion, snapshot, backup, and text-export action is audited; the most
  common user action isn't.

## Dead columns / tables / exports (low severity, safe to remove or finish)

- `owner_aliases` table — no query file, zero references outside the
  migration that created it.
- `sources.last_scan_at`, `sources.last_error`, `sources.last_error_at` —
  read incidentally via `SELECT *` but never written by `putSource` or
  anything else.
- `metadata_overlays.legal_hold` — column exists, never settable (PATCH
  schema doesn't accept it), never surfaced in API responses.
- `snapshots.legal_hold_active`, `snapshots.legal_hold_reason` — never
  written (see Archive "Disposition" bug above for the read-side impact).
- `snapshots.spec_title_at_snapshot` (migration 005) — backfilled once,
  never read or written again.
- `proposals.submitted_by` (migration 005) — never set; superseded by
  `source`/`resolved_by` added in a later migration without removing this
  one.
- `specs.updated_at` — written on every scan (always equal to `indexed_at`),
  never read back anywhere.
- `backend/src/db/queries/index.ts` — barrel re-export of all query
  modules, zero importers (everything imports the specific file directly).
- `db/queries/relationships.ts`'s `listBySpec()` — superseded by
  `listBySourceKeys()`, never called.
