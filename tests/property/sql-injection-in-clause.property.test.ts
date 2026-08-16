/**
 * Property-based tests — SQL Injection IN Clause Fix
 *
 * Property 1: Bug Condition — SQL String Interpolation in IN Clauses
 *
 * For any non-empty specKeys array passed to `listBySourceKeys` or
 * `listPendingBySourceKeys`, the SQL string used SHALL contain only `?`
 * placeholders (no `$k` patterns) and parameters SHALL be passed as a
 * positional array (not a named object).
 *
 * This test encodes the EXPECTED (fixed) behavior. On unfixed code it will
 * FAIL — that failure confirms the bug exists. After the fix is applied,
 * this same test will PASS, confirming the bug is resolved.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3
 */
import { describe, test, expect } from "bun:test";
import fc from "fast-check";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ─── Source paths ────────────────────────────────────────────────────────────

const RELATIONSHIPS_PATH = resolve(
  import.meta.dir,
  "../../backend/src/db/queries/relationships.ts",
);
const SUGGESTIONS_PATH = resolve(
  import.meta.dir,
  "../../backend/src/db/queries/suggestions.ts",
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract the function body for a named function from a source file.
 * Matches `export function <name>(` and captures everything until the
 * closing brace at the same indentation level.
 */
function extractFunctionBody(source: string, functionName: string): string {
  const regex = new RegExp(
    `export function ${functionName}\\b[^{]*\\{`,
    "m",
  );
  const match = regex.exec(source);
  if (!match) throw new Error(`Function ${functionName} not found in source`);

  const startIdx = match.index + match[0].length;
  let depth = 1;
  let i = startIdx;
  while (i < source.length && depth > 0) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") depth--;
    i++;
  }
  return source.slice(startIdx, i - 1);
}

/**
 * Simulate what the function does with a given specKeys array:
 * builds placeholders the same way the source code does, and returns
 * the resulting placeholder string and parameter style.
 *
 * This replicates the logic to verify what SQL would be constructed.
 */
function simulatePlaceholderConstruction(
  functionBody: string,
  specKeys: string[],
): { placeholders: string; usesNamedParams: boolean } {
  // Detect the pattern: uses $k{i} named placeholders
  const usesNamedPattern = /\$k\$\{i\}|\$k\${i}|`\$k\${i}`|\$k\d/.test(functionBody)
    || /map\(\(_, i\) => `\$k\$\{i\}`\)/.test(functionBody);

  // Detect positional ? pattern
  const usesPositionalPattern = /map\(\(\) => "\?"\)/.test(functionBody)
    || /map\(\(\) => '\?'\)/.test(functionBody);

  let placeholders: string;
  if (usesNamedPattern) {
    // Simulates current (buggy) behavior
    placeholders = specKeys.map((_, i) => `$k${i}`).join(", ");
  } else if (usesPositionalPattern) {
    // Simulates fixed behavior
    placeholders = specKeys.map(() => "?").join(", ");
  } else {
    // Unknown pattern
    placeholders = "UNKNOWN";
  }

  // Detect named params object usage
  const usesNamedParams =
    functionBody.includes("Record<string, string>") ||
    functionBody.includes("params[`$k${i}`]") ||
    (functionBody.includes("params") && functionBody.includes("forEach"));

  return { placeholders, usesNamedParams };
}

// ─── Property 1: Bug Condition — No String Interpolation in SQL ──────────────

describe("Property 1: Bug Condition — SQL String Interpolation in IN Clauses", () => {
  const relationshipsSource = readFileSync(RELATIONSHIPS_PATH, "utf-8");
  const suggestionsSource = readFileSync(SUGGESTIONS_PATH, "utf-8");

  const listBySourceKeysBody = extractFunctionBody(
    relationshipsSource,
    "listBySourceKeys",
  );
  const listPendingBySourceKeysBody = extractFunctionBody(
    suggestionsSource,
    "listPendingBySourceKeys",
  );

  // Arbitrary spec key: alphanumeric with dashes and dots, realistic format
  const arbSpecKey = fc
    .stringMatching(/^[a-z][a-z0-9._-]{2,30}$/)
    .filter((s) => s.length >= 3);

  test("listBySourceKeys uses only ? placeholders for all non-empty specKeys arrays", () => {
    /**
     * Validates: Requirements 2.1, 2.3
     */
    fc.assert(
      fc.property(
        fc.array(arbSpecKey, { minLength: 1, maxLength: 50 }),
        (specKeys) => {
          const { placeholders, usesNamedParams } =
            simulatePlaceholderConstruction(listBySourceKeysBody, specKeys);

          // The SQL placeholders should be only ? characters
          const expectedPlaceholders = specKeys.map(() => "?").join(", ");
          expect(placeholders).toBe(expectedPlaceholders);

          // Parameters should NOT be named (no Record<string, string> object)
          expect(usesNamedParams).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  test("listPendingBySourceKeys uses only ? placeholders for all non-empty specKeys arrays", () => {
    /**
     * Validates: Requirements 2.2, 2.3
     */
    fc.assert(
      fc.property(
        fc.array(arbSpecKey, { minLength: 1, maxLength: 50 }),
        (specKeys) => {
          const { placeholders, usesNamedParams } =
            simulatePlaceholderConstruction(
              listPendingBySourceKeysBody,
              specKeys,
            );

          // The SQL placeholders should be only ? characters
          const expectedPlaceholders = specKeys.map(() => "?").join(", ");
          expect(placeholders).toBe(expectedPlaceholders);

          // Parameters should NOT be named (no Record<string, string> object)
          expect(usesNamedParams).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  test("listBySourceKeys SQL template contains no $k pattern interpolation", () => {
    /**
     * Validates: Requirements 1.1, 1.3
     *
     * Static check: the function body itself should not contain
     * the named-placeholder construction pattern.
     */
    // Assert no `$k${i}` template literal pattern exists in the function
    expect(listBySourceKeysBody).not.toMatch(/\$k\$\{i\}/);
    // Assert no Record<string, string> params object
    expect(listBySourceKeysBody).not.toMatch(/Record<string,\s*string>/);
    // Assert no params[`$k${i}`] assignment
    expect(listBySourceKeysBody).not.toMatch(/params\[`\$k\$\{i\}`\]/);
  });

  test("listPendingBySourceKeys SQL template contains no $k pattern interpolation", () => {
    /**
     * Validates: Requirements 1.2, 1.3
     *
     * Static check: the function body itself should not contain
     * the named-placeholder construction pattern.
     */
    // Assert no `$k${i}` template literal pattern exists in the function
    expect(listPendingBySourceKeysBody).not.toMatch(/\$k\$\{i\}/);
    // Assert no Record<string, string> params object
    expect(listPendingBySourceKeysBody).not.toMatch(/Record<string,\s*string>/);
    // Assert no params[`$k${i}`] assignment
    expect(listPendingBySourceKeysBody).not.toMatch(/params\[`\$k\$\{i\}`\]/);
  });
});
