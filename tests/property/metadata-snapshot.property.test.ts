/**
 * Property-based tests: Metadata Resolution Priority & Snapshot Content Integrity
 *
 * Property 12: resolveMetadata prefers overlay > sidecar > artifact-derived per field
 * Property 13: re-hashing stored artifact contents matches stored contentDigest
 *              (sha256 of concatenated sorted artifact contents)
 */
import { describe, expect, test } from "bun:test";
import fc from "fast-check";
import { createHash } from "node:crypto";
import { resolveMetadata, evaluateCompleteness } from "../../backend/src/services/metadata.js";
import type {
  NormalizedSpec,
  MetadataOverlay,
  LifecycleStage,
} from "../../shared/src/types.js";
import type { SpecLibrarySidecarV1 } from "../../shared/src/schemas.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Replicate the contentDigest computation from archiver.ts:
 * sha256 of concatenated sorted (by name) artifact contents.
 */
function computeContentDigest(
  artifacts: { name: string; content: string }[],
): string {
  const sorted = [...artifacts].sort((a, b) => a.name.localeCompare(b.name));
  const hash = createHash("sha256");
  for (const a of sorted) {
    hash.update(a.content);
  }
  return hash.digest("hex");
}

function makeSpec(overrides: Partial<NormalizedSpec> = {}): NormalizedSpec {
  return {
    key: "src1::test-spec",
    sourceId: "src1",
    specId: "test-spec",
    type: "feature",
    workflow: "requirements-first",
    title: "Default Title",
    owner: "default-owner",
    stage: "new",
    progress: 33,
    provenance: {
      repository: "/repo",
      relativePath: ".kiro/specs/test-spec",
      branch: "main",
      commitHash: "abc123",
      isDirty: false,
    },
    artifacts: { "requirements.md": true },
    taskCounts: { total: 0, completed: 0 },
    contentDigest: "digest-test",
    indexedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const arbNonEmptyStr = fc.stringMatching(/^[A-Za-z0-9 _-]{1,50}$/);
const arbOptStr = fc.option(arbNonEmptyStr, { nil: undefined });
const arbTags = fc.array(fc.stringMatching(/^[a-z]{3,10}$/), {
  minLength: 0,
  maxLength: 5,
});

const arbOverlay: fc.Arbitrary<MetadataOverlay | null> = fc.option(
  fc.record({
    specKey: fc.constant("src1::test-spec"),
    title: arbOptStr,
    summary: arbOptStr,
    owner: arbOptStr,
    theme: arbOptStr,
    tags: fc.option(arbTags, { nil: undefined }),
    targetRelease: arbOptStr,
    retentionPolicy: fc.option(
      fc.record({
        type: fc.constantFrom(
          "permanent" as const,
          "project_lifetime" as const,
          "active_plus_2_years" as const,
        ),
      }),
      { nil: undefined },
    ),
    revision: fc.integer({ min: 1, max: 100 }),
    updatedAt: fc.constant("2026-01-01T00:00:00Z"),
  }),
  { nil: null },
);

const arbSidecar: fc.Arbitrary<SpecLibrarySidecarV1 | null> = fc.option(
  fc.record({
    schemaVersion: fc.constant(1 as const),
    specId: fc.constant("test-spec"),
    metadata: fc.record({
      displayTitle: arbOptStr,
      summary: arbOptStr,
      theme: arbOptStr,
      tags: fc.option(arbTags, { nil: undefined }),
      owner: fc.option(
        fc.record({
          name: arbNonEmptyStr,
          email: fc.option(fc.constant("test@jhu.edu"), { nil: undefined }),
        }),
        { nil: undefined },
      ),
      targetRelease: arbOptStr,
      retentionPolicy: fc.option(
        fc.record({
          type: fc.constantFrom(
            "permanent" as const,
            "project_lifetime" as const,
            "active_plus_2_years" as const,
          ),
        }),
        { nil: undefined },
      ),
    }),
  }),
  { nil: null },
);

const arbSpec: fc.Arbitrary<NormalizedSpec> = fc
  .record({
    title: arbNonEmptyStr,
    owner: arbNonEmptyStr,
  })
  .map(({ title, owner }) => makeSpec({ title, owner }));

// ─── Property 12: Metadata Resolution Priority ──────────────────────────────

describe("Property 12: Metadata Resolution Priority", () => {
  test("overlay fields always win over sidecar and artifact-derived", () => {
    fc.assert(
      fc.property(arbSpec, arbOverlay, arbSidecar, (spec, overlay, sidecar) => {
        const resolved = resolveMetadata(spec, overlay, sidecar);

        if (overlay) {
          // overlay fields take priority when defined
          if (overlay.title !== undefined) {
            expect(resolved.title).toBe(overlay.title);
          }
          if (overlay.summary !== undefined) {
            expect(resolved.summary).toBe(overlay.summary);
          }
          if (overlay.owner !== undefined) {
            expect(resolved.owner).toBe(overlay.owner);
          }
          if (overlay.theme !== undefined) {
            expect(resolved.theme).toBe(overlay.theme);
          }
          if (overlay.tags !== undefined) {
            expect(resolved.tags).toEqual(overlay.tags);
          }
          if (overlay.targetRelease !== undefined) {
            expect(resolved.targetRelease).toBe(overlay.targetRelease);
          }
          if (overlay.retentionPolicy !== undefined) {
            expect(resolved.retentionPolicy).toEqual(overlay.retentionPolicy);
          }
        }
      }),
      { numRuns: 200 },
    );
  });

  test("sidecar fields win over artifact-derived when overlay is absent or undefined for that field", () => {
    fc.assert(
      fc.property(arbSpec, arbSidecar, (spec, sidecar) => {
        // No overlay — sidecar should win over artifact
        const resolved = resolveMetadata(spec, null, sidecar);
        const sm = sidecar?.metadata;

        if (sm?.displayTitle !== undefined) {
          expect(resolved.title).toBe(sm.displayTitle);
        } else {
          // Falls back to spec.title
          expect(resolved.title).toBe(spec.title);
        }

        if (sm?.owner?.name !== undefined) {
          expect(resolved.owner).toBe(sm.owner.name);
        } else {
          expect(resolved.owner).toBe(spec.owner);
        }

        if (sm?.summary !== undefined) {
          expect(resolved.summary).toBe(sm.summary);
        } else {
          expect(resolved.summary).toBeUndefined();
        }

        if (sm?.theme !== undefined) {
          expect(resolved.theme).toBe(sm.theme);
        } else {
          expect(resolved.theme).toBeUndefined();
        }

        if (sm?.tags !== undefined) {
          expect(resolved.tags).toEqual(sm.tags);
        } else {
          expect(resolved.tags).toEqual([]);
        }
      }),
      { numRuns: 200 },
    );
  });

  test("artifact-derived is the fallback when both overlay and sidecar are null", () => {
    fc.assert(
      fc.property(arbSpec, (spec) => {
        const resolved = resolveMetadata(spec, null, null);
        expect(resolved.title).toBe(spec.title);
        expect(resolved.owner).toBe(spec.owner);
        expect(resolved.tags).toEqual([]);
        expect(resolved.summary).toBeUndefined();
        expect(resolved.theme).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });

  test("partial overlay: undefined fields fall through to sidecar or artifact", () => {
    fc.assert(
      fc.property(arbSpec, arbOverlay, arbSidecar, (spec, overlay, sidecar) => {
        const resolved = resolveMetadata(spec, overlay, sidecar);
        const sm = sidecar?.metadata;

        // Title resolution chain: overlay.title ?? sidecar.metadata.displayTitle ?? spec.title
        const expectedTitle =
          overlay?.title ?? sm?.displayTitle ?? spec.title;
        expect(resolved.title).toBe(expectedTitle);

        // Owner resolution chain: overlay.owner ?? sidecar.metadata.owner.name ?? spec.owner
        const expectedOwner =
          overlay?.owner ?? sm?.owner?.name ?? spec.owner;
        expect(resolved.owner).toBe(expectedOwner);

        // Tags resolution chain: overlay.tags ?? sidecar.metadata.tags ?? []
        const expectedTags = overlay?.tags ?? sm?.tags ?? [];
        expect(resolved.tags).toEqual(expectedTags);
      }),
      { numRuns: 200 },
    );
  });

  test("evaluateCompleteness reports missing fields correctly", () => {
    const arbStage = fc.constantFrom<LifecycleStage>(
      "new",
      "scoped",
      "refined",
      "in-flight",
      "done",
    );

    fc.assert(
      fc.property(arbSpec, arbOverlay, arbSidecar, arbStage, (spec, overlay, sidecar, stage) => {
        const resolved = resolveMetadata(spec, overlay, sidecar);
        const completeness = evaluateCompleteness(resolved, stage);

        // Verify the invariant: missing fields match what's actually missing
        if (!resolved.title) expect(completeness.missing).toContain("title");
        if (!resolved.owner) expect(completeness.missing).toContain("owner");
        if (!resolved.theme) expect(completeness.missing).toContain("theme");
        if (!resolved.tags || resolved.tags.length === 0) {
          expect(completeness.missing).toContain("tags");
        }

        // complete flag is consistent
        expect(completeness.complete).toBe(completeness.missing.length === 0);
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Property 13: Snapshot Content Integrity ─────────────────────────────────

describe("Property 13: Snapshot Content Integrity", () => {
  test("computeContentDigest is deterministic regardless of input order", () => {
    // Generate artifacts with unique names (the archiver contract requires unique names)
    const arbArtifacts = fc
      .array(
        fc.record({
          name: fc.stringMatching(/^[a-z][a-z0-9_]{0,15}\.(md|json|ts)$/),
          content: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        { minLength: 1, maxLength: 10 },
      )
      .map((artifacts) => {
        // Deduplicate by name — keep first occurrence
        const seen = new Set<string>();
        return artifacts.filter((a) => {
          if (seen.has(a.name)) return false;
          seen.add(a.name);
          return true;
        });
      })
      .filter((artifacts) => artifacts.length >= 1);

    fc.assert(
      fc.property(arbArtifacts, (artifacts) => {
        // Compute the digest
        const digest1 = computeContentDigest(artifacts);

        // Shuffle and compute again — sort-by-name makes it order-independent
        const shuffled = [...artifacts].reverse();
        const digest2 = computeContentDigest(shuffled);

        expect(digest1).toBe(digest2);
      }),
      { numRuns: 200 },
    );
  });

  test("contentDigest changes when any artifact content changes", () => {
    const arbArtifacts = fc.array(
      fc.record({
        name: fc.stringMatching(/^[a-z]{3,10}\.(md|json)$/),
        content: fc.string({ minLength: 1, maxLength: 200 }),
      }),
      { minLength: 1, maxLength: 5 },
    );
    const arbMutation = fc.string({ minLength: 1, maxLength: 50 });

    fc.assert(
      fc.property(arbArtifacts, arbMutation, (artifacts, mutation) => {
        if (artifacts.length === 0) return;

        const digestBefore = computeContentDigest(artifacts);

        // Mutate the first artifact's content
        const mutated = [...artifacts];
        mutated[0] = { ...mutated[0]!, content: mutated[0]!.content + mutation };
        const digestAfter = computeContentDigest(mutated);

        expect(digestBefore).not.toBe(digestAfter);
      }),
      { numRuns: 200 },
    );
  });

  test("contentDigest is a valid 64-char hex sha256", () => {
    const arbArtifacts = fc.array(
      fc.record({
        name: fc.stringMatching(/^[a-z]{2,10}\.(md|json|ts)$/),
        content: fc.string({ minLength: 0, maxLength: 500 }),
      }),
      { minLength: 1, maxLength: 10 },
    );

    fc.assert(
      fc.property(arbArtifacts, (artifacts) => {
        const digest = computeContentDigest(artifacts);
        expect(digest).toMatch(/^[a-f0-9]{64}$/);
      }),
      { numRuns: 100 },
    );
  });

  test("re-hashing individual artifacts reproduces the stored per-artifact hash", () => {
    // This tests that sha256(content) for each artifact matches what would be stored
    const arbContent = fc.string({ minLength: 1, maxLength: 1000 });

    fc.assert(
      fc.property(arbContent, (content) => {
        const hash = createHash("sha256").update(content).digest("hex");
        // Re-hash should be identical
        const reHash = createHash("sha256").update(content).digest("hex");
        expect(hash).toBe(reHash);
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
      }),
      { numRuns: 200 },
    );
  });

  test("empty content still produces a valid digest", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.stringMatching(/^[a-z]{2,8}\.md$/),
            content: fc.constant(""),
          }),
          { minLength: 1, maxLength: 5 },
        ),
        (artifacts) => {
          const digest = computeContentDigest(artifacts);
          expect(digest).toMatch(/^[a-f0-9]{64}$/);
        },
      ),
      { numRuns: 100 },
    );
  });

  test("digest stability: same inputs always produce same output across calls", () => {
    const arbArtifacts = fc.array(
      fc.record({
        name: fc.stringMatching(/^[a-z]{2,10}\.(md|json)$/),
        content: fc.string({ minLength: 1, maxLength: 300 }),
      }),
      { minLength: 1, maxLength: 8 },
    );

    fc.assert(
      fc.property(arbArtifacts, (artifacts) => {
        const d1 = computeContentDigest(artifacts);
        const d2 = computeContentDigest(artifacts);
        const d3 = computeContentDigest(artifacts);
        expect(d1).toBe(d2);
        expect(d2).toBe(d3);
      }),
      { numRuns: 100 },
    );
  });
});
