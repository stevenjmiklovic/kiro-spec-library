import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  extractApprovers,
  extractImplementationRef,
  extractSummary,
  inferTags,
  extractCreatedAt,
  extractCompletedAt,
  autoPopulate,
} from '../../backend/src/services/auto-metadata.js';
import type { RawSpecArtifacts } from '../../backend/src/services/normalizer.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function gitExec(cwd: string, args: string[]): Promise<void> {
  const proc = Bun.spawn(['git', ...args], {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`git ${args.join(' ')} failed (exit ${exitCode}): ${stderr}`);
  }
}

function createTempRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'auto-meta-test-'));
  return dir;
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('auto-metadata', () => {
  let repoPath: string;
  const specRelPath = '.kiro/specs/my-feature';

  beforeAll(async () => {
    repoPath = createTempRepo();

    // Initialize git repo
    await gitExec(repoPath, ['init']);
    await gitExec(repoPath, ['config', 'user.name', 'Alice Author']);
    await gitExec(repoPath, ['config', 'user.email', 'alice@example.com']);
    await gitExec(repoPath, ['config', 'commit.gpgsign', 'false']);

    // Create spec directory structure
    const specDir = join(repoPath, specRelPath);
    mkdirSync(specDir, { recursive: true });

    // First commit by Alice (primary owner)
    writeFileSync(
      join(specDir, 'requirements.md'),
      '# User Authentication\n\nImplement OAuth2 login flow for the web application.\n\n- Must support Google and GitHub providers\n',
    );
    await gitExec(repoPath, ['add', '.']);
    await gitExec(repoPath, ['commit', '-m', 'initial requirements']);

    // Second commit by Bob
    await gitExec(repoPath, ['config', 'user.name', 'Bob Reviewer']);
    await gitExec(repoPath, ['config', 'user.email', 'bob@example.com']);
    writeFileSync(
      join(specDir, 'design.md'),
      '# Authentication Design\n\nThis design covers the OAuth2 integration.\n\nSee https://github.com/org/repo/pull/42 for the implementation.\n',
    );
    await gitExec(repoPath, ['add', '.']);
    await gitExec(repoPath, ['commit', '-m', 'add design doc']);

    // Third commit by Charlie
    await gitExec(repoPath, ['config', 'user.name', 'Charlie Dev']);
    await gitExec(repoPath, ['config', 'user.email', 'charlie@example.com']);
    writeFileSync(
      join(specDir, 'tasks.md'),
      '# Tasks\n\n- [x] Set up OAuth client IDs\n- [x] Implement callback handler\n- [x] Add session management\n',
    );
    await gitExec(repoPath, ['add', '.']);
    await gitExec(repoPath, ['commit', '-m', 'add tasks']);

    // Fourth commit by Alice again (makes her the majority committer)
    await gitExec(repoPath, ['config', 'user.name', 'Alice Author']);
    await gitExec(repoPath, ['config', 'user.email', 'alice@example.com']);
    writeFileSync(
      join(specDir, '.config.kiro'),
      JSON.stringify({ specId: 'auth-feature', specType: 'feature' }),
    );
    await gitExec(repoPath, ['add', '.']);
    await gitExec(repoPath, ['commit', '-m', 'add config']);
  });

  afterAll(() => {
    rmSync(repoPath, { recursive: true, force: true });
  });

  // ─── extractApprovers ────────────────────────────────────────────────────

  describe('extractApprovers', () => {
    test('returns unique committers excluding primary owner', async () => {
      const approvers = await extractApprovers(repoPath, specRelPath);
      // Alice has 2 commits (primary), Bob and Charlie have 1 each
      expect(approvers).not.toContain('Alice Author');
      expect(approvers).toContain('Bob Reviewer');
      expect(approvers).toContain('Charlie Dev');
    });

    test('returns at most 5 approvers', async () => {
      const approvers = await extractApprovers(repoPath, specRelPath);
      expect(approvers.length).toBeLessThanOrEqual(5);
    });

    test('returns empty array for non-existent path', async () => {
      const approvers = await extractApprovers(repoPath, 'no/such/path');
      expect(approvers).toEqual([]);
    });
  });

  // ─── extractImplementationRef ────────────────────────────────────────────

  describe('extractImplementationRef', () => {
    test('finds GitHub PR URL in content', () => {
      const contents: Record<string, string> = {
        'design.md': 'See https://github.com/org/repo/pull/42 for details.',
      };
      expect(extractImplementationRef(contents)).toBe(
        'https://github.com/org/repo/pull/42',
      );
    });

    test('finds GitHub issue URL', () => {
      const contents: Record<string, string> = {
        'requirements.md': 'Tracks https://github.com/org/repo/issues/99',
      };
      expect(extractImplementationRef(contents)).toBe(
        'https://github.com/org/repo/issues/99',
      );
    });

    test('finds GitLab MR URL', () => {
      const contents: Record<string, string> = {
        'design.md': 'MR: https://gitlab.com/group/project/-/merge_requests/15',
      };
      expect(extractImplementationRef(contents)).toBe(
        'https://gitlab.com/group/project/-/merge_requests/15',
      );
    });

    test('falls back to .config.kiro tracking_issue', () => {
      const contents: Record<string, string> = {
        'requirements.md': 'No URLs here.',
        '.config.kiro': JSON.stringify({
          specId: 'test',
          tracking_issue: 'https://jira.example.com/PROJ-123',
        }),
      };
      expect(extractImplementationRef(contents)).toBe(
        'https://jira.example.com/PROJ-123',
      );
    });

    test('falls back to .config.kiro implementation', () => {
      const contents: Record<string, string> = {
        '.config.kiro': JSON.stringify({
          specId: 'test',
          implementation: 'https://github.com/org/repo/pull/77',
        }),
      };
      expect(extractImplementationRef(contents)).toBe(
        'https://github.com/org/repo/pull/77',
      );
    });

    test('returns undefined when no ref found', () => {
      const contents: Record<string, string> = {
        'requirements.md': 'Just text with no URLs.',
      };
      expect(extractImplementationRef(contents)).toBeUndefined();
    });
  });

  // ─── extractSummary ──────────────────────────────────────────────────────

  describe('extractSummary', () => {
    test('extracts first paragraph from requirements.md', () => {
      const contents: Record<string, string> = {
        'requirements.md':
          '# Title\n\nThis is the first paragraph of the spec.\n\n- List item\n',
      };
      expect(extractSummary(contents)).toBe(
        'This is the first paragraph of the spec.',
      );
    });

    test('falls back to design.md', () => {
      const contents: Record<string, string> = {
        'design.md': '# Design\n\nArchitecture overview for the service.\n',
      };
      expect(extractSummary(contents)).toBe(
        'Architecture overview for the service.',
      );
    });

    test('truncates to 200 characters', () => {
      const longPara = 'A'.repeat(250);
      const contents: Record<string, string> = {
        'requirements.md': `# Title\n\n${longPara}\n`,
      };
      const result = extractSummary(contents);
      expect(result?.length).toBe(200);
    });

    test('returns undefined when no paragraph found', () => {
      const contents: Record<string, string> = {
        'tasks.md': '- [x] Done\n- [ ] Todo\n',
      };
      expect(extractSummary(contents)).toBeUndefined();
    });

    test('skips headings and list items', () => {
      const contents: Record<string, string> = {
        'requirements.md':
          '# Title\n\n## Subtitle\n\n- item\n- item\n\nActual paragraph here.\n',
      };
      expect(extractSummary(contents)).toBe('Actual paragraph here.');
    });
  });

  // ─── inferTags ───────────────────────────────────────────────────────────

  describe('inferTags', () => {
    test('extracts tags from title', () => {
      const tags = inferTags('User Authentication', '.kiro/specs/auth', {});
      expect(tags).toContain('user');
      expect(tags).toContain('authentication');
    });

    test('extracts tags from path segments', () => {
      const tags = inferTags('My Feature', '.kiro/specs/payment-gateway', {});
      expect(tags).toContain('payment-gateway');
    });

    test('extracts high-TF terms from content', () => {
      const contents: Record<string, string> = {
        'requirements.md': 'database database database migration migration migration',
      };
      const tags = inferTags('Setup', '.kiro/specs/setup', contents);
      expect(tags).toContain('database');
      expect(tags).toContain('migration');
    });

    test('excludes stop words', () => {
      const tags = inferTags(
        'The very simple and basic test',
        '.kiro/specs/test',
        {},
      );
      expect(tags).not.toContain('the');
      expect(tags).not.toContain('and');
      expect(tags).not.toContain('very');
    });

    test('returns at most 8 tags', () => {
      const lotsOfContent = Array.from(
        { length: 20 },
        (_, i) => `word${i} `.repeat(10),
      ).join(' ');
      const tags = inferTags(
        'One Two Three Four Five Six Seven Eight Nine Ten',
        '.kiro/specs/many-segments-here-for-testing',
        { 'requirements.md': lotsOfContent },
      );
      expect(tags.length).toBeLessThanOrEqual(8);
    });
  });

  // ─── extractCreatedAt ────────────────────────────────────────────────────

  describe('extractCreatedAt', () => {
    test('returns the earliest commit date for the spec', async () => {
      const date = await extractCreatedAt(repoPath, specRelPath);
      expect(date).toBeDefined();
      // Should be an ISO 8601 date string
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('returns undefined for non-existent path', async () => {
      const date = await extractCreatedAt(repoPath, 'no/such/path');
      expect(date).toBeUndefined();
    });
  });

  // ─── extractCompletedAt ──────────────────────────────────────────────────

  describe('extractCompletedAt', () => {
    test('returns date when stage is completed', async () => {
      const date = await extractCompletedAt('completed', repoPath, specRelPath);
      expect(date).toBeDefined();
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('returns undefined when stage is not completed', async () => {
      const date = await extractCompletedAt('tasks', repoPath, specRelPath);
      expect(date).toBeUndefined();
    });

    test('returns undefined when stage is requirements', async () => {
      const date = await extractCompletedAt('requirements', repoPath, specRelPath);
      expect(date).toBeUndefined();
    });
  });

  // ─── autoPopulate ────────────────────────────────────────────────────────

  describe('autoPopulate', () => {
    test('orchestrates all extractors', async () => {
      const raw: RawSpecArtifacts = {
        slug: 'my-feature',
        relativePath: specRelPath,
        config: { specId: 'auth-feature', specType: 'feature' },
        contents: {
          'requirements.md':
            '# User Authentication\n\nImplement OAuth2 login flow for the web application.\n',
          'design.md':
            '# Authentication Design\n\nThis design covers the OAuth2 integration.\n\nSee https://github.com/org/repo/pull/42 for the implementation.\n',
          'tasks.md':
            '# Tasks\n\n- [x] Set up OAuth client IDs\n- [x] Implement callback handler\n- [x] Add session management\n',
        },
        provenance: {
          repository: repoPath,
          relativePath: specRelPath,
          branch: 'main',
          commitHash: 'abc123',
          isDirty: false,
        },
      };

      const result = await autoPopulate(raw, repoPath, 'Alice Author');

      // Approvers should exclude the owner
      expect(result.approvers).toBeDefined();
      expect(result.approvers!).not.toContain('Alice Author');
      expect(result.approvers!.length).toBeGreaterThan(0);

      // Should find the PR URL
      expect(result.implementationRef).toBe(
        'https://github.com/org/repo/pull/42',
      );

      // Should extract summary
      expect(result.summary).toBeDefined();
      expect(result.summary).toContain('OAuth2');

      // Should have tags
      expect(result.tags).toBeDefined();
      expect(result.tags!.length).toBeGreaterThan(0);

      // Should have createdAt
      expect(result.createdAt).toBeDefined();
    });

    test('handles empty contents gracefully', async () => {
      const raw: RawSpecArtifacts = {
        slug: 'empty-spec',
        relativePath: 'nonexistent/path',
        config: null,
        contents: {},
        provenance: {
          repository: repoPath,
          relativePath: 'nonexistent/path',
          branch: 'main',
          commitHash: 'def456',
          isDirty: false,
        },
      };

      const result = await autoPopulate(raw, repoPath, 'Nobody');

      expect(result.approvers).toEqual([]);
      expect(result.implementationRef).toBeUndefined();
      expect(result.summary).toBeUndefined();
      expect(result.createdAt).toBeUndefined();
    });
  });
});
