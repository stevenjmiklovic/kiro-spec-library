import type { Database } from 'bun:sqlite';

export const migration = {
  number: 9,
  name: 'metadata-schema-completion',
  up(db: Database): void {
    db.exec(`
      ALTER TABLE metadata_overlays ADD COLUMN approvers TEXT;
      ALTER TABLE metadata_overlays ADD COLUMN implementation_ref TEXT;
    `);
  },
};
