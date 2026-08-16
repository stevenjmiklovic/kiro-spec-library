import type { Database } from "bun:sqlite";
import type { RelationshipType } from "@kiro-spec-library/shared";

export interface RelationshipRow {
  id: string;
  source_spec_key: string;
  target_spec_key: string;
  type: string;
  created_at: string;
}

export function createRelationship(
  db: Database,
  rel: {
    id: string;
    sourceSpecKey: string;
    targetSpecKey: string;
    type: RelationshipType;
  },
): void {
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

export function deleteRelationship(db: Database, id: string): void {
  const stmt = db.prepare("DELETE FROM relationships WHERE id = $id");
  stmt.run({ $id: id });
}

export function listBySpec(db: Database, specKey: string): RelationshipRow[] {
  const stmt = db.prepare(`
    SELECT * FROM relationships
    WHERE source_spec_key = $spec_key OR target_spec_key = $spec_key
    ORDER BY created_at DESC
  `);
  return stmt.all({ $spec_key: specKey }) as RelationshipRow[];
}

/** Bulk-fetch relationships whose source is one of the given spec keys (for graph edge building). */
export function listBySourceKeys(db: Database, specKeys: string[]): RelationshipRow[] {
  if (specKeys.length === 0) return [];
  const placeholders = specKeys.map((_, i) => `$k${i}`).join(", ");
  const params: Record<string, string> = {};
  specKeys.forEach((key, i) => {
    params[`$k${i}`] = key;
  });
  const stmt = db.prepare(`
    SELECT * FROM relationships
    WHERE source_spec_key IN (${placeholders})
  `);
  return stmt.all(params) as RelationshipRow[];
}

export function checkDuplicate(
  db: Database,
  sourceSpecKey: string,
  targetSpecKey: string,
  type: RelationshipType,
): boolean {
  const stmt = db.prepare(`
    SELECT 1 FROM relationships
    WHERE source_spec_key = $source AND target_spec_key = $target AND type = $type
    LIMIT 1
  `);
  return stmt.get({ $source: sourceSpecKey, $target: targetSpecKey, $type: type }) !== null;
}
