export interface ValidationResult {
    valid: boolean;
    reason?: string;
}
/**
 * Validate git command arguments.
 * Rejects forbidden flags and shell metacharacters.
 */
export declare function validateArgs(args: string[]): ValidationResult;
/**
 * Build a safe git fetch command array for a clone path and branch.
 * Always disables hooks, uses --no-tags, and limits depth.
 */
export declare function buildFetchCommand(clonePath: string, branch: string): string[];
/**
 * Build a safe git clone command array for a URL and destination.
 */
export declare function buildCloneCommand(url: string, destination: string, branch: string): string[];
//# sourceMappingURL=git-validator.d.ts.map