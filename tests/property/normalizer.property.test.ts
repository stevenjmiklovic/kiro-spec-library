/**
 * Property-based tests for backend/src/services/normalizer.ts
 *
 * Properties tested:
 *  1. Normalizer Determinism
 *  2. Spec Key Stability
 *  3. Progress Bounds
 *  4. Task Counting
 */
import { describe, test, expect } from 'bun:test';
import * as fc from 'fast-check';
import {
  normalize,
  deriveKey,
  calculateProgress,
  countTasks,
  type RawSpecArtifacts,
} from '../../backend/src/services/normalizer.js';
import type { ArtifactManifest, Source, SpecProvenance, TaskCounts } from '../../shared/src/types.js';

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const arbProvenance: fc.Arbitrary<SpecProvenance> = fc.record({
  repository: fc.string({ minLength: 1, maxLength: 30 }),
  relativePath: fc.string({ minLength: 1, maxLength: 60 }),
  branch: fc.string({ minLength: 1, maxLength: 20 }),
  commitHash: fc.hexaString({ minLength: 40, maxLength: 40 }),
  isDirty: fc.boolean(),
  remoteUrl: fc.option(fc.webUrl(), { nil: undefined }),
});

const arbSource: fc.Arbitrary<Source> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 30 }),
  type: fc.constantFrom('local' as const, 'remote' as const),
  path: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  url: fc.option(fc.webUrl(), { nil: undefined }),
  branch: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  webUrlTemplate: fc.option(fc.string(), { nil: undefined }),
  addedAt: fc.date().map((d) => d.toISOString()),
});

const ARTIFACT_FILES = [
  'requirements.md',
  'design.md',
  'tasks.md',
  'bugfix.md',
  '.config.kiro',
  'tasks.meta.json',
  'spec-library.json',
] as const;

/** Generate a valid contents record (at least one file) */
const arbContents: fc.Arbitrary<Record<string, string>> = fc
  .subarray([...ARTIFACT_FILES], { minLength: 1 })
  .chain((files) =>
    fc.tuple(...files.map(() => fc.string({ maxLength: 200 }))).map((bodies) => {
      const rec: Record<string, string> = {};
      for (let i = 0; i < files.length; i++) {
        rec[files[i]!] = bodies[i]!;
      }
      return rec;
    }),
  );

const arbConfigKiro = fc.option(
  fc.record({
    specId: fc.string({ minLength: 1, maxLength: 30 }),
    workflowType: fc.option(
      fc.constantFrom('requirements-first' as const, 'design-first' as const),
      { nil: undefined },
    ),
    specType: fc.option(
      fc.constantFrom('feature' as const, 'bugfix' as const, 'quick' as const),
      { nil: undefined },
    ),
  }),
  { nil: null },
);

const arbRaw: fc.Arbitrary<RawSpecArtifacts> = fc.record({
  slug: fc.string({ minLength: 1, maxLength: 40 }),
  relativePath: fc.string({ minLength: 1, maxLength: 60 }),
  config: arbConfigKiro,
  contents: arbContents,
  provenance: arbProvenance,
});

// ─── Property 1: Normalizer Determinism ──────────────────────────────────────

describe('Property 1: Normalizer Determinism', () => {
  test('identical RawSpecArtifacts + Source produce identical normalize() output (excluding indexedAt)', () => {
    fc.assert(
      fc.property(arbRaw, arbSource, (raw, source) => {
        const a = normalize(raw, source);
        const b = normalize(raw, source);

        // Exclude indexedAt (non-deterministic timestamp)
        const { indexedAt: _ia, ...restA } = a;
        const { indexedAt: _ib, ...restB } = b;

        expect(restA).toEqual(restB);
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 2: Spec Key Stability ─────────────────────────────────────────

describe('Property 2: Spec Key Stability', () => {
  test('deriveKey is stable for the same inputs', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
        fc.string({ minLength: 1, maxLength: 60 }),
        (sourceId, specId, relativePath) => {
          const key1 = deriveKey(sourceId, specId, relativePath);
          const key2 = deriveKey(sourceId, specId, relativePath);
          expect(key1).toBe(key2);
        },
      ),
      { numRuns: 100 },
    );
  });

  test('specId present => key is `${sourceId}::${specId}`', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 60 }),
        (sourceId, specId, relativePath) => {
          const key = deriveKey(sourceId, specId, relativePath);
          expect(key).toBe(`${sourceId}::${specId}`);
        },
      ),
      { numRuns: 100 },
    );
  });

  test('specId absent => key is `${sourceId}::${relativePath}`', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 60 }),
        (sourceId, relativePath) => {
          const key = deriveKey(sourceId, null, relativePath);
          expect(key).toBe(`${sourceId}::${relativePath}`);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 3: Progress Bounds ─────────────────────────────────────────────

describe('Property 3: Progress Bounds', () => {
  const arbArtifactManifest: fc.Arbitrary<ArtifactManifest> = fc.record({
    'requirements.md': fc.option(fc.constant(true), { nil: undefined }),
    'bugfix.md': fc.option(fc.constant(true), { nil: undefined }),
    'design.md': fc.option(fc.constant(true), { nil: undefined }),
    'tasks.md': fc.option(fc.constant(true), { nil: undefined }),
    '.config.kiro': fc.option(fc.constant(true), { nil: undefined }),
    'tasks.meta.json': fc.option(fc.constant(true), { nil: undefined }),
    'spec-library.json': fc.option(fc.constant(true), { nil: undefined }),
  });

  const arbTaskCounts: fc.Arbitrary<TaskCounts> = fc
    .record({
      total: fc.nat({ max: 200 }),
      completed: fc.nat({ max: 200 }),
    })
    .filter((tc) => tc.completed <= tc.total);

  test('progress is always in [0, 100]', () => {
    fc.assert(
      fc.property(arbArtifactManifest, arbTaskCounts, (artifacts, taskCounts) => {
        const progress = calculateProgress(artifacts, taskCounts);
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 },
    );
  });

  test('progress is monotonic as completed increases (same artifacts, same total)', () => {
    fc.assert(
      fc.property(
        arbArtifactManifest,
        fc.nat({ max: 200 }).filter((n) => n > 0),
        fc.nat({ max: 199 }),
        (artifacts, total, offset) => {
          const completedLow = Math.min(offset, total);
          const completedHigh = total; // max possible completed

          const progressLow = calculateProgress(artifacts, { total, completed: completedLow });
          const progressHigh = calculateProgress(artifacts, { total, completed: completedHigh });

          expect(progressHigh).toBeGreaterThanOrEqual(progressLow);
        },
      ),
      { numRuns: 100 },
    );
  });

  test('progress is monotonic as artifacts are added', () => {
    fc.assert(
      fc.property(arbTaskCounts, (taskCounts) => {
        const noArtifacts: ArtifactManifest = {};
        const withReqs: ArtifactManifest = { 'requirements.md': true };
        const withReqsDesign: ArtifactManifest = { 'requirements.md': true, 'design.md': true };
        const withAll: ArtifactManifest = {
          'requirements.md': true,
          'design.md': true,
          'tasks.md': true,
        };

        const p0 = calculateProgress(noArtifacts, taskCounts);
        const p1 = calculateProgress(withReqs, taskCounts);
        const p2 = calculateProgress(withReqsDesign, taskCounts);
        const p3 = calculateProgress(withAll, taskCounts);

        expect(p1).toBeGreaterThanOrEqual(p0);
        expect(p2).toBeGreaterThanOrEqual(p1);
        expect(p3).toBeGreaterThanOrEqual(p2);
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 4: Task Counting ───────────────────────────────────────────────

describe('Property 4: Task Counting', () => {
  /** Generate a markdown string with a known count of checkboxes */
  const arbTaskContent: fc.Arbitrary<{ content: string; expectedTotal: number; expectedCompleted: number }> = fc
    .array(
      fc.record({
        type: fc.constantFrom('done' as const, 'open' as const, 'partial' as const, 'text' as const),
        indent: fc.nat({ max: 4 }),
        text: fc.string({ minLength: 1, maxLength: 40 }).filter((s) => !s.includes('\n')),
      }),
      { minLength: 0, maxLength: 50 },
    )
    .map((lines) => {
      let total = 0;
      let completed = 0;
      const contentLines: string[] = [];

      for (const line of lines) {
        const indent = ' '.repeat(line.indent);
        switch (line.type) {
          case 'done':
            contentLines.push(`${indent}- [x] ${line.text}`);
            total++;
            completed++;
            break;
          case 'open':
            contentLines.push(`${indent}- [ ] ${line.text}`);
            total++;
            break;
          case 'partial':
            contentLines.push(`${indent}- [~] ${line.text}`);
            total++;
            break;
          case 'text':
            contentLines.push(`${indent}${line.text}`);
            break;
        }
      }

      return { content: contentLines.join('\n'), expectedTotal: total, expectedCompleted: completed };
    });

  test('total = count of [x], [ ], [~] checkbox lines; completed = only [x]', () => {
    fc.assert(
      fc.property(arbTaskContent, ({ content, expectedTotal, expectedCompleted }) => {
        const result = countTasks(content);
        expect(result.total).toBe(expectedTotal);
        expect(result.completed).toBe(expectedCompleted);
      }),
      { numRuns: 100 },
    );
  });

  test('undefined/empty content returns zero counts', () => {
    expect(countTasks(undefined)).toEqual({ total: 0, completed: 0 });
    expect(countTasks('')).toEqual({ total: 0, completed: 0 });
  });

  test('completed is always <= total', () => {
    fc.assert(
      fc.property(arbTaskContent, ({ content }) => {
        const result = countTasks(content);
        expect(result.completed).toBeLessThanOrEqual(result.total);
      }),
      { numRuns: 100 },
    );
  });
});
