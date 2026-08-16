/**
 * Scanner integration test (Task 21.1)
 *
 * Exercises the full discovery -> normalization -> storage pipeline against a
 * temporary local repository, and verifies error isolation (one failing source
 * does not abort the scan).
 */
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Database } from 'bun:sqlite';

import { createDatabase } from '../../backend/src/db/connection.js';
import { runMigrations } from '../../backend/src/db/migrator.js';
import { ScannerService } from '../../backend/src/services/scanner.js';
import { listSpecs } from '../../backend/src/db/queries/specs.js';
import { putSource } from '../../backend/src/db/queries/sources.js';
import type { Source } from '../../shared/src/types.js';

let dataDir: string;
let repoDir: string;
let db: Database;
let scanner: ScannerService;

/** Create a `.kiro/specs/<slug>/` spec with the given artifact contents. */
function writeSpec(
  repo: string,
  slug: string,
  files: Record<string, string>,
): void {
  const dir = join(repo, '.kiro', 'specs', slug);
  mkdirSync(dir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(dir, name), content);
  }
}

beforeAll(async () => {
  dataDir = mkdtempSync(join(tmpdir(), 'scanner-data-'));
  repoDir = mkdtempSync(join(tmpdir(), 'scanner-repo-'));

  // A completed feature spec.
  writeSpec(repoDir, 'agent-memory', {
    'requirements.md': '# Agent Memory\n\nPersistent memory.',
    'design.md': '# Design\n\nArchitecture.',
    'tasks.md': '- [x] Task one\n- [x] Task two\n- [ ] Task three\n',
  });
  // A quick spec (tasks only).
  writeSpec(repoDir, 'quick-fix', {
    'tasks.md': '- [ ] Do the thing\n',
  });

  db = createDatabase(dataDir);
  await runMigrations(db);
  scanner = new ScannerService(db, dataDir);
});

afterAll(() => {
  if (db) db.close();
  rmSync(dataDir, { recursive: true, force: true });
  rmSync(repoDir, { recursive: true, force: true });
});

describe('Scanner integration', () => {
  test('discovers, normalizes, and stores local specs', async () => {
    const source: Source = {
      id: 'local-1',
      type: 'local',
      path: repoDir,
      addedAt: new Date().toISOString(),
    };
    putSource(db, source);

    const result = await scanner.triggerScan([source]);

    expect(result.status).toBe('completed');
    expect(result.specsDiscovered).toBe(2);
    expect(result.errors).toHaveLength(0);

    const stored = listSpecs(db, { limit: 100, offset: 0 });
    const keys = stored.map((s) => s.key).sort();
    expect(keys).toContain('local-1::.kiro/specs/agent-memory');
    expect(keys).toContain('local-1::.kiro/specs/quick-fix');

    // Normalization results are persisted.
    const agentMem = stored.find((s) => s.key === 'local-1::.kiro/specs/agent-memory');
    expect(agentMem).toBeDefined();
    expect(agentMem!.type).toBe('feature');
    expect(agentMem!.stage).toBe('tasks'); // has tasks.md, not all complete
    expect(agentMem!.total_tasks).toBe(3);
    expect(agentMem!.completed_tasks).toBe(2);
    expect(agentMem!.progress).toBeGreaterThan(0);
    expect(agentMem!.progress).toBeLessThanOrEqual(100);

    const quick = stored.find((s) => s.key === 'local-1::.kiro/specs/quick-fix');
    expect(quick!.type).toBe('quick');
  });

  test('scan syncs specs_fts so a search term matches the scanned content', () => {
    // Relies on the scan above having indexed agent-memory's requirements.md
    // ("Persistent memory.") into specs_fts.
    const results = listSpecs(db, { query: 'Persistent', limit: 10, offset: 0 });
    const keys = results.map((s) => s.key);
    expect(keys).toContain('local-1::.kiro/specs/agent-memory');
    expect(keys).not.toContain('local-1::.kiro/specs/quick-fix');
  });

  test('error isolation: one failing source does not abort the scan', async () => {
    const good: Source = {
      id: 'good-src',
      type: 'local',
      path: repoDir,
      addedAt: new Date().toISOString(),
    };
    // Remote source with a URL containing shell metacharacters — the git
    // command builder rejects it, throwing inside scanSource; the scan must
    // isolate that failure and still process the good source.
    const bad: Source = {
      id: 'bad-src',
      type: 'remote',
      url: 'https://evil.example.com/$(rm -rf ~).git',
      branch: 'main',
      addedAt: new Date().toISOString(),
    };
    putSource(db, good);
    putSource(db, bad);

    const result = await scanner.triggerScan([good, bad]);

    expect(result.status).toBe('partial_failure');
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    expect(result.errors.some((e) => e.sourceId === 'bad-src')).toBe(true);

    // The good source's specs are still discovered and stored.
    expect(result.specsDiscovered).toBeGreaterThanOrEqual(2);
    const stored = listSpecs(db, { limit: 100, offset: 0 });
    expect(stored.some((s) => s.key.startsWith('good-src::'))).toBe(true);
  });

  test('an empty local source (no .kiro/specs) yields zero specs without error', async () => {
    const emptyRepo = mkdtempSync(join(tmpdir(), 'scanner-empty-'));
    try {
      const source: Source = {
        id: 'empty-src',
        type: 'local',
        path: emptyRepo,
        addedAt: new Date().toISOString(),
      };
      putSource(db, source);
      const result = await scanner.triggerScan([source]);
      expect(result.status).toBe('completed');
      expect(result.errors).toHaveLength(0);
    } finally {
      rmSync(emptyRepo, { recursive: true, force: true });
    }
  });
});
