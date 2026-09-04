import type { Database } from "bun:sqlite";
import type { Source } from "@kiro-spec-library/shared";

export interface SourceRow {
  id: string;
  type: string;
  path: string | null;
  url: string | null;
  branch: string | null;
  web_url_template: string | null;
  added_at: string;
}

/**
 * Map a raw DB row to the canonical camelCase {@link Source} shape.
 *
 * The `sources` table stores snake_case columns (`web_url_template`,
 * `added_at`) and always materializes both `path` and `url` (null for the
 * other type). The rest of the app — the UI `Source` interface and, critically,
 * the `POST /sync` request schema, which requires a non-optional camelCase
 * `addedAt` — speaks the {@link Source} shape. Returning raw rows made
 * `Save & rescan` forward snake_case objects to `/sync`, which then failed
 * TypeBox validation (missing `addedAt`) with a 422, so no scan ever ran.
 * Serialize at the query boundary so callers only ever see `Source`.
 */
function rowToSource(row: SourceRow): Source {
  const type = row.type === "remote" ? "remote" : "local";
  return {
    id: row.id,
    type,
    ...(type === "local"
      ? { path: row.path ?? undefined }
      : {
          url: row.url ?? undefined,
          branch: row.branch ?? undefined,
          webUrlTemplate: row.web_url_template ?? undefined,
        }),
    addedAt: row.added_at,
  };
}

export function listSources(db: Database): Source[] {
  const stmt = db.prepare("SELECT * FROM sources ORDER BY added_at DESC");
  return (stmt.all() as SourceRow[]).map(rowToSource);
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

/**
 * Replace the ENTIRE source set with `sources`, atomically. The UI's
 * `Save & rescan` promises "Saving replaces the entire source list", so a
 * source the user removed in the panel must actually disappear from the DB —
 * an upsert-only PUT left removed sources behind. Runs in a transaction so a
 * mid-write failure can't leave a half-applied set.
 */
export function replaceSources(
  db: Database,
  sources: Array<{
    id: string;
    type: "local" | "remote";
    path?: string | null;
    url?: string | null;
    branch?: string | null;
    webUrlTemplate?: string | null;
    addedAt: string;
  }>,
): void {
  const run = db.transaction(() => {
    db.prepare("DELETE FROM sources").run();
    for (const source of sources) {
      putSource(db, source);
    }
  });
  run();
}
