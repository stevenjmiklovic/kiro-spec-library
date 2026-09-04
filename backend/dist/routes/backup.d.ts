import { Elysia } from "elysia";
import type { Database } from "bun:sqlite";
export declare function backupRoutes(deps: {
    db: Database;
    dataDir: string;
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
//# sourceMappingURL=backup.d.ts.map