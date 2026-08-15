import type { Database } from "bun:sqlite";
export interface SnapshotRow {
    id: string;
    spec_key: string;
    created_at: string;
    content_digest: string;
    metadata_projection: string;
    provenance: string;
    retention_policy: string | null;
    legal_hold_active: number;
    legal_hold_reason: string | null;
    purged: number;
    purged_at: string | null;
}
export interface SnapshotFilters {
    cursor?: string;
    limit: number;
}
export declare function createSnapshot(db: Database, snapshot: {
    id: string;
    specKey: string;
    createdAt: string;
    contentDigest: string;
    metadataProjection: Record<string, unknown>;
    provenance: Record<string, unknown>;
    retentionPolicy?: string | null;
}): void;
export declare function findByDigest(db: Database, specKey: string, contentDigest: string): SnapshotRow | null;
export declare function getSnapshot(db: Database, id: string): SnapshotRow | null;
export declare function purgeSnapshot(db: Database, id: string): void;
export declare function listSnapshots(db: Database, filters: SnapshotFilters): SnapshotRow[];
export interface SnapshotArtifactRow {
    id: number;
    snapshot_id: string;
    name: string;
    content_hash: string;
    size_bytes: number;
    storage_path: string;
}
export declare function insertSnapshotArtifact(db: Database, artifact: {
    snapshotId: string;
    name: string;
    contentHash: string;
    sizeBytes: number;
    storagePath: string;
}): void;
export declare function getSnapshotArtifacts(db: Database, snapshotId: string): SnapshotArtifactRow[];
//# sourceMappingURL=snapshots.d.ts.map