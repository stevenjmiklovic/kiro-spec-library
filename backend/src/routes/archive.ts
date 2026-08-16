import { Elysia, t } from "elysia";
import type { Database } from "bun:sqlite";
import type { ArchiverService } from "../services/archiver.js";
import { listSnapshots, type SnapshotRow } from "../db/queries/snapshots.js";
import { listSupersessionsByTargetKeys } from "../db/queries/relationships.js";

/** Attach `supersededBy` (successor spec key/title) per ADR-005's replacement for legal-hold. */
function attachSupersessionData(db: Database, snapshots: SnapshotRow[]) {
  const specKeys = snapshots.map((s) => s.spec_key);
  const supersessions = listSupersessionsByTargetKeys(db, specKeys);
  const byTarget = new Map(
    supersessions.map((s) => [
      s.target_spec_key,
      { specKey: s.successor_spec_key, title: s.successor_title },
    ]),
  );
  return snapshots.map((s) => ({
    ...s,
    supersededBy: byTarget.get(s.spec_key) ?? null,
  }));
}

export interface ArchiveDeps {
  db: Database;
  archiver: ArchiverService;
}

export function archiveRoutes(deps: ArchiveDeps) {
  const { db, archiver } = deps;

  return new Elysia({ prefix: "/archive" })
    .get(
      "/",
      ({ query }) => {
        const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200);
        const cursor = query.cursor || undefined;

        const snapshots = listSnapshots(db, { cursor, limit: limit + 1 });

        const hasMore = snapshots.length > limit;
        const page = hasMore ? snapshots.slice(0, limit) : snapshots;
        const nextCursor = hasMore ? page[page.length - 1]!.created_at : null;

        return { snapshots: attachSupersessionData(db, page), nextCursor };
      },
      {
        query: t.Object({
          cursor: t.Optional(t.String()),
          limit: t.Optional(t.String()),
        }),
      },
    )
    .get(
      "/:snapshotId",
      async ({ params, set }) => {
        try {
          const snapshot = await archiver.retrieveSnapshot(params.snapshotId);
          return snapshot;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          if (message.includes("not found")) {
            set.status = 404;
            return { code: "NOT_FOUND", message };
          }
          if (message.includes("purged")) {
            set.status = 410;
            return { code: "GONE", message };
          }
          set.status = 500;
          return { code: "INTERNAL_ERROR", message };
        }
      },
      {
        params: t.Object({
          snapshotId: t.String(),
        }),
      },
    )
    .delete(
      "/:snapshotId",
      async ({ params, body, set }) => {
        try {
          await archiver.purge(params.snapshotId, body.confirmation);
          return { purged: true };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          if (message.includes("not found")) {
            set.status = 404;
            return { code: "NOT_FOUND", message };
          }
          if (message.includes("not eligible") || message.includes("Invalid confirmation")) {
            set.status = 409;
            return { code: "CONFLICT", message };
          }
          set.status = 500;
          return { code: "INTERNAL_ERROR", message };
        }
      },
      {
        params: t.Object({
          snapshotId: t.String(),
        }),
        body: t.Object({
          confirmation: t.String(),
        }),
      },
    );
}
