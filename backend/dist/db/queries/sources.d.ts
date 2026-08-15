import type { Database } from "bun:sqlite";
export interface SourceRow {
    id: string;
    type: string;
    path: string | null;
    url: string | null;
    branch: string | null;
    web_url_template: string | null;
    added_at: string;
    last_scan_at: string | null;
    last_error: string | null;
    last_error_at: string | null;
}
export declare function listSources(db: Database): SourceRow[];
export declare function putSource(db: Database, source: {
    id: string;
    type: "local" | "remote";
    path?: string | null;
    url?: string | null;
    branch?: string | null;
    webUrlTemplate?: string | null;
    addedAt: string;
}): void;
export declare function deleteSource(db: Database, id: string): void;
//# sourceMappingURL=sources.d.ts.map