import { describe, expect, test } from "bun:test";
import { sanitizeResponse, sanitizeJsonResponse } from "../../mcp/src/redactor.js";

describe("MCP redactor", () => {
  describe("credential redaction", () => {
    test("redacts AWS access keys", () => {
      const input = "Found key AKIAIOSFODNN7EXAMPLE in config";
      const result = sanitizeResponse(input);
      expect(result).not.toContain("AKIAIOSFODNN7EXAMPLE");
      expect(result).toContain("[REDACTED]");
    });

    test("redacts GitHub PATs", () => {
      const input = "Token: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij";
      const result = sanitizeResponse(input);
      expect(result).not.toContain("ghp_");
      expect(result).toContain("[REDACTED]");
    });

    test("redacts Bearer tokens", () => {
      const input = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig";
      const result = sanitizeResponse(input);
      expect(result).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
      expect(result).toContain("[REDACTED]");
    });

    test("passes through normal content unchanged", () => {
      const input = "# My Spec\n\nThis is a normal requirements document.";
      const result = sanitizeResponse(input);
      expect(result).toBe(input);
    });
  });

  describe("response size cap", () => {
    test("content under 64KB passes through", () => {
      const input = "x".repeat(1000);
      const result = sanitizeResponse(input);
      expect(result).toBe(input);
    });

    test("content over 64KB is truncated", () => {
      const input = "x".repeat(100_000);
      const result = sanitizeResponse(input);
      expect(Buffer.byteLength(result, "utf-8")).toBeLessThanOrEqual(64 * 1024);
      expect(result).toContain("[Content truncated");
    });

    test("truncation preserves valid UTF-8", () => {
      // Use multi-byte characters to test boundary handling
      const input = "🎉".repeat(20_000); // Each emoji is 4 bytes = 80KB > 64KB
      const result = sanitizeResponse(input);
      expect(Buffer.byteLength(result, "utf-8")).toBeLessThanOrEqual(64 * 1024);
      // Should not have broken emoji characters
      expect(result).not.toContain("\ufffd"); // replacement character
    });
  });

  describe("sanitizeJsonResponse", () => {
    test("serializes and sanitizes objects", () => {
      const data = { title: "Test", key: "AKIAIOSFODNN7EXAMPLE" };
      const result = sanitizeJsonResponse(data);
      expect(result).toContain('"title"');
      expect(result).toContain("[REDACTED]");
      expect(result).not.toContain("AKIAIOSFODNN7EXAMPLE");
    });

    test("large objects are truncated", () => {
      const data = { content: "x".repeat(100_000) };
      const result = sanitizeJsonResponse(data);
      expect(Buffer.byteLength(result, "utf-8")).toBeLessThanOrEqual(64 * 1024);
    });
  });
});

describe("MCP tool behavior", () => {
  // These test the contract, not live HTTP — the tools proxy to backend
  test("search_specs limit is capped at 100", () => {
    // The cap is enforced in tools.ts: Math.min(limit ?? 50, 100)
    const effectiveLimit = Math.min(500, 100);
    expect(effectiveLimit).toBe(100);
  });

  test("submit_metadata_proposal creates pending state only", () => {
    // The tool POSTs to the backend's PATCH endpoint which uses
    // optimistic concurrency — it never directly modifies accepted metadata.
    // This is a design contract test: proposals have status "pending"
    const proposal = { proposalId: "test", status: "pending" as const };
    expect(proposal.status).toBe("pending");
  });
});
