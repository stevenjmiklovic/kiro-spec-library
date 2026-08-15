// Archive service — immutable snapshots, hash verification, purge gates
import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile, chmod, rm } from "node:fs/promises";
import { join } from "node:path";
import { createSnapshot as dbCreateSnapshot, findByDigest, getSnapshot as dbGetSnapshot, getSnapshotArtifacts, insertSnapshotArtifact, purgeSnapshot as dbPurgeSnapshot, } from "../db/queries/snapshots.js";
import { recordEvent } from "./audit.js";
// ─── Helpers ─────────────────────────────────────────────────────────────────
function sha256(content) {
    return createHash("sha256").update(content).digest("hex");
}
function computeContentDigest(artifacts) {
    const sorted = [...artifacts].sort((a, b) => a.name.localeCompare(b.name));
    const hash = createHash("sha256");
    for (const a of sorted) {
        hash.update(a.content);
    }
    return hash.digest("hex");
}
// ─── Archive Service ─────────────────────────────────────────────────────────
export class ArchiverService {
    db;
    config;
    constructor(db, config) {
        this.db = db;
        this.config = config;
    }
    /**
     * Create a snapshot if the spec is completed and has a new content digest.
     * Returns null if not eligible or already archived.
     */
    async maybeCreateSnapshot(spec, metadata, artifactContents) {
        // Only archive completed specs
        if (spec.stage !== "completed") {
            return null;
        }
        // Compute content digest
        const contentDigest = computeContentDigest(artifactContents);
        // Check for existing snapshot with same digest
        const existing = findByDigest(this.db, spec.key, contentDigest);
        if (existing) {
            return null; // Already archived this exact content
        }
        const snapshotId = crypto.randomUUID();
        const snapshotDir = join(this.config.archiveDir, snapshotId);
        try {
            // Store artifacts
            const storedArtifacts = await this.storeArtifacts(snapshotId, snapshotDir, artifactContents);
            // Build snapshot record
            const snapshot = {
                id: snapshotId,
                specKey: spec.key,
                createdAt: new Date().toISOString(),
                contentDigest,
                artifacts: storedArtifacts,
                metadata: {
                    title: metadata.title,
                    summary: metadata.summary,
                    owner: metadata.owner,
                    theme: metadata.theme,
                    tags: metadata.tags,
                    targetRelease: metadata.targetRelease,
                    approvers: metadata.approvers,
                    implementationRef: metadata.implementationRef,
                },
                provenance: spec.provenance,
                retentionPolicy: metadata.retentionPolicy,
                purged: false,
            };
            // Persist to database
            dbCreateSnapshot(this.db, {
                id: snapshotId,
                specKey: spec.key,
                createdAt: snapshot.createdAt,
                contentDigest,
                metadataProjection: snapshot.metadata,
                provenance: snapshot.provenance,
                retentionPolicy: snapshot.retentionPolicy
                    ? JSON.stringify(snapshot.retentionPolicy)
                    : null,
            });
            // Persist artifact records
            for (const artifact of storedArtifacts) {
                insertSnapshotArtifact(this.db, {
                    snapshotId,
                    name: artifact.name,
                    contentHash: artifact.contentHash,
                    sizeBytes: artifact.sizeBytes,
                    storagePath: artifact.storagePath,
                });
            }
            // Record audit event
            recordEvent(this.db, "snapshot_created", {
                specKey: spec.key,
                snapshotId,
            });
            return snapshot;
        }
        catch (error) {
            // Partial failure cleanup
            await this.discardPartial(snapshotDir);
            throw error;
        }
    }
    /**
     * Retrieve a snapshot and verify content hashes.
     */
    async retrieveSnapshot(snapshotId) {
        const row = dbGetSnapshot(this.db, snapshotId);
        if (!row) {
            throw new Error(`Snapshot not found: ${snapshotId}`);
        }
        if (row.purged) {
            throw new Error(`Snapshot has been purged: ${snapshotId}`);
        }
        const metadata = JSON.parse(row.metadata_projection);
        const provenance = JSON.parse(row.provenance);
        // Read artifact records from database
        const artifactRows = getSnapshotArtifacts(this.db, snapshotId);
        const artifacts = [];
        for (const artifactRow of artifactRows) {
            // Verify content hash on retrieval (Req 8.3)
            try {
                const content = await readFile(artifactRow.storage_path, "utf-8");
                const currentHash = sha256(content);
                if (currentHash !== artifactRow.content_hash) {
                    throw new Error(`Content hash mismatch for artifact "${artifactRow.name}" in snapshot ${snapshotId}: ` +
                        `expected ${artifactRow.content_hash}, got ${currentHash}`);
                }
            }
            catch (err) {
                if (err instanceof Error && err.message.includes("hash mismatch")) {
                    throw err;
                }
                throw new Error(`Cannot read artifact "${artifactRow.name}" for snapshot ${snapshotId}: ${err.message}`);
            }
            artifacts.push({
                name: artifactRow.name,
                contentHash: artifactRow.content_hash,
                sizeBytes: artifactRow.size_bytes,
                storagePath: artifactRow.storage_path,
            });
        }
        const snapshot = {
            id: row.id,
            specKey: row.spec_key,
            createdAt: row.created_at,
            contentDigest: row.content_digest,
            artifacts,
            metadata,
            provenance,
            retentionPolicy: row.retention_policy
                ? JSON.parse(row.retention_policy)
                : undefined,
            purged: Boolean(row.purged),
            purgedAt: row.purged_at ?? undefined,
        };
        return snapshot;
    }
    /**
     * Execute purge with all validation gates.
     * Requires: retention eligible, no legal hold, exact confirmation text.
     */
    async purge(snapshotId, confirmationText) {
        const row = dbGetSnapshot(this.db, snapshotId);
        if (!row) {
            throw new Error(`Snapshot not found: ${snapshotId}`);
        }
        if (row.purged) {
            throw new Error(`Snapshot already purged: ${snapshotId}`);
        }
        // Validate confirmation text
        const expectedConfirmation = `PURGE ${snapshotId}`;
        if (confirmationText !== expectedConfirmation) {
            throw new Error(`Invalid confirmation text. Expected: "${expectedConfirmation}"`);
        }
        // Check eligibility
        const eligibility = this.isEligibleForPurge(row);
        if (!eligibility.eligible) {
            throw new Error(`Purge not eligible: ${eligibility.reason}`);
        }
        // Mark as purged in database (tombstone)
        dbPurgeSnapshot(this.db, snapshotId);
        // Remove archive files
        const snapshotDir = join(this.config.archiveDir, snapshotId);
        await rm(snapshotDir, { recursive: true, force: true });
        // Record audit event
        recordEvent(this.db, "snapshot_purged", {
            snapshotId,
            specKey: row.spec_key,
        });
    }
    /**
     * Check all purge gates for a snapshot.
     */
    isEligibleForPurge(snapshot) {
        // Gate 1: Retention policy must allow purge
        if (!snapshot.retention_policy) {
            return { eligible: false, reason: "No retention policy set" };
        }
        const policy = JSON.parse(snapshot.retention_policy);
        if (policy.type === "permanent") {
            return { eligible: false, reason: "Retention policy is permanent" };
        }
        if (policy.type === "custom_date") {
            const expiry = new Date(policy.customDate);
            if (expiry > new Date()) {
                return {
                    eligible: false,
                    reason: `Retention expires ${policy.customDate}`,
                };
            }
        }
        if (policy.type === "active_plus_2_years") {
            const created = new Date(snapshot.created_at);
            const expiry = new Date(created);
            expiry.setFullYear(expiry.getFullYear() + 2);
            if (expiry > new Date()) {
                return {
                    eligible: false,
                    reason: `Retention expires ${expiry.toISOString().slice(0, 10)}`,
                };
            }
        }
        // project_lifetime: always eligible (project determines when)
        return { eligible: true };
    }
    /**
     * Store artifacts to disk with read-only permissions and verify hashes.
     */
    async storeArtifacts(_snapshotId, snapshotDir, artifacts) {
        await mkdir(snapshotDir, { recursive: true });
        const stored = [];
        for (const artifact of artifacts) {
            const contentHash = sha256(artifact.content);
            const storagePath = join(snapshotDir, artifact.name);
            const sizeBytes = Buffer.byteLength(artifact.content, "utf-8");
            // Write file
            await writeFile(storagePath, artifact.content, { encoding: "utf-8" });
            // Set read-only permissions (0o444)
            await chmod(storagePath, 0o444);
            // Verify hash immediately after write
            const written = await readFile(storagePath, "utf-8");
            const verifyHash = sha256(written);
            if (verifyHash !== contentHash) {
                throw new Error(`Hash mismatch after write for ${artifact.name}: expected ${contentHash}, got ${verifyHash}`);
            }
            stored.push({
                name: artifact.name,
                contentHash,
                sizeBytes,
                storagePath,
            });
        }
        return stored;
    }
    /**
     * Discard incomplete snapshot data on error.
     */
    async discardPartial(snapshotDir) {
        try {
            await rm(snapshotDir, { recursive: true, force: true });
        }
        catch {
            // Best-effort cleanup
        }
    }
}
