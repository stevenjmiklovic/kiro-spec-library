import { Elysia } from "elysia";
import type { Database } from "bun:sqlite";
export declare function auditRoutes(deps: {
    db: Database;
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
    audit: {
        get: {
            body: unknown;
            params: {};
            query: {
                after?: string | undefined;
                before?: string | undefined;
                limit?: string | undefined;
                specKey?: string | undefined;
                operation?: string | undefined;
                actor?: string | undefined;
            };
            headers: unknown;
            response: {
                200: {
                    code: string;
                    message: string;
                    events?: undefined;
                    total?: undefined;
                } | {
                    events: import("../db/queries/audit.js").AuditRow[];
                    total: number;
                    code?: undefined;
                    message?: undefined;
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
//# sourceMappingURL=audit.d.ts.map