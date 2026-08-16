import type { Database } from "bun:sqlite";
import type { RelationshipType, SuggestionReason } from "@kiro-spec-library/shared";

export interface SuggestionRow {
  id: string;
  source_spec_key: string;
  target_spec_key: string;
  type: string;
  confidence: number;
  reason: string;
  evidence: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  data_hash: string;
}

export function createSuggestion(
  db: Database,
  suggestion: {
    id: string;
    sourceSpecKey: string;
    targetSpecKey: string;
    type: RelationshipType;
    confidence: number;
    reason: SuggestionReason;
    evidence: string;
    dataHash: string;
  },
): void {
  const stmt = db.prepare(`
    INSERT INTO suggestions (
      id, source_spec_key, target_spec_key, type, confidence,
      reason, evidence, status, created_at, data_hash
    ) VALUES (
      $id, $source_spec_key, $target_spec_key, $type, $confidence,
      $reason, $evidence, 'pending', $created_at, $data_hash
    )
  `);
  stmt.run({
    $id: suggestion.id,
    $source_spec_key: suggestion.sourceSpecKey,
    $target_spec_key: suggestion.targetSpecKey,
    $type: suggestion.type,
    $confidence: suggestion.confidence,
    $reason: suggestion.reason,
    $evidence: suggestion.evidence,
    $created_at: new Date().toISOString(),
    $data_hash: suggestion.dataHash,
  });
}

export function acceptSuggestion(db: Database, id: string): void {
  const stmt = db.prepare(`
    UPDATE suggestions
    SET status = 'accepted', resolved_at = $resolved_at
    WHERE id = $id
  `);
  stmt.run({ $id: id, $resolved_at: new Date().toISOString() });
}

export function rejectSuggestion(
  db: Database,
  id: string,
  dataHash: string,
): void {
  db.transaction(() => {
    const suggestion = db
      .prepare("SELECT * FROM suggestions WHERE id = $id")
      .get({ $id: id }) as SuggestionRow | null;

    if (!suggestion) return;

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE suggestions
      SET status = 'rejected', resolved_at = $resolved_at
      WHERE id = $id
    `).run({ $id: id, $resolved_at: now });

    db.prepare(`
      INSERT INTO rejections (id, source_spec_key, target_spec_key, type, data_hash, rejected_at)
      VALUES ($id, $source, $target, $type, $data_hash, $rejected_at)
    `).run({
      $id: crypto.randomUUID(),
      $source: suggestion.source_spec_key,
      $target: suggestion.target_spec_key,
      $type: suggestion.type,
      $data_hash: dataHash,
      $rejected_at: now,
    });
  })();
}

export function listPending(
  db: Database,
  specKey?: string,
): SuggestionRow[] {
  if (specKey) {
    const stmt = db.prepare(`
      SELECT * FROM suggestions
      WHERE status = 'pending' AND (source_spec_key = $spec_key OR target_spec_key = $spec_key)
      ORDER BY confidence DESC, created_at DESC
    `);
    return stmt.all({ $spec_key: specKey }) as SuggestionRow[];
  }

  const stmt = db.prepare(`
    SELECT * FROM suggestions
    WHERE status = 'pending'
    ORDER BY confidence DESC, created_at DESC
  `);
  return stmt.all() as SuggestionRow[];
}

/** Bulk-fetch pending suggestions whose source is one of the given spec keys (for graph edge building). */
export function listPendingBySourceKeys(db: Database, specKeys: string[]): SuggestionRow[] {
  if (specKeys.length === 0) return [];
  const placeholders = specKeys.map((_, i) => `$k${i}`).join(", ");
  const params: Record<string, string> = {};
  specKeys.forEach((key, i) => {
    params[`$k${i}`] = key;
  });
  const stmt = db.prepare(`
    SELECT * FROM suggestions
    WHERE status = 'pending' AND source_spec_key IN (${placeholders})
  `);
  return stmt.all(params) as SuggestionRow[];
}

export function isRejected(
  db: Database,
  sourceKey: string,
  targetKey: string,
  type: RelationshipType,
  dataHash: string,
): boolean {
  const stmt = db.prepare(`
    SELECT 1 FROM rejections
    WHERE source_spec_key = $source AND target_spec_key = $target
      AND type = $type AND data_hash = $data_hash
    LIMIT 1
  `);
  return stmt.get({
    $source: sourceKey,
    $target: targetKey,
    $type: type,
    $data_hash: dataHash,
  }) !== null;
}
