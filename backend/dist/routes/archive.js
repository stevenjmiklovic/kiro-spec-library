import { Elysia, t } from "elysia";
import { listSnapshots } from "../db/queries/snapshots.js";
export function archiveRoutes(deps) {
    const { db, archiver } = deps;
    return new Elysia({ prefix: "/archive" })
        .get("/", ({ query }) => {
        const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200);
        const cursor = query.cursor || undefined;
        const snapshots = listSnapshots(db, { cursor, limit: limit + 1 });
        const hasMore = snapshots.length > limit;
        const page = hasMore ? snapshots.slice(0, limit) : snapshots;
        const nextCursor = hasMore ? page[page.length - 1].created_at : null;
        return { snapshots: page, nextCursor };
    }, {
        query: t.Object({
            cursor: t.Optional(t.String()),
            limit: t.Optional(t.String()),
        }),
    })
        .get("/:snapshotId", async ({ params, set }) => {
        try {
            const snapshot = await archiver.retrieveSnapshot(params.snapshotId);
            return snapshot;
        }
        catch (err) {
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
    }, {
        params: t.Object({
            snapshotId: t.String(),
        }),
    })
        .delete("/:snapshotId", async ({ params, body, set }) => {
        try {
            await archiver.purge(params.snapshotId, body.confirmation);
            return { purged: true };
        }
        catch (err) {
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
    }, {
        params: t.Object({
            snapshotId: t.String(),
        }),
        body: t.Object({
            confirmation: t.String(),
        }),
    });
}
