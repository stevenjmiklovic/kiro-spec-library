/**
 * Redact credential-like values from content.
 * Returns sanitized string with matches replaced by [REDACTED].
 */
export declare function redact(content: string): string;
/**
 * Check whether content contains potential credentials.
 * Cheaper than full redaction when you just need a boolean.
 */
export declare function containsCredentials(content: string): boolean;
//# sourceMappingURL=redactor.d.ts.map