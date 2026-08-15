import type { Database } from 'bun:sqlite';

export const migration = {
  number: 6,
  name: 'proposals-rationale-source',
  up(db: Database): void {
    db.exec(`
      ALTER TABLE proposals ADD COLUMN rationale TEXT;
      ALTER TABLE proposals ADD COLUMN source TEXT DEFAULT 'human';
    `);
  },
};
