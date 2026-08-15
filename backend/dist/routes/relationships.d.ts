import type { Database } from "bun:sqlite";
import { Elysia } from "elysia";
export declare function relationshipRoutes(deps: {
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
    specs: {
        ":id": {
            relationships: {
                post: {
                    body: {
                        note?: string | undefined;
                        type: never;
                        targetSpecKey: string;
                    };
                    params: {
                        id: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            code: string;
                            message: string;
                            id?: undefined;
                            createdAt?: undefined;
                        } | {
                            id: `${string}-${string}-${string}-${string}-${string}`;
                            createdAt: string;
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
    };
} & {
    specs: {
        ":id": {
            relationships: {
                ":relId": {
                    delete: {
                        body: unknown;
                        params: {
                            id: string;
                            relId: string;
                        };
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: null;
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
        };
    };
} & {
    specs: {
        ":id": {
            suggestions: {
                get: {
                    body: unknown;
                    params: {
                        id: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            suggestions: import("../db/queries/suggestions.js").SuggestionRow[];
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
    };
} & {
    suggestions: {
        ":id": {
            accept: {
                post: {
                    body: unknown;
                    params: {
                        id: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            code: string;
                            message: string;
                            relationshipId?: undefined;
                        } | {
                            relationshipId: `${string}-${string}-${string}-${string}-${string}`;
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
    };
} & {
    suggestions: {
        ":id": {
            reject: {
                post: {
                    body: unknown;
                    params: {
                        id: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            code: string;
                            message: string;
                            status?: undefined;
                        } | {
                            status: "rejected";
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
//# sourceMappingURL=relationships.d.ts.map