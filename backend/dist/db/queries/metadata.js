export class RevisionConflictError extends Error {
    specKey;
    expectedRevision;
    actualRevision;
    constructor(specKey, expectedRevision, actualRevision) {
        super(`Revision conflict for spec '${specKey}': expected ${expectedRevision}, actual ${actualRevision}`);
        this.specKey = specKey;
        this.expectedRevision = expectedRevision;
        this.actualRevision = actualRevision;
        this.name = "RevisionConflictError";
    }
}
export function getOverlay(db, specKey) {
    const stmt = db.prepare("SELECT * FROM metadata_overlays WHERE spec_key = $spec_key");
    return stmt.get({ $spec_key: specKey }) ?? null;
}
export function upsertOverlay(db, specKey, patch, expectedRevision) {
    const result = db.transaction(() => {
        const existing = getOverlay(db, specKey);
        if (existing) {
            if (existing.revision !== expectedRevision) {
                throw new RevisionConflictError(specKey, expectedRevision, existing.revision);
            }
            const sets = [];
            const params = { $spec_key: specKey };
            for (const [key, value] of Object.entries(patch)) {
                const col = key.replace(/([A-Z])/g, "_$1").toLowerCase();
                sets.push(`${col} = $${col}`);
                params[`$${col}`] = typeof value === "object" && value !== null
                    ? JSON.stringify(value)
                    : value ?? null;
            }
            sets.push("revision = revision + 1");
            sets.push("updated_at = $updated_at");
            params.$updated_at = new Date().toISOString();
            const sql = `UPDATE metadata_overlays SET ${sets.join(", ")} WHERE spec_key = $spec_key`;
            db.prepare(sql).run(params);
        }
        else {
            if (expectedRevision !== 0) {
                throw new RevisionConflictError(specKey, expectedRevision, 0);
            }
            const cols = ["spec_key", "revision", "updated_at"];
            const vals = ["$spec_key", "1", "$updated_at"];
            const params = {
                $spec_key: specKey,
                $updated_at: new Date().toISOString(),
            };
            for (const [key, value] of Object.entries(patch)) {
                const col = key.replace(/([A-Z])/g, "_$1").toLowerCase();
                cols.push(col);
                vals.push(`$${col}`);
                params[`$${col}`] = typeof value === "object" && value !== null
                    ? JSON.stringify(value)
                    : value ?? null;
            }
            const sql = `INSERT INTO metadata_overlays (${cols.join(", ")}) VALUES (${vals.join(", ")})`;
            db.prepare(sql).run(params);
        }
        return getOverlay(db, specKey);
    })();
    return result;
}
export function deleteOverlay(db, specKey) {
    const stmt = db.prepare("DELETE FROM metadata_overlays WHERE spec_key = $spec_key");
    stmt.run({ $spec_key: specKey });
}
