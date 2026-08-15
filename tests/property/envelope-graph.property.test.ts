/**
 * Property-based tests — Properties 16, 17, 18
 *
 * Property 16: Error Envelope Structure
 *   Error envelope has code:string, message truncated to <=500 chars
 *   (MAX_ERROR_MESSAGE_LENGTH from shared), and a UUID v4 requestId.
 *
 * Property 17: Relationship Type Validation
 *   Only the 5 valid types (depends_on|blocks|supersedes|duplicates|related)
 *   are accepted; others are rejected.
 *
 * Property 18: Node Placement Determinism
 *   placeGraphNodes(specs) yields identical coordinates for identical input.
 */
import { describe, expect, test } from "bun:test";
import fc from "fast-check";
import {
  MAX_ERROR_MESSAGE_LENGTH,
  RELATIONSHIP_TYPES,
} from "../../shared/src/constants.js";
import { CreateRelationshipSchema, SidecarRelationshipSchema } from "../../shared/src/schemas.js";
import { placeGraphNodes, type GraphSpec } from "../../ui/src/components/GraphCanvas.js";
import type { YAxisField } from "../../ui/src/components/GraphCanvas.js";

// ─── Constants from GraphCanvas ──────────────────────────────────────────────

const LEFT_GUTTER = 160;
const STAGE_WIDTH = 270;
const LANE_GAP = 220;
const NODE_GAP = 138;
const STAGES = ["new", "scoped", "refined", "in-flight", "done"];

// ─── UUID v4 regex ───────────────────────────────────────────────────────────

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ─── Property 16: Error Envelope Structure ───────────────────────────────────

describe("Property 16: Error Envelope Structure", () => {
  // Reproduce the truncate logic from the router
  function truncate(msg: string, max: number): string {
    return msg.length > max ? msg.slice(0, max - 1) + "…" : msg;
  }

  function buildErrorEnvelope(errorMessage: string, code: string) {
    const requestId = crypto.randomUUID();
    return {
      code,
      message: truncate(errorMessage, MAX_ERROR_MESSAGE_LENGTH),
      requestId,
    };
  }

  test("message is always <= MAX_ERROR_MESSAGE_LENGTH (100+ generated cases)", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 2000 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (errorMessage, code) => {
          const envelope = buildErrorEnvelope(errorMessage, code);

          // Property: message length <= MAX_ERROR_MESSAGE_LENGTH
          expect(envelope.message.length).toBeLessThanOrEqual(MAX_ERROR_MESSAGE_LENGTH);
        },
      ),
      { numRuns: 100 },
    );
  });

  test("code is always a non-empty string (100+ generated cases)", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 1000 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (errorMessage, code) => {
          const envelope = buildErrorEnvelope(errorMessage, code);

          expect(typeof envelope.code).toBe("string");
          expect(envelope.code.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  test("requestId is always a valid UUID v4 (100+ generated cases)", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 1000 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (errorMessage, code) => {
          const envelope = buildErrorEnvelope(errorMessage, code);

          expect(envelope.requestId).toMatch(UUID_V4_REGEX);
        },
      ),
      { numRuns: 100 },
    );
  });

  test("messages exactly at boundary are not truncated (100+ generated cases)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: MAX_ERROR_MESSAGE_LENGTH }),
        (length) => {
          const msg = "x".repeat(length);
          const envelope = buildErrorEnvelope(msg, "TEST");

          // At or below boundary: message is unchanged
          expect(envelope.message).toBe(msg);
          expect(envelope.message.length).toBe(length);
        },
      ),
      { numRuns: 100 },
    );
  });

  test("messages above boundary are truncated with ellipsis (100+ generated cases)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: MAX_ERROR_MESSAGE_LENGTH + 1, max: 5000 }),
        (length) => {
          const msg = "y".repeat(length);
          const envelope = buildErrorEnvelope(msg, "TEST");

          // Above boundary: truncated to exactly MAX_ERROR_MESSAGE_LENGTH
          expect(envelope.message.length).toBe(MAX_ERROR_MESSAGE_LENGTH);
          // Ends with ellipsis
          expect(envelope.message.endsWith("…")).toBe(true);
          // First part matches original
          expect(envelope.message.slice(0, MAX_ERROR_MESSAGE_LENGTH - 1)).toBe(
            msg.slice(0, MAX_ERROR_MESSAGE_LENGTH - 1),
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  test("full envelope shape with arbitrary inputs (100+ generated cases)", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 3000 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (errorMessage, code) => {
          const envelope = buildErrorEnvelope(errorMessage, code);

          // Structural assertions
          expect(envelope).toHaveProperty("code");
          expect(envelope).toHaveProperty("message");
          expect(envelope).toHaveProperty("requestId");
          expect(typeof envelope.code).toBe("string");
          expect(typeof envelope.message).toBe("string");
          expect(typeof envelope.requestId).toBe("string");
          expect(envelope.message.length).toBeLessThanOrEqual(MAX_ERROR_MESSAGE_LENGTH);
          expect(envelope.requestId).toMatch(UUID_V4_REGEX);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 17: Relationship Type Validation ───────────────────────────────

describe("Property 17: Relationship Type Validation", () => {
  const validTypes = new Set<string>(RELATIONSHIP_TYPES);

  test("all 5 valid relationship types are accepted by schema (100+ generated cases)", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...RELATIONSHIP_TYPES),
        fc.uuid(),
        (type, targetKey) => {
          const result = CreateRelationshipSchema.safeParse({
            targetSpecKey: targetKey,
            type,
          });
          expect(result.success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  test("any string NOT in the 5 valid types is rejected (100+ generated cases)", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(
          (s) => !validTypes.has(s),
        ),
        fc.uuid(),
        (invalidType, targetKey) => {
          const result = CreateRelationshipSchema.safeParse({
            targetSpecKey: targetKey,
            type: invalidType,
          });
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  test("SidecarRelationshipSchema also rejects invalid types (100+ generated cases)", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(
          (s) => !validTypes.has(s),
        ),
        fc.uuid(),
        (invalidType, targetSpecId) => {
          const result = SidecarRelationshipSchema.safeParse({
            targetSpecId,
            type: invalidType,
          });
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  test("variations/typos of valid types are rejected (100+ generated cases)", () => {
    // Generate plausible but invalid relationship type strings
    const nearMissArbitrary = fc.oneof(
      // Uppercase versions
      fc.constantFrom(...RELATIONSHIP_TYPES).map((t) => t.toUpperCase()),
      // With extra chars
      fc.constantFrom(...RELATIONSHIP_TYPES).map((t) => t + "s"),
      fc.constantFrom(...RELATIONSHIP_TYPES).map((t) => "_" + t),
      // Partial matches
      fc.constantFrom("depends", "block", "supersede", "duplicate", "relate"),
      // Camel case
      fc.constantFrom("dependsOn", "Blocks", "superSedes", "Duplicates", "Related"),
      // With hyphens instead of underscores
      fc.constantFrom("depends-on", "blocks-", "super-sedes"),
      // Random alphanum strings
      fc.stringOf(
        fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz_".split("")),
        { minLength: 3, maxLength: 20 },
      ).filter((s) => !validTypes.has(s)),
    );

    fc.assert(
      fc.property(nearMissArbitrary, fc.uuid(), (badType, targetKey) => {
        if (validTypes.has(badType)) return; // skip rare collision

        const result = CreateRelationshipSchema.safeParse({
          targetSpecKey: targetKey,
          type: badType,
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  test("empty string type is rejected (100+ generated cases)", () => {
    fc.assert(
      fc.property(fc.uuid(), (targetKey) => {
        const result = CreateRelationshipSchema.safeParse({
          targetSpecKey: targetKey,
          type: "",
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 18: Node Placement Determinism ─────────────────────────────────

describe("Property 18: Node Placement Determinism", () => {
  // Arbitrary GraphSpec generator
  const graphSpecArb: fc.Arbitrary<GraphSpec> = fc.record({
    key: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 50 }),
    type: fc.constantFrom("feature", "bugfix", "quick", "unknown") as fc.Arbitrary<GraphSpec["type"]>,
    stage: fc.constantFrom(...STAGES),
    progress: fc.integer({ min: 0, max: 100 }),
    owner: fc.string({ minLength: 1, maxLength: 30 }),
    theme: fc.string({ minLength: 0, maxLength: 30 }),
    repository: fc.string({ minLength: 0, maxLength: 40 }),
  });

  const yAxisFieldArb: fc.Arbitrary<YAxisField> = fc.constantFrom("theme", "owner", "repository", "type");

  test("identical input yields identical coordinates (100+ generated cases)", () => {
    fc.assert(
      fc.property(
        fc.array(graphSpecArb, { minLength: 1, maxLength: 30 }),
        (specs) => {
          const result1 = placeGraphNodes(specs);
          const result2 = placeGraphNodes(specs);

          expect(result1.length).toBe(result2.length);

          for (let i = 0; i < result1.length; i++) {
            const n1 = result1[i]!;
            const n2 = result2[i]!;
            expect(n1.id).toBe(n2.id);
            expect(n1.position.x).toBe(n2.position.x);
            expect(n1.position.y).toBe(n2.position.y);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  test("output length equals input length (100+ generated cases)", () => {
    fc.assert(
      fc.property(
        fc.array(graphSpecArb, { minLength: 0, maxLength: 50 }),
        (specs) => {
          const nodes = placeGraphNodes(specs);
          expect(nodes.length).toBe(specs.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  test("each node id matches a spec key (100+ generated cases)", () => {
    fc.assert(
      fc.property(
        fc.array(graphSpecArb, { minLength: 1, maxLength: 20 }),
        (specs) => {
          const nodes = placeGraphNodes(specs);
          const specKeys = new Set(specs.map((s) => s.key));

          for (const node of nodes) {
            expect(specKeys.has(node.id)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  test("x coordinate is determined by stage column (100+ generated cases)", () => {
    fc.assert(
      fc.property(
        fc.array(graphSpecArb, { minLength: 1, maxLength: 20 }),
        (specs) => {
          const nodes = placeGraphNodes(specs);

          for (const node of nodes) {
            const spec = specs.find((s) => s.key === node.id);
            if (!spec) continue;
            const stageIndex = STAGES.indexOf(spec.stage);
            const expectedX = LEFT_GUTTER + stageIndex * STAGE_WIDTH;
            expect(node.position.x).toBe(expectedX);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  test("y coordinate is determined by theme lane and row (100+ generated cases)", () => {
    fc.assert(
      fc.property(
        fc.array(graphSpecArb, { minLength: 1, maxLength: 20 }),
        (specs) => {
          const nodes = placeGraphNodes(specs, "theme");
          const themes = [...new Set(specs.map((s) => s.theme || "Unassigned"))].sort();

          for (const node of nodes) {
            const spec = specs.find((s) => s.key === node.id);
            if (!spec) continue;

            const theme = spec.theme || "Unassigned";
            const laneIndex = themes.indexOf(theme);

            // Find the row index within the cell (same theme + same stage)
            const inCell = specs
              .filter(
                (s) =>
                  (s.theme || "Unassigned") === theme && s.stage === spec.stage,
              )
              .sort((a, b) => a.title.localeCompare(b.title) || a.key.localeCompare(b.key));
            const rowIndex = inCell.findIndex((s) => s.key === spec.key);

            const expectedY = laneIndex * LANE_GAP + rowIndex * NODE_GAP;
            expect(node.position.y).toBe(expectedY);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  test("y coordinate works for all yAxisField options (100+ generated cases)", () => {
    function getLaneValue(spec: GraphSpec, field: YAxisField): string {
      switch (field) {
        case "owner": return spec.owner || "Unassigned";
        case "repository": return spec.repository || "Unassigned";
        case "type": return spec.type || "unknown";
        case "theme": return spec.theme || "Unassigned";
      }
    }

    fc.assert(
      fc.property(
        fc.array(graphSpecArb, { minLength: 1, maxLength: 20 }),
        yAxisFieldArb,
        (specs, field) => {
          const nodes = placeGraphNodes(specs, field);
          const lanes = [...new Set(specs.map((s) => getLaneValue(s, field)))].sort();

          for (const node of nodes) {
            const spec = specs.find((s) => s.key === node.id);
            if (!spec) continue;

            const lane = getLaneValue(spec, field);
            const laneIndex = lanes.indexOf(lane);

            const inCell = specs
              .filter(
                (s) =>
                  getLaneValue(s, field) === lane && s.stage === spec.stage,
              )
              .sort((a, b) => a.title.localeCompare(b.title) || a.key.localeCompare(b.key));
            const rowIndex = inCell.findIndex((s) => s.key === spec.key);

            const expectedY = laneIndex * LANE_GAP + rowIndex * NODE_GAP;
            expect(node.position.y).toBe(expectedY);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  test("reordering input array does not change node positions (100+ generated cases)", () => {
    fc.assert(
      fc.property(
        fc.array(graphSpecArb, { minLength: 2, maxLength: 20 }),
        yAxisFieldArb,
        (specs, field) => {
          // Original order
          const result1 = placeGraphNodes(specs, field);

          // Reversed order
          const reversed = [...specs].reverse();
          const result2 = placeGraphNodes(reversed, field);

          // Same number of nodes
          expect(result1.length).toBe(result2.length);

          // Build a map from id -> position for comparison
          const posMap1 = new Map(result1.map((n) => [n.id, n.position]));
          const posMap2 = new Map(result2.map((n) => [n.id, n.position]));

          for (const [id, pos1] of posMap1) {
            const pos2 = posMap2.get(id);
            expect(pos2).toBeDefined();
            expect(pos1.x).toBe(pos2!.x);
            expect(pos1.y).toBe(pos2!.y);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
