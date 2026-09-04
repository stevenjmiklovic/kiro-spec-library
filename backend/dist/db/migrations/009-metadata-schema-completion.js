export const migration = {
    number: 9,
    name: 'metadata-schema-completion',
    up(db) {
        db.exec(`
      ALTER TABLE metadata_overlays ADD COLUMN approvers TEXT;
      ALTER TABLE metadata_overlays ADD COLUMN implementation_ref TEXT;
    `);
    },
};
