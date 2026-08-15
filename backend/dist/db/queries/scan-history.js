export function insertScan(db, scan) {
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
export function updateScan(db, runId, update) {
    const sets = [];
    const params = { $run_id: runId };
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
    if (sets.length === 0)
        return;
    const sql = `UPDATE scan_history SET ${sets.join(", ")} WHERE run_id = $run_id`;
    db.prepare(sql).run(params);
}
export function getScan(db, runId) {
    const stmt = db.prepare("SELECT * FROM scan_history WHERE run_id = $run_id");
    return stmt.get({ $run_id: runId }) ?? null;
}
