export function listSources(db) {
    const stmt = db.prepare("SELECT * FROM sources ORDER BY added_at DESC");
    return stmt.all();
}
export function putSource(db, source) {
    const stmt = db.prepare(`
    INSERT OR REPLACE INTO sources (id, type, path, url, branch, web_url_template, added_at)
    VALUES ($id, $type, $path, $url, $branch, $web_url_template, $added_at)
  `);
    stmt.run({
        $id: source.id,
        $type: source.type,
        $path: source.path ?? null,
        $url: source.url ?? null,
        $branch: source.branch ?? null,
        $web_url_template: source.webUrlTemplate ?? null,
        $added_at: source.addedAt,
    });
}
export function deleteSource(db, id) {
    const stmt = db.prepare("DELETE FROM sources WHERE id = $id");
    stmt.run({ $id: id });
}
