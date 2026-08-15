import { Elysia } from "elysia";
import type { Database } from "bun:sqlite";
import type { ArchiverService } from "../services/archiver.js";
export interface ArchiveDeps {
    db: Database;
    archiver: ArchiverService;
}
export declare function archiveRoutes(deps: ArchiveDeps): Elysia<"/archive", {
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
                    snapshots: import("../db/queries/snapshots.js").SnapshotRow[];
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
//# sourceMappingURL=archive.d.ts.map