import { Elysia } from "elysia";
import type { Database } from "bun:sqlite";
export interface SettingsDeps {
    db: Database;
}
export declare function settingsRoutes(deps: SettingsDeps): Elysia<"/settings", {
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
    settings: {
        sources: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        sources: import("../db/queries/sources.js").SourceRow[];
                    };
                };
            };
        };
    };
} & {
    settings: {
        sources: {
            put: {
                body: {
                    path?: string | undefined;
                    branch?: string | undefined;
                    url?: string | undefined;
                    webUrlTemplate?: string | undefined;
                    addedAt?: string | undefined;
                    type: "local" | "remote";
                    id: string;
                }[];
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        code: string;
                        message: string;
                        sources?: undefined;
                    } | {
                        sources: import("../db/queries/sources.js").SourceRow[];
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
//# sourceMappingURL=settings.d.ts.map