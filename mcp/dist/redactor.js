// MCP-specific credential redaction and response size enforcement
import { redact } from "@kiro-spec-library/shared";
/** Maximum response size in bytes (64 KB) */
const MAX_RESPONSE_BYTES = 64 * 1024;
const TRUNCATION_NOTICE = "\n\n[Content truncated — response exceeded 64 KB limit]";
/**
 * Redact credentials and enforce size limit on MCP tool responses.
 */
export function sanitizeResponse(content) {
    // First, redact credentials
    let sanitized = redact(content);
    // Then enforce size cap
    const bytes = Buffer.byteLength(sanitized, "utf-8");
    if (bytes > MAX_RESPONSE_BYTES) {
        // Truncate to fit within limit (accounting for notice)
        const maxContentBytes = MAX_RESPONSE_BYTES - Buffer.byteLength(TRUNCATION_NOTICE, "utf-8");
        sanitized = truncateToByteLimit(sanitized, maxContentBytes) + TRUNCATION_NOTICE;
    }
    return sanitized;
}
/**
 * Truncate a string to fit within a byte limit without splitting multi-byte characters.
 */
function truncateToByteLimit(str, maxBytes) {
    const buf = Buffer.from(str, "utf-8");
    if (buf.length <= maxBytes)
        return str;
    // Find the last valid character boundary before maxBytes
    let end = maxBytes;
    while (end > 0 && (buf[end] & 0xc0) === 0x80) {
        end--;
    }
    return buf.subarray(0, end).toString("utf-8");
}
/**
 * Sanitize a JSON-serializable object — stringify, redact, enforce size.
 */
export function sanitizeJsonResponse(data) {
    const json = JSON.stringify(data, null, 2);
    return sanitizeResponse(json);
}
