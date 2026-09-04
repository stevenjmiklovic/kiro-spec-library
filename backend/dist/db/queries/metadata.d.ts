import type { Database } from "bun:sqlite";
import type { MetadataOverlay } from "@kiro-spec-library/shared";
export interface MetadataRow {
    spec_key: string;
    title: string | null;
    summary: string | null;
    owner: string | null;
    theme: string | null;
    tags: string | null;
    target_release: string | null;
    retention_policy: string | null;
    reviewed_at: string | null;
    approvers: string | null;
    implementation_ref: string | null;
    revision: number;
    updated_at: string;
}
export declare class RevisionConflictError extends Error {
    readonly specKey: string;
    readonly expectedRevision: number;
    readonly actualRevision: number;
    constructor(specKey: string, expectedRevision: number, actualRevision: number);
}
export declare function getOverlay(db: Database, specKey: string): MetadataRow | null;
export declare function upsertOverlay(db: Database, specKey: string, patch: Record<string, unknown>, expectedRevision: number): MetadataRow;
/** Map a raw `metadata_overlays` row to the shape `resolveMetadata()` expects. */
export declare function overlayRowToMetadataOverlay(overlay: MetadataRow): MetadataOverlay;
export declare function deleteOverlay(db: Database, specKey: string): void;
//# sourceMappingURL=metadata.d.ts.map