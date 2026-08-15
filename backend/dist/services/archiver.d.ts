import type { Database } from "bun:sqlite";
import type { NormalizedSpec, Snapshot } from "@kiro-spec-library/shared";
import type { ResolvedMetadata } from "./metadata.js";
export interface ArchiveConfig {
    archiveDir: string;
}
interface ArtifactInput {
    name: string;
    content: string;
}
export declare class ArchiverService {
    private readonly db;
    private readonly config;
    constructor(db: Database, config: ArchiveConfig);
    /**
     * Create a snapshot if the spec is completed and has a new content digest.
     * Returns null if not eligible or already archived.
     */
    maybeCreateSnapshot(spec: NormalizedSpec, metadata: ResolvedMetadata, artifactContents: ArtifactInput[]): Promise<Snapshot | null>;
    /**
     * Retrieve a snapshot and verify content hashes.
     */
    retrieveSnapshot(snapshotId: string): Promise<Snapshot>;
    /**
     * Execute purge with all validation gates.
     * Requires: retention eligible, no legal hold, exact confirmation text.
     */
    purge(snapshotId: string, confirmationText: string): Promise<void>;
    /**
     * Check all purge gates for a snapshot.
     */
    isEligibleForPurge(snapshot: {
        retention_policy: string | null;
        created_at: string;
    }): {
        eligible: boolean;
        reason?: string;
    };
    /**
     * Store artifacts to disk with read-only permissions and verify hashes.
     */
    private storeArtifacts;
    /**
     * Discard incomplete snapshot data on error.
     */
    private discardPartial;
}
export {};
//# sourceMappingURL=archiver.d.ts.map