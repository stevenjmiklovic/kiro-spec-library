import type { Database } from "bun:sqlite";
import { Elysia } from "elysia";
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
                type?: string | undefined;
                stage?: string | undefined;
                owner?: string | undefined;
                theme?: string | undefined;
                repository?: string | undefined;
                metadataComplete?: string | undefined;
                q?: string | undefined;
                limit?: string | undefined;
                offset?: string | undefined;
            };
            headers: unknown;
            response: {
                200: {
                    specs: {
                        projectName: string;
                        relationships: {
                            targetKey: string;
                            type: string;
                        }[];
                        suggestions: {
                            targetKey: string;
                            type: string;
                        }[];
                        key: string;
                        source_id: string;
                        spec_id: string;
                        type: string;
                        workflow: string;
                        title: string;
                        owner: string;
                        stage: string;
                        progress: number;
                        repository: string;
                        relative_path: string;
                        branch: string;
                        commit_hash: string;
                        is_dirty: number;
                        remote_url: string | null;
                        total_tasks: number;
                        completed_tasks: number;
                        content_digest: string;
                        indexed_at: string;
                    }[];
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
        "by-key": {
            get: {
                body: unknown;
                params: {};
                query: {
                    key: string;
                };
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
                            tags?: string[] | undefined;
                            owner?: string | undefined;
                            theme?: string | undefined;
                            title?: string | undefined;
                            summary?: string | undefined;
                            targetRelease?: string | undefined;
                            retentionPolicy?: {
                                customDate?: string | undefined;
                                type: string;
                            } | undefined;
                            approvers?: string[] | undefined;
                            implementationRef?: string | undefined;
                            reviewedAt?: string | undefined;
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