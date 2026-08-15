import type { Database } from "bun:sqlite";
import type { ScanStatus } from "@kiro-spec-library/shared";

type Params = Record<string, string | number | bigint | boolean | null>;

export interface ScanRow {
  run_id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  specs_discovered: number;
  errors: string | null;
}

export function insertScan(
  db: Database,
  scan: {
    runId: string;
    startedAt: string;
    status: ScanStatus;
  },
): void {
  const stmt = db.prepare(`
    INSERT INTO scan_history (run_id, started_at, status)
    VALUES ($run_id, $started_at, $status)
  `);
  stmt.run({
    $run_id: scan.runId,
    $started_at: scan.startedAt,
    $status: scan.status,
  });
}

export function updateScan(
  db: Database,
  runId: string,
  update: {
    completedAt?: string;
    status?: ScanStatus;
    specsDiscovered?: number;
    errors?: string;
  },
): void {
  const sets: string[] = [];
  const params: Params = { $run_id: runId };

  if (update.completedAt !== undefined) {
    sets.push("completed_at = $completed_at");
    params.$completed_at = update.completedAt;
  }
  if (update.status !== undefined) {
    sets.push("status = $status");
    params.$status = update.status;
  }
  if (update.specsDiscovered !== undefined) {
    sets.push("specs_discovered = $specs_discovered");
    params.$specs_discovered = update.specsDiscovered;
  }
  if (update.errors !== undefined) {
    sets.push("errors = $errors");
    params.$errors = update.errors;
  }

  if (sets.length === 0) return;

  const sql = `UPDATE scan_history SET ${sets.join(", ")} WHERE run_id = $run_id`;
  db.prepare(sql).run(params);
}

export function getScan(db: Database, runId: string): ScanRow | null {
  const stmt = db.prepare("SELECT * FROM scan_history WHERE run_id = $run_id");
  return (stmt.get({ $run_id: runId }) as ScanRow) ?? null;
}
