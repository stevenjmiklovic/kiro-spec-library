export const migration = {
    number: 8,
    name: 'metadata-reviewed-at',
    up(db) {
        db.exec(`
      ALTER TABLE metadata_overlays ADD COLUMN reviewed_at TEXT;
    `);
    },
};
