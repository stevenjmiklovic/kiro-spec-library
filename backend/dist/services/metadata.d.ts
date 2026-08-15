import type { Database } from "bun:sqlite";
import type { MetadataCompleteness, MetadataOverlay, NormalizedSpec, LifecycleStage } from "@kiro-spec-library/shared";
import type { SpecLibrarySidecarV1 } from "@kiro-spec-library/shared";
export interface ResolvedMetadata {
    title: string;
    summary?: string;
    owner: string;
    theme?: string;
    tags: string[];
    targetRelease?: string;
    retentionPolicy?: {
        type: string;
        customDate?: string;
    };
    approvers: string[];
    implementationRef?: string;
}
/**
 * Resolve metadata with priority: overlay > sidecar > artifact-derived.
 * NormalizedSpec only carries title and owner from artifacts; the rest
 * comes from overlay or sidecar.
 */
export declare function resolveMetadata(spec: NormalizedSpec, overlay: MetadataOverlay | null, sidecar: SpecLibrarySidecarV1 | null): ResolvedMetadata;
/**
 * Evaluate metadata completeness.
 * Required for all stages: title, owner, theme, at least one tag.
 */
export declare function evaluateCompleteness(resolved: ResolvedMetadata, _stage: LifecycleStage): MetadataCompleteness;
/**
 * Apply a metadata patch with optimistic concurrency.
 * Delegates revision checking to upsertOverlay which verifies expectedRevision
 * matches the current DB state and increments atomically within a transaction.
 */
export declare function applyPatch(db: Database, specKey: string, patch: Record<string, unknown>, expectedRevision: number): {
    revision: number;
    updatedAt: string;
};
//# sourceMappingURL=metadata.d.ts.map