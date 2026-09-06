import { describe, expect, test } from "bun:test";
import { titleCaseSlug, titleCaseWord } from "../../shared/src/text.js";

describe("titleCaseWord", () => {
  test("capitalizes an ordinary word", () => {
    expect(titleCaseWord("budget")).toBe("Budget");
  });

  test("preserves known acronyms uppercase regardless of input casing", () => {
    expect(titleCaseWord("llm")).toBe("LLM");
    expect(titleCaseWord("SQL")).toBe("SQL");
    expect(titleCaseWord("Crdt")).toBe("CRDT");
  });

  test("uses mixed-case form for OAuth-style initialisms", () => {
    expect(titleCaseWord("oauth")).toBe("OAuth");
  });

  test("returns empty string unchanged", () => {
    expect(titleCaseWord("")).toBe("");
  });
});

describe("titleCaseSlug", () => {
  test("keeps acronyms uppercase in a full slug (the reported bug)", () => {
    expect(titleCaseSlug("llm-budget-control")).toBe("LLM Budget Control");
    expect(titleCaseSlug("sql-injection-in-clause-fix")).toBe("SQL Injection In Clause Fix");
    expect(titleCaseSlug("flaky-crdt-signal-synthesis-test")).toBe(
      "Flaky CRDT Signal Synthesis Test",
    );
  });

  test("accepts space-delimited input and collapses repeats", () => {
    expect(titleCaseSlug("api  gateway")).toBe("API Gateway");
  });

  test("title-cases a slug with no acronyms normally", () => {
    expect(titleCaseSlug("harbormaster-personality")).toBe("Harbormaster Personality");
  });
});
