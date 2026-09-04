import type { Database } from 'bun:sqlite';
import type { Source, ScanResult } from '@kiro-spec-library/shared';
import type { ArchiverService } from './archiver.js';
export interface SpecDirectory {
    slug: string;
    absolutePath: string;
    relativePath: string;
    sourceId: string;
}
export declare class ScannerService {
    private db;
    private dataDir;
    private archiver;
    private inFlight;
    constructor(db: Database, dataDir: string, archiver: ArchiverService);
    triggerScan(sources: Source[]): Promise<ScanResult>;
    private executeScan;
    /** Generate and persist cross-repo suggestions for this scan cycle's full corpus. */
    private generateSuggestions;
    private scanSource;
    private refreshRemote;
    private discoverSpecDirs;
    private readArtifacts;
    private getProvenance;
    private execGit;
    private categorizeError;
}
//# sourceMappingURL=scanner.d.ts.map