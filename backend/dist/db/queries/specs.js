export function upsertSpec(db, spec) {
    const stmt = db.prepare(`
    INSERT OR REPLACE INTO specs (
      key, source_id, spec_id, type, workflow, title, owner, stage, progress,
      repository, relative_path, branch, commit_hash, is_dirty, remote_url,
      total_tasks, completed_tasks, content_digest, indexed_at, updated_at
    ) VALUES (
      $key, $source_id, $spec_id, $type, $workflow, $title, $owner, $stage, $progress,
      $repository, $relative_path, $branch, $commit_hash, $is_dirty, $remote_url,
      $total_tasks, $completed_tasks, $content_digest, $indexed_at, $updated_at
    )
  `);
    stmt.run({
        $key: spec.key,
        $source_id: spec.sourceId,
        $spec_id: spec.specId,
        $type: spec.type,
        $workflow: spec.workflow,
        $title: spec.title,
        $owner: spec.owner,
        $stage: spec.stage,
        $progress: spec.progress,
        $repository: spec.provenance.repository,
        $relative_path: spec.provenance.relativePath,
        $branch: spec.provenance.branch,
        $commit_hash: spec.provenance.commitHash,
        $is_dirty: spec.provenance.isDirty ? 1 : 0,
        $remote_url: spec.provenance.remoteUrl ?? null,
        $total_tasks: spec.taskCounts.total,
        $completed_tasks: spec.taskCounts.completed,
        $content_digest: spec.contentDigest,
        $indexed_at: spec.indexedAt,
        $updated_at: spec.indexedAt,
    });
}
export function findByKey(db, key) {
    const stmt = db.prepare("SELECT * FROM specs WHERE key = $key");
    return stmt.get({ $key: key }) ?? null;
}
export function listSpecs(db, filters) {
    const conditions = [];
    const params = {};
    if (filters.type) {
        conditions.push("s.type = $type");
        params.$type = filters.type;
    }
    if (filters.stage) {
        conditions.push("s.stage = $stage");
        params.$stage = filters.stage;
    }
    if (filters.owner) {
        conditions.push("s.owner = $owner");
        params.$owner = filters.owner;
    }
    if (filters.repository) {
        conditions.push("s.repository = $repository");
        params.$repository = filters.repository;
    }
    if (filters.theme) {
        conditions.push("m.theme = $theme");
        params.$theme = filters.theme;
    }
    const needsJoin = !!filters.theme;
    const from = needsJoin
        ? "specs s LEFT JOIN metadata_overlays m ON s.key = m.spec_key"
        : "specs s";
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    params.$limit = filters.limit;
    params.$offset = filters.offset;
    const sql = `SELECT s.* FROM ${from} ${where} ORDER BY s.indexed_at DESC LIMIT $limit OFFSET $offset`;
    const stmt = db.prepare(sql);
    return stmt.all(params);
}
export function searchSpecs(db, query, limit) {
    const stmt = db.prepare(`
    SELECT s.* FROM specs s
    JOIN specs_fts ON specs_fts.rowid = (
      SELECT rowid FROM specs WHERE key = s.key
    )
    WHERE specs_fts MATCH $query
    ORDER BY rank
    LIMIT $limit
  `);
    return stmt.all({ $query: query, $limit: limit });
}
export function countSpecs(db, filters) {
    const conditions = [];
    const params = {};
    if (filters.type) {
        conditions.push("s.type = $type");
        params.$type = filters.type;
    }
    if (filters.stage) {
        conditions.push("s.stage = $stage");
        params.$stage = filters.stage;
    }
    if (filters.owner) {
        conditions.push("s.owner = $owner");
        params.$owner = filters.owner;
    }
    if (filters.repository) {
        conditions.push("s.repository = $repository");
        params.$repository = filters.repository;
    }
    if (filters.theme) {
        conditions.push("m.theme = $theme");
        params.$theme = filters.theme;
    }
    const needsJoin = !!filters.theme;
    const from = needsJoin
        ? "specs s LEFT JOIN metadata_overlays m ON s.key = m.spec_key"
        : "specs s";
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `SELECT COUNT(*) as count FROM ${from} ${where}`;
    const stmt = db.prepare(sql);
    const row = stmt.get(params);
    return row.count;
}
