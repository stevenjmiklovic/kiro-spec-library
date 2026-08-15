export const migration = {
    number: 2,
    name: 'fts5-indexes',
    up(db) {
        db.exec(`
      CREATE VIRTUAL TABLE specs_fts USING fts5(
        title,
        content,
        owner,
        theme,
        tags,
        repository,
        content='',
        contentless_delete=1
      );

      CREATE VIRTUAL TABLE snapshots_fts USING fts5(
        title,
        content,
        owner,
        theme,
        tags,
        content='',
        contentless_delete=1
      );
    `);
    },
};
