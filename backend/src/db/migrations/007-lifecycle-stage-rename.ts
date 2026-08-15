import type { Database } from 'bun:sqlite';

export const migration = {
  number: 7,
  name: 'lifecycle-stage-rename',
  up(db: Database): void {
    // SQLite doesn't support ALTER CHECK constraint — recreate the table.
    // Map old values → new: requirements→new, bug_analysis→scoped, design→scoped, tasks→refined/in-flight, completed→done
    db.exec(`
      CREATE TABLE specs_new (
        key TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        spec_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('feature', 'bugfix', 'quick', 'unknown')),
        workflow TEXT NOT NULL DEFAULT 'requirements-first' CHECK (workflow IN ('requirements-first', 'design-first', 'unknown')),
        title TEXT NOT NULL DEFAULT '',
        owner TEXT NOT NULL DEFAULT 'unowned',
        stage TEXT NOT NULL CHECK (stage IN ('new', 'scoped', 'refined', 'in-flight', 'done')),
        progress INTEGER NOT NULL DEFAULT 0,
        repository TEXT,
        relative_path TEXT,
        branch TEXT,
        commit_hash TEXT,
        is_dirty INTEGER NOT NULL DEFAULT 0,
        remote_url TEXT,
        total_tasks INTEGER NOT NULL DEFAULT 0,
        completed_tasks INTEGER NOT NULL DEFAULT 0,
        content_digest TEXT NOT NULL,
        indexed_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      INSERT INTO specs_new SELECT
        key, source_id, spec_id, type, workflow, title, owner,
        CASE stage
          WHEN 'requirements' THEN 'new'
          WHEN 'bug_analysis' THEN 'scoped'
          WHEN 'design' THEN 'scoped'
          WHEN 'tasks' THEN CASE WHEN completed_tasks > 0 THEN 'in-flight' ELSE 'refined' END
          WHEN 'completed' THEN 'done'
          ELSE 'new'
        END,
        progress, repository, relative_path, branch, commit_hash,
        is_dirty, remote_url, total_tasks, completed_tasks,
        content_digest, indexed_at, updated_at
      FROM specs;

      DROP TABLE specs;
      ALTER TABLE specs_new RENAME TO specs;

      CREATE INDEX idx_specs_source ON specs(source_id);
      CREATE INDEX idx_specs_stage ON specs(stage);
      CREATE INDEX idx_specs_type ON specs(type);
      CREATE INDEX idx_specs_owner ON specs(owner);
    `);
  },
};
