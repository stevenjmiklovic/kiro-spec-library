/** Spec type classification */
export type SpecType = "feature" | "bugfix" | "quick" | "unknown";
/** Workflow type classification */
export type WorkflowType = "requirements-first" | "design-first" | "unknown";
/** Lifecycle stage */
export type LifecycleStage = "new" | "scoped" | "refined" | "in-flight" | "done";
/** Relationship type between specs */
export type RelationshipType = "depends_on" | "blocks" | "supersedes" | "duplicates" | "related";
/** Retention policy type */
export type RetentionPolicyType = "permanent" | "project_lifetime" | "active_plus_2_years" | "custom_date";
/** Audit operation types (content-free) */
export type AuditOperation = "metadata_created" | "metadata_updated" | "metadata_deleted" | "relationship_created" | "relationship_deleted" | "suggestion_accepted" | "suggestion_rejected" | "snapshot_created" | "snapshot_purged" | "backup_created" | "backup_restored" | "text_export_created" | "text_export_applied";
/** Scan error category */
export type ScanErrorCategory = "auth" | "network" | "timeout" | "validation" | "io";
/** Suggestion reason */
export type SuggestionReason = "markdown_link" | "shared_tags" | "shared_theme" | "repository_proximity" | "content_similarity";
/** Scan status */
export type ScanStatus = "running" | "completed" | "partial_failure";
/** Suggestion status */
export type SuggestionStatus = "pending" | "accepted" | "rejected";
export interface RetentionPolicy {
    type: RetentionPolicyType;
    /** ISO 8601 date, only for custom_date type */
    customDate?: string;
}
export interface Source {
    id: string;
    type: "local" | "remote";
    /** Local: directory path */
    path?: string;
    /** Remote: HTTPS or SSH URL */
    url?: string;
    /** Remote: single branch to track */
    branch?: string;
    /** Remote: permalink template (e.g. "https://github.com/org/repo/blob/{commit}/{path}") */
    webUrlTemplate?: string;
    /** ISO 8601 */
    addedAt: string;
}
export interface NormalizedSpec {
    /** Deterministic key: sourceId + specId or path */
    key: string;
    sourceId: string;
    specId: string;
    type: SpecType;
    workflow: WorkflowType;
    title: string;
    owner: string;
    stage: LifecycleStage;
    /** 0–100 */
    progress: number;
    provenance: SpecProvenance;
    artifacts: ArtifactManifest;
    taskCounts: TaskCounts;
    /** SHA-256 of concatenated sorted artifact content */
    contentDigest: string;
    /** ISO 8601 */
    indexedAt: string;
}
export interface SpecProvenance {
    repository: string;
    relativePath: string;
    branch: string;
    commitHash: string;
    isDirty: boolean;
    remoteUrl?: string;
}
export interface ArtifactManifest {
    /** Key: artifact filename, value: whether it exists */
    "requirements.md"?: boolean;
    "bugfix.md"?: boolean;
    "design.md"?: boolean;
    "tasks.md"?: boolean;
    ".config.kiro"?: boolean;
    "tasks.meta.json"?: boolean;
    "spec-library.json"?: boolean;
}
export interface TaskCounts {
    total: number;
    completed: number;
}
export interface MetadataOverlay {
    specKey: string;
    title?: string;
    summary?: string;
    owner?: string;
    theme?: string;
    tags?: string[];
    targetRelease?: string;
    /** @deprecated — retained in schema for backward compat with existing DB rows */
    retentionPolicy?: RetentionPolicy;
    approvers?: string[];
    implementationRef?: string;
    /** ISO 8601 timestamp when the spec's requirements/design passed review (grill-me). */
    reviewedAt?: string;
    revision: number;
    /** ISO 8601 */
    updatedAt: string;
}
export interface MetadataCompleteness {
    complete: boolean;
    missing: string[];
}
export interface Relationship {
    id: string;
    sourceSpecKey: string;
    targetSpecKey: string;
    type: RelationshipType;
    /** ISO 8601 */
    createdAt: string;
}
export interface Suggestion {
    id: string;
    sourceSpecKey: string;
    targetSpecKey: string;
    type: RelationshipType;
    /** 0.0–1.0 */
    confidence: number;
    reason: SuggestionReason;
    /** Human-readable explanation */
    evidence: string;
    status: SuggestionStatus;
    /** ISO 8601 */
    createdAt: string;
    resolvedAt?: string;
    /** Hash of inputs that generated this suggestion */
    dataHash: string;
}
export interface Snapshot {
    id: string;
    specKey: string;
    /** ISO 8601 */
    createdAt: string;
    /** SHA-256 of concatenated sorted artifact content */
    contentDigest: string;
    artifacts: SnapshotArtifact[];
    metadata: MetadataProjection;
    provenance: SpecProvenance;
    retentionPolicy?: RetentionPolicy;
    purged: boolean;
    purgedAt?: string;
}
export interface SnapshotArtifact {
    name: string;
    /** SHA-256 */
    contentHash: string;
    sizeBytes: number;
    storagePath: string;
}
export interface MetadataProjection {
    title: string;
    summary?: string;
    owner: string;
    theme?: string;
    tags: string[];
    targetRelease?: string;
    approvers: string[];
    implementationRef?: string;
    /** ISO 8601 timestamp when the spec passed review. */
    reviewedAt?: string;
}
export interface ScanResult {
    runId: string;
    /** ISO 8601 */
    startedAt: string;
    completedAt?: string;
    status: ScanStatus;
    sourcesScanned: number;
    specsDiscovered: number;
    errors: ScanError[];
}
export interface ScanError {
    sourceId: string;
    category: ScanErrorCategory;
    message: string;
    /** ISO 8601 */
    timestamp: string;
}
export interface AuditEvent {
    id: string;
    operation: AuditOperation;
    specKey?: string;
    snapshotId?: string;
    actor: string;
    /** ISO 8601 with ms precision */
    timestamp: string;
}
export interface ErrorEnvelope {
    code: string;
    /** Max 500 chars, no internal details */
    message: string;
    details?: FieldError[];
    /** UUID v4 */
    requestId: string;
}
export interface FieldError {
    field: string;
    message: string;
}
export interface OwnerAlias {
    id: string;
    displayName: string;
    email?: string;
    /** Git author names associated with this alias */
    gitNames: string[];
    /** Whether this alias represents the local user (for "Mine" filter) */
    isLocal: boolean;
}
//# sourceMappingURL=types.d.ts.map