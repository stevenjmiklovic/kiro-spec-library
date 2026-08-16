# Changelog

All notable changes to the Kiro Spec Library will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] — 2026-08-16

### Added

- Added property-based tests (fast-check) covering all 18 correctness properties with 100+ iterations each.
- Added Audit Log panel with operation filter and scrollable table, wired into AppChrome alongside other panels.
- Added Archive Ledger with chronological table, cursor pagination, sticky month index, and filter controls.
- Added build pipeline producing ESM bundles for all 4 workspaces.
- Scaffolded Bun workspace monorepo with shared, backend, ui, and mcp workspaces, Crew app manifest, and TypeScript project references.
- Added wrapGatewayApi adapter for KiroCrew gateway SDK integration with automatic proxy-path construction and dev-mode fallback.
- Added supersession chain as lifecycle disposition mechanism derived from the relationship graph.
- Added SQLite database layer with bun:sqlite in WAL mode, numbered migration runner, 12 tables (sources, specs, artifacts, metadata_overlays, relationships, suggestions, snapshots, snapshot_artifacts, scan_history, audit_events, rejections, owner_aliases), contentless FTS5 indexes, and 8 prepared-statement query modules.
- Added DetailPanel with inline-editable metadata, optimistic-concurrency PATCH, suggestion accept/reject, and SpecActions.
- Added Playwright E2E tests covering keyboard a11y, view/filter switching, and visual regression.
- Added MCP server with search_specs, get_spec_context, and submit_metadata_proposal tools, protected by per-session token authentication.
- Added immutable archive service with SHA-256 hash-verified snapshot creation and retrieval, retention policy enforcement (permanent, project_lifetime, active_plus_2_years, custom_date), legal hold gates, exact confirmation purge, and partial failure cleanup.
- Added integration suites for scanner, REST API, MCP tools, and database migrations.
- Added shared types, constants, Zod validation schemas, and credential redaction utility.
- Added MCP token authentication mechanism with file-based token sharing and opt-in enforcement via MCP_AUTH_ENFORCE=1.
- Added UX polish: Escape/focus management, loading skeletons, filter chips, keyboard hints, copy-link, theme persistence.
- Added Elysia REST API with TypeBox validation covering all endpoints: spec CRUD with metadata overlays, relationships and suggestions, archive snapshots with purge, source configuration, sidecar import/export, sync triggers, audit queries, error envelopes with request IDs, and backend server lifecycle with graceful shutdown.
- Added pending-proposal queue so MCP proposals require approval before applying.
- Added deterministic relationship suggestion engine with TF-IDF content similarity, cosine scoring, cross-spec markdown link detection, shared tag/theme analysis, repository proximity, per-spec limits, and rejection-aware filtering.
- Added client-only Aliases panel for configuring git author names, completing the "Mine" scope filter.
- Added spec normalizer (deterministic key derivation, type/workflow/stage classification, progress calculation, title extraction) and repository scanner (single-flight scanning, remote Git refresh, timeout enforcement, error isolation per source).
- Added metadata_overlays.approvers and implementation_ref columns for richer spec metadata tracking.
- Added path validator (traversal rejection, symlink escape detection, credential path blocking, file size limits) and git argument validator (shell metacharacter rejection, forbidden option filtering, safe command builders).
- Added Relationship Observatory with interactive graph canvas, theme-lane layout, keyboard navigation, and edge type distinction.
- Added manual Rescan button to AppChrome for triggering repository scanning on demand.
- Added user-controlled theme switcher persisted in URL, applying to both views.
- Added React ErrorBoundary component to prevent uncaught render errors from blanking the screen.

### Changed

- Split typography: system-ui for controls, AWS Diatype for headings, ui-monospace for code.
- Applied migration 005: updated_at, submitted_by, CASCADE, indexes, column rename, spec_title_at_snapshot.

### Fixed

- Fixed cosineSimilarity exceeding 1.0 due to floating-point rounding.
- Fixed API and routing bugs in gateway integration including permission paths, relationship/suggestion endpoints, and proposal routes.
- Fixed bootstrap 500 error, PATCH metadata field gaps, missing audit event on metadata update, and Archive Disposition display.

### Removed

- Removed 8 dead database columns (legal_hold, spec_title_at_snapshot, submitted_by, updated_at, and others) and the unused owner_aliases table via migration 010.
- Removed Legal Hold from all active code paths; DB columns kept dormant.
- Removed dead import/export routes (GET /export, POST /import/preview, POST /import/apply) superseded by text-export and backup services.

### Documentation

- Documented user-controlled theme toggle decision.
- Documented decision to implement MCP token authentication with opt-in enforcement (ADR-007).
- Documented supersession chain replacing Legal Hold.
- Documented decision to use a gateway SDK routing adapter with direct fetch (ADR-008).
- Documented schema migration 005 correctness improvements.
- Documented decision to use in-process TF-IDF with pairwise cosine similarity for relationship suggestions (ADR-003).
- Documented decision to use Bun workspace monorepo with Elysia backend (ADR-001).
- Documented decision to use contentless FTS5 for full-text search over external services (ADR-002).
