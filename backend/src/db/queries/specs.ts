import type { Database } from "bun:sqlite";
import type { NormalizedSpec } from "@kiro-spec-library/shared";

type Params = Record<string, string | number | bigint | boolean | null>;

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
  limit: number;
  offset: number;
}

export function upsertSpec(db: Database, spec: NormalizedSpec): void {
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

  const needsJoin = true; // Always join to pick up reviewedAt from overlay
  const from = "specs s LEFT JOIN metadata_overlays m ON s.key = m.spec_key";

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  params.$limit = filters.limit;
  params.$offset = filters.offset;

  const sql = `SELECT s.*, m.reviewed_at FROM ${from} ${where} ORDER BY s.indexed_at DESC LIMIT $limit OFFSET $offset`;
  const stmt = db.prepare(sql);
  return stmt.all(params) as SpecRow[];
}

export function searchSpecs(
  db: Database,
  query: string,
  limit: number,
): SpecRow[] {
  const stmt = db.prepare(`
    SELECT s.* FROM specs s
    JOIN specs_fts ON specs_fts.rowid = (
      SELECT rowid FROM specs WHERE key = s.key
    )
    WHERE specs_fts MATCH $query
    ORDER BY rank
    LIMIT $limit
  `);
  return stmt.all({ $query: query, $limit: limit }) as SpecRow[];
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
