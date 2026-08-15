export function createSnapshot(db, snapshot) {
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
export function findByDigest(db, specKey, contentDigest) {
    const stmt = db.prepare(`
    SELECT * FROM snapshots
    WHERE spec_key = $spec_key AND content_digest = $content_digest
  `);
    return stmt.get({ $spec_key: specKey, $content_digest: contentDigest }) ?? null;
}
export function getSnapshot(db, id) {
    const stmt = db.prepare("SELECT * FROM snapshots WHERE id = $id");
    return stmt.get({ $id: id }) ?? null;
}
export function purgeSnapshot(db, id) {
    const stmt = db.prepare(`
    UPDATE snapshots
    SET purged = 1, purged_at = $purged_at
    WHERE id = $id
  `);
    stmt.run({ $id: id, $purged_at: new Date().toISOString() });
}
export function listSnapshots(db, filters) {
    if (filters.cursor) {
        const stmt = db.prepare(`
      SELECT * FROM snapshots
      WHERE created_at < $cursor
      ORDER BY created_at DESC
      LIMIT $limit
    `);
        return stmt.all({ $cursor: filters.cursor, $limit: filters.limit });
    }
    const stmt = db.prepare(`
    SELECT * FROM snapshots
    ORDER BY created_at DESC
    LIMIT $limit
  `);
    return stmt.all({ $limit: filters.limit });
}
export function insertSnapshotArtifact(db, artifact) {
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
export function getSnapshotArtifacts(db, snapshotId) {
    const stmt = db.prepare("SELECT * FROM snapshot_artifacts WHERE snapshot_id = $snapshot_id");
    return stmt.all({ $snapshot_id: snapshotId });
}
