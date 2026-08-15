import type { Database } from 'bun:sqlite';

export const migration = {
  number: 4,
  name: 'proposals-table',
  up(db: Database): void {
    db.exec(`
      CREATE TABLE proposals (
        id TEXT PRIMARY KEY,
        spec_key TEXT NOT NULL REFERENCES specs(key) ON DELETE CASCADE,
        patch TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
        submitted_at TEXT NOT NULL,
        resolved_at TEXT,
        resolved_by TEXT
      );

      CREATE INDEX idx_proposals_spec_key ON proposals(spec_key);
      CREATE INDEX idx_proposals_status ON proposals(status);
    `);
  },
};
