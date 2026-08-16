import type { Database } from "bun:sqlite";
import type { MetadataOverlay } from "@kiro-spec-library/shared";

type Params = Record<string, string | number | bigint | boolean | null>;

export interface MetadataRow {
  spec_key: string;
  title: string | null;
  summary: string | null;
  owner: string | null;
  theme: string | null;
  tags: string | null;
  target_release: string | null;
  retention_policy: string | null;
  reviewed_at: string | null;
  approvers: string | null;
  implementation_ref: string | null;
  revision: number;
  updated_at: string;
}

export class RevisionConflictError extends Error {
  constructor(
    public readonly specKey: string,
    public readonly expectedRevision: number,
    public readonly actualRevision: number,
  ) {
    super(
      `Revision conflict for spec '${specKey}': expected ${expectedRevision}, actual ${actualRevision}`,
    );
    this.name = "RevisionConflictError";
  }
}

export function getOverlay(db: Database, specKey: string): MetadataRow | null {
  const stmt = db.prepare(
    "SELECT * FROM metadata_overlays WHERE spec_key = $spec_key",
  );
  return (stmt.get({ $spec_key: specKey }) as MetadataRow) ?? null;
}

export function upsertOverlay(
  db: Database,
  specKey: string,
  patch: Record<string, unknown>,
  expectedRevision: number,
): MetadataRow {
  const result = db.transaction(() => {
    const existing = getOverlay(db, specKey);

    if (existing) {
      if (existing.revision !== expectedRevision) {
        throw new RevisionConflictError(
          specKey,
          expectedRevision,
          existing.revision,
        );
      }

      const sets: string[] = [];
      const params: Params = { $spec_key: specKey };

      for (const [key, value] of Object.entries(patch)) {
        const col = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        sets.push(`${col} = $${col}`);
        params[`$${col}`] = typeof value === "object" && value !== null
          ? JSON.stringify(value)
          : (value as string | number | boolean | null) ?? null;
      }

      sets.push("revision = revision + 1");
      sets.push("updated_at = $updated_at");
      params.$updated_at = new Date().toISOString();

      const sql = `UPDATE metadata_overlays SET ${sets.join(", ")} WHERE spec_key = $spec_key`;
      db.prepare(sql).run(params);
    } else {
      if (expectedRevision !== 0) {
        throw new RevisionConflictError(specKey, expectedRevision, 0);
      }

      const cols = ["spec_key", "revision", "updated_at"];
      const vals = ["$spec_key", "1", "$updated_at"];
      const params: Params = {
        $spec_key: specKey,
        $updated_at: new Date().toISOString(),
      };

      for (const [key, value] of Object.entries(patch)) {
        const col = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        cols.push(col);
        vals.push(`$${col}`);
        params[`$${col}`] = typeof value === "object" && value !== null
          ? JSON.stringify(value)
          : (value as string | number | boolean | null) ?? null;
      }

      const sql = `INSERT INTO metadata_overlays (${cols.join(", ")}) VALUES (${vals.join(", ")})`;
      db.prepare(sql).run(params);
    }

    return getOverlay(db, specKey)!;
  })();

  return result;
}

/** Map a raw `metadata_overlays` row to the shape `resolveMetadata()` expects. */
export function overlayRowToMetadataOverlay(overlay: MetadataRow): MetadataOverlay {
  return {
    specKey: overlay.spec_key,
    title: overlay.title ?? undefined,
    summary: overlay.summary ?? undefined,
    owner: overlay.owner ?? undefined,
    theme: overlay.theme ?? undefined,
    tags: overlay.tags ? JSON.parse(overlay.tags) : undefined,
    targetRelease: overlay.target_release ?? undefined,
    retentionPolicy: overlay.retention_policy
      ? JSON.parse(overlay.retention_policy)
      : undefined,
    approvers: overlay.approvers ? JSON.parse(overlay.approvers) : undefined,
    implementationRef: overlay.implementation_ref ?? undefined,
    reviewedAt: overlay.reviewed_at ?? undefined,
    revision: overlay.revision,
    updatedAt: overlay.updated_at,
  };
}

export function deleteOverlay(db: Database, specKey: string): void {
  const stmt = db.prepare(
    "DELETE FROM metadata_overlays WHERE spec_key = $spec_key",
  );
  stmt.run({ $spec_key: specKey });
}
