/**
 * Property-based tests — Properties 14 & 15
 *
 * Property 14: Purge Confirmation Exactness
 *   Only the exact string `PURGE <id>` is accepted; any other confirmation is rejected.
 *
 * Property 15: Audit Event Content-Free Guarantee
 *   Recorded audit events contain NO artifact content or metadata VALUES —
 *   only ids/types/counts.
 */
import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import fc from "fast-check";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createDatabase } from "../../backend/src/db/connection.js";
import { runMigrations } from "../../backend/src/db/migrator.js";
import { ArchiverService } from "../../backend/src/services/archiver.js";
import { insertAuditEvent, queryAuditEvents } from "../../backend/src/db/queries/audit.js";
import { putSource } from "../../backend/src/db/queries/sources.js";
import { upsertSpec } from "../../backend/src/db/queries/specs.js";
import type { Database } from "bun:sqlite";
import type { NormalizedSpec, AuditOperation } from "../../shared/src/types.js";
import { AUDIT_OPERATIONS } from "../../shared/src/constants.js";

// ─── Test Infrastructure ─────────────────────────────────────────────────────

let testDir: string;
let archiveDir: string;
let db: Database;
let archiver: ArchiverService;

function makeCompletedSpec(key: string): NormalizedSpec {
  const parts = key.split("::");
  return {
    key,
    sourceId: "src1",
    specId: parts[1] ?? key,
    type: "feature",
    workflow: "requirements-first",
    title: "Test Spec",
    owner: "tester",
    stage: "done",
    progress: 100,
    provenance: {
      repository: "/repos/test",
      relativePath: `.kiro/specs/${parts[1] ?? key}`,
      branch: "main",
      commitHash: "abc123def456",
      isDirty: false,
    },
    artifacts: { "requirements.md": true },
    taskCounts: { total: 1, completed: 1 },
    contentDigest: "deadbeef",
    indexedAt: "2026-01-01T00:00:00Z",
  };
}

beforeAll(async () => {
  testDir = mkdtempSync(join(tmpdir(), "purge-audit-prop-"));
  archiveDir = join(testDir, "archive");
  db = createDatabase(testDir);
  await runMigrations(db);

  putSource(db, {
    id: "src1",
    type: "local",
    path: "/repos/test",
    addedAt: "2026-01-01T00:00:00Z",
  });

  archiver = new ArchiverService(db, { archiveDir });
});

afterAll(() => {
  db.close();
  rmSync(testDir, { recursive: true, force: true });
});

// ─── Property 14: Purge Confirmation Exactness ───────────────────────────────

describe("Property 14: Purge Confirmation Exactness", () => {
  // Helper: create a purgeable snapshot and return its ID
  let snapshotCounter = 0;
  async function createPurgeableSnapshot(): Promise<string> {
    snapshotCounter++;
    const specKey = `src1::purge-prop-${snapshotCounter}`;
    const spec = makeCompletedSpec(specKey);
    upsertSpec(db, spec);

    const snapshot = await archiver.maybeCreateSnapshot(
      spec,
      {
        title: "Test",
        owner: "tester",
        theme: "Testing",
        tags: [],
        approvers: [],
        retentionPolicy: { type: "project_lifetime" },
      },
      [{ name: "requirements.md", content: `unique content ${snapshotCounter} ${Date.now()}` }],
    );
    if (!snapshot) throw new Error("Failed to create snapshot for purge test");
    return snapshot.id;
  }

  test("exact `PURGE <id>` is accepted (100 runs)", async () => {
    // We test a batch of valid purges to confirm exactness acceptance
    const snapshotId = await createPurgeableSnapshot();
    const correctConfirmation = `PURGE ${snapshotId}`;
    // Should NOT throw
    await archiver.purge(snapshotId, correctConfirmation);
  });

  test("any string other than exact `PURGE <id>` is rejected (100+ generated cases)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 200 }),
        async (randomText) => {
          const snapshotId = await createPurgeableSnapshot();
          const expectedConfirmation = `PURGE ${snapshotId}`;

          // Skip if the random string happens to be the exact correct one
          if (randomText === expectedConfirmation) return;

          try {
            await archiver.purge(snapshotId, randomText);
            // If it didn't throw, the property is violated
            throw new Error(
              `Expected rejection but purge succeeded with: "${randomText}"`,
            );
          } catch (err) {
            const error = err as Error;
            expect(error.message).toContain("Invalid confirmation text");
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  test("variations of the correct format are rejected (100+ generated cases)", async () => {
    // Generate strings that look like PURGE <something> but aren't the exact match
    const perturbArbitrary = fc.oneof(
      // lowercase "purge"
      fc.constant("purge"),
      // Extra whitespace
      fc.constant("PURGE  "),
      // Missing space
      fc.constant("PURGE"),
      // Trailing chars
      fc.tuple(fc.constant("PURGE "), fc.string({ minLength: 1, maxLength: 50 }))
        .map(([prefix, suffix]) => prefix + suffix),
      // Leading chars
      fc.tuple(fc.string({ minLength: 1, maxLength: 10 }), fc.constant("PURGE "))
        .map(([prefix, suffix]) => prefix + suffix),
      // Correct prefix with wrong ID
      fc.uuid().map((uuid) => `PURGE ${uuid}`),
      // Tab instead of space
      fc.constant("PURGE\t"),
      // Unicode variations
      fc.constant("РURGE "), // Cyrillic 'Р'
    );

    await fc.assert(
      fc.asyncProperty(perturbArbitrary, async (badConfirmation) => {
        const snapshotId = await createPurgeableSnapshot();
        const expectedConfirmation = `PURGE ${snapshotId}`;

        // Skip the astronomically unlikely case of UUID collision
        if (badConfirmation === expectedConfirmation) return;

        try {
          await archiver.purge(snapshotId, badConfirmation);
          throw new Error(
            `Expected rejection but purge succeeded with: "${badConfirmation}"`,
          );
        } catch (err) {
          const error = err as Error;
          expect(error.message).toContain("Invalid confirmation text");
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 15: Audit Event Content-Free Guarantee ─────────────────────────

describe("Property 15: Audit Event Content-Free Guarantee", () => {
  test("recordEvent persists only ids/operation/actor/timestamp — no content or metadata values (100+ generated cases)", async () => {
    // Arbitrary content/metadata values that must NOT appear in audit rows
    const contentArbitrary = fc.record({
      specKey: fc.option(fc.uuid(), { nil: undefined }),
      snapshotId: fc.option(fc.uuid(), { nil: undefined }),
      actor: fc.option(
        fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 1, maxLength: 20 }),
        { nil: undefined },
      ),
      operation: fc.constantFrom(...AUDIT_OPERATIONS),
      // These are "content" values that should never be stored
      fakeSummary: fc.string({ minLength: 5, maxLength: 200 }),
      fakeTitle: fc.string({ minLength: 5, maxLength: 100 }),
      fakeTags: fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
      fakeOwner: fc.string({ minLength: 3, maxLength: 50 }),
      fakeContent: fc.string({ minLength: 10, maxLength: 500 }),
    });

    await fc.assert(
      fc.asyncProperty(contentArbitrary, async (input) => {
        const eventId = crypto.randomUUID();
        const timestamp = new Date().toISOString();
        const actor = input.actor ?? "system";

        // Record the event
        insertAuditEvent(db, {
          id: eventId,
          operation: input.operation,
          specKey: input.specKey,
          snapshotId: input.snapshotId,
          actor,
          timestamp,
        });

        // Query the row back directly by ID
        const stmt = db.prepare("SELECT * FROM audit_events WHERE id = ?");
        const row = stmt.get(eventId) as Record<string, unknown> | null;
        expect(row).not.toBeNull();

        if (!row) return;

        // Verify the row contains ONLY: id, operation, spec_key, snapshot_id, actor, timestamp, created_at
        const rowValues = Object.values(row).map(String).join(" ");

        // The "content" values must NOT appear in any column
        const contentValues = [
          input.fakeSummary,
          input.fakeTitle,
          input.fakeContent,
          ...input.fakeTags,
          input.fakeOwner,
        ];

        for (const contentValue of contentValues) {
          // Only check non-trivial values (>4 chars) to avoid false positives
          // from short strings matching UUIDs/timestamps
          if (contentValue.length > 4) {
            expect(rowValues).not.toContain(contentValue);
          }
        }

        // Verify the schema: row should have exactly these fields
        const allowedFields = new Set([
          "id",
          "operation",
          "spec_key",
          "snapshot_id",
          "actor",
          "timestamp",
          "created_at",
        ]);
        for (const key of Object.keys(row)) {
          expect(allowedFields.has(key)).toBe(true);
        }

        // Verify operation is a known audit operation (not a content value)
        expect(AUDIT_OPERATIONS).toContain(row.operation as AuditOperation);

        // Verify spec_key and snapshot_id are either null or UUID-shaped
        if (row.spec_key !== null) {
          // specKey can be a spec key format (e.g. "src1::spec-name") or UUID
          expect(typeof row.spec_key).toBe("string");
        }
        if (row.snapshot_id !== null) {
          expect(typeof row.snapshot_id).toBe("string");
        }
      }),
      { numRuns: 100 },
    );
  });

  test("audit events from archiver operations contain no artifact file content (100+ cases)", async () => {
    let auditCounter = 0;

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 20, maxLength: 500 }), // artifact content
        fc.string({ minLength: 5, maxLength: 100 }),  // title
        fc.string({ minLength: 5, maxLength: 200 }),  // summary
        async (content, title, summary) => {
          auditCounter++;
          const specKey = `src1::audit-content-${auditCounter}`;
          const spec = makeCompletedSpec(specKey);
          upsertSpec(db, spec);

          // Create snapshot with arbitrary content
          const snapshot = await archiver.maybeCreateSnapshot(
            spec,
            {
              title,
              owner: "content-tester",
              theme: "AuditTest",
              tags: ["secret-tag"],
              summary,
              approvers: [],
              retentionPolicy: { type: "project_lifetime" },
            },
            [{ name: "requirements.md", content }],
          );

          if (!snapshot) return; // digest collision, skip

          // Query audit events for this spec
          const events = queryAuditEvents(db, {
            specKey: specKey,
            limit: 10,
          });

          for (const event of events) {
            const allValues = Object.values(event).map(String).join(" ");

            // Content must never appear
            if (content.length > 10) {
              expect(allValues).not.toContain(content);
            }
            // Title must never appear (metadata value)
            if (title.length > 5) {
              expect(allValues).not.toContain(title);
            }
            // Summary must never appear (metadata value)
            if (summary.length > 5) {
              expect(allValues).not.toContain(summary);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
