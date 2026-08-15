export const migration = {
    number: 5,
    name: 'schema-improvements',
    up(db) {
        db.exec(`
      -- 1. Add updated_at to specs table
      ALTER TABLE specs ADD COLUMN updated_at TEXT;
      UPDATE specs SET updated_at = indexed_at;

      -- 2. Add submitted_by to proposals table
      ALTER TABLE proposals ADD COLUMN submitted_by TEXT DEFAULT 'mcp-agent';

      -- 3. Recreate snapshot_artifacts with ON DELETE CASCADE
      CREATE TABLE snapshot_artifacts_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        snapshot_id TEXT NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        storage_path TEXT NOT NULL
      );
      INSERT INTO snapshot_artifacts_new SELECT * FROM snapshot_artifacts;
      DROP TABLE snapshot_artifacts;
      ALTER TABLE snapshot_artifacts_new RENAME TO snapshot_artifacts;

      -- 4. Composite index on relationships(target_spec_key, type)
      CREATE INDEX IF NOT EXISTS idx_relationships_target_type ON relationships(target_spec_key, type);

      -- 5. Index on rejections(data_hash)
      CREATE INDEX IF NOT EXISTS idx_rejections_data_hash ON rejections(data_hash);

      -- 6. Rename audit_events.spec_id to spec_key
      ALTER TABLE audit_events RENAME COLUMN spec_id TO spec_key;

      -- 7. json_valid() CHECKs skipped: SQLite cannot add CHECK constraints
      -- after table creation. Application-layer Zod schemas enforce JSON validity.

      -- 8. Add spec_title_at_snapshot to snapshots (denormalized title)
      ALTER TABLE snapshots ADD COLUMN spec_title_at_snapshot TEXT;
      UPDATE snapshots SET spec_title_at_snapshot = (SELECT title FROM specs WHERE specs.key = snapshots.spec_key);
    `);
    },
};
