import type { Database } from "bun:sqlite";

export interface SnapshotRow {
  id: string;
  spec_key: string;
  created_at: string;
  content_digest: string;
  metadata_projection: string;
  provenance: string;
  retention_policy: string | null;
  purged: number;
  purged_at: string | null;
}

export interface SnapshotFilters {
  cursor?: string;
  limit: number;
}

export function createSnapshot(
  db: Database,
  snapshot: {
    id: string;
    specKey: string;
    createdAt: string;
    contentDigest: string;
    metadataProjection: Record<string, unknown>;
    provenance: Record<string, unknown>;
    retentionPolicy?: string | null;
  },
): void {
  const stmt = db.prepare(`
    INSERT INTO snapshots (
      id, spec_key, created_at, content_digest, metadata_projection,
      provenance, retention_policy
    ) VALUES (
      $id, $spec_key, $created_at, $content_digest, $metadata_projection,
      $provenance, $retention_policy
    )
  `);
  stmt.run({
    $id: snapshot.id,
    $spec_key: snapshot.specKey,
    $created_at: snapshot.createdAt,
    $content_digest: snapshot.contentDigest,
    $metadata_projection: JSON.stringify(snapshot.metadataProjection),
    $provenance: JSON.stringify(snapshot.provenance),
    $retention_policy: snapshot.retentionPolicy ?? null,
  });
}

export function findByDigest(
  db: Database,
  specKey: string,
  contentDigest: string,
): SnapshotRow | null {
  const stmt = db.prepare(`
    SELECT * FROM snapshots
    WHERE spec_key = $spec_key AND content_digest = $content_digest
  `);
  return (stmt.get({ $spec_key: specKey, $content_digest: contentDigest }) as SnapshotRow) ?? null;
}

export function getSnapshot(db: Database, id: string): SnapshotRow | null {
  const stmt = db.prepare("SELECT * FROM snapshots WHERE id = $id");
  return (stmt.get({ $id: id }) as SnapshotRow) ?? null;
}

export function purgeSnapshot(db: Database, id: string): void {
  const stmt = db.prepare(`
    UPDATE snapshots
    SET purged = 1, purged_at = $purged_at
    WHERE id = $id
  `);
  stmt.run({ $id: id, $purged_at: new Date().toISOString() });
}

export function listSnapshots(
  db: Database,
  filters: SnapshotFilters,
): SnapshotRow[] {
  if (filters.cursor) {
    const stmt = db.prepare(`
      SELECT * FROM snapshots
      WHERE created_at < $cursor
      ORDER BY created_at DESC
      LIMIT $limit
    `);
    return stmt.all({ $cursor: filters.cursor, $limit: filters.limit }) as SnapshotRow[];
  }

  const stmt = db.prepare(`
    SELECT * FROM snapshots
    ORDER BY created_at DESC
    LIMIT $limit
  `);
  return stmt.all({ $limit: filters.limit }) as SnapshotRow[];
}

/** Every snapshot record (including purged), for full-library export. */
export function listAllSnapshots(db: Database): SnapshotRow[] {
  const stmt = db.prepare("SELECT * FROM snapshots ORDER BY created_at ASC");
  return stmt.all() as SnapshotRow[];
}

export interface SnapshotArtifactRow {
  id: number;
  snapshot_id: string;
  name: string;
  content_hash: string;
  size_bytes: number;
  storage_path: string;
}

export function insertSnapshotArtifact(
  db: Database,
  artifact: {
    snapshotId: string;
    name: string;
    contentHash: string;
    sizeBytes: number;
    storagePath: string;
  },
): void {
  const stmt = db.prepare(`
    INSERT INTO snapshot_artifacts (snapshot_id, name, content_hash, size_bytes, storage_path)
    VALUES ($snapshot_id, $name, $content_hash, $size_bytes, $storage_path)
  `);
  stmt.run({
    $snapshot_id: artifact.snapshotId,
    $name: artifact.name,
    $content_hash: artifact.contentHash,
    $size_bytes: artifact.sizeBytes,
    $storage_path: artifact.storagePath,
  });
}

export function getSnapshotArtifacts(
  db: Database,
  snapshotId: string,
): SnapshotArtifactRow[] {
  const stmt = db.prepare(
    "SELECT * FROM snapshot_artifacts WHERE snapshot_id = $snapshot_id",
  );
  return stmt.all({ $snapshot_id: snapshotId }) as SnapshotArtifactRow[];
}
