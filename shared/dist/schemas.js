// @kiro-spec-library/shared — Zod validation schemas
import { z } from "zod";
import { LIFECYCLE_STAGES, RELATIONSHIP_TYPES, RETENTION_POLICY_TYPES, SPEC_TYPES, WORKFLOW_TYPES, } from "./constants.js";
// ─── .config.kiro ────────────────────────────────────────────────────────────
export const ConfigKiroSchema = z.object({
    specId: z.string().min(1),
    workflowType: z.enum(["requirements-first", "design-first"]).optional(),
    specType: z.enum(["feature", "bugfix", "quick"]).optional(),
});
// ─── Retention Policy ────────────────────────────────────────────────────────
export const RetentionPolicySchema = z.object({
    type: z.enum(RETENTION_POLICY_TYPES),
    customDate: z.string().datetime().optional(),
}).refine((data) => data.type !== "custom_date" || data.customDate !== undefined, { message: "customDate is required when type is custom_date" });
// ─── Sidecar Schema (spec-library.json) ──────────────────────────────────────
export const SidecarRelationshipSchema = z.object({
    targetSpecId: z.string().min(1),
    targetRepository: z.string().optional(),
    type: z.enum(RELATIONSHIP_TYPES),
    note: z.string().max(500).optional(),
});
export const SidecarMetadataSchema = z.object({
    displayTitle: z.string().max(200).optional(),
    summary: z.string().max(2000).optional(),
    theme: z.string().max(100).optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    owner: z.object({
        name: z.string().min(1).max(100),
        email: z.string().email().optional(),
    }).optional(),
    targetRelease: z.string().max(50).optional(),
    retentionPolicy: RetentionPolicySchema.optional(),
});
export const SpecLibrarySidecarV1Schema = z.object({
    schemaVersion: z.literal(1),
    specId: z.string().min(1),
    metadata: SidecarMetadataSchema,
    relationships: z.array(SidecarRelationshipSchema).max(50).optional(),
});
// ─── Textual/git-committable library export ──────────────────────────────────
// A whole-library export as a zip of human-readable, diffable JSON files —
// suitable for committing into a dedicated version-control repo. Every spec
// reference uses (specId, repository) rather than the internal DB `key`,
// since that's the only addressing scheme that survives outside this DB.
export const TextExportManifestSchema = z.object({
    schemaVersion: z.literal(1),
    exportedAt: z.string().datetime(),
    counts: z.object({
        sources: z.number().int().min(0),
        specs: z.number().int().min(0),
        suggestions: z.number().int().min(0),
        rejections: z.number().int().min(0),
        proposals: z.number().int().min(0),
        snapshots: z.number().int().min(0),
        auditEvents: z.number().int().min(0),
    }),
});
export const TextExportSourceSchema = z.object({
    id: z.string().min(1),
    type: z.enum(["local", "remote"]),
    path: z.string().optional(),
    url: z.string().optional(),
    branch: z.string().optional(),
    webUrlTemplate: z.string().optional(),
    addedAt: z.string().datetime(),
});
const SpecRefSchema = z.object({
    specId: z.string().min(1),
    repository: z.string().min(1),
});
export const TextExportSuggestionSchema = z.object({
    source: SpecRefSchema,
    target: SpecRefSchema,
    type: z.enum(RELATIONSHIP_TYPES),
    confidence: z.number().min(0).max(1),
    reason: z.string().min(1),
    evidence: z.string(),
    status: z.enum(["pending", "accepted", "rejected"]),
    createdAt: z.string().datetime(),
    resolvedAt: z.string().datetime().optional(),
    dataHash: z.string().min(1),
});
export const TextExportRejectionSchema = z.object({
    source: SpecRefSchema,
    target: SpecRefSchema,
    type: z.enum(RELATIONSHIP_TYPES),
    dataHash: z.string().min(1),
    rejectedAt: z.string().datetime(),
});
export const TextExportProposalSchema = z.object({
    id: z.string().min(1),
    spec: SpecRefSchema,
    patch: z.record(z.string(), z.unknown()),
    status: z.enum(["pending", "accepted", "rejected"]),
    submittedAt: z.string().datetime(),
    submittedBy: z.string().optional(),
    resolvedAt: z.string().datetime().optional(),
    resolvedBy: z.string().optional(),
    rationale: z.string().optional(),
    source: z.string().optional(),
});
// Snapshot records are export-only (read-only in the textual format): the
// archived artifact bytes live on disk, not in this export, so there is
// nothing meaningful to "apply" back from this file alone.
export const TextExportSnapshotSchema = z.object({
    id: z.string().min(1),
    spec: SpecRefSchema,
    createdAt: z.string().datetime(),
    contentDigest: z.string().min(1),
    retentionPolicy: z.string().optional(),
    purged: z.boolean(),
    purgedAt: z.string().datetime().optional(),
    artifactNames: z.array(z.string()),
});
// ─── Metadata Patch (API request body) ───────────────────────────────────────
export const MetadataPatchSchema = z.object({
    title: z.string().max(200).optional(),
    summary: z.string().max(2000).optional(),
    owner: z.string().max(100).optional(),
    theme: z.string().max(100).optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    targetRelease: z.string().max(50).optional(),
    retentionPolicy: RetentionPolicySchema.optional(),
    expectedRevision: z.number().int().positive(),
});
// ─── Source Configuration ────────────────────────────────────────────────────
export const LocalSourceSchema = z.object({
    type: z.literal("local"),
    path: z.string().min(1),
});
export const RemoteSourceSchema = z.object({
    type: z.literal("remote"),
    url: z.string().min(1),
    branch: z.string().min(1).default("main"),
    webUrlTemplate: z.string().optional(),
});
export const SourceConfigSchema = z.discriminatedUnion("type", [
    LocalSourceSchema,
    RemoteSourceSchema,
]);
// ─── Relationship Creation ───────────────────────────────────────────────────
export const CreateRelationshipSchema = z.object({
    targetSpecKey: z.string().min(1),
    type: z.enum(RELATIONSHIP_TYPES),
    note: z.string().max(500).optional(),
});
// ─── Search / Filter Parameters ──────────────────────────────────────────────
export const SpecFilterSchema = z.object({
    query: z.string().max(200).optional(),
    type: z.enum(SPEC_TYPES).optional(),
    stage: z.enum(LIFECYCLE_STAGES).optional(),
    workflow: z.enum(WORKFLOW_TYPES).optional(),
    theme: z.string().optional(),
    owner: z.string().optional(),
    repository: z.string().optional(),
    metadataComplete: z.boolean().optional(),
    limit: z.number().int().min(1).max(250).default(50),
    offset: z.number().int().min(0).default(0),
});
// ─── Archive Filter Parameters ───────────────────────────────────────────────
export const ArchiveFilterSchema = z.object({
    query: z.string().max(200).optional(),
    type: z.enum(SPEC_TYPES).optional(),
    theme: z.string().optional(),
    owner: z.string().optional(),
    repository: z.string().optional(),
    retentionType: z.enum(RETENTION_POLICY_TYPES).optional(),
    metadataComplete: z.boolean().optional(),
    afterDate: z.string().datetime().optional(),
    beforeDate: z.string().datetime().optional(),
    cursor: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(50),
});
