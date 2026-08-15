/**
 * Agentic auto-population of metadata fields from repository context.
 *
 * Extracts approvers, implementation references, summaries, tags, and timestamps
 * by inspecting git history, spec file content, and file ownership patterns.
 * Returns only fields it can populate with reasonable confidence — callers
 * decide whether to persist or propose the results.
 */
import type { RawSpecArtifacts } from './normalizer.js';
export interface AutoPopulatedFields {
    /** Suggested approvers derived from git log (excludes the primary owner) */
    approvers?: string[];
    /** Link to implementation PR/branch if found in content */
    implementationRef?: string;
    /** Summary extracted from the first paragraph */
    summary?: string;
    /** Inferred tags from title, path, and content */
    tags?: string[];
    /** First commit touching the spec (ISO 8601) */
    createdAt?: string;
    /** Last commit date when stage is completed */
    completedAt?: string;
}
/**
 * Extract likely approvers from git log authors who have committed to this spec.
 * Identifies the primary committer (most commits) and excludes them.
 * Returns up to 5 unique secondary contributors.
 */
export declare function extractApprovers(repoPath: string, specPath: string): Promise<string[]>;
/**
 * Scan spec file contents for implementation references (PR/MR/issue URLs).
 * Checks content first, then falls back to .config.kiro tracking fields.
 */
export declare function extractImplementationRef(contents: Record<string, string>): string | undefined;
/**
 * Extract a summary from the first non-heading, non-list paragraph in
 * requirements.md or design.md. Truncates to 200 characters.
 */
export declare function extractSummary(contents: Record<string, string>): string | undefined;
/**
 * Infer tags from the spec title, path segments, and high-TF terms in content.
 * Returns at most 8 unique lowercase tags.
 */
export declare function inferTags(title: string, relativePath: string, contents: Record<string, string>): string[];
/**
 * Get the earliest commit date for files under the spec path.
 */
export declare function extractCreatedAt(repoPath: string, specPath: string): Promise<string | undefined>;
/**
 * Get the last commit date for files under the spec path — only meaningful
 * when the spec stage is 'completed'.
 */
export declare function extractCompletedAt(stage: string, repoPath: string, specPath: string): Promise<string | undefined>;
/**
 * Auto-populate metadata fields by inspecting git history and spec content.
 * Non-throwing: returns whatever fields were successfully extracted.
 *
 * @param raw - The raw spec artifacts (for access to relativePath and contents)
 * @param repoPath - Absolute path to the repository root
 * @param currentOwner - The currently assigned owner (used to exclude from approvers)
 */
export declare function autoPopulate(raw: RawSpecArtifacts, repoPath: string, currentOwner: string): Promise<AutoPopulatedFields>;
//# sourceMappingURL=auto-metadata.d.ts.map