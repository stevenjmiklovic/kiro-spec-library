import type { Database } from 'bun:sqlite';
import type { Source, ScanResult } from '@kiro-spec-library/shared';
export interface SpecDirectory {
    slug: string;
    absolutePath: string;
    relativePath: string;
    sourceId: string;
}
export declare class ScannerService {
    private db;
    private dataDir;
    private inFlight;
    constructor(db: Database, dataDir: string);
    triggerScan(sources: Source[]): Promise<ScanResult>;
    private executeScan;
    private scanSource;
    private refreshRemote;
    private discoverSpecDirs;
    private readArtifacts;
    private getProvenance;
    private execGit;
    private categorizeError;
}
//# sourceMappingURL=scanner.d.ts.map