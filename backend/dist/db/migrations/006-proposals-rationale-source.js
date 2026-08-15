export const migration = {
    number: 6,
    name: 'proposals-rationale-source',
    up(db) {
        db.exec(`
      ALTER TABLE proposals ADD COLUMN rationale TEXT;
      ALTER TABLE proposals ADD COLUMN source TEXT DEFAULT 'human';
    `);
    },
};
