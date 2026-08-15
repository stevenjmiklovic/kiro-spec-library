export function createProposal(db, params) {
    const stmt = db.prepare(`
    INSERT INTO proposals (id, spec_key, patch, status, submitted_at, rationale, source)
    VALUES ($id, $spec_key, $patch, 'pending', $submitted_at, $rationale, $source)
  `);
    stmt.run({
        $id: params.id,
        $spec_key: params.specKey,
        $patch: JSON.stringify(params.patch),
        $submitted_at: params.submittedAt,
        $rationale: params.rationale ?? null,
        $source: params.source ?? 'human',
    });
    return db
        .query("SELECT * FROM proposals WHERE id = ?")
        .get(params.id);
}
export function listPendingProposals(db, specKey) {
    return db
        .query("SELECT * FROM proposals WHERE spec_key = ? AND status = 'pending' ORDER BY submitted_at DESC")
        .all(specKey);
}
export function acceptProposal(db, id) {
    const stmt = db.prepare(`
    UPDATE proposals
    SET status = 'accepted', resolved_at = $resolved_at, resolved_by = 'human'
    WHERE id = $id AND status = 'pending'
  `);
    stmt.run({ $id: id, $resolved_at: new Date().toISOString() });
    return db
        .query("SELECT * FROM proposals WHERE id = ?")
        .get(id) ?? null;
}
export function rejectProposal(db, id) {
    const stmt = db.prepare(`
    UPDATE proposals
    SET status = 'rejected', resolved_at = $resolved_at, resolved_by = 'human'
    WHERE id = $id AND status = 'pending'
  `);
    stmt.run({ $id: id, $resolved_at: new Date().toISOString() });
    return db
        .query("SELECT * FROM proposals WHERE id = ?")
        .get(id) ?? null;
}
export function getProposal(db, id) {
    return db
        .query("SELECT * FROM proposals WHERE id = ?")
        .get(id) ?? null;
}
