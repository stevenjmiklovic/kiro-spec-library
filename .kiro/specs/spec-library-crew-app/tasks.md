# Implementation Plan: Spec Library Crew App

## Overview

Convert the approved Kiro Spec Library prototype into a production Crew app with Bun workspaces (shared, backend, ui, mcp), SQLite persistence with FTS5, a relationship graph canvas, chronological archive table, deterministic suggestion engine, immutable snapshot archive, and a restricted Spec Librarian MCP agent. All code is TypeScript running on the Bun runtime with Elysia for HTTP routing.

## Tasks

- [x] 1. Project scaffolding and Bun workspace setup
  - [x] 1.1 Create root `package.json` with Bun workspaces declaration (`shared`, `backend`, `ui`, `mcp`) and shared dev dependencies (TypeScript, `fast-check`, Vitest, Playwright)
    - Configure `"workspaces"` array pointing to workspace directories
    - Add root scripts: `build`, `test`, `test:sites`, `dev`, `lint`
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Create `app.json` Crew manifest with all required fields
    - Name `kiro-spec-library`, version `0.1.0`, displayName, author, license `Apache-2.0`
    - Declare `minCrewVersion: "0.2.0"`, platforms `["macos-arm64", "macos-x64", "linux-x64"]`
    - UI route `/apps/kiro-spec-library`, entry `ui/dist/index.mjs`, externals
    - Backend entry `backend/dist/index.mjs`, runtime `bun`, portEnv, health `/health`
    - Agent `spec-librarian` with empty tools array
    - MCP entry `mcp/dist/index.mjs`, runtime `bun`
    - Permissions: `api: ["self"]`, `storage: "app"`, `network: ["git-clone", "git-fetch"]`
    - Required host commands: `["git", "bun"]`
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 17.1, 17.2_

  - [x] 1.3 Create workspace `package.json` files for `shared/`, `backend/`, `ui/`, `mcp/`
    - `shared`: no runtime deps, exports `./src/index.ts`
    - `backend`: deps on `elysia`, `@elysiajs/cors`, shared workspace; `bun:sqlite` is built-in
    - `ui`: deps on React, `@xyflow/react`, `lucide-react`; externals for Crew SDK
    - `mcp`: deps on `@modelcontextprotocol/sdk`, shared workspace
    - Each workspace has `build` and `typecheck` scripts
    - _Requirements: 1.2, 1.3, 1.6_

  - [x] 1.4 Create `tsconfig.json` files (root and per-workspace) with strict mode, path aliases to shared workspace
    - Root extends base config; workspaces use composite project references
    - Target `ESNext`, module `ESNext`, moduleResolution `bundler`
    - _Requirements: 1.2_

- [x] 2. Checkpoint - Ensure workspace setup compiles
  - Ensure all workspaces resolve, `bun install` succeeds, and `tsc --noEmit` passes across all workspaces. Ask the user if questions arise.

- [x] 3. Shared types, interfaces, constants, and validation schemas
  - [x] 3.1 Create `shared/src/types.ts` with all TypeScript interfaces and type aliases
    - `SpecType`, `WorkflowType`, `LifecycleStage`, `RelationshipType`, `RetentionPolicyType`
    - `RetentionPolicy`, `ErrorEnvelope`, `FieldError`, `Source`, `AuditEvent`, `AuditOperation`
    - `NormalizedSpec`, `SpecProvenance`, `ArtifactManifest`, `TaskCounts`
    - `Suggestion`, `SuggestionReason`, `Snapshot`, `SnapshotArtifact`
    - `MetadataOverlay`, `MetadataCompleteness`, `ScanResult`, `ScanError`
    - _Requirements: 4.1–4.12, 6.1–6.4, 7.1, 8.1–8.9, 19.5_

  - [x] 3.2 Create `shared/src/constants.ts` with shared enums and configuration defaults
    - `SPEC_TYPES`, `WORKFLOW_TYPES`, `LIFECYCLE_STAGES`, `RELATIONSHIP_TYPES`
    - `DEFAULT_SCAN_INTERVAL_MS = 900_000`, `MAX_ARTIFACT_BYTES = 1_048_576`
    - `MAX_SUGGESTIONS_PER_SPEC = 5`, `SUGGESTION_THRESHOLD = 0.3`
    - `FTS_SEARCH_LIMIT = 50`, `GRAPH_NODE_CAP = 250`, `ARCHIVE_PAGE_SIZE = 50`
    - `API_PREFIX = "/apps/kiro-spec-library/api/v1"`
    - _Requirements: 3.4, 7.4, 10.10, 11.3, 14.3, 16.1_

  - [x] 3.3 Create `shared/src/schemas.ts` with Zod validation schemas for sidecar and config
    - `SpecLibrarySidecarV1` schema with strict validation
    - `.config.kiro` schema (specId, workflowType, specType)
    - Metadata patch schema for API requests
    - Source configuration schema (local/remote variants)
    - _Requirements: 9.2, 9.5, 9.6_

  - [x] 3.4 Create `shared/src/redactor.ts` with credential redaction utility
    - Implement all PATTERNS from design: API keys, bearer tokens, private keys, passwords, GitHub PATs, AWS access keys
    - Export `redact(content: string): string` function
    - _Requirements: 15.4_

  - [x] 3.5 Create `shared/src/index.ts` barrel export
    - Re-export all types, constants, schemas, and redactor
    - _Requirements: 1.2_

- [x] 4. Database layer
  - [x] 4.1 Create `backend/src/db/connection.ts` with `bun:sqlite` connection setup
    - Open database in app-owned data directory
    - Enable WAL mode (`PRAGMA journal_mode = WAL`)
    - Enable foreign keys (`PRAGMA foreign_keys = ON`)
    - Run `PRAGMA integrity_check` on startup; abort if it fails
    - Export typed `Database` instance
    - _Requirements: 5.1, 5.4, 5.7_

  - [x] 4.2 Create `backend/src/db/migrations/001-core-tables.ts` with core schema
    - Tables: `sources`, `specs`, `artifacts`, `metadata_overlays`, `relationships`, `suggestions`, `snapshots`, `snapshot_artifacts`, `scan_history`, `audit_events`, `rejections`, `owner_aliases`
    - All CHECK constraints, UNIQUE constraints, and foreign keys per design
    - _Requirements: 5.2, 5.6_

  - [x] 4.3 Create `backend/src/db/migrations/002-fts5-indexes.ts` with FTS5 virtual tables
    - `specs_fts` and `snapshots_fts` contentless FTS5 tables
    - Insert/update/delete triggers to sync FTS with base tables
    - _Requirements: 5.3_

  - [x] 4.4 Create `backend/src/db/migrations/003-performance-indexes.ts`
    - All indexes from design: `idx_specs_source`, `idx_specs_stage`, `idx_specs_type`, `idx_specs_owner`, `idx_specs_theme`, `idx_relationships_source`, `idx_relationships_target`, `idx_suggestions_status`, `idx_snapshots_spec`, `idx_snapshots_created`, `idx_audit_timestamp`, `idx_audit_spec`, `idx_audit_operation`
    - _Requirements: 16.1, 16.2_

  - [x] 4.5 Create `backend/src/db/migrator.ts` migration runner
    - Discover and apply numbered migrations sequentially
    - Track applied migrations in a `_migrations` table
    - Abort startup on migration failure, logging migration number and error
    - _Requirements: 5.2_

  - [x] 4.6 Create `backend/src/db/queries/` prepared statement modules
    - `specs.ts`: upsert, findByKey, list with pagination/filters, search via FTS5
    - `metadata.ts`: get, upsert with revision check, delete
    - `relationships.ts`: create, delete, listBySpec, checkDuplicate
    - `suggestions.ts`: create, accept, reject, listPending, filterByDataHash
    - `snapshots.ts`: create, findByDigest, get, purge (tombstone), list with cursor pagination
    - `sources.ts`: list, put, delete
    - `audit.ts`: insert, query with filters (spec, operation, actor, date range)
    - `scan-history.ts`: insert, update, get
    - All using prepared statements for performance
    - _Requirements: 5.6, 16.2_

- [x] 5. Checkpoint - Ensure database layer compiles and migrations apply
  - Ensure migrations apply cleanly to a fresh database, prepared statements compile, and type-checking passes. Ask the user if questions arise.

- [x] 6. Security layer
  - [x] 6.1 Create `backend/src/security/path-validator.ts`
    - Reject paths containing `..`
    - Resolve and check symlinks against source root
    - Reject filesystem root `/`
    - Check file size against `MAX_ARTIFACT_BYTES`
    - Reject credential paths (`.kiro/credentials`, `.kiro/secrets`, `.credentials`, `.secrets`)
    - Return typed `ValidationResult` with reject reasons
    - _Requirements: 3.5, 15.1, 15.3_

  - [x] 6.2 Create `backend/src/security/git-validator.ts`
    - Define `FORBIDDEN_ARGS` and `SHELL_METACHARACTERS` regex
    - `validateArgs(args: string[]): ValidationResult`
    - `buildFetchCommand(clonePath, branch): string[]` — always `--no-tags`, `--depth=1`, hooks disabled
    - _Requirements: 3.2, 15.2_

  - [x]* 6.3 Write unit tests for path-validator and git-validator
    - Test traversal rejection with various `..` placements
    - Test symlink escape detection
    - Test credential path blocking
    - Test shell metacharacter rejection
    - Test forbidden git args
    - _Requirements: 15.1, 15.2, 15.3_

- [x] 7. Core backend services
  - [x] 7.1 Create `backend/src/services/normalizer.ts`
    - `deriveKey(sourceId, specId | null, relativePath): string` — deterministic key derivation
    - `classifyType(artifacts, config): SpecType` — feature/bugfix/quick/unknown logic
    - `classifyWorkflow(artifacts): WorkflowType` — requirements-first/design-first/unknown
    - `extractTitle(content, fallbackSlug): string` — first H1 heading extraction
    - `calculateStage(artifacts, taskCounts): LifecycleStage` — from design's stage table
    - `calculateProgress(artifacts, taskCounts): number` — 33+33+34*(completed/total) formula
    - `countTasks(tasksContent): TaskCounts` — regex for `- [ ]`, `- [x]`, `- [~]`
    - `normalize(raw, source): NormalizedSpec` — pure function orchestrating all above
    - _Requirements: 4.1–4.12_

  - [x] 7.2 Create `backend/src/services/scanner.ts`
    - Single-flight scan with `inFlight` guard
    - `triggerScan(): Promise<ScanResult>` — returns existing run if in progress
    - `scanSource(source): Promise<SpecDirectory[]>` — per-source scanning
    - `refreshRemote(source): Promise<void>` — git fetch with validation
    - `discoverSpecDirs(repoPath, sourceId): SpecDirectory[]` — find `.kiro/specs/<slug>/`
    - `readArtifacts(specDir): RawSpecArtifacts` — read and validate each file
    - Timeout enforcement: 120s per remote operation
    - Error isolation: one source failure does not abort scan
    - Record scan history and errors
    - _Requirements: 3.1–3.7_

  - [x] 7.3 Create `backend/src/services/metadata.ts` metadata resolution
    - `resolveMetadata(spec, overlay, sidecar): ResolvedMetadata` — priority: overlay > sidecar > artifact-derived
    - `evaluateCompleteness(resolved, stage): MetadataCompleteness` — title, owner, theme, tag required; completed stage adds retention + provenance
    - `applyPatch(specKey, patch, expectedRevision): { revision, updatedAt }` — optimistic concurrency
    - _Requirements: 6.1–6.4_

  - [x] 7.4 Create `backend/src/services/audit.ts` audit event logger
    - `recordEvent(operation, specId?, snapshotId?, actor): void`
    - Content-free: only operation, spec ID, snapshot ID, timestamp (ISO 8601 ms), actor
    - Failure tolerance: log errors but never fail parent operation
    - _Requirements: 19.1–19.8_

  - [x]* 7.5 Write unit tests for normalizer
    - Type classification scenarios (feature, bugfix, quick, unknown)
    - Workflow detection (requirements-first, design-first, unknown)
    - Title extraction (H1 present, absent, fallback to slug)
    - Stage calculation (all lifecycle transitions)
    - Progress computation (boundary cases, zero checkboxes)
    - Task counting (`[x]`, `[ ]`, `[~]` markers)
    - _Requirements: 4.1–4.12_

- [x] 8. Suggestion engine
  - [x] 8.1 Create `backend/src/services/suggester.ts`
    - `buildTfIdfVectors(specs): Map<string, TfIdfVector>` — term frequency × inverse document frequency
    - `cosineSimilarity(a, b): number` — dot product / (magnitude_a × magnitude_b)
    - `extractMarkdownLinks(content, currentSpecKey): LinkReference[]` — find cross-spec references
    - `isProximate(a, b): boolean` — same repo or adjacent directories
    - `filterRejected(suggestions, rejections): Suggestion[]` — skip unless data_hash changed
    - `generateAll(specs, metadata): Suggestion[]` — orchestrate all strategies, deduplicate, limit 5 per spec
    - Confidence scoring: markdown_link=0.9, shared_tags=0.5+0.1×count, shared_theme=0.4, proximity=0.35, content_similarity=actual cosine
    - _Requirements: 7.3, 7.4, 7.7_

  - [x]* 8.2 Write unit tests for TF-IDF and cosine similarity
    - Self-similarity equals 1.0
    - Similarity bounded [0, 1]
    - Empty documents handled gracefully
    - Per-spec limit enforced (max 5)
    - Deduplication of same-pair same-type suggestions
    - _Requirements: 7.3, 7.4_

- [x] 9. Archive service
  - [x] 9.1 Create `backend/src/services/archiver.ts`
    - `maybeCreateSnapshot(spec, metadata): Promise<Snapshot | null>` — only for completed specs with new content digest
    - `retrieveSnapshot(snapshotId): Promise<Snapshot>` — verify content hashes on retrieval
    - `purge(snapshotId, confirmationText): Promise<void>` — validate retention expired, no legal hold, exact text match
    - `isEligibleForPurge(snapshot): { eligible, reason? }` — check all purge gates
    - `storeArtifacts(snapshotId, artifacts): Promise<SnapshotArtifact[]>` — write with read-only permissions, verify hashes
    - SHA-256 content digest computation for concatenated sorted artifacts
    - Partial failure cleanup: discard incomplete snapshot data on error
    - _Requirements: 8.1–8.9_

  - [x]* 9.2 Write unit tests for archive service
    - Snapshot creation for newly completed spec
    - Duplicate digest detection (no re-archive)
    - Hash verification on write and retrieval
    - Purge gate validation (retention, legal hold, confirmation text)
    - Partial failure cleanup
    - _Requirements: 8.1–8.9_

- [x] 10. Checkpoint - Ensure all backend services compile and unit tests pass
  - Ensure all services compile, type-check passes, and unit tests pass. Ask the user if questions arise.

- [x] 11. Elysia REST API routes
  - [x] 11.1 Create `backend/src/router.ts` with Elysia app setup and global middleware
    - Error handler producing `ErrorEnvelope` with `requestId` (UUID v4)
    - Request ID generation via `crypto.randomUUID()`
    - CORS configuration for Crew shell origin
    - API prefix `/apps/kiro-spec-library/api/v1`
    - TypeBox schema validation on all request bodies
    - _Requirements: 14.1–14.5_

  - [x] 11.2 Implement health and bootstrap endpoints
    - `GET /health` — 200 when ready, 503 before initialization complete
    - `GET /bootstrap` — app init data (counts, facets, sync state)
    - _Requirements: 1.7, 1.8_

  - [x] 11.3 Implement spec CRUD endpoints
    - `GET /specs` — paginated list with filters (type, stage, owner, theme, repo, completeness)
    - `GET /specs/:id` — single spec detail with resolved metadata
    - `PATCH /specs/:id/metadata` — optimistic revision check, 409 on conflict
    - _Requirements: 6.4, 10.8, 14.2_

  - [x] 11.4 Implement relationship and suggestion endpoints
    - `POST /specs/:id/relationships` — create with type validation, 409 on duplicate
    - `DELETE /specs/:id/relationships/:relId` — remove relationship
    - `GET /specs/:id/suggestions` — pending suggestions for spec
    - `POST /suggestions/:id/accept` — convert to curated relationship
    - `POST /suggestions/:id/reject` — record rejection with data_hash
    - _Requirements: 7.1, 7.2, 7.5–7.9_

  - [x] 11.5 Implement archive endpoints
    - `GET /archive` — cursor-based pagination (created_at + id), batches of 50
    - `GET /archive/:snapshotId` — snapshot detail with artifacts
    - `DELETE /archive/:snapshotId` — purge with confirmation validation
    - _Requirements: 8.3, 8.6, 8.7, 8.8, 11.3, 15.6_

  - [x] 11.6 Implement sync endpoints
    - `POST /sync` — trigger manual scan, return run ID
    - `GET /sync/:runId` — scan status and results
    - _Requirements: 3.1, 3.6, 3.7_

  - [x] 11.7 Implement settings endpoints
    - `GET /settings/sources` — list configured sources
    - `PUT /settings/sources` — update sources with validation (path exists, remote reachable)
    - _Requirements: 2.1–2.7_

  - [x] 11.8 Implement sidecar import/export endpoints
    - `GET /export` — produce downloadable `spec-library.json`
    - `POST /import/preview` — validate and preview changes (add/modify/remove counts)
    - `POST /import/apply` — apply validated import
    - _Requirements: 9.1–9.6_

  - [x] 11.9 Implement audit endpoint
    - `GET /audit` — query events with filters (spec, operation, actor, date range)
    - _Requirements: 19.6_

- [x] 12. Backend entry point and server lifecycle
  - [x] 12.1 Create `backend/src/index.ts` server startup sequence
    - Generate MCP token (`crypto.randomUUID()`)
    - Open database connection (WAL, integrity check)
    - Run migrations
    - Start Elysia server on configured port
    - Trigger initial scan (single-flight)
    - Schedule periodic scans (15-minute interval)
    - Graceful shutdown handler
    - _Requirements: 1.7, 1.8, 3.1, 5.1, 5.2, 5.4, 5.5, 5.7_

- [x] 13. Checkpoint - Ensure REST API compiles and responds to health checks
  - Ensure backend starts, `/health` returns 200, migrations apply, and type-checking passes. Ask the user if questions arise.

- [x] 14. MCP server and tool implementations
  - [x] 14.1 Create `mcp/src/index.ts` MCP server entry point
    - Initialize MCP protocol handler
    - Read backend token from environment variable
    - Connect to backend via token-protected localhost HTTP
    - Register tools with schema definitions
    - _Requirements: 5.5, 13.1_

  - [x] 14.2 Create `mcp/src/tools.ts` tool implementations
    - `search_specs(query, filters?, limit?)` — FTS5 search, limit capped at 100
    - `get_spec_context(specId, revisionId?)` — full spec detail with artifact content
    - `submit_metadata_proposal(specId, baseRevision, metadataPatch, relationshipAdds?, rationale)` — create pending proposal only
    - Response size cap: 64 KB per tool response
    - _Requirements: 13.2, 13.4, 15.5_

  - [x] 14.3 Create `mcp/src/redactor.ts` MCP-specific credential redaction
    - Apply shared redactor to all content before MCP transmission
    - Enforce 64 KB response limit with truncation
    - _Requirements: 13.6, 15.4_

  - [x]* 14.4 Write unit tests for MCP tools
    - Verify search respects limit cap
    - Verify proposals create pending state only (no direct modification)
    - Verify credential redaction on output
    - Verify response size cap enforcement
    - _Requirements: 13.2, 13.4, 13.6_

- [x] 15. UI shared infrastructure
  - [x] 15.1 Create `ui/src/hooks/useCrewIntegration.ts` Crew SDK hook bindings
    - Wrap `useTheme`, `useAppApi`, `useNotify`, `useNavigate`, `useChatLauncher`
    - Error detection: render error message if any hook throws or returns undefined
    - _Requirements: 18.1, 18.2_

  - [x] 15.2 Create `ui/src/hooks/useUrlState.ts` URL state management
    - Persist view, selected spec, archive revision, search query, active filters in URL query params
    - Restore identical state on page reload with same URL
    - _Requirements: 12.5_

  - [x] 15.3 Create `ui/src/hooks/useSpecData.ts` data fetching hook
    - Fetch specs with filters, handle loading/error states
    - Paginated fetching for archive (cursor-based)
    - Search debounce (500ms after 2+ chars)
    - _Requirements: 10.7, 11.3, 16.2_

  - [x] 15.4 Create `ui/src/styles/tokens.ts` design tokens
    - Dark theme tokens for Relationship View (graphite canvas palette)
    - Light theme tokens for Archive View
    - AWS Diatype font family declaration
    - Spacing, color, and typography tokens matching prototype
    - _Requirements: 18.4, 18.5_

  - [x] 15.5 Create `ui/src/styles/global.css` base styles
    - CSS custom properties from token system
    - AWS Diatype font-face declarations
    - Reset and accessibility baseline styles
    - _Requirements: 18.4_

  - [x] 15.6 Create `ui/src/App.tsx` root component with error boundary
    - `AppProvider` context with Crew hook values
    - `ErrorBoundary` wrapping view router
    - View switching based on URL state (relationship vs archive)
    - _Requirements: 18.1, 18.2, 18.3_

  - [x] 15.7 Create `ui/src/index.tsx` ESM library entry point
    - Export `SpecLibraryApp` as default
    - Ensure React and ReactDOM are external (not bundled)
    - _Requirements: 1.3_

- [x] 16. Relationship View
  - [x] 16.1 Create `ui/src/views/RelationshipView.tsx` main view container
    - Dark graphite canvas background
    - Stage columns across top, theme lanes sized proportionally
    - Empty lanes collapsed to labeled placeholder row
    - Filter bar integration
    - 250-node cap with refinement prompt
    - _Requirements: 10.1, 10.2, 10.10, 10.12_

  - [x] 16.2 Create `ui/src/components/GraphCanvas.tsx` using `@xyflow/react`
    - Deterministic node placement algorithm (theme lane → stage column → sort by title, specId)
    - Solid edges for accepted relationships, dashed for pending suggestions
    - Zoom controls (25%–400%, default 100%)
    - Virtual rendering for performance (built-in to @xyflow/react)
    - Color legend and non-color status labels
    - _Requirements: 10.3, 10.4, 10.6, 16.3_

  - [x] 16.3 Create `ui/src/components/NodeComponent.tsx` custom node rendering
    - Display spec title, type icon, stage indicator, progress
    - Highlighted border on selection
    - Animate adjacent edges on selection
    - Visible focus states with 3:1 contrast ratio
    - _Requirements: 10.5, 10.11_

  - [x] 16.4 Create `ui/src/components/EdgeComponent.tsx` custom edge rendering
    - Solid for relationships, dashed for suggestions
    - Type labels on edges
    - Edge bundling for parallel edges between same nodes
    - _Requirements: 10.4_

  - [x] 16.5 Create `ui/src/components/FilterBar.tsx` filter controls
    - Team/Mine scope (browser-local, not auth boundary)
    - Theme, type, stage, owner, repository, metadata completeness filters
    - Search field (2+ chars triggers, 500ms debounce)
    - Empty state message when no results match
    - _Requirements: 10.7, 10.8, 10.9, 10.12_

  - [x] 16.6 Implement keyboard navigation for Relationship View
    - Roving keyboard focus
    - Arrow-key navigation between nodes
    - Enter for selection
    - Focus states meeting 3:1 contrast ratio
    - Non-color status indicators
    - _Requirements: 10.11_

- [x] 17. Archive View
  - [x] 17.1 Create `ui/src/views/ArchiveView.tsx` main view container
    - Light-themed chronological table
    - Snapshots grouped by completion month, newest-first within groups
    - Cursor-based pagination in batches of 50
    - Loading indicator during page fetch, prevent duplicate fetches
    - _Requirements: 11.1, 11.3, 11.8_

  - [x] 17.2 Implement sticky year/month index
    - Highlights currently visible month group
    - Click scrolls to corresponding group
    - _Requirements: 11.2_

  - [x] 17.3 Implement Archive View filter controls
    - Type, theme, repository, owner, date range, retention, legal hold, metadata completeness
    - Search field (max 200 chars)
    - Empty state when no results (retain filter selections)
    - _Requirements: 11.4, 11.7_

  - [x] 17.4 Implement responsive layout for Archive View
    - Below 1024px: stacked list layout
    - Snapshot detail in slide-in drawer instead of inline section on narrow viewports
    - _Requirements: 11.6_

  - [x] 17.5 Implement snapshot detail display
    - Artifact completeness ratio
    - Source provenance, tags, retention policy, legal hold status
    - Available revisions
    - _Requirements: 11.5_

- [x] 18. Detail panel, metadata panel, and spec actions
  - [x] 18.1 Create `ui/src/components/DetailPanel.tsx`
    - Right inspection rail in Relationship View
    - Expanded drawer in Archive View
    - Full spec metadata display
    - _Requirements: 10.5, 11.5_

  - [x] 18.2 Create `ui/src/components/MetadataPanel.tsx`
    - List: title, summary, owner, theme, tags, target release, retention policy, legal hold
    - Relationships section with pending suggestions
    - Import/export affordances
    - Each field viewable with edit affordance
    - Pending proposal display with accept/reject actions
    - _Requirements: 12.4, 13.7, 13.8_

  - [x] 18.3 Implement spec actions
    - "Open Spec" with options: Crew chat (with spec ID, revision, commit) or repository permalink
    - Disabled permalink when no web URL template exists
    - Dirty state indicator adjacent to permalink
    - Chat launcher integration via `useChatLauncher`
    - _Requirements: 12.1, 12.2, 12.3, 13.3_

- [x] 19. Checkpoint - Ensure UI compiles and renders both views
  - Ensure `ui` workspace builds to ESM bundle, type-checking passes, and both views render without errors in a test harness. Ask the user if questions arise.

- [x] 20. Property-based tests with fast-check
  - [x]* 20.1 Property 1 & 2: Normalizer determinism and spec key stability
    - **Property 1: Normalizer Determinism** — identical inputs produce byte-for-byte identical output
    - **Property 2: Spec Key Stability** — same sourceId + specId always produces same key
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.8, 4.10**

  - [x]* 20.2 Property 3 & 4: Progress bounds and task counting
    - **Property 3: Progress Bounds and Monotonicity** — progress always [0, 100], monotonically increasing with artifacts
    - **Property 4: Task Counting Correctness** — total = all checkboxes, completed = only `[x]`
    - **Validates: Requirements 4.9, 4.10, 4.11**

  - [x]* 20.3 Property 5: Sidecar round-trip equivalence
    - **Property 5: Sidecar Round-Trip Equivalence** — export → import → export produces identical sorted JSON
    - **Validates: Requirements 9.5**

  - [x]* 20.4 Property 6 & 7: Path traversal and symlink escape
    - **Property 6: Path Traversal Rejection** — any path with `..` is rejected
    - **Property 7: Symlink Escape Prevention** — symlinks resolving outside source root rejected
    - **Validates: Requirements 15.1**

  - [x]* 20.5 Property 8 & 9: Git argument safety and credential redaction
    - **Property 8: Git Argument Safety** — shell metacharacters and forbidden options always rejected
    - **Property 9: Credential Redaction Completeness** — all credential patterns replaced with `[REDACTED]`
    - **Validates: Requirements 15.2, 15.4**

  - [x]* 20.6 Property 10 & 11: TF-IDF similarity bounds and suggestion limits
    - **Property 10: TF-IDF Cosine Similarity Bounds** — always [0.0, 1.0], self-similarity = 1.0
    - **Property 11: Suggestion Deduplication and Limit** — max 5 per spec, no duplicate pair+type
    - **Validates: Requirements 7.3, 7.4**

  - [x]* 20.7 Property 12 & 13: Metadata resolution priority and snapshot integrity
    - **Property 12: Metadata Resolution Priority** — overlay > sidecar > artifact-derived
    - **Property 13: Snapshot Content Integrity** — re-hashing stored artifacts matches stored hashes
    - **Validates: Requirements 6.1, 8.3**

  - [x]* 20.8 Property 14 & 15: Purge confirmation and audit content-free
    - **Property 14: Purge Confirmation Exactness** — only exact `PURGE <id>` accepted
    - **Property 15: Audit Event Content-Free Guarantee** — no artifact content or metadata values in events
    - **Validates: Requirements 8.6, 15.6, 19.5**

  - [x]* 20.9 Property 16, 17 & 18: Error envelope, relationship type, and node placement
    - **Property 16: Error Envelope Structure** — code, message ≤500 chars, UUID v4 requestId
    - **Property 17: Relationship Type Validation** — invalid types always rejected
    - **Property 18: Node Placement Determinism** — identical data produces identical coordinates
    - **Validates: Requirements 7.2, 10.3, 14.1, 14.5**

- [x] 21. Integration tests
  - [x]* 21.1 Scanner integration tests with temporary Git repositories
    - Create temp local and remote repos with `.kiro/specs/` directories
    - Test discovery, normalization, and storage pipeline
    - Test remote refresh with fetch
    - Test error isolation (one source failure doesn't abort scan)
    - _Requirements: 3.1–3.7_

  - [x]* 21.2 REST API integration tests
    - Full CRUD cycle for specs, metadata, relationships, suggestions
    - Error responses (409 conflict, 400 validation, 422 invalid type)
    - Revision conflict on metadata write
    - Purge with all gate conditions
    - _Requirements: 7.1–7.9, 8.6, 14.1–14.5_

  - [x]* 21.3 MCP tool integration tests
    - `search_specs` with various queries and filters
    - `get_spec_context` with redaction verification
    - `submit_metadata_proposal` creating pending state
    - Token authentication enforcement
    - _Requirements: 13.2, 13.4, 13.6_

  - [x]* 21.4 Database migration integration tests
    - Apply all migrations to fresh database
    - Verify schema matches expected structure
    - Test migration failure handling
    - _Requirements: 5.2_

- [x] 22. Checkpoint - Ensure all tests pass
  - Ensure all unit, property-based, and integration tests pass. Ask the user if questions arise.

- [x] 23. E2E tests
  - [x]* 23.1 Playwright keyboard navigation and accessibility tests
    - Roving focus in graph canvas
    - Arrow-key navigation between nodes
    - Enter selection opens detail panel
    - Focus states visible with 3:1 contrast
    - Tab order through filter controls
    - _Requirements: 10.11_

  - [x]* 23.2 Playwright view switching and filter tests
    - Switch between Relationship and Archive views
    - Apply filters and verify results
    - Search with 2+ characters
    - URL state preservation across reload
    - _Requirements: 10.7, 10.8, 11.4, 12.5_

  - [x]* 23.3 Visual regression tests
    - Capture at 1440×1024
    - Compare against prototype references
    - Dark theme relationship canvas
    - Light theme archive table
    - _Requirements: 18.5_

- [x] 24. Build pipeline and dist artifacts
  - [x] 24.1 Configure build scripts for all workspaces
    - `shared`: compile TypeScript to ESM
    - `backend`: bundle to `backend/dist/index.mjs`
    - `ui`: bundle to `ui/dist/index.mjs` with React/ReactDOM/Lucide/@kirocrew/app-sdk as externals
    - `mcp`: bundle to `mcp/dist/index.mjs`
    - Root `npm run build` orchestrates all workspace builds in dependency order
    - _Requirements: 1.3, 1.6_

  - [x] 24.2 Validate dist output structure
    - Ensure `ui/dist/index.mjs`, `backend/dist/index.mjs`, `mcp/dist/index.mjs` exist after build
    - Verify ESM format (no CommonJS require calls)
    - Verify externals are not bundled into UI
    - _Requirements: 1.6_

- [x] 25. Final manifest validation and Crew app lifecycle
  - [x] 25.1 Validate `app.json` against Crew manifest schema
    - All required fields present and correctly typed
    - Version in semver format
    - Platform array covers macOS-arm64, macOS-x64, Linux-x64
    - Permissions minimal (self API, app storage, git network)
    - _Requirements: 1.1, 1.4, 1.5, 17.1, 17.2_

  - [x] 25.2 Run full `npm run build` and `npm run test:sites`
    - Build must produce `dist/client/index.html`, `dist/server/index.js`, `dist/.openai/hosting.json`
    - Sites worker test must pass
    - Verify Crew app lifecycle: install → start → health → serve → stop
    - _Requirements: 1.7, 1.8_

- [x] 26. Final checkpoint - Ensure complete app builds and all tests pass
  - Ensure `npm run build` succeeds, `npm run test:sites` passes, all tests (unit, property, integration) pass, and the app responds to health checks. Ask the user if questions arise.

- [x] 27. UX polish and chrome improvements
  - [x] 27.1 Dialog/rail accessibility: Escape-to-close, focus trap, and focus restore
    - Add Escape handler to the Relationship detail rail and Archive drawer
    - Trap focus within the open drawer (`role="dialog" aria-modal`) and restore focus to the triggering row/node on close
    - _Requirements: 10.5, 11.5, 11.6_
  - [x] 27.2 Resolve the "Mine" scope dead end
    - Add an owner-alias editor (persisted in localStorage) so the Team/Mine toggle is meaningful
    - Disable or annotate the Mine toggle until at least one alias exists
    - _Requirements: 10.x scope filtering_
  - [x] 27.3 Guard unsaved metadata edits
    - Warn or auto-commit in-progress MetadataPanel field edits when selection changes
    - Surface a saving indicator in the DetailPanel header while a PATCH is in flight
    - _Requirements: 12.4_
  - [x] 27.4 Loading skeletons
    - Replace bare "Loading…" text with skeleton node cards (Relationship) and table rows (Archive)
    - _Requirements: 10.x, 11.1_
  - [x] 27.5 Active-filter chips
    - Render dismissible chips for each active filter in both filter bars, with individual removal
    - _Requirements: 10.x, 11.4_
  - [x] 27.6 Keyboard-nav discoverability and Copy-view link
    - Surface graph roving-navigation shortcuts (visible focus ring / hint)
    - Add a "Copy link to this view" action in the chrome (URL already encodes state)
    - _Requirements: 10.x_
  - [x] 27.7 Theme + chrome polish
    - Persist theme selection to localStorage in addition to the URL param
    - Consolidate the duplicate stage/edge legends; add an inline progress bar on node cards
    - Make the graph height viewport-relative (`min(43rem, 70vh)`) for short viewports
    - _Requirements: 10.x, 20.x_

  - [x] 27.8 Fix cosineSimilarity floating-point bound violation
    - Clamp return value with `Math.min(1.0, ...)` in backend/src/services/suggester.ts
    - fast-check found the function can return 1.0000000000000002 due to FP rounding
    - Remove the epsilon tolerance from the property test after applying the clamp
    - _Bug found by Property 10_

  - [x] 27.9 Implement a real pending-proposal queue for MCP submit_metadata_proposal
    - Current behavior: PATCHes /specs/:id/metadata directly (modifies overlay immediately)
    - Intended behavior: create a pending proposal requiring human approval before applying
    - Add a proposals table, backend queue route, and update mcp/src/tools.ts to POST to it
    - Update the MCP integration test to assert pending-only semantics once implemented
    - _Discrepancy found by integration test, pre-existing concern from Task 14_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript throughout, running on the Bun runtime
- `bun:sqlite` provides zero-dependency native SQLite access
- Elysia with TypeBox provides type-safe HTTP routing and schema validation
- `@xyflow/react` handles graph rendering with built-in virtualization
- `fast-check` is used for all property-based tests (minimum 100 iterations per property)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5"] },
    { "id": 3, "tasks": ["4.1", "6.1", "6.2"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4", "4.5", "6.3"] },
    { "id": 5, "tasks": ["4.6"] },
    { "id": 6, "tasks": ["7.1", "7.4"] },
    { "id": 7, "tasks": ["7.2", "7.3", "8.1"] },
    { "id": 8, "tasks": ["7.5", "8.2", "9.1"] },
    { "id": 9, "tasks": ["9.2", "11.1"] },
    { "id": 10, "tasks": ["11.2", "11.3", "11.4", "11.5", "11.6", "11.7", "11.8", "11.9"] },
    { "id": 11, "tasks": ["12.1"] },
    { "id": 12, "tasks": ["14.1", "14.2", "14.3"] },
    { "id": 13, "tasks": ["14.4", "15.1", "15.2", "15.3", "15.4", "15.5"] },
    { "id": 14, "tasks": ["15.6", "15.7"] },
    { "id": 15, "tasks": ["16.1", "16.2", "16.5"] },
    { "id": 16, "tasks": ["16.3", "16.4", "16.6", "17.1"] },
    { "id": 17, "tasks": ["17.2", "17.3", "17.4", "17.5"] },
    { "id": 18, "tasks": ["18.1", "18.2", "18.3"] },
    { "id": 19, "tasks": ["20.1", "20.2", "20.3", "20.4", "20.5", "20.6", "20.7", "20.8", "20.9"] },
    { "id": 20, "tasks": ["21.1", "21.2", "21.3", "21.4"] },
    { "id": 21, "tasks": ["23.1", "23.2", "23.3"] },
    { "id": 22, "tasks": ["24.1"] },
    { "id": 23, "tasks": ["24.2", "25.1"] },
    { "id": 24, "tasks": ["25.2"] }
  ]
}
```
