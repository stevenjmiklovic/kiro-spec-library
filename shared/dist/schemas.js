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
