import type { Database } from 'bun:sqlite';

/**
 * Drops columns/tables confirmed fully unused (docs/known-issues.md's
 * "Dead columns / tables / exports" section): never written by any query,
 * never read by any route/UI, and — for the two legal-hold-related columns
 * on snapshots/metadata_overlays — superseded by the `supersedes`
 * relationship graph per ADR-005 (whose UI/API-layer code was removed in
 * an earlier migration on this branch).
 */
export const migration = {
  number: 10,
  name: 'drop-dead-columns',
  up(db: Database): void {
    db.exec(`
      ALTER TABLE sources DROP COLUMN last_scan_at;
      ALTER TABLE sources DROP COLUMN last_error;
      ALTER TABLE sources DROP COLUMN last_error_at;

      ALTER TABLE metadata_overlays DROP COLUMN legal_hold;

      ALTER TABLE snapshots DROP COLUMN legal_hold_active;
      ALTER TABLE snapshots DROP COLUMN legal_hold_reason;
      ALTER TABLE snapshots DROP COLUMN spec_title_at_snapshot;

      ALTER TABLE proposals DROP COLUMN submitted_by;

      ALTER TABLE specs DROP COLUMN updated_at;

      DROP TABLE owner_aliases;
    `);
  },
};
