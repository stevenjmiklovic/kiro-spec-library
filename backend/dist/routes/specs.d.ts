import { Elysia } from "elysia";
import type { Database } from "bun:sqlite";
import { type SpecRow } from "../db/queries/specs.js";
export declare function specRoutes(deps: {
    db: Database;
}): Elysia<"/specs", {
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
        get: {
            body: unknown;
            params: {};
            query: {
                limit?: string | undefined;
                offset?: string | undefined;
                type?: string | undefined;
                stage?: string | undefined;
                owner?: string | undefined;
                theme?: string | undefined;
                repository?: string | undefined;
                metadataComplete?: string | undefined;
            };
            headers: unknown;
            response: {
                200: {
                    specs: SpecRow[];
                    total: number;
                    limit: number;
                    offset: number;
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
    specs: {
        ":id": {
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
                        spec?: undefined;
                        metadata?: undefined;
                        revision?: undefined;
                    } | {
                        spec: SpecRow;
                        metadata: import("../services/metadata.js").ResolvedMetadata;
                        revision: number;
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
    specs: {
        ":id": {
            metadata: {
                patch: {
                    body: {
                        expectedRevision: number;
                        patch: {
                            summary?: string | undefined;
                            tags?: string[] | undefined;
                            owner?: string | undefined;
                            theme?: string | undefined;
                            title?: string | undefined;
                            retentionPolicy?: {
                                customDate?: string | undefined;
                                type: string;
                            } | undefined;
                            targetRelease?: string | undefined;
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
                            revision?: undefined;
                            updatedAt?: undefined;
                            expected?: undefined;
                            actual?: undefined;
                        } | {
                            revision: number;
                            updatedAt: string;
                            code?: undefined;
                            message?: undefined;
                            expected?: undefined;
                            actual?: undefined;
                        } | {
                            code: string;
                            message: string;
                            expected: number;
                            actual: number;
                            revision?: undefined;
                            updatedAt?: undefined;
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
//# sourceMappingURL=specs.d.ts.map