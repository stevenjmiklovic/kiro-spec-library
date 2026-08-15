import type { AuditOperation, LifecycleStage, RelationshipType, RetentionPolicyType, SpecType, SuggestionReason, WorkflowType } from "./types.js";
export declare const SPEC_TYPES: readonly SpecType[];
export declare const WORKFLOW_TYPES: readonly WorkflowType[];
export declare const LIFECYCLE_STAGES: readonly LifecycleStage[];
export declare const RELATIONSHIP_TYPES: readonly RelationshipType[];
export declare const RETENTION_POLICY_TYPES: readonly RetentionPolicyType[];
export declare const AUDIT_OPERATIONS: readonly AuditOperation[];
export declare const SUGGESTION_REASONS: readonly SuggestionReason[];
/** Scan interval: 15 minutes */
export declare const DEFAULT_SCAN_INTERVAL_MS = 900000;
/** Maximum artifact file size: 1 MB */
export declare const MAX_ARTIFACT_BYTES = 1048576;
/** Maximum suggestions per spec */
export declare const MAX_SUGGESTIONS_PER_SPEC = 5;
/** Minimum confidence threshold for suggestions */
export declare const SUGGESTION_THRESHOLD = 0.3;
/** FTS5 search result limit */
export declare const FTS_SEARCH_LIMIT = 50;
/** Maximum nodes in a single graph response */
export declare const GRAPH_NODE_CAP = 250;
/** Archive pagination batch size */
export declare const ARCHIVE_PAGE_SIZE = 50;
/** Remote operation timeout (seconds) */
export declare const REMOTE_TIMEOUT_SECONDS = 120;
/** REST API prefix */
export declare const API_PREFIX = "/apps/kiro-spec-library/api/v1";
/** Maximum error message length exposed to clients */
export declare const MAX_ERROR_MESSAGE_LENGTH = 500;
export declare const CONFIDENCE_WEIGHTS: {
    readonly markdown_link: 0.9;
    readonly shared_tags_base: 0.5;
    readonly shared_tags_increment: 0.1;
    readonly shared_theme: 0.4;
    readonly repository_proximity: 0.35;
};
export declare const SPEC_ARTIFACTS: {
    readonly REQUIREMENTS: "requirements.md";
    readonly BUGFIX: "bugfix.md";
    readonly DESIGN: "design.md";
    readonly TASKS: "tasks.md";
    readonly CONFIG: ".config.kiro";
    readonly TASKS_META: "tasks.meta.json";
    readonly SIDECAR: "spec-library.json";
};
/** Paths that must never be accessed */
export declare const CREDENTIAL_PATHS: readonly [".kiro/credentials", ".kiro/secrets", ".credentials", ".secrets"];
/** Git arguments that are never allowed */
export declare const FORBIDDEN_GIT_ARGS: readonly ["--upload-pack", "--exec", "-c", "--config", "--hooks-path"];
//# sourceMappingURL=constants.d.ts.map