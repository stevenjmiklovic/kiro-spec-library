import type { Database } from "bun:sqlite";
import type { AuditOperation } from "@kiro-spec-library/shared";

type Params = Record<string, string | number | bigint | boolean | null>;

export interface AuditRow {
  id: string;
  operation: string;
  spec_key: string | null;
  snapshot_id: string | null;
  actor: string;
  timestamp: string;
  created_at: string;
}

export interface AuditFilters {
  specKey?: string;
  operation?: AuditOperation;
  actor?: string;
  after?: string;
  before?: string;
  limit: number;
}

export function insertAuditEvent(
  db: Database,
  event: {
    id: string;
    operation: AuditOperation;
    specKey?: string;
    snapshotId?: string;
    actor: string;
    timestamp: string;
  },
): void {
  const stmt = db.prepare(`
    INSERT INTO audit_events (id, operation, spec_key, snapshot_id, actor, timestamp)
    VALUES ($id, $operation, $spec_key, $snapshot_id, $actor, $timestamp)
  `);
  stmt.run({
    $id: event.id,
    $operation: event.operation,
    $spec_key: event.specKey ?? null,
    $snapshot_id: event.snapshotId ?? null,
    $actor: event.actor,
    $timestamp: event.timestamp,
  });
}

export function queryAuditEvents(
  db: Database,
  filters: AuditFilters,
): AuditRow[] {
  const conditions: string[] = [];
  const params: Params = {};

  if (filters.specKey) {
    conditions.push("spec_key = $spec_key");
    params.$spec_key = filters.specKey;
  }
  if (filters.operation) {
    conditions.push("operation = $operation");
    params.$operation = filters.operation;
  }
  if (filters.actor) {
    conditions.push("actor = $actor");
    params.$actor = filters.actor;
  }
  if (filters.after) {
    conditions.push("timestamp > $after");
    params.$after = filters.after;
  }
  if (filters.before) {
    conditions.push("timestamp < $before");
    params.$before = filters.before;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  params.$limit = filters.limit;

  const sql = `SELECT * FROM audit_events ${where} ORDER BY timestamp DESC LIMIT $limit`;
  const stmt = db.prepare(sql);
  return stmt.all(params) as AuditRow[];
}
