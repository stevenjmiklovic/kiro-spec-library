import { Elysia } from "elysia";
import type { Database } from "bun:sqlite";
export declare function proposalRoutes(deps: {
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
            proposals: {
                get: {
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
                            proposals?: undefined;
                        } | {
                            proposals: import("../db/queries/proposals.js").ProposalRow[];
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
            proposals: {
                post: {
                    body: {
                        expectedRevision?: number | undefined;
                        rationale?: string | undefined;
                        source?: string | undefined;
                        relationshipAdds?: {
                            note?: string | undefined;
                            type: string;
                            targetSpecId: string;
                        }[] | undefined;
                        patch: {
                            [x: string]: unknown;
                        };
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
                            status?: undefined;
                        } | {
                            id: string;
                            status: string;
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
    proposals: {
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
                            id?: undefined;
                            status?: undefined;
                            resolved_at?: undefined;
                        } | {
                            id: string;
                            status: string;
                            resolved_at: string | null;
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
    proposals: {
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
                            id?: undefined;
                            status?: undefined;
                            resolved_at?: undefined;
                        } | {
                            id: string;
                            status: string;
                            resolved_at: string | null;
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
//# sourceMappingURL=proposals.d.ts.map