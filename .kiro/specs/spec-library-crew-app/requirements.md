# Requirements Document

## Introduction

Convert the approved Kiro Spec Library React prototype into a production Kiro Crew app that indexes Spec artifacts from local and remote Git repositories, presents them in a relationship-first dark canvas and a light chronological archive, curates metadata overlays and retention policies, generates relationship suggestions, creates immutable snapshots of completed Specs, and exposes a restricted Spec Librarian agent for AI-assisted metadata proposals.

## Glossary

- **Crew_App**: A full-stack application installable into Kiro Crew comprising an `app.json` manifest, ESM UI bundle, Node backend, optional MCP server, and optional agent definition.
- **Spec**: A Kiro specification residing in a `.kiro/specs/<slug>/` directory within a Git repository, consisting of requirement or bugfix artifacts, design documents, and task lists.
- **Source**: An administrator-configured local directory root or remote Git repository URL from which Specs are discovered.
- **Scanner**: The backend component that discovers, reads, and normalizes Spec artifacts from configured Sources.
- **Normalizer**: The component that derives type, workflow, lifecycle stage, progress, title, and owner from raw Spec artifacts and Git metadata.
- **Metadata_Overlay**: User-curated metadata fields stored in the database that take precedence over artifact-derived and sidecar values.
- **Sidecar**: A `spec-library.json` file co-located with Spec artifacts containing portable metadata and relationship declarations conforming to `SpecLibrarySidecarV1`.
- **Relationship**: A typed directional link between two Specs with types `depends_on`, `blocks`, `supersedes`, `duplicates`, or `related`.
- **Suggestion**: A pending relationship or metadata proposal generated deterministically or by the Spec Librarian agent, requiring explicit user acceptance.
- **Snapshot**: An immutable archive record of a completed Spec containing source artifacts, metadata projection, content hashes, and Git provenance.
- **Retention_Policy**: A rule governing how long a Snapshot is preserved, with values `permanent`, `project_lifetime`, `active_plus_2_years`, or `custom_date`.
- **Legal_Hold**: A flag preventing purge of a Snapshot regardless of retention eligibility.
- **Purge**: The permanent removal of Snapshot bytes and search content, retaining only a tombstone and audit record.
- **Spec_Librarian**: A restricted agent with no shell or filesystem-write tools that submits metadata proposals through MCP tools.
- **MCP_Server**: The app-owned Model Context Protocol server exposing `search_specs`, `get_spec_context`, and `submit_metadata_proposal` tools.
- **Relationship_View**: The default dark graphite canvas showing Specs as nodes with typed edges organized by theme lanes and lifecycle stage columns.
- **Archive_View**: The light chronological table listing completed Spec Snapshots grouped by completion month.
- **Detail_Panel**: The right inspection rail in Relationship_View or the expanded drawer in Archive_View showing full Spec metadata and actions.
- **Metadata_Completeness**: A Spec satisfies completeness when it has a title, owner, theme, and at least one tag; completed Specs additionally require a retention policy and source provenance.

## Requirements

### Requirement 1: Crew App Manifest and Structure

**User Story:** As a Crew platform administrator, I want the Spec Library packaged as a standard Crew app with a valid manifest, so that I can install, enable, and manage it through Crew's app lifecycle.

#### Acceptance Criteria

1. THE Crew_App SHALL include an `app.json` manifest declaring name `kiro-spec-library`, version in semver format (MAJOR.MINOR.PATCH), display name, author, license `Apache-2.0`, minimum Crew version `0.2.0`, macOS and Linux platform support, UI route, backend configuration, agent definition, MCP server, permissions, and required host commands.
2. THE Crew_App SHALL organize source into npm workspaces: `ui`, `backend`, `mcp`, and `shared`.
3. THE Crew_App SHALL build the UI workspace into `ui/dist/index.mjs` as an ESM library bundle keeping React, ReactDOM, Lucide, and `@kirocrew/app-sdk` as external dependencies.
4. THE Crew_App SHALL declare `git` as a required host command in the manifest.
5. THE Crew_App SHALL limit permissions to its own API, app-scoped storage, and network access for Git clone and fetch operations.
6. THE Crew_App SHALL include compiled bundles in the repository at `ui/dist/index.mjs`, `backend/dist/index.mjs`, and `mcp/dist/index.mjs` because Crew excludes build inputs during installation.
7. WHEN the backend process has completed initialization and is accepting HTTP requests, THE Crew_App SHALL expose a `/health` endpoint that returns HTTP 200 with no additional payload.
8. IF a request is made to the `/health` endpoint before the backend has completed initialization, THEN THE Crew_App SHALL return HTTP 503 to indicate the service is not yet ready.

### Requirement 2: Source Configuration

**User Story:** As an administrator, I want to configure local and remote repository sources, so that the Spec Library indexes Specs from all relevant codebases.

#### Acceptance Criteria

1. THE Scanner SHALL support administrator-configured local directory roots as Sources, validated by confirming the path exists and is readable at configuration time.
2. THE Scanner SHALL support administrator-configured remote HTTPS or SSH Git repository URLs, each with a single branch specification and an optional web URL template, as Sources.
3. THE Scanner SHALL use the host SSH agent or Git credential helper for authentication and SHALL NOT collect or persist credentials.
4. WHEN a remote Source is configured, THE Scanner SHALL clone the specified branch of the repository into app-owned storage within 120 seconds.
5. THE Crew_App SHALL expose `GET /settings/sources` and `PUT /settings/sources` REST endpoints for reading and updating Source configurations.
6. IF a Source configuration fails validation (local path unreadable, unreachable remote URL, or authentication failure), THEN THE Crew_App SHALL reject the configuration, return an error message indicating the failure reason, and leave the existing Source list unchanged.
7. WHEN an administrator removes a Source via `PUT /settings/sources`, THE Scanner SHALL delete the associated cloned repository data from app-owned storage and remove all Specs originating from that Source from the index.

### Requirement 3: Repository Scanning and Refresh

**User Story:** As a user, I want Specs automatically discovered and kept current, so that the library always reflects the latest state of configured repositories.

#### Acceptance Criteria

1. THE Scanner SHALL run a single-flight scan on backend startup, every 15 minutes, and on manual refresh via `POST /sync`.
2. WHEN refreshing a remote Source, THE Scanner SHALL use noninteractive, hook-disabled `git fetch` operations and reset only app-owned clones.
3. IF a Source becomes unavailable during a scan, THEN THE Scanner SHALL retain the last good index for that Source and record the failure timestamp and error category.
4. THE Scanner SHALL read only `.kiro/specs/<slug>/` directories containing `.config.kiro`, `requirements.md` or `bugfix.md`, `design.md`, `tasks.md`, optional `tasks.meta.json`, and optional `spec-library.json`.
5. THE Scanner SHALL reject path traversal attempts, source-root symlink escapes, files exceeding a configured size limit (default 1 MB per artifact), invalid Git arguments, filesystem root paths, and sensitive Crew credential paths.
6. THE Crew_App SHALL expose `GET /sync/:runId` for retrieving scan status and results.
7. IF a concurrent scan request arrives while a scan is already in progress, THEN THE Scanner SHALL return the run ID of the in-progress scan rather than starting a duplicate.

### Requirement 4: Spec Normalization and Lifecycle Calculation

**User Story:** As a user, I want each Spec consistently categorized by type, stage, and progress, so that I can understand the state of work across all repositories.

#### Acceptance Criteria

1. THE Normalizer SHALL derive a deterministic Spec key by concatenating the Source ID with the `.config.kiro` `specId` value, producing identical output across invocations given identical inputs.
2. IF the `.config.kiro` file is absent or contains no `specId` value, THEN THE Normalizer SHALL derive the Spec key by concatenating the Source ID with the repository-relative path of the Spec directory.
3. THE Normalizer SHALL classify each Spec as `feature` when a `requirements.md` and `design.md` both exist, `bugfix` when `.config.kiro` contains `type: bugfix` or only a bug-analysis artifact exists, `quick` when only `tasks.md` exists with no design or requirements artifact, or `unknown` when none of these conditions are met.
4. THE Normalizer SHALL classify each Spec workflow as `requirements-first` when `requirements.md` is the earliest-created artifact, `design-first` when `design.md` is the earliest-created artifact, or `unknown` when neither artifact exists.
5. THE Normalizer SHALL extract title from the first H1 heading in the workflow's initial artifact, where the initial artifact is `requirements.md` for `requirements-first` workflows and `design.md` for `design-first` workflows, falling back to the Spec directory slug when no H1 heading is found or the initial artifact does not exist.
6. THE Normalizer SHALL resolve owner from the curated Metadata_Overlay entry for the Spec when present, then from the most recent Git commit author who modified any file within the Spec directory.
7. IF neither a Metadata_Overlay entry nor any Git commit author exists for the Spec, THEN THE Normalizer SHALL set the owner to `unowned`.
8. THE Normalizer SHALL calculate lifecycle stage as: Requirements (or Bug Analysis for `bugfix` type) when only the initial artifact exists, Design when `design.md` exists, Tasks when `tasks.md` exists, and Completed when `tasks.md` contains at least one checkbox and all checkboxes are checked.
9. THE Normalizer SHALL treat `[~]` markers and unchecked checkboxes (`[ ]`) as incomplete tasks.
10. THE Normalizer SHALL calculate overall progress as: 33% when the initial artifact exists, plus 33% when `design.md` exists, plus 34% multiplied by the ratio of completed task checkboxes to total task checkboxes in `tasks.md`.
11. IF `tasks.md` exists but contains zero checkboxes, THEN THE Normalizer SHALL assign 0% for the task-completion portion of overall progress.
12. THE Normalizer SHALL record repository name, relative path, branch, commit hash, dirty state, and remote URL for each Spec.

### Requirement 5: Storage and Database

**User Story:** As a developer, I want a robust local database backing the app, so that metadata, relationships, and archive state persist reliably across restarts.

#### Acceptance Criteria

1. THE Crew_App SHALL use `bun:sqlite` in WAL mode for all persistent storage.
2. THE Crew_App SHALL apply numbered migrations sequentially on startup, and IF a migration fails, THEN THE Crew_App SHALL abort startup and log the migration number and error.
3. THE Crew_App SHALL maintain FTS5 full-text search indexes over Spec content, titles, tags, and metadata.
4. THE Crew_App SHALL keep a single backend process as the database writer.
5. THE MCP_Server SHALL communicate with the backend over a token-protected localhost HTTP endpoint, where the token is generated at backend startup and passed to the MCP process via environment variable.
6. THE Crew_App SHALL persist Sources, scan history, normalized Specs, artifacts, Metadata_Overlays with optimistic revisions, tags, owner aliases, curated Relationships, pending Suggestions, Snapshots, retention state, purge tombstones, and content-free audit events.
7. WHEN the backend process starts, THE Crew_App SHALL verify database integrity and open the database before accepting any HTTP requests.

### Requirement 6: Metadata Resolution and Completeness

**User Story:** As a user, I want my curated metadata to take priority over automatically derived values, so that I can correct and enrich Spec information.

#### Acceptance Criteria

1. THE Crew_App SHALL resolve each metadata field independently in priority order: accepted database Metadata_Overlay value first, explicitly imported Sidecar value second, deterministic artifact and Git-derived value third.
2. THE Crew_App SHALL evaluate Metadata_Completeness as requiring non-empty title (1–200 characters), owner, theme, and at least one tag for all Specs.
3. WHEN a Spec is in Completed stage, THE Crew_App SHALL additionally require a Retention_Policy and source provenance (repository, branch, and commit hash) for Metadata_Completeness.
4. WHEN a metadata write includes an `expectedRevision` that does not match the current revision, THE Crew_App SHALL return HTTP 409 Conflict, preserve the existing metadata state unchanged, and include the current revision value in the error response.

### Requirement 7: Relationships and Suggestions

**User Story:** As a user, I want to see how Specs relate to each other and receive intelligent relationship suggestions, so that I can navigate cross-cutting concerns.

#### Acceptance Criteria

1. THE Crew_App SHALL support Relationship types: `depends_on`, `blocks`, `supersedes`, `duplicates`, and `related`.
2. THE Crew_App SHALL reject creation of a Relationship with a type value not in the enumerated set and return an error indicating the invalid type.
3. THE Crew_App SHALL generate deterministic Suggestions from explicit cross-Spec Markdown links, shared tags and themes, repository proximity (Specs in the same repository or adjacent directories), and normalized content similarity (cosine similarity of TF-IDF vectors above a configurable threshold defaulting to 0.3).
4. THE Crew_App SHALL limit deterministic Suggestions to five per Spec above the configured confidence threshold.
5. THE Crew_App SHALL display pending Suggestions as dashed edges in Relationship_View and accepted Relationships as solid edges.
6. WHEN a user accepts a Suggestion, THE Crew_App SHALL convert the Suggestion into a curated Relationship and remove it from the pending list.
7. WHEN a user rejects a Suggestion, THE Crew_App SHALL remove the Suggestion from the pending list and record the rejection so the same suggestion is not regenerated until the underlying data changes.
8. THE Crew_App SHALL expose `POST /specs/:id/relationships`, `DELETE /specs/:id/relationships`, `GET /specs/:id/suggestions`, `POST /suggestions/:id/accept`, and `POST /suggestions/:id/reject` REST endpoints.
9. IF a user attempts to create a Relationship that duplicates an existing one (same source, target, and type), THEN THE Crew_App SHALL reject the request and return an error indicating the duplicate.

### Requirement 8: Archive Snapshots

**User Story:** As a team lead, I want completed Specs preserved as immutable snapshots, so that historical work is retrievable even if source repositories change.

#### Acceptance Criteria

1. WHEN a Spec first reaches Completed stage during a scan—or reaches Completed again with a new content digest—THE Crew_App SHALL create an immutable Snapshot containing source artifacts, metadata projection, content hashes, and Git provenance within 60 seconds of detecting the completed state.
2. IF a completed Spec becomes active again, THEN THE Crew_App SHALL preserve prior Snapshots without modification.
3. THE Crew_App SHALL store Snapshots under app-owned archive storage with read-only file permissions and SHALL verify content hashes against stored digests at write time and on each retrieval.
4. THE Crew_App SHALL support Retention_Policy values: `permanent` (no expiry), `project_lifetime` (retained until the owning project is explicitly marked closed by an authorized user), `active_plus_2_years` (retained until 2 years after the Spec last left Completed stage), and `custom_date` (a user-specified date no earlier than 30 days and no later than 10 years from Snapshot creation).
5. THE Crew_App SHALL NOT purge Snapshots automatically.
6. WHEN a purge is requested, THE Crew_App SHALL require that the Snapshot's Retention_Policy expiry date has passed, that the Snapshot has no active Legal_Hold, and that the user provides exact confirmation text `PURGE <snapshot-id>`; IF any condition is not met, THEN THE Crew_App SHALL reject the request and indicate which condition failed.
7. WHEN a purge is executed, THE Crew_App SHALL remove Snapshot bytes and search content but retain a tombstone and audit record so the same content digest is not recreated.
8. WHEN a user requests retrieval of a Snapshot by its identifier, THE Crew_App SHALL return the stored source artifacts, metadata projection, and Git provenance independent of the current state of the original source repository.
9. IF Snapshot creation fails due to unreachable source artifacts or hash computation error, THEN THE Crew_App SHALL discard any partial Snapshot data, record the failure in the audit log, and retry creation on the next scan cycle.

### Requirement 9: Sidecar Import and Export

**User Story:** As a user, I want to import and export metadata as portable sidecar files, so that I can share curated information across environments without modifying source repositories.

#### Acceptance Criteria

1. THE Crew_App SHALL NOT write to or push any Source repository.
2. WHEN a user requests metadata export, THE Crew_App SHALL produce a downloadable `spec-library.json` file conforming to `SpecLibrarySidecarV1` schema version 1.
3. WHEN a user imports a Sidecar, THE Crew_App SHALL present a preview listing the count and identity of entries to be added, modified, and removed before applying them.
4. THE Crew_App SHALL expose `GET /export`, `POST /import/preview`, and `POST /import/apply` REST endpoints.
5. THE Crew_App SHALL guarantee that exporting metadata, then importing the resulting Sidecar, then exporting again produces a Sidecar document with identical field values when both documents are serialized with keys sorted alphabetically (round-trip equivalence).
6. IF an imported file fails validation against the `SpecLibrarySidecarV1` schema, THEN THE Crew_App SHALL reject the import, retain the existing metadata state unchanged, and return an error message indicating which schema constraints were violated.

### Requirement 10: Relationship View UI

**User Story:** As a user, I want a dark graph canvas showing Specs as connected nodes organized by theme and lifecycle stage, so that I can visually navigate the library and understand dependencies.

#### Acceptance Criteria

1. THE Relationship_View SHALL be the default landing surface with a dark graphite canvas.
2. THE Relationship_View SHALL display stage columns across the top and theme lanes sized proportionally to the number of nodes they contain, with empty lanes collapsed to a labeled placeholder row.
3. THE Relationship_View SHALL place nodes deterministically by theme, stage, title, and Spec ID such that identical data always produces identical node positions.
4. THE Relationship_View SHALL render solid edges for accepted Relationships and dashed edges for pending Suggestions.
5. WHEN a node is selected, THE Relationship_View SHALL visually distinguish the selected node with a highlighted border, animate adjacent edges, and display the Detail_Panel.
6. THE Relationship_View SHALL provide zoom controls with a range of 25% to 400% (default 100%), a color legend, and non-color status labels.
7. WHEN a user enters at least 2 characters into the search field, THE Relationship_View SHALL filter visible nodes by matching against title, content, owner, repository, theme, and tags within 500 milliseconds of the last keystroke.
8. THE Relationship_View SHALL support filters for Team/Mine scope, theme, type, stage, owner, repository, and Metadata_Completeness.
9. THE Relationship_View SHALL implement "Mine" as a browser-local name/email alias filter that is never used as an authorization boundary.
10. WHEN a graph response exceeds 250 nodes, THE Relationship_View SHALL cap the displayed result at 250 nodes and display a refinement prompt indicating the total count and suggesting filter adjustments.
11. THE Relationship_View SHALL provide roving keyboard focus, arrow-key navigation, Enter selection, visible focus states meeting a minimum 3:1 contrast ratio against the canvas, and non-color status indicators for accessibility.
12. IF a search query or active filter combination matches zero nodes, THEN THE Relationship_View SHALL display an empty-state message indicating no results and suggesting the user adjust filters or search terms.

### Requirement 11: Archive View UI

**User Story:** As a user, I want a light chronological table of completed Specs grouped by month, so that I can browse and retrieve historical work efficiently.

#### Acceptance Criteria

1. THE Archive_View SHALL display a light-themed chronological table of completed Snapshots grouped by completion month, sorted newest-first within each group.
2. THE Archive_View SHALL include a sticky year/month index that highlights the currently visible month group and scrolls the table to the corresponding group when a user clicks an index entry.
3. THE Archive_View SHALL paginate results using cursor-based pagination in batches of 50.
4. THE Archive_View SHALL present filter controls that narrow visible results by type, theme, repository, owner, date range, retention, Legal_Hold, and Metadata_Completeness, and a search field accepting queries up to 200 characters.
5. WHEN a Snapshot is selected, THE Archive_View SHALL display a detail section showing artifact completeness as a ratio of populated fields to total fields, source provenance, tags, Retention_Policy, Legal_Hold status, and available revisions.
6. WHEN the viewport width is below 1024 px, THE Archive_View SHALL render a stacked list layout and display Snapshot detail in a slide-in drawer instead of an inline section.
7. IF a search or filter combination returns zero results, THEN THE Archive_View SHALL display an empty-state message indicating no matching Snapshots were found and retain all active filter selections.
8. WHILE the next page of results is being fetched, THE Archive_View SHALL display a loading indicator at the end of the current list and prevent duplicate fetch requests.

### Requirement 12: Spec Actions

**User Story:** As a user, I want contextual actions on each Spec to open it in a Crew chat session or view it in its source repository, so that I can transition seamlessly between browsing and working.

#### Acceptance Criteria

1. WHEN the user selects "Open Spec", THE Crew_App SHALL present options to open a Crew chat with the Spec Librarian including the selected Spec identifier, revision number, and source commit hash, or to open the repository permalink at the indexed commit.
2. IF no web URL template exists for a Source, THEN THE Crew_App SHALL render the repository permalink option as non-interactive and visually distinct from enabled options.
3. IF the indexed Source was in a dirty state at index time, THEN THE Crew_App SHALL display a visible indicator adjacent to the repository permalink stating that uncommitted changes existed when the Spec was indexed.
4. THE Crew_App SHALL provide a metadata review panel listing title, summary, owner, theme, tags, target release, Retention_Policy, Legal_Hold, Relationships, import/export, and pending Suggestions, where each field is viewable and offers an affordance to initiate editing.
5. THE Crew_App SHALL persist selected view, Spec, archive revision, search query, and active filters in URL query state such that reloading the page with the same URL restores the identical application state.

### Requirement 13: Spec Librarian Agent

**User Story:** As a user, I want an AI assistant that can search Specs and propose metadata changes, so that I can curate the library efficiently with intelligent assistance.

#### Acceptance Criteria

1. THE Spec_Librarian SHALL have no shell or filesystem-write tools.
2. THE MCP_Server SHALL expose exactly three tools: `search_specs(query, filters, limit)` where limit is capped at 100, `get_spec_context(specId, revisionId?)`, and `submit_metadata_proposal(specId, baseRevision, metadataPatch, relationshipAdds, rationale)`.
3. THE Crew_App SHALL launch the Spec_Librarian through Crew's `useChatLauncher` hook.
4. THE MCP_Server SHALL treat every agent submission as a pending proposal that cannot directly modify accepted metadata, Relationships, Retention_Policies, Legal_Holds, or Snapshots.
5. WHEN a proposal's `baseRevision` does not match the current Spec revision, THE Crew_App SHALL reject approval and prompt the user to regenerate or manually reconcile the proposal.
6. THE MCP_Server SHALL redact values matching common credential patterns (API keys, tokens, passwords, private keys) from content sent through MCP and SHALL bound each tool response payload to 64 KB.
7. THE Crew_App SHALL make AI assistance opt-in, launchable from the metadata panel.
8. WHEN a pending proposal exists for a Spec, THE Crew_App SHALL display the proposal summary, rationale, and proposed changes in a reviewable format with explicit accept and reject affordances.

### Requirement 14: REST API Error Handling

**User Story:** As a frontend consumer, I want consistent error responses with codes and request IDs, so that I can handle failures predictably and report issues.

#### Acceptance Criteria

1. THE Crew_App SHALL return error responses using an envelope containing a machine-readable `code` string, a human-readable `message` not exceeding 500 characters that does not expose internal implementation details, optional field-level `details` array, and a unique `requestId` formatted as a UUID v4.
2. WHEN a metadata write includes a stale `expectedRevision`, THE Crew_App SHALL return HTTP 409 with an error envelope indicating the conflict and including the current revision value.
3. THE Crew_App SHALL expose all browser-facing endpoints under the path prefix `/apps/kiro-spec-library/api/v1`.
4. WHEN a request body fails JSON parsing or schema validation, THE Crew_App SHALL return HTTP 400 with an error envelope listing the specific validation failures.
5. WHEN an unhandled server error occurs, THE Crew_App SHALL return HTTP 500 with an error envelope containing a generic message and the `requestId`, and SHALL log the full error details server-side.

### Requirement 15: Security and Input Validation

**User Story:** As a platform operator, I want the app to reject malicious inputs and protect credentials, so that the Spec Library cannot be exploited to access unauthorized resources.

#### Acceptance Criteria

1. THE Scanner SHALL reject file paths containing `..` sequences, symlinks whose resolved target is outside the Source root directory, files exceeding the configured size limit (default 1 MB), and any path resolving to the filesystem root `/`.
2. THE Scanner SHALL reject Git command arguments containing shell metacharacters, option injection prefixes (`--`), or arguments that would enable arbitrary code execution (e.g., `--upload-pack`, `--exec`).
3. THE Scanner SHALL reject access to paths matching Crew credential locations including `~/.kiro/credentials`, `~/.kiro/secrets`, and any path containing `.credentials` or `.secrets` segments.
4. THE Crew_App SHALL redact values matching patterns for API keys, bearer tokens, private key blocks, and password fields before surfacing content to the UI or the MCP_Server.
5. THE MCP_Server SHALL reject tool calls that attempt to modify accepted metadata, Relationships, Retention_Policies, Legal_Holds, or Snapshots directly and SHALL return an error indicating the operation is not permitted.
6. THE Crew_App SHALL validate that purge confirmation text exactly matches `PURGE <snapshot-id>` (case-sensitive, no leading or trailing whitespace) before executing a purge.

### Requirement 16: Performance

**User Story:** As a user working with large codebases, I want the Spec Library to remain responsive, so that browsing and searching do not interrupt my workflow.

#### Acceptance Criteria

1. THE Scanner SHALL index 1,000 local Specs in under 10 seconds on a machine with an SSD and at least 8 GB RAM.
2. THE Crew_App SHALL return search responses in under 200 milliseconds at a catalog size of 5,000 Specs measured from request receipt to response flush.
3. THE Relationship_View SHALL render a 250-node graph result within 2 seconds from data receipt to interactive display.
4. IF a remote Source or Git operation fails, THEN THE Crew_App SHALL preserve the last good catalog and continue serving read requests without degradation.
5. IF the Relationship_View exceeds the 2-second render threshold, THEN THE Crew_App SHALL display a loading indicator and render progressively rather than blocking the UI thread.

### Requirement 17: Platform Compatibility

**User Story:** As a Crew user on macOS or Linux, I want the Spec Library to work on my platform, so that I can use it regardless of my operating system.

#### Acceptance Criteria

1. THE Crew_App SHALL support macOS (arm64 and x86_64) and Linux (x86_64) Crew hosts in version 0.1.
2. THE Crew_App SHALL declare platform support in the `app.json` manifest for both macOS and Linux installation targets.
3. THE Crew_App SHALL use only POSIX-compatible file operations and shell commands so that identical backend code runs on both macOS and Linux without platform-conditional branches.
4. IF the Crew_App is installed on an unsupported platform, THEN the manifest validation SHALL prevent installation and report the unsupported platform in the error message.

### Requirement 18: Crew Shell Integration

**User Story:** As a Crew user, I want the Spec Library to use Crew's native navigation and theming hooks, so that it feels integrated with the rest of the platform rather than standalone.

#### Acceptance Criteria

1. THE Crew_App SHALL invoke Crew's `useTheme`, `useAppApi`, `useNotify`, `useNavigate`, and `useChatLauncher` hooks during initialization and SHALL apply the values returned by those hooks to govern theming, navigation, notifications, and chat-launcher behavior respectively.
2. IF any of the Crew hooks (`useTheme`, `useAppApi`, `useNotify`, `useNavigate`, `useChatLauncher`) throws an error or returns an undefined value, THEN THE Crew_App SHALL render an error message indicating which hook failed and SHALL NOT render the main application content.
3. THE Crew_App SHALL NOT render its own sidebar, top navigation bar, or any navigation shell element; all outer navigation chrome SHALL be provided exclusively by the Crew platform shell.
4. THE Crew_App SHALL display the official Kiro wordmark (unmodified logo asset) and apply the AWS Diatype font family as the primary typeface across all rendered views, regardless of the active theme returned by `useTheme`.
5. WHILE the Crew platform shell is providing outer navigation, THE Crew_App SHALL apply spacing values, color tokens, panel width-to-height proportions, and typographic hierarchy from the approved prototype, deviating by no more than 4 px in spacing and no more than 2 percentage points in panel proportion relative to the prototype reference.
6. WHEN the Crew `useTheme` hook emits a theme-change event, THE Crew_App SHALL update all color tokens and surface styles within 200 milliseconds without requiring a full page reload.

### Requirement 19: Audit Trail

**User Story:** As a team lead, I want content-free audit events recorded for significant operations, so that I can review what happened without exposing sensitive content.

#### Acceptance Criteria

1. WHEN metadata is created, updated, or deleted, THE Crew_App SHALL record a content-free audit event.
2. WHEN a Relationship is created or removed, THE Crew_App SHALL record a content-free audit event.
3. WHEN a Suggestion is accepted or rejected, THE Crew_App SHALL record a content-free audit event.
4. WHEN a Snapshot is created or purged, THE Crew_App SHALL record a content-free audit event.
5. THE Crew_App SHALL include the operation type, Spec identifier, timestamp (ISO 8601 with millisecond precision), and actor identifier in each audit event without including artifact content or metadata values, and SHALL store events in chronological order.
6. THE Crew_App SHALL expose audit events through a queryable interface supporting filtering by Spec identifier, operation type, actor, and date range.
7. THE Crew_App SHALL retain audit events for at least 2 years from creation.
8. IF audit event recording fails due to a database error, THEN THE Crew_App SHALL log the failure and SHALL NOT fail the parent operation that triggered the audit event.
