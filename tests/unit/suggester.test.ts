import { describe, expect, test } from "bun:test";
import {
  buildTfIdfVectors,
  cosineSimilarity,
  extractMarkdownLinks,
  isProximate,
  filterRejected,
  generateAll,
  type TfIdfVector,
} from "../../backend/src/services/suggester.js";
import type { NormalizedSpec, Suggestion } from "../../shared/src/types.js";
import type { ResolvedMetadata } from "../../backend/src/services/metadata.js";

function makeSpec(overrides: Partial<NormalizedSpec> & { key: string }): NormalizedSpec {
  return {
    sourceId: "src1",
    specId: overrides.key,
    type: "feature",
    workflow: "requirements-first",
    title: "Test Spec",
    owner: "unowned",
    stage: "new",
    progress: 33,
    provenance: {
      repository: "/repo",
      relativePath: `.kiro/specs/${overrides.key}`,
      branch: "main",
      commitHash: "abc123",
      isDirty: false,
    },
    artifacts: { "requirements.md": true },
    taskCounts: { total: 0, completed: 0 },
    contentDigest: "digest-" + overrides.key,
    indexedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeMeta(overrides: Partial<ResolvedMetadata> = {}): ResolvedMetadata {
  return {
    title: "Test",
    owner: "someone",
    tags: [],
    approvers: [],
    ...overrides,
  };
}

describe("TF-IDF vectors", () => {
  test("builds vectors for multiple documents", () => {
    const docs = new Map([
      ["a", "the quick brown fox"],
      ["b", "the lazy brown dog"],
    ]);
    const vectors = buildTfIdfVectors(docs);
    expect(vectors.size).toBe(2);
    expect(vectors.get("a")!.size).toBeGreaterThan(0);
    expect(vectors.get("b")!.size).toBeGreaterThan(0);
  });

  test("empty corpus returns empty map", () => {
    const vectors = buildTfIdfVectors(new Map());
    expect(vectors.size).toBe(0);
  });

  test("single document has zero IDF for all terms", () => {
    // With only one doc, log(1/1) = 0, so all TF-IDF values are 0
    const docs = new Map([["a", "hello world test"]]);
    const vectors = buildTfIdfVectors(docs);
    const vec = vectors.get("a")!;
    // All terms appear in 1 of 1 docs: IDF = log(1/1) = 0
    expect(vec.size).toBe(0);
  });
});

describe("cosineSimilarity", () => {
  test("self-similarity equals 1.0", () => {
    const vec: TfIdfVector = new Map([
      ["hello", 0.5],
      ["world", 0.3],
    ]);
    const sim = cosineSimilarity(vec, vec);
    expect(sim).toBeCloseTo(1.0, 5);
  });

  test("orthogonal vectors have similarity 0", () => {
    const a: TfIdfVector = new Map([["hello", 1.0]]);
    const b: TfIdfVector = new Map([["world", 1.0]]);
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  test("similarity bounded [0, 1]", () => {
    const a: TfIdfVector = new Map([
      ["x", 0.8],
      ["y", 0.2],
    ]);
    const b: TfIdfVector = new Map([
      ["x", 0.4],
      ["z", 0.9],
    ]);
    const sim = cosineSimilarity(a, b);
    expect(sim).toBeGreaterThanOrEqual(0);
    expect(sim).toBeLessThanOrEqual(1);
  });

  test("empty vectors return 0", () => {
    const empty: TfIdfVector = new Map();
    const vec: TfIdfVector = new Map([["a", 1.0]]);
    expect(cosineSimilarity(empty, vec)).toBe(0);
    expect(cosineSimilarity(vec, empty)).toBe(0);
    expect(cosineSimilarity(empty, empty)).toBe(0);
  });
});

describe("extractMarkdownLinks", () => {
  test("extracts .kiro/specs/ references", () => {
    const content = "See .kiro/specs/agent-memory for details";
    const knownKeys = new Set(["src1::agent-memory", "src1::other"]);
    const links = extractMarkdownLinks(content, "src1::current", knownKeys);
    expect(links.length).toBe(1);
    expect(links[0]!.targetKey).toBe("src1::agent-memory");
  });

  test("extracts relative markdown links", () => {
    const content = "Depends on [alerts](../usage-alerts/)";
    const knownKeys = new Set(["src1::usage-alerts", "src1::other"]);
    const links = extractMarkdownLinks(content, "src1::current", knownKeys);
    expect(links.length).toBe(1);
    expect(links[0]!.targetKey).toBe("src1::usage-alerts");
  });

  test("does not match self-references", () => {
    const content = "See .kiro/specs/current for this spec";
    const knownKeys = new Set(["src1::current"]);
    const links = extractMarkdownLinks(content, "src1::current", knownKeys);
    expect(links.length).toBe(0);
  });
});

describe("isProximate", () => {
  test("same repo and same directory = proximate", () => {
    const a = makeSpec({ key: "a", provenance: { repository: "/repo", relativePath: ".kiro/specs/a", branch: "main", commitHash: "x", isDirty: false } });
    const b = makeSpec({ key: "b", provenance: { repository: "/repo", relativePath: ".kiro/specs/b", branch: "main", commitHash: "y", isDirty: false } });
    expect(isProximate(a, b)).toBe(true);
  });

  test("different repos = not proximate", () => {
    const a = makeSpec({ key: "a", provenance: { repository: "/repo1", relativePath: ".kiro/specs/a", branch: "main", commitHash: "x", isDirty: false } });
    const b = makeSpec({ key: "b", provenance: { repository: "/repo2", relativePath: ".kiro/specs/b", branch: "main", commitHash: "y", isDirty: false } });
    expect(isProximate(a, b)).toBe(false);
  });
});

describe("filterRejected", () => {
  test("filters out previously rejected with same dataHash", () => {
    const suggestions: Suggestion[] = [
      { id: "1", sourceSpecKey: "a", targetSpecKey: "b", type: "related", confidence: 0.5, reason: "shared_theme", evidence: "x", status: "pending", createdAt: "", dataHash: "hash1" },
    ];
    const rejections = [{ sourceSpecKey: "a", targetSpecKey: "b", type: "related", dataHash: "hash1" }];
    const result = filterRejected(suggestions, rejections);
    expect(result.length).toBe(0);
  });

  test("keeps suggestion if dataHash changed since rejection", () => {
    const suggestions: Suggestion[] = [
      { id: "1", sourceSpecKey: "a", targetSpecKey: "b", type: "related", confidence: 0.5, reason: "shared_theme", evidence: "x", status: "pending", createdAt: "", dataHash: "hash2" },
    ];
    const rejections = [{ sourceSpecKey: "a", targetSpecKey: "b", type: "related", dataHash: "hash1" }];
    const result = filterRejected(suggestions, rejections);
    expect(result.length).toBe(1);
  });
});

describe("generateAll", () => {
  test("returns empty for fewer than 2 specs", () => {
    const spec = makeSpec({ key: "a" });
    const metaMap = new Map([["a", makeMeta()]]);
    expect(generateAll([spec], metaMap)).toEqual([]);
  });

  test("per-spec limit enforced (max 5)", () => {
    // Create 10 specs all sharing the same theme — should produce many candidates but cap at 5
    const specs = Array.from({ length: 10 }, (_, i) => makeSpec({ key: `spec-${i}` }));
    const metaMap = new Map(
      specs.map((s) => [s.key, makeMeta({ theme: "same-theme", tags: ["common"] })]),
    );
    const results = generateAll(specs, metaMap);
    // Check no single spec appears in more than 5 suggestions
    const counts = new Map<string, number>();
    for (const r of results) {
      counts.set(r.sourceSpecKey, (counts.get(r.sourceSpecKey) ?? 0) + 1);
      counts.set(r.targetSpecKey, (counts.get(r.targetSpecKey) ?? 0) + 1);
    }
    for (const [, count] of counts) {
      expect(count).toBeLessThanOrEqual(5);
    }
  });

  test("deduplicates same-pair same-reason suggestions", () => {
    const a = makeSpec({ key: "a" });
    const b = makeSpec({ key: "b" });
    const metaMap = new Map([
      ["a", makeMeta({ theme: "x", tags: ["t1"] })],
      ["b", makeMeta({ theme: "x", tags: ["t1"] })],
    ]);
    const results = generateAll([a, b], metaMap);
    // Each reason should appear at most once per pair
    const reasonCounts = new Map<string, number>();
    for (const r of results) {
      const key = `${r.sourceSpecKey}|${r.targetSpecKey}|${r.reason}`;
      reasonCounts.set(key, (reasonCounts.get(key) ?? 0) + 1);
    }
    for (const [, count] of reasonCounts) {
      expect(count).toBe(1);
    }
  });
});
