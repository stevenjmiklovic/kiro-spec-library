import { Elysia } from "elysia";
import type { Database } from "bun:sqlite";
export interface ImportPreviewResult {
    valid: boolean;
    specCount: number;
    changes: {
        add: number;
        modify: number;
        remove: number;
    };
}
export interface ImportApplyResult {
    applied: number;
}
export declare function importExportRoutes(deps: {
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
                    200: ImportPreviewResult | {
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
                    200: ImportApplyResult | {
                        code: string;
                        message: string;
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
//# sourceMappingURL=import-export.d.ts.map