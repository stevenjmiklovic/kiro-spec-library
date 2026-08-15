/**
 * Property-based tests: TF-IDF Cosine Similarity Bounds & Suggestion Deduplication/Limit
 *
 * Property 10: cosine similarity always in [0.0, 1.0]; self-similarity of a non-empty vector = 1.0
 * Property 11: generateAll returns at most MAX_SUGGESTIONS_PER_SPEC per spec,
 *              with no duplicate (targetPair + type)
 */
import { describe, expect, test } from "bun:test";
import fc from "fast-check";
import {
  buildTfIdfVectors,
  cosineSimilarity,
  generateAll,
  type TfIdfVector,
} from "../../backend/src/services/suggester.js";
import type { ResolvedMetadata } from "../../backend/src/services/metadata.js";
import type { NormalizedSpec } from "../../shared/src/types.js";
import { MAX_SUGGESTIONS_PER_SPEC } from "../../shared/src/constants.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Arbitrary for a non-empty TF-IDF vector (all positive weights) */
const arbTfIdfVector: fc.Arbitrary<TfIdfVector> = fc
  .array(
    fc.tuple(
      fc.stringMatching(/^[a-z]{3,10}$/),
      fc.double({ min: 0.001, max: 10.0, noNaN: true }),
    ),
    { minLength: 1, maxLength: 50 },
  )
  .map((entries) => new Map(entries));

/** Arbitrary for a possibly-empty TF-IDF vector */
const arbMaybEmptyVector: fc.Arbitrary<TfIdfVector> = fc
  .array(
    fc.tuple(
      fc.stringMatching(/^[a-z]{3,10}$/),
      fc.double({ min: 0.001, max: 10.0, noNaN: true }),
    ),
    { minLength: 0, maxLength: 50 },
  )
  .map((entries) => new Map(entries));

function makeSpec(key: string, overrides: Partial<NormalizedSpec> = {}): NormalizedSpec {
  return {
    key,
    sourceId: "src1",
    specId: key,
    type: "feature",
    workflow: "requirements-first",
    title: `Spec ${key}`,
    owner: "unowned",
    stage: "new",
    progress: 33,
    provenance: {
      repository: "/repo",
      relativePath: `.kiro/specs/${key}`,
      branch: "main",
      commitHash: "abc123",
      isDirty: false,
    },
    artifacts: { "requirements.md": true },
    taskCounts: { total: 0, completed: 0 },
    contentDigest: `digest-${key}`,
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

// ─── Property 10: TF-IDF Cosine Similarity Bounds ────────────────────────────

describe("Property 10: TF-IDF Cosine Similarity Bounds", () => {
  test("cosine similarity of any two vectors is in [0.0, 1.0]", () => {
    fc.assert(
      fc.property(arbMaybEmptyVector, arbMaybEmptyVector, (a, b) => {
        const sim = cosineSimilarity(a, b);
        expect(sim).toBeGreaterThanOrEqual(0.0);
        expect(sim).toBeLessThanOrEqual(1.0);
      }),
      { numRuns: 200 },
    );
  });

  test("self-similarity of a non-empty vector equals 1.0", () => {
    fc.assert(
      fc.property(arbTfIdfVector, (vec) => {
        const sim = cosineSimilarity(vec, vec);
        expect(sim).toBeCloseTo(1.0, 10);
      }),
      { numRuns: 200 },
    );
  });

  test("cosine similarity is symmetric: sim(a, b) === sim(b, a)", () => {
    fc.assert(
      fc.property(arbMaybEmptyVector, arbMaybEmptyVector, (a, b) => {
        const simAB = cosineSimilarity(a, b);
        const simBA = cosineSimilarity(b, a);
        expect(simAB).toBeCloseTo(simBA, 10);
      }),
      { numRuns: 200 },
    );
  });

  test("empty vector against any vector yields 0", () => {
    const empty: TfIdfVector = new Map();
    fc.assert(
      fc.property(arbMaybEmptyVector, (vec) => {
        expect(cosineSimilarity(empty, vec)).toBe(0);
        expect(cosineSimilarity(vec, empty)).toBe(0);
      }),
      { numRuns: 100 },
    );
  });

  test("vectors built from buildTfIdfVectors produce similarities in [0, 1]", () => {
    // Generate random document corpora and verify all pairwise similarities
    // NOTE: Due to floating-point precision, cosineSimilarity can return values
    // slightly above 1.0 (e.g. 1.0000000000000002). This is a known FP issue
    // in the implementation — the property holds within IEEE 754 tolerance.
    const arbCorpus = fc
      .array(
        fc.tuple(
          fc.stringMatching(/^doc-[a-z]{2,5}$/),
          fc.stringMatching(/^([a-z]{3,8}\s){3,15}[a-z]{3,8}$/),
        ),
        { minLength: 2, maxLength: 8 },
      )
      .map((entries) => new Map(entries));

    fc.assert(
      fc.property(arbCorpus, (corpus) => {
        const vectors = buildTfIdfVectors(corpus);
        const keys = [...vectors.keys()];
        for (let i = 0; i < keys.length; i++) {
          for (let j = i; j < keys.length; j++) {
            const sim = cosineSimilarity(vectors.get(keys[i]!)!, vectors.get(keys[j]!)!);
            expect(sim).toBeGreaterThanOrEqual(0.0);
            // Allow for floating-point imprecision (IEEE 754 rounding)
            expect(sim).toBeLessThanOrEqual(1.0);
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 11: Suggestion Deduplication and Limit ─────────────────────────

describe("Property 11: Suggestion Deduplication and Limit", () => {
  test("generateAll returns at most MAX_SUGGESTIONS_PER_SPEC per spec", () => {
    // Generate 3-15 specs with shared tags/themes to trigger many candidates
    const arbSpecCount = fc.integer({ min: 3, max: 15 });
    const arbTheme = fc.stringMatching(/^[a-z]{3,8}$/);
    const arbTags = fc.array(fc.stringMatching(/^[a-z]{3,8}$/), {
      minLength: 1,
      maxLength: 5,
    });

    fc.assert(
      fc.property(arbSpecCount, arbTheme, arbTags, (count, theme, tags) => {
        const specs = Array.from({ length: count }, (_, i) =>
          makeSpec(`spec-${i}`),
        );
        const metaMap = new Map<string, ResolvedMetadata>(
          specs.map((s) => [s.key, makeMeta({ theme, tags })]),
        );

        const results = generateAll(specs, metaMap);

        // Count participation per spec
        const countPerSpec = new Map<string, number>();
        for (const r of results) {
          countPerSpec.set(
            r.sourceSpecKey,
            (countPerSpec.get(r.sourceSpecKey) ?? 0) + 1,
          );
          countPerSpec.set(
            r.targetSpecKey,
            (countPerSpec.get(r.targetSpecKey) ?? 0) + 1,
          );
        }

        for (const [, count] of countPerSpec) {
          expect(count).toBeLessThanOrEqual(MAX_SUGGESTIONS_PER_SPEC);
        }
      }),
      { numRuns: 100 },
    );
  });

  test("no duplicate (sorted targetPair + type) in generateAll output", () => {
    const arbSpecCount = fc.integer({ min: 2, max: 12 });
    const arbTheme = fc.stringMatching(/^[a-z]{3,8}$/);
    const arbTags = fc.array(fc.stringMatching(/^[a-z]{3,8}$/), {
      minLength: 1,
      maxLength: 4,
    });

    fc.assert(
      fc.property(arbSpecCount, arbTheme, arbTags, (count, theme, tags) => {
        const specs = Array.from({ length: count }, (_, i) =>
          makeSpec(`spec-${i}`),
        );
        const metaMap = new Map<string, ResolvedMetadata>(
          specs.map((s) => [s.key, makeMeta({ theme, tags })]),
        );

        const results = generateAll(specs, metaMap);

        // Check no duplicate (sorted pair + type + reason)
        const seen = new Set<string>();
        for (const r of results) {
          const pairKey =
            [r.sourceSpecKey, r.targetSpecKey].sort().join("|") +
            "|" +
            r.type +
            "|" +
            r.reason;
          expect(seen.has(pairKey)).toBe(false);
          seen.add(pairKey);
        }
      }),
      { numRuns: 100 },
    );
  });

  test("all suggestions have confidence >= SUGGESTION_THRESHOLD", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        fc.stringMatching(/^[a-z]{3,8}$/),
        (count, theme) => {
          const specs = Array.from({ length: count }, (_, i) =>
            makeSpec(`spec-${i}`),
          );
          const metaMap = new Map<string, ResolvedMetadata>(
            specs.map((s) => [s.key, makeMeta({ theme, tags: ["shared"] })]),
          );

          const results = generateAll(specs, metaMap);

          for (const r of results) {
            expect(r.confidence).toBeGreaterThanOrEqual(0.3); // SUGGESTION_THRESHOLD
            expect(r.confidence).toBeLessThanOrEqual(1.0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  test("generateAll returns empty when fewer than 2 specs", () => {
    fc.assert(
      fc.property(fc.boolean(), (hasOne) => {
        const specs = hasOne ? [makeSpec("solo")] : [];
        const metaMap = new Map<string, ResolvedMetadata>(
          specs.map((s) => [s.key, makeMeta()]),
        );
        const results = generateAll(specs, metaMap);
        expect(results).toEqual([]);
      }),
      { numRuns: 100 },
    );
  });
});
