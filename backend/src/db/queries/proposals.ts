import type { Database } from "bun:sqlite";

export interface ProposalRow {
  id: string;
  spec_key: string;
  patch: string;
  status: string;
  submitted_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  rationale: string | null;
  source: string | null;
}

export function createProposal(
  db: Database,
  params: {
    id: string;
    specKey: string;
    patch: Record<string, unknown>;
    submittedAt: string;
    rationale?: string;
    source?: string;
  },
): ProposalRow {
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
    .query<ProposalRow, [string]>("SELECT * FROM proposals WHERE id = ?")
    .get(params.id)!;
}

/** Every proposal in the database (any status), for full-library export. */
export function listAllProposals(db: Database): ProposalRow[] {
  return db
    .query<ProposalRow, []>("SELECT * FROM proposals ORDER BY submitted_at ASC")
    .all();
}

export function listPendingProposals(db: Database, specKey: string): ProposalRow[] {
  return db
    .query<ProposalRow, [string]>(
      "SELECT * FROM proposals WHERE spec_key = ? AND status = 'pending' ORDER BY submitted_at DESC"
    )
    .all(specKey);
}

export function acceptProposal(db: Database, id: string): ProposalRow | null {
  const stmt = db.prepare(`
    UPDATE proposals
    SET status = 'accepted', resolved_at = $resolved_at, resolved_by = 'human'
    WHERE id = $id AND status = 'pending'
  `);
  stmt.run({ $id: id, $resolved_at: new Date().toISOString() });

  return db
    .query<ProposalRow, [string]>("SELECT * FROM proposals WHERE id = ?")
    .get(id) ?? null;
}

export function rejectProposal(db: Database, id: string): ProposalRow | null {
  const stmt = db.prepare(`
    UPDATE proposals
    SET status = 'rejected', resolved_at = $resolved_at, resolved_by = 'human'
    WHERE id = $id AND status = 'pending'
  `);
  stmt.run({ $id: id, $resolved_at: new Date().toISOString() });

  return db
    .query<ProposalRow, [string]>("SELECT * FROM proposals WHERE id = ?")
    .get(id) ?? null;
}

export function getProposal(db: Database, id: string): ProposalRow | null {
  return db
    .query<ProposalRow, [string]>("SELECT * FROM proposals WHERE id = ?")
    .get(id) ?? null;
}
