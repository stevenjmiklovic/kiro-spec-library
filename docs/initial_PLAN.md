# Kiro Spec Library & Archive Crew App

## Summary

Convert the approved React prototype into a production Kiro Crew app hosted at `github.com/jhu-sheridan-libraries/kiro-spec-library`.

The app will use Crew’s native dashboard shell while preserving the prototype’s defining experience:

- Dark, relationship-first Spec Observatory as the default view.
- Light Archive Ledger as the secondary view.
- Team/Mine filtering, search, themes, lifecycle stages, inspection panels, metadata review, and chronological retrieval.
- Local and remote Git repository indexing.
- Immutable snapshots of completed Specs, curated metadata, retention controls, and AI-assisted suggestions requiring approval.

The implementation follows Crew’s full-stack app model: root `app.json`, ESM dashboard page, Node backend, app-scoped storage, MCP tools, and a restricted Spec Librarian agent. Crew resolves the UI SDK at runtime and reverse-proxies backend requests. [Crew Apps](https://kiro.dev/docs/crew/apps/), [App SDK](https://kiro.dev/docs/crew/apps/sdk/)

## Implementation Changes

### 1. Crew app foundation

- Restructure the prototype into npm workspaces: `ui`, `backend`, `mcp`, and `shared`.
- Convert UI code to TypeScript and build `ui/dist/index.mjs` as an ESM library bundle. Keep React, ReactDOM, Lucide, and `@kirocrew/app-sdk` external.
- Add `app.json` with:
  - `name`: `kiro-spec-library`
  - `version`: `0.1.0`
  - `displayName`: `Spec Library`
  - `author`: `Johns Hopkins University Sheridan Libraries`
  - `license`: `Apache-2.0`
  - `minCrewVersion`: `0.2.0`
  - macOS and Linux server installation
  - UI route `/apps/kiro-spec-library`
  - Node backend with automatic port and `/health`
  - Spec Librarian agent and app-owned MCP server
  - permissions limited to the app API, app storage, and network access needed for Git clone/fetch
  - `git` as a required host command
- Commit the compiled UI, backend, and MCP bundles because Crew excludes build inputs during installation. [Manifest reference](https://kiro.dev/docs/crew/apps/manifest/), [Publishing guidelines](https://kiro.dev/docs/crew/apps/publishing/)

### 2. Repository ingestion and Spec normalization

- Support administrator-configured sources:
  - Local repository roots.
  - Remote HTTPS or SSH Git repositories with branch and optional web URL template.
- Use the host’s SSH agent or Git credential helper; never collect or persist credentials.
- Clone remote repositories into app-owned storage. Refresh with noninteractive, hook-disabled `git fetch` operations and reset only app-owned clones.
- Run a single-flight scan on startup, every 15 minutes, and on manual refresh. Retain the last good index when a source becomes unavailable.
- Read only `.kiro/specs/<slug>/` artifacts:
  - `.config.kiro`
  - `requirements.md` or `bugfix.md`
  - `design.md`
  - `tasks.md`
  - optional `tasks.meta.json`
  - optional `spec-library.json` sidecar
- Reject traversal, source-root symlink escapes, oversized files, invalid Git arguments, filesystem roots, and sensitive Crew credential paths.
- Derive a stable Spec key from source ID plus `.config.kiro.specId`; fall back to source ID plus repository-relative path.
- Normalize each Spec into:
  - feature, bugfix, quick, or unknown type
  - requirements-first, design-first, or unknown workflow
  - repository, path, branch, commit, dirty state, and remote URL
  - title from the first artifact H1, falling back to the directory slug
  - artifact availability and task counts
  - owner from curated metadata, then the latest relevant Git author
- Calculate lifecycle consistently:
  - Requirements/Bug Analysis: initial artifact exists.
  - Design: `design.md` exists.
  - Tasks: `tasks.md` exists.
  - Completed: `tasks.md` contains at least one checkbox and all checkboxes are checked.
  - `[~]` and unchecked tasks remain incomplete.
- Calculate overall progress as 33% for the initial artifact, 33% for design, and 34% multiplied by task completion.

Kiro’s canonical Spec structure consists of the initial requirements or bugfix artifact, `design.md`, and `tasks.md`. [Kiro Specs](https://kiro.dev/docs/specs/)

### 3. Storage, metadata, relationships, and archive

- Use `better-sqlite3` in WAL mode, with numbered migrations and FTS5 search.
- Keep a single backend process as the database writer; the MCP server communicates with it over a token-protected localhost endpoint.
- Persist:
  - sources and scan history
  - normalized Specs and artifacts
  - metadata overlays with optimistic revisions
  - tags and owner aliases
  - curated relationships
  - pending deterministic and agent suggestions
  - archive snapshots, retention state, and purge tombstones
  - content-free audit events
- Metadata resolution order:
  1. Accepted database overlay.
  2. Explicitly imported `spec-library.json`.
  3. Deterministic artifact and Git-derived values.
- Metadata completeness requires title, owner, theme, and at least one tag. Completed Specs also require a retention policy and source provenance.
- Support relationship types: `depends_on`, `blocks`, `supersedes`, `duplicates`, and `related`.
- Generate explainable suggestions from:
  - explicit cross-Spec links in Markdown
  - shared tags and themes
  - repository proximity
  - normalized content similarity
- Limit deterministic suggestions to five per Spec above a fixed confidence threshold. Pending suggestions appear as dashed graph edges; accepted relationships become solid.
- On the first completed scan—or a later completion with a new content digest—create an immutable snapshot containing the source artifacts, metadata projection, hashes, and Git provenance.
- Preserve prior snapshots if a completed Spec becomes active again.
- Store snapshots under app-owned archive storage with read-only files and hash verification.
- Retention policies are `permanent`, `project_lifetime`, `active_plus_2_years`, and `custom_date`.
- Never purge automatically. A purge requires eligibility, no legal hold, and exact confirmation text `PURGE <snapshot-id>`. Purging removes snapshot bytes and search content but retains a tombstone and audit record so the same digest is not recreated.
- Never write to or push a source repository. Metadata export produces a downloadable `spec-library.json`; import is an explicit preview-and-confirm operation.

### 4. Prototype-conforming UI

- Use Crew’s real navigation and `useTheme`, `useAppApi`, `useNotify`, `useNavigate`, and `useChatLauncher`; do not render the prototype’s duplicate Kiro sidebar.
- Preserve the official Kiro wordmark, AWS Diatype fallback assets, density, spacing, colors, panel proportions, and detail hierarchy.

Relationship view:

- Default landing surface with dark graphite canvas.
- Stage columns across the top and dynamically sized theme lanes.
- Deterministic node placement by theme, stage, title, and Spec ID.
- Solid accepted edges and dashed pending suggestions.
- Selected-node emphasis, animated adjacent edges, zoom controls, legend, and right inspection rail.
- Search title, content, owner, repository, theme, and tags.
- Team/Mine scope, theme, type, stage, owner, repository, and metadata-completeness filters.
- “Mine” uses browser-local name/email aliases because Crew exposes no current-user identity hook; it is a filter, never an authorization boundary.
- Cap one graph response at 250 nodes and show a refinement prompt when results are truncated.
- Add roving keyboard focus, arrow navigation, Enter selection, visible focus states, and non-color status labels.

Archive view:

- Light chronological table grouped by completion month.
- Functional sticky year/month index with scroll synchronization.
- Cursor pagination in batches of 50.
- Search and filters for type, theme, repository, owner, date, retention, legal hold, and metadata completeness.
- Selected snapshot detail includes artifact completeness, source, provenance, tags, retention, legal hold, and available revisions.
- Responsive detail drawer below desktop width and a stacked list fallback for narrow screens.

Actions:

- “Open Spec” presents:
  - Open Crew chat with the Spec Librarian and selected Spec/revision context.
  - Open repository permalink at the indexed commit.
- Disable repository browsing when no web URL exists; warn when the indexed source was dirty.
- Metadata review supports title, summary, owner, theme, tags, target release, retention, legal hold, relationships, import/export, and pending suggestions.
- Use URL query state for selected view, Spec, archive revision, search, and filters so navigation and deep links are stable.

### 5. Spec Librarian agent

- Bundle a restricted `spec-librarian` agent with no shell or filesystem-write tools.
- Expose only three app MCP tools:
  - `search_specs(query, filters, limit)`
  - `get_spec_context(specId, revisionId?)`
  - `submit_metadata_proposal(specId, baseRevision, metadataPatch, relationshipAdds, rationale)`
- Launch the agent through `useChatLauncher`.
- Treat every agent result as a pending proposal. The MCP server cannot modify accepted metadata, relationships, retention, legal holds, or snapshots.
- Reject approval when the proposal’s base revision is stale; prompt the user to regenerate or manually reconcile it.
- Redact credential-like values and bound the content sent through MCP. AI assistance remains opt-in from the metadata panel.

## Public Interfaces

### Sidecar schema

`spec-library.json` will use a versioned contract:

```ts
interface SpecLibrarySidecarV1 {
  schemaVersion: 1;
  specId: string;
  metadata: {
    displayTitle?: string;
    summary?: string;
    theme?: string;
    tags?: string[];
    owner?: { name: string; email?: string };
    targetRelease?: string;
    retentionPolicy?: RetentionPolicy;
    legalHold?: { active: boolean; reason?: string };
  };
  relationships?: Array<{
    targetSpecId: string;
    targetRepository?: string;
    type: "depends_on" | "blocks" | "supersedes" | "duplicates" | "related";
    note?: string;
  }>;
}
```

### REST API

All browser endpoints live under `/apps/kiro-spec-library/api/v1`:

- `GET /bootstrap` — counts, facets, sync state, and UI defaults.
- `GET /specs` and `GET /specs/:id` — relationship catalog and detail.
- `GET /archive` and `GET /archive/:snapshotId` — paginated archive retrieval.
- `PATCH /specs/:id/metadata` — revision-checked metadata update.
- `POST/DELETE /specs/:id/relationships` — curated relationships.
- `GET /specs/:id/suggestions` — pending proposals.
- `POST /suggestions/:id/accept` and `/reject`.
- `POST /sync` and `GET /sync/:runId`.
- `GET/PUT /settings/sources`.
- `GET /export` and `POST /import/preview`, followed by `/import/apply`.
- `DELETE /archive/:snapshotId` — legal-hold and confirmation-gated purge.

Responses use an error envelope with `code`, safe `message`, optional field details, and request ID. Metadata writes include `expectedRevision`; stale writes return HTTP 409.

## Test and Release Plan

- Unit-test parsing for feature, bugfix, quick, design-first, missing, malformed, partially completed, completed, and reopened Specs.
- Test stable IDs, progress calculations, metadata precedence, Git-owner fallback, sidecar round trips, relationship scoring, snapshot deduplication, retention dates, holds, and purge tombstones.
- Security-test traversal, symlink escape, oversized files, malicious repository URLs, Git option injection, credential redaction, proxy authentication, stale proposals, and unauthorized MCP operations.
- Integration-test local roots and temporary Git remotes, offline refresh, authentication failures, dirty repositories, deleted Specs, renamed Specs, duplicate intrinsic IDs, and database migrations.
- Component-test search, filters, selection, metadata review, suggestion approval, Open Spec choices, archive month navigation, and error/empty/loading states.
- Run Playwright accessibility and keyboard tests.
- Add visual regression captures at 1440×1024 against the approved relationship and Archive references, comparing the app content region because Crew supplies the outer shell.
- Performance acceptance:
  - Index 1,000 local Specs in under 10 seconds on a typical developer machine.
  - Search responses under 200 ms at 5,000 Specs.
  - Render a 250-node relationship result within 2 seconds.
  - Preserve the last good catalog during remote or Git failures.
- Validate with `kirocrew doctor`, install from local path, enable, verify dashboard loading, backend health, MCP tools, agent proposals, and uninstall with “Keep app data.”
- Prepare a 256×256 icon, light/dark hero art, relationship and Archive screenshots, README, Apache-2.0 license, permission rationale, and committed runtime bundles.
- Publish `jhu-sheridan-libraries/kiro-spec-library`, then submit its `main` branch to Kiro’s public App Store registry. [Publishing guidelines](https://kiro.dev/docs/crew/apps/publishing/)

## Assumptions

- Version 0.1 supports macOS and Linux Crew hosts.
- Crew-authenticated dashboard users are trusted equally; the app does not introduce a second identity or role system.
- “Mine” is a personal browser-side filter based on configured Git/name aliases.
- Source repositories remain authoritative for active artifacts; the app owns metadata overlays and completed snapshots.
- Host Git credentials are available where private remotes are configured.
- No automated purge, repository write, Git push, or unapproved agent metadata mutation is permitted.
