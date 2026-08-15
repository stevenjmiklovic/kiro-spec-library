// @kiro-spec-library/shared — Credential redaction utility

const REDACTED = "[REDACTED]";

/**
 * Patterns matched against content for credential-like values.
 * Order matters: more specific patterns first to avoid partial matches.
 */
const PATTERNS: readonly RegExp[] = [
  // Private keys (PEM blocks)
  /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/g,

  // AWS access key IDs
  /(?:AKIA|ASIA)[A-Z0-9]{16}/g,

  // AWS secret access keys (40 char base64-ish after known prefix)
  /(?:aws_secret_access_key|secret_access_key)\s*[:=]\s*['"]?[A-Za-z0-9/+=]{40}['"]?/gi,

  // GitHub PATs (classic and fine-grained)
  /gh[ps]_[A-Za-z0-9_]{36,}/g,
  /github_pat_[A-Za-z0-9_]{22,}/g,

  // Bearer tokens
  /Bearer\s+[\w\-.~+/]+=*/g,

  // Generic API keys / secrets (key=value or key: value patterns)
  /(?:api[_-]?key|api[_-]?secret|secret[_-]?key|access[_-]?token|auth[_-]?token)\s*[:=]\s*['"]?[\w\-/.~+]{20,}['"]?/gi,

  // Password fields
  /(?:password|passwd|pwd)\s*[:=]\s*['"]?[^\s'"]{8,}['"]?/gi,

  // Connection strings with embedded credentials
  /(?:mongodb|postgres|mysql|redis|amqp):\/\/[^:]+:[^@]+@[^\s'"]+/gi,
] as const;

/**
 * Redact credential-like values from content.
 * Returns sanitized string with matches replaced by [REDACTED].
 */
export function redact(content: string): string {
  let result = content;
  for (const pattern of PATTERNS) {
    // Reset lastIndex for global regexes reused across calls
    pattern.lastIndex = 0;
    result = result.replace(pattern, REDACTED);
  }
  return result;
}

/**
 * Check whether content contains potential credentials.
 * Cheaper than full redaction when you just need a boolean.
 */
export function containsCredentials(content: string): boolean {
  for (const pattern of PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) {
      return true;
    }
  }
  return false;
}
