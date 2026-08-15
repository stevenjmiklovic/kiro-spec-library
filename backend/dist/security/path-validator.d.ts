export interface ValidationResult {
    valid: boolean;
    reason?: string;
}
/**
 * Validate a file path relative to a source root.
 * Rejects traversal, symlink escapes, credential paths, oversized files, and root paths.
 */
export declare function validatePath(filePath: string, sourceRoot: string): Promise<ValidationResult>;
/**
 * Synchronous path check (no symlink resolution or size check).
 * Use for quick pre-filtering before async validation.
 */
export declare function validatePathSync(filePath: string, sourceRoot: string): ValidationResult;
//# sourceMappingURL=path-validator.d.ts.map