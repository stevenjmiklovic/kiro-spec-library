/**
 * Redact credentials and enforce size limit on MCP tool responses.
 */
export declare function sanitizeResponse(content: string): string;
/**
 * Sanitize a JSON-serializable object — stringify, redact, enforce size.
 */
export declare function sanitizeJsonResponse(data: unknown): string;
//# sourceMappingURL=redactor.d.ts.map