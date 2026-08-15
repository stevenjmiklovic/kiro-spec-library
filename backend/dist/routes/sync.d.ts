import { Elysia } from "elysia";
import type { Database } from "bun:sqlite";
import type { ScannerService } from "../services/scanner.js";
export interface SyncDeps {
    db: Database;
    scanner: ScannerService;
}
export declare function syncRoutes(deps: SyncDeps): Elysia<"/sync", {
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
    sync: {
        post: {
            body: {
                sources: {
                    path?: string | undefined;
                    branch?: string | undefined;
                    url?: string | undefined;
                    webUrlTemplate?: string | undefined;
                    type: "local" | "remote";
                    id: string;
                    addedAt: string;
                }[];
            };
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: {
                    runId: string;
                };
                422: {
                    type: "validation";
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
            };
        };
    };
} & {
    sync: {
        ":runId": {
            get: {
                body: unknown;
                params: {
                    runId: string;
                };
                query: unknown;
                headers: unknown;
                response: {
                    200: import("../db/queries/scan-history.js").ScanRow | {
                        code: string;
                        message: string;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
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
//# sourceMappingURL=sync.d.ts.map