import type { Database } from "bun:sqlite";
import { Elysia } from "elysia";
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
export declare function knowledgeSyncRoutes(deps: {
    db: Database;
    dataDir: string;
}): Elysia<"", {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    typebox: {};
    error: {};
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
}, {
    "knowledge-sync": {
        post: {
            body: unknown;
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: import("../services/knowledge-sync.js").KnowledgeSyncResult;
            };
        };
    };
} & {
    "knowledge-sync": {
        spec: {
            post: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("../services/knowledge-sync.js").SingleSpecSyncResult | {
                        code: string;
                        message: string;
                    };
                };
            };
        };
    };
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}>;
//# sourceMappingURL=knowledge-sync.d.ts.map