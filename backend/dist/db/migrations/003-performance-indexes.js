export const migration = {
    number: 3,
    name: 'performance-indexes',
    up(db) {
        db.exec(`
      CREATE INDEX idx_specs_source ON specs(source_id);
      CREATE INDEX idx_specs_stage ON specs(stage);
      CREATE INDEX idx_specs_type ON specs(type);
      CREATE INDEX idx_specs_owner ON specs(owner);
      CREATE INDEX idx_specs_theme ON metadata_overlays(theme);
      CREATE INDEX idx_relationships_source ON relationships(source_spec_key);
      CREATE INDEX idx_relationships_target ON relationships(target_spec_key);
      CREATE INDEX idx_suggestions_status ON suggestions(status);
      CREATE INDEX idx_snapshots_spec ON snapshots(spec_key);
      CREATE INDEX idx_snapshots_created ON snapshots(created_at DESC);
      CREATE INDEX idx_audit_timestamp ON audit_events(timestamp DESC);
      CREATE INDEX idx_audit_spec ON audit_events(spec_id);
      CREATE INDEX idx_audit_operation ON audit_events(operation);
    `);
    },
};
