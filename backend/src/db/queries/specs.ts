import type { Database } from "bun:sqlite";
import type { NormalizedSpec } from "@kiro-spec-library/shared";

type Params = Record<string, string | number | bigint | boolean | null>;

/**
 * Turn free-text user input into a safe FTS5 MATCH expression: each
 * whitespace-separated word becomes a quoted phrase term (implicit AND
 * between terms), so stray FTS5 query-syntax characters (-, :, *, etc.)
 * in user input can't cause a MATCH syntax error.
 */
function sanitizeFtsQuery(query: string): string {
  return query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `"${word.replace(/"/g, '""')}"`)
    .join(" ");
}

export interface SpecRow {
  key: string;
  source_id: string;
  spec_id: string;
  type: string;
  workflow: string;
  title: string;
  owner: string;
  stage: string;
  progress: number;
  repository: string;
  relative_path: string;
  branch: string;
  commit_hash: string;
  is_dirty: number;
  remote_url: string | null;
  total_tasks: number;
  completed_tasks: number;
  content_digest: string;
  indexed_at: string;
}

export interface SpecFilters {
  type?: string;
  stage?: string;
  owner?: string;
  theme?: string;
  repository?: string;
  /** Full-text search term, matched against specs_fts (title/content/owner/theme/tags/repository). */
  query?: string;
  limit: number;
  offset: number;
}

/**
 * Upsert a spec, preserving its rowid across updates (`ON CONFLICT DO UPDATE`
 * rather than `INSERT OR REPLACE`, which deletes+reinserts and would change
 * the rowid). specs_fts is joined to `specs` by matching rowid, so a stable
 * rowid is required for that join — and for `syncSpecFts` below — to stay
 * correct across rescans. Returns the row's rowid for the caller to pass to
 * `syncSpecFts`.
 */
export function upsertSpec(db: Database, spec: NormalizedSpec): number {
  const stmt = db.prepare(`
    INSERT INTO specs (
      key, source_id, spec_id, type, workflow, title, owner, stage, progress,
      repository, relative_path, branch, commit_hash, is_dirty, remote_url,
      total_tasks, completed_tasks, content_digest, indexed_at, updated_at
    ) VALUES (
      $key, $source_id, $spec_id, $type, $workflow, $title, $owner, $stage, $progress,
      $repository, $relative_path, $branch, $commit_hash, $is_dirty, $remote_url,
      $total_tasks, $completed_tasks, $content_digest, $indexed_at, $updated_at
    )
    ON CONFLICT(key) DO UPDATE SET
      source_id = excluded.source_id,
      spec_id = excluded.spec_id,
      type = excluded.type,
      workflow = excluded.workflow,
      title = excluded.title,
      owner = excluded.owner,
      stage = excluded.stage,
      progress = excluded.progress,
      repository = excluded.repository,
      relative_path = excluded.relative_path,
      branch = excluded.branch,
      commit_hash = excluded.commit_hash,
      is_dirty = excluded.is_dirty,
      remote_url = excluded.remote_url,
      total_tasks = excluded.total_tasks,
      completed_tasks = excluded.completed_tasks,
      content_digest = excluded.content_digest,
      indexed_at = excluded.indexed_at,
      updated_at = excluded.updated_at
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

  const row = db
    .prepare("SELECT rowid FROM specs WHERE key = $key")
    .get({ $key: spec.key }) as { rowid: number };
  return row.rowid;
}

/**
 * Sync a spec's row into the contentless `specs_fts` table by matching
 * rowid (delete-then-insert — contentless FTS5 tables don't support UPDATE).
 * Call after `upsertSpec` with the rowid it returned.
 */
export function syncSpecFts(
  db: Database,
  rowid: number,
  fields: {
    title: string;
    content: string;
    owner: string;
    theme: string;
    tags: string;
    repository: string;
  },
): void {
  db.prepare("DELETE FROM specs_fts WHERE rowid = $rowid").run({ $rowid: rowid });
  db.prepare(`
    INSERT INTO specs_fts (rowid, title, content, owner, theme, tags, repository)
    VALUES ($rowid, $title, $content, $owner, $theme, $tags, $repository)
  `).run({
    $rowid: rowid,
    $title: fields.title,
    $content: fields.content,
    $owner: fields.owner,
    $theme: fields.theme,
    $tags: fields.tags,
    $repository: fields.repository,
  });
}

export function findByKey(db: Database, key: string): SpecRow | null {
  const stmt = db.prepare("SELECT * FROM specs WHERE key = $key");
  return (stmt.get({ $key: key }) as SpecRow) ?? null;
}

export function listSpecs(db: Database, filters: SpecFilters): SpecRow[] {
  const conditions: string[] = [];
  const params: Params = {};

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
  const ftsQuery = filters.query ? sanitizeFtsQuery(filters.query) : "";
  if (ftsQuery) {
    conditions.push(
      "s.key IN (SELECT specs.key FROM specs JOIN specs_fts ON specs_fts.rowid = specs.rowid WHERE specs_fts MATCH $query)",
    );
    params.$query = ftsQuery;
  }

  // Always join to pick up reviewedAt from overlay
  const from = "specs s LEFT JOIN metadata_overlays m ON s.key = m.spec_key";

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  params.$limit = filters.limit;
  params.$offset = filters.offset;

  const sql = `SELECT s.*, m.reviewed_at FROM ${from} ${where} ORDER BY s.indexed_at DESC LIMIT $limit OFFSET $offset`;
  const stmt = db.prepare(sql);
  return stmt.all(params) as SpecRow[];
}

export function countSpecs(
  db: Database,
  filters: Omit<SpecFilters, "limit" | "offset">,
): number {
  const conditions: string[] = [];
  const params: Params = {};

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
  const ftsQuery = filters.query ? sanitizeFtsQuery(filters.query) : "";
  if (ftsQuery) {
    conditions.push(
      "s.key IN (SELECT specs.key FROM specs JOIN specs_fts ON specs_fts.rowid = specs.rowid WHERE specs_fts MATCH $query)",
    );
    params.$query = ftsQuery;
  }

  const needsJoin = !!filters.theme;
  const from = needsJoin
    ? "specs s LEFT JOIN metadata_overlays m ON s.key = m.spec_key"
    : "specs s";

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `SELECT COUNT(*) as count FROM ${from} ${where}`;
  const stmt = db.prepare(sql);
  const row = stmt.get(params) as { count: number };
  return row.count;
}
