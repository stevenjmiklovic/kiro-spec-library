export function insertAuditEvent(db, event) {
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
export function queryAuditEvents(db, filters) {
    const conditions = [];
    const params = {};
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
    return stmt.all(params);
}
