import type { Database } from "bun:sqlite";
import type { FieldError } from "@kiro-spec-library/shared";
import { Elysia } from "elysia";
import type { ArchiverService } from "./services/archiver.js";
import type { ScannerService } from "./services/scanner.js";
export interface RouterDeps {
    db: Database;
    scanner: ScannerService;
    archiver: ArchiverService;
    ready: () => boolean;
    /** Application-owned storage root — needed by backup/restore for file-level DB swaps. */
    dataDir: string;
    /** Shared secret the MCP process authenticates with via the X-MCP-Token header. */
    mcpToken: string;
    /**
     * Whether to actually reject requests missing/mismatching X-MCP-Token.
     * Defaults off: the UI and MCP currently share this port with no
     * established way for the browser UI to obtain the token, so blanket
     * enforcement would break it until that's addressed separately. Opt in
     * via MCP_AUTH_ENFORCE=1.
     */
    enforceMcpAuth: boolean;
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
                        code: string;
                        message: string;
                        requestId: `${string}-${string}-${string}-${string}-${string}`;
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
                        code: string;
                        message: string;
                        requestId: `${string}-${string}-${string}-${string}-${string}`;
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
        "spec-detail": {
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
                        code: string;
                        message: string;
                        requestId: `${string}-${string}-${string}-${string}-${string}`;
                    } | {
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
                };
            };
        };
    };
} & {
    api: {
        "spec-suggestions": {
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
                        code: string;
                        message: string;
                        requestId: `${string}-${string}-${string}-${string}-${string}`;
                    } | {
                        suggestions: import("./db/queries/suggestions.js").SuggestionRow[];
                    };
                };
            };
        };
    };
} & {
    api: {
        "spec-proposals": {
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
                        code: string;
                        message: string;
                        requestId: `${string}-${string}-${string}-${string}-${string}`;
                    } | {
                        code: string;
                        message: string;
                        proposals?: undefined;
                    } | {
                        proposals: import("./db/queries/proposals.js").ProposalRow[];
                        code?: undefined;
                        message?: undefined;
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
    };
} & {
    api: {
        sync: {
            post: {
                body: {
                    sources: {
                        path?: string | undefined;
                        url?: string | undefined;
                        branch?: string | undefined;
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
                        path?: string | undefined;
                        url?: string | undefined;
                        branch?: string | undefined;
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
                        snapshots: {
                            supersededBy: {
                                specKey: string;
                                title: string;
                            } | null;
                            id: string;
                            spec_key: string;
                            created_at: string;
                            content_digest: string;
                            metadata_projection: string;
                            provenance: string;
                            retention_policy: string | null;
                            purged: number;
                            purged_at: string | null;
                        }[];
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
        specs: {
            "suggestions-by-key": {
                get: {
                    body: unknown;
                    params: {};
                    query: {
                        key: string;
                    };
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
            "proposals-by-key": {
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
                    limit?: string | undefined;
                    specKey?: string | undefined;
                    operation?: string | undefined;
                    actor?: string | undefined;
                    after?: string | undefined;
                    before?: string | undefined;
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
        backup: {
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
        backup: {
            restore: {
                post: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            code: string;
                            message: string;
                            restored?: undefined;
                            requiresRestart?: undefined;
                            safetyBackupPath?: undefined;
                        } | {
                            restored: boolean;
                            requiresRestart: boolean;
                            message: string;
                            safetyBackupPath: string;
                            code?: undefined;
                        };
                    };
                };
            };
        };
    };
} & {
    api: {
        export: {
            text: {
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
        };
    } & {
        export: {
            text: {
                apply: {
                    post: {
                        body: unknown;
                        params: {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: import("./services/text-export.js").ApplyTextExportResult | {
                                code: string;
                                message: string;
                            };
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
        } | {
            code: string;
            message: string;
            requestId: `${string}-${string}-${string}-${string}-${string}`;
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