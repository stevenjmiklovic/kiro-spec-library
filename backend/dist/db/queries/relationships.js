export function createRelationship(db, rel) {
    const stmt = db.prepare(`
    INSERT INTO relationships (id, source_spec_key, target_spec_key, type, created_at)
    VALUES ($id, $source_spec_key, $target_spec_key, $type, $created_at)
  `);
    stmt.run({
        $id: rel.id,
        $source_spec_key: rel.sourceSpecKey,
        $target_spec_key: rel.targetSpecKey,
        $type: rel.type,
        $created_at: new Date().toISOString(),
    });
}
export function deleteRelationship(db, id) {
    const stmt = db.prepare("DELETE FROM relationships WHERE id = $id");
    stmt.run({ $id: id });
}
export function listBySpec(db, specKey) {
    const stmt = db.prepare(`
    SELECT * FROM relationships
    WHERE source_spec_key = $spec_key OR target_spec_key = $spec_key
    ORDER BY created_at DESC
  `);
    return stmt.all({ $spec_key: specKey });
}
export function checkDuplicate(db, sourceSpecKey, targetSpecKey, type) {
    const stmt = db.prepare(`
    SELECT 1 FROM relationships
    WHERE source_spec_key = $source AND target_spec_key = $target AND type = $type
    LIMIT 1
  `);
    return stmt.get({ $source: sourceSpecKey, $target: targetSpecKey, $type: type }) !== null;
}
