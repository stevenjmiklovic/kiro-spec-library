import type { Database } from "bun:sqlite";

export interface SourceRow {
  id: string;
  type: string;
  path: string | null;
  url: string | null;
  branch: string | null;
  web_url_template: string | null;
  added_at: string;
  last_scan_at: string | null;
  last_error: string | null;
  last_error_at: string | null;
}

export function listSources(db: Database): SourceRow[] {
  const stmt = db.prepare("SELECT * FROM sources ORDER BY added_at DESC");
  return stmt.all() as SourceRow[];
}

export function putSource(
  db: Database,
  source: {
    id: string;
    type: "local" | "remote";
    path?: string | null;
    url?: string | null;
    branch?: string | null;
    webUrlTemplate?: string | null;
    addedAt: string;
  },
): void {
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

export function deleteSource(db: Database, id: string): void {
  const stmt = db.prepare("DELETE FROM sources WHERE id = $id");
  stmt.run({ $id: id });
}
