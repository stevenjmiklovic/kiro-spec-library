// @kiro-spec-library/shared — Constants and configuration defaults
// ─── Type Enumerations ───────────────────────────────────────────────────────
export const SPEC_TYPES = [
    "feature",
    "bugfix",
    "quick",
    "unknown",
];
export const WORKFLOW_TYPES = [
    "requirements-first",
    "design-first",
    "unknown",
];
export const LIFECYCLE_STAGES = [
    "new",
    "scoped",
    "refined",
    "in-flight",
    "done",
];
export const RELATIONSHIP_TYPES = [
    "depends_on",
    "blocks",
    "supersedes",
    "duplicates",
    "related",
];
export const RETENTION_POLICY_TYPES = [
    "permanent",
    "project_lifetime",
    "active_plus_2_years",
    "custom_date",
];
export const AUDIT_OPERATIONS = [
    "metadata_created",
    "metadata_updated",
    "metadata_deleted",
    "relationship_created",
    "relationship_deleted",
    "suggestion_accepted",
    "suggestion_rejected",
    "snapshot_created",
    "snapshot_purged",
    "backup_created",
    "backup_restored",
    "text_export_created",
    "text_export_applied",
];
export const SUGGESTION_REASONS = [
    "markdown_link",
    "shared_tags",
    "shared_theme",
    "repository_proximity",
    "content_similarity",
];
// ─── Configuration Defaults ──────────────────────────────────────────────────
/** Scan interval: 15 minutes */
export const DEFAULT_SCAN_INTERVAL_MS = 900_000;
/** Maximum artifact file size: 1 MB */
export const MAX_ARTIFACT_BYTES = 1_048_576;
/** Maximum suggestions per spec */
export const MAX_SUGGESTIONS_PER_SPEC = 5;
/** Minimum confidence threshold for suggestions */
export const SUGGESTION_THRESHOLD = 0.3;
/** FTS5 search result limit */
export const FTS_SEARCH_LIMIT = 50;
/** Maximum nodes in a single graph response */
export const GRAPH_NODE_CAP = 250;
/** Archive pagination batch size */
export const ARCHIVE_PAGE_SIZE = 50;
/** Remote operation timeout (seconds) */
export const REMOTE_TIMEOUT_SECONDS = 120;
// ─── API ─────────────────────────────────────────────────────────────────────
/** REST API prefix */
export const API_PREFIX = "/apps/kiro-spec-library/api/v1";
/** Maximum error message length exposed to clients */
export const MAX_ERROR_MESSAGE_LENGTH = 500;
// ─── Suggestion Confidence Weights ───────────────────────────────────────────
export const CONFIDENCE_WEIGHTS = {
    markdown_link: 0.9,
    shared_tags_base: 0.5,
    shared_tags_increment: 0.1,
    shared_theme: 0.4,
    repository_proximity: 0.35,
    // content_similarity uses actual cosine score
};
// ─── Artifact Names ──────────────────────────────────────────────────────────
export const SPEC_ARTIFACTS = {
    REQUIREMENTS: "requirements.md",
    BUGFIX: "bugfix.md",
    DESIGN: "design.md",
    TASKS: "tasks.md",
    CONFIG: ".config.kiro",
    TASKS_META: "tasks.meta.json",
    SIDECAR: "spec-library.json",
};
// ─── Security ────────────────────────────────────────────────────────────────
/** Paths that must never be accessed */
export const CREDENTIAL_PATHS = [
    ".kiro/credentials",
    ".kiro/secrets",
    ".credentials",
    ".secrets",
];
/** Git arguments that are never allowed */
export const FORBIDDEN_GIT_ARGS = [
    "--upload-pack",
    "--exec",
    "-c",
    "--config",
    "--hooks-path",
];
