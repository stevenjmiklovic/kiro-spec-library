import { Elysia } from "elysia";
import type { Database } from "bun:sqlite";
import type { FieldError } from "@kiro-spec-library/shared";
import type { ScannerService } from "./services/scanner.js";
import type { ArchiverService } from "./services/archiver.js";
export interface RouterDeps {
    db: Database;
    scanner: ScannerService;
    archiver: ArchiverService;
    ready: () => boolean;
}
export declare function createRouter(deps: RouterDeps): Elysia<"/api", {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    typebox: {};
    error: {};
} & {
    typebox: {};
    error: {};
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
} & {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
}, {
    api: {};
} & {
    api: {
        health: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        code: string;
                        message: string;
                        details: FieldError[];
                        requestId: `${string}-${string}-${string}-${string}-${string}`;
                    } | {
                        code: string;
                        message: string;
                        requestId: `${string}-${string}-${string}-${string}-${string}`;
                        details?: undefined;
                    } | {
                        status: "starting";
                    } | {
                        status: "ok";
                    };
                };
            };
        };
    };
} & {
    api: {
        bootstrap: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        code: string;
                        message: string;
                        details: FieldError[];
                        requestId: `${string}-${string}-${string}-${string}-${string}`;
                    } | {
                        code: string;
                        message: string;
                        requestId: `${string}-${string}-${string}-${string}-${string}`;
                        details?: undefined;
                    } | {
                        status: "starting";
                        specCount?: undefined;
                        archiveCount?: undefined;
                        lastSyncAt?: undefined;
                        syncStatus?: undefined;
                        facets?: undefined;
                    } | {
                        specCount: number;
                        archiveCount: number;
                        lastSyncAt: string | null;
                        syncStatus: string;
                        facets: {
                            types: string[];
                            stages: string[];
                            themes: string[];
                            owners: string[];
                            repositories: string[];
                        };
                        status?: undefined;
                    };
                };
            };
        };
    };
} & {
    api: {
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
                        specs: import("./db/queries/specs.js").SpecRow[];
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
                            spec: import("./db/queries/specs.js").SpecRow;
                            metadata: import("./services/metadata.js").ResolvedMetadata;
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
    };
} & {
    api: {
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
                        200: import("./db/queries/scan-history.js").ScanRow | {
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
    };
} & {
    api: {
        settings: {
            sources: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            sources: import("./db/queries/sources.js").SourceRow[];
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
                            sources: import("./db/queries/sources.js").SourceRow[];
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
    api: {
        archive: {
            get: {
                body: unknown;
                params: {};
                query: {
                    limit?: string | undefined;
                    cursor?: string | undefined;
                };
                headers: unknown;
                response: {
                    200: {
                        snapshots: import("./db/queries/snapshots.js").SnapshotRow[];
                        nextCursor: string | null;
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
        archive: {
            ":snapshotId": {
                get: {
                    body: unknown;
                    params: {
                        snapshotId: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@kiro-spec-library/shared").Snapshot | {
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
    } & {
        archive: {
            ":snapshotId": {
                delete: {
                    body: {
                        confirmation: string;
                    };
                    params: {
                        snapshotId: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            purged: boolean;
                            code?: undefined;
                            message?: undefined;
                        } | {
                            code: string;
                            message: string;
                            purged?: undefined;
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
    api: {
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
                                suggestions: import("./db/queries/suggestions.js").SuggestionRow[];
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
    };
} & {
    api: {
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
                                proposals: import("./db/queries/proposals.js").ProposalRow[];
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
    };
} & {
    api: {
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
                        events: import("./db/queries/audit.js").AuditRow[];
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
    };
} & {
    api: {
        export: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: Response;
                };
            };
        };
    } & {
        import: {
            preview: {
                post: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("./routes/import-export.js").ImportPreviewResult | {
                            valid: boolean;
                            specCount: number;
                            changes: {
                                add: number;
                                modify: number;
                                remove: number;
                            };
                            errors: {
                                path: string;
                                message: string;
                            }[];
                        };
                    };
                };
            };
        };
    } & {
        import: {
            apply: {
                post: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("./routes/import-export.js").ImportApplyResult | {
                            code: string;
                            message: string;
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
    response: {
        200: {
            code: string;
            message: string;
            details: FieldError[];
            requestId: `${string}-${string}-${string}-${string}-${string}`;
        } | {
            code: string;
            message: string;
            requestId: `${string}-${string}-${string}-${string}-${string}`;
            details?: undefined;
        };
    };
} & {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}>;
//# sourceMappingURL=router.d.ts.map