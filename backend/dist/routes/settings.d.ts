import type { Database } from "bun:sqlite";
import { Elysia } from "elysia";
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
                        sources: import("@kiro-spec-library/shared").Source[];
                    };
                };
            };
        };
    };
} & {
    settings: {
        browse: {
            get: {
                body: unknown;
                params: {};
                query: {
                    path?: string | undefined;
                };
                headers: unknown;
                response: {
                    200: {
                        code: string;
                        message: string;
                        path?: undefined;
                        name?: undefined;
                        parent?: undefined;
                        home?: undefined;
                        hasSpecs?: undefined;
                        directories?: undefined;
                    } | {
                        path: string;
                        name: string;
                        parent: string | null;
                        home: string;
                        hasSpecs: boolean;
                        directories: {
                            name: string;
                            path: string;
                            hasSpecs: boolean;
                        }[];
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
} & {
    settings: {
        sources: {
            put: {
                body: {
                    url?: string | undefined;
                    path?: string | undefined;
                    branch?: string | undefined;
                    webUrlTemplate?: string | undefined;
                    addedAt?: string | undefined;
                    id: string;
                    type: "remote" | "local";
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
                        sources: import("@kiro-spec-library/shared").Source[];
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