export const migration = {
    number: 1,
    name: 'core-tables',
    up(db) {
        db.exec(`
      CREATE TABLE sources (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('local', 'remote')),
        path TEXT,
        url TEXT,
        branch TEXT,
        web_url_template TEXT,
        added_at TEXT NOT NULL,
        last_scan_at TEXT,
        last_error TEXT,
        last_error_at TEXT
      );

      CREATE TABLE specs (
        key TEXT PRIMARY KEY,
        source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
        spec_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('feature', 'bugfix', 'quick', 'unknown')),
        workflow TEXT NOT NULL CHECK (workflow IN ('requirements-first', 'design-first', 'unknown')),
        title TEXT NOT NULL,
        owner TEXT NOT NULL DEFAULT 'unowned',
        stage TEXT NOT NULL CHECK (stage IN ('requirements', 'bug_analysis', 'design', 'tasks', 'completed')),
        progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        repository TEXT NOT NULL,
        relative_path TEXT NOT NULL,
        branch TEXT NOT NULL,
        commit_hash TEXT NOT NULL,
        is_dirty INTEGER NOT NULL DEFAULT 0,
        remote_url TEXT,
        total_tasks INTEGER NOT NULL DEFAULT 0,
        completed_tasks INTEGER NOT NULL DEFAULT 0,
        content_digest TEXT NOT NULL,
        indexed_at TEXT NOT NULL,
        UNIQUE(source_id, spec_id)
      );

      CREATE TABLE artifacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        spec_key TEXT NOT NULL REFERENCES specs(key) ON DELETE CASCADE,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        content_hash TEXT NOT NULL,
        UNIQUE(spec_key, name)
      );

      CREATE TABLE metadata_overlays (
        spec_key TEXT PRIMARY KEY REFERENCES specs(key) ON DELETE CASCADE,
        title TEXT,
        summary TEXT,
        owner TEXT,
        theme TEXT,
        tags TEXT,
        target_release TEXT,
        retention_policy TEXT,
        legal_hold TEXT,
        revision INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE relationships (
        id TEXT PRIMARY KEY,
        source_spec_key TEXT NOT NULL REFERENCES specs(key) ON DELETE CASCADE,
        target_spec_key TEXT NOT NULL REFERENCES specs(key) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('depends_on', 'blocks', 'supersedes', 'duplicates', 'related')),
        created_at TEXT NOT NULL,
        UNIQUE(source_spec_key, target_spec_key, type)
      );

      CREATE TABLE suggestions (
        id TEXT PRIMARY KEY,
        source_spec_key TEXT NOT NULL REFERENCES specs(key) ON DELETE CASCADE,
        target_spec_key TEXT NOT NULL REFERENCES specs(key) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('depends_on', 'blocks', 'supersedes', 'duplicates', 'related')),
        confidence REAL NOT NULL,
        reason TEXT NOT NULL,
        evidence TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
        created_at TEXT NOT NULL,
        resolved_at TEXT,
        data_hash TEXT NOT NULL
      );

      CREATE TABLE snapshots (
        id TEXT PRIMARY KEY,
        spec_key TEXT NOT NULL,
        created_at TEXT NOT NULL,
        content_digest TEXT NOT NULL,
        metadata_projection TEXT NOT NULL,
        provenance TEXT NOT NULL,
        retention_policy TEXT,
        legal_hold_active INTEGER NOT NULL DEFAULT 0,
        legal_hold_reason TEXT,
        purged INTEGER NOT NULL DEFAULT 0,
        purged_at TEXT,
        UNIQUE(spec_key, content_digest)
      );

      CREATE TABLE snapshot_artifacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        snapshot_id TEXT NOT NULL REFERENCES snapshots(id),
        name TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        storage_path TEXT NOT NULL
      );

      CREATE TABLE scan_history (
        run_id TEXT PRIMARY KEY,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'partial_failure')),
        specs_discovered INTEGER NOT NULL DEFAULT 0,
        errors TEXT
      );

      CREATE TABLE audit_events (
        id TEXT PRIMARY KEY,
        operation TEXT NOT NULL,
        spec_id TEXT,
        snapshot_id TEXT,
        actor TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now'))
      );

      CREATE TABLE rejections (
        id TEXT PRIMARY KEY,
        source_spec_key TEXT NOT NULL,
        target_spec_key TEXT NOT NULL,
        type TEXT NOT NULL,
        data_hash TEXT NOT NULL,
        rejected_at TEXT NOT NULL
      );

      CREATE TABLE owner_aliases (
        id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        email TEXT,
        git_names TEXT NOT NULL,
        is_local INTEGER NOT NULL DEFAULT 1
      );
    `);
    },
};
