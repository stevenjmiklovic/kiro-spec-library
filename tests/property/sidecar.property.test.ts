/**
 * Property-based tests for the SpecLibrarySidecarV1 schema round-trip.
 *
 * Property 5: Sidecar Round-Trip Equivalence
 *   export (JSON.stringify sorted) -> parse -> export again => identical output
 */
import { describe, test, expect } from 'bun:test';
import * as fc from 'fast-check';
import { SpecLibrarySidecarV1Schema } from '../../shared/src/schemas.js';
import type { SpecLibrarySidecarV1 } from '../../shared/src/schemas.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Deterministic JSON serialization with sorted keys */
function sortedStringify(obj: unknown): string {
  return JSON.stringify(obj, (_key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(value).sort()) {
        sorted[k] = (value as Record<string, unknown>)[k];
      }
      return sorted;
    }
    return value;
  });
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const RELATIONSHIP_TYPES = ['depends_on', 'blocks', 'supersedes', 'duplicates', 'related'] as const;
const arbRetentionPolicy = fc.oneof(
  fc.record({
    type: fc.constantFrom('permanent' as const, 'project_lifetime' as const, 'active_plus_2_years' as const),
  }),
  fc.record({
    type: fc.constant('custom_date' as const),
    customDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map((d) => d.toISOString()),
  }),
);

/** Generate emails that pass Zod's z.string().email() validation */
const arbEmail: fc.Arbitrary<string> = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{1,8}$/),
    fc.stringMatching(/^[a-z][a-z0-9]{1,6}$/),
    fc.constantFrom('com', 'org', 'edu', 'io', 'net'),
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

const arbOwner = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.option(arbEmail, { nil: undefined }),
});

const arbMetadata = fc.record({
  displayTitle: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  summary: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  theme: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  tags: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }), {
    nil: undefined,
  }),
  owner: fc.option(arbOwner, { nil: undefined }),
  targetRelease: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  retentionPolicy: fc.option(arbRetentionPolicy, { nil: undefined }),
});

const arbRelationship = fc.record({
  targetSpecId: fc.string({ minLength: 1, maxLength: 50 }),
  targetRepository: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  type: fc.constantFrom(...RELATIONSHIP_TYPES),
  note: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
});

const arbSidecar: fc.Arbitrary<SpecLibrarySidecarV1> = fc.record({
  schemaVersion: fc.constant(1 as const),
  specId: fc.string({ minLength: 1, maxLength: 50 }),
  metadata: arbMetadata,
  relationships: fc.option(fc.array(arbRelationship, { minLength: 0, maxLength: 10 }), { nil: undefined }),
});

// ─── Property 5: Sidecar Round-Trip Equivalence ──────────────────────────────

describe('Property 5: Sidecar Round-Trip Equivalence', () => {
  test('export -> import -> export yields identical sorted JSON', () => {
    fc.assert(
      fc.property(arbSidecar, (sidecar) => {
        // Step 1: Export (serialize to sorted JSON)
        const exported = sortedStringify(sidecar);

        // Step 2: Import (parse JSON and validate with schema)
        const parsed = JSON.parse(exported);
        const validated = SpecLibrarySidecarV1Schema.parse(parsed);

        // Step 3: Export again
        const reExported = sortedStringify(validated);

        // They must be identical
        expect(reExported).toBe(exported);
      }),
      { numRuns: 100 },
    );
  });

  test('generated sidecars always pass schema validation', () => {
    fc.assert(
      fc.property(arbSidecar, (sidecar) => {
        const result = SpecLibrarySidecarV1Schema.safeParse(sidecar);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  test('round-trip preserves all fields (no data loss)', () => {
    fc.assert(
      fc.property(arbSidecar, (sidecar) => {
        const json = JSON.stringify(sidecar);
        const restored = SpecLibrarySidecarV1Schema.parse(JSON.parse(json));

        expect(restored.schemaVersion).toBe(sidecar.schemaVersion);
        expect(restored.specId).toBe(sidecar.specId);

        // Metadata fields
        if (sidecar.metadata.displayTitle !== undefined) {
          expect(restored.metadata.displayTitle).toBe(sidecar.metadata.displayTitle);
        }
        if (sidecar.metadata.summary !== undefined) {
          expect(restored.metadata.summary).toBe(sidecar.metadata.summary);
        }
        if (sidecar.metadata.theme !== undefined) {
          expect(restored.metadata.theme).toBe(sidecar.metadata.theme);
        }
        if (sidecar.metadata.tags !== undefined) {
          expect(restored.metadata.tags).toEqual(sidecar.metadata.tags);
        }
        if (sidecar.metadata.owner !== undefined) {
          expect(restored.metadata.owner).toEqual(sidecar.metadata.owner);
        }

        // Relationships
        if (sidecar.relationships !== undefined) {
          expect(restored.relationships).toHaveLength(sidecar.relationships.length);
        }
      }),
      { numRuns: 100 },
    );
  });
});
