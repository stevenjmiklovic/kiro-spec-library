import { Elysia } from "elysia";
import { recordEvent } from "../services/audit.js";
import { syncOneSpecToKnowledgeLibrary, syncSpecsToKnowledgeLibrary, } from "../services/knowledge-sync.js";
/**
 * POST /api/knowledge-sync — push every indexed spec into the KiroCrew
 * Knowledge Library (graph-based cross-document store). Idempotent: unchanged
 * specs are refused as duplicates by the library, changed specs are replaced.
 *
 * POST /api/knowledge-sync/spec {key} — push ONE spec, for the UI's per-spec
 * "Send to Knowledge Library" button.
 *
 * When the gateway has knowledge.auto_add_documents turned off, the batch
 * route sets `disabled: true` (409) and the single-spec route returns status
 * "disabled" (409) — both with a body explaining what to enable, so the UI can
 * render an actionable message rather than a bare failure.
 */
export function knowledgeSyncRoutes(deps) {
    const { db, dataDir } = deps;
    return new Elysia({ prefix: "" })
        .post("/knowledge-sync", async ({ set }) => {
        const result = await syncSpecsToKnowledgeLibrary(db, { dataDir });
        recordEvent(db, "knowledge_sync_run");
        if (result.disabled) {
            // Not an error status — the caller asked to sync and we're telling them
            // the one prerequisite. 409 Conflict communicates "your request is
            // valid but the current config forbids it" without masquerading as a
            // 5xx the UI would show as a crash.
            set.status = 409;
        }
        return result;
    })
        .post("/knowledge-sync/spec", async ({ body, set }) => {
        const key = body?.key;
        if (typeof key !== "string" || key.length === 0) {
            set.status = 400;
            return { code: "BAD_REQUEST", message: "key required" };
        }
        const result = await syncOneSpecToKnowledgeLibrary(db, key, { dataDir });
        if (result === null) {
            set.status = 404;
            return { code: "NOT_FOUND", message: `Spec '${key}' not found` };
        }
        recordEvent(db, "knowledge_sync_run");
        if (result.status === "disabled")
            set.status = 409;
        else if (result.status === "failed")
            set.status = 502;
        return result;
    });
}
