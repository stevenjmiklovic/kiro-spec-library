/**
 * Property-based tests — Properties 6, 7, 8, 9 (security)
 *
 * Property 6: Path Traversal Rejection — any path with a `..` segment is rejected.
 * Property 7: Symlink Escape Prevention — symlinks resolving outside the root are rejected.
 * Property 8: Git Argument Safety — shell metacharacters and forbidden options are rejected.
 * Property 9: Credential Redaction Completeness — credential patterns are replaced; no secret survives.
 */
import { describe, test, expect, afterAll } from 'bun:test';
import fc from 'fast-check';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { validatePathSync, validatePath } from '../../backend/src/security/path-validator.js';
import { validateArgs } from '../../backend/src/security/git-validator.js';
import { redact } from '../../shared/src/redactor.js';
import { FORBIDDEN_GIT_ARGS } from '../../shared/src/constants.js';

const tmpDirs: string[] = [];
function makeTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// ─── Property 6: Path Traversal Rejection ────────────────────────────────────

describe('Property 6: Path Traversal Rejection', () => {
  const arbSegment = fc
    .string({ minLength: 1, maxLength: 8 })
    .filter((s) => s !== '..' && !s.includes('/') && !s.includes('\\'));

  test('any path containing a `..` segment is rejected', () => {
    fc.assert(
      fc.property(
        fc.array(arbSegment, { maxLength: 4 }),
        fc.array(arbSegment, { maxLength: 4 }),
        (before, after) => {
          const segs = [...before, '..', ...after];
          const path = segs.join('/');
          const result = validatePathSync(path, '/tmp/source-root');
          expect(result.valid).toBe(false);
          expect(result.reason).toContain('traversal');
        },
      ),
      { numRuns: 100 },
    );
  });

  test('paths without `..` and inside root are accepted', () => {
    fc.assert(
      fc.property(fc.array(arbSegment, { minLength: 1, maxLength: 5 }), (segs) => {
        const path = segs.join('/');
        const result = validatePathSync(path, '/tmp/source-root');
        // No traversal component => not rejected for traversal reasons.
        if (!result.valid) {
          expect(result.reason).not.toContain('traversal');
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 7: Symlink Escape Prevention ───────────────────────────────────

describe('Property 7: Symlink Escape Prevention', () => {
  test('a symlink inside the root that points outside is rejected', async () => {
    const root = makeTmp('sec-root-');
    const outside = makeTmp('sec-outside-');
    const secretFile = join(outside, 'secret.txt');
    writeFileSync(secretFile, 'sensitive');

    const linkName = 'escape-link';
    symlinkSync(secretFile, join(root, linkName));

    const result = await validatePath(linkName, root);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Symlink escapes source root');
  });

  test('a real file inside the root validates', async () => {
    const root = makeTmp('sec-root-ok-');
    mkdirSync(join(root, 'sub'), { recursive: true });
    const inside = join('sub', 'file.md');
    writeFileSync(join(root, inside), '# ok');

    const result = await validatePath(inside, root);
    expect(result.valid).toBe(true);
  });

  test('a symlink inside the root pointing inside the root validates', async () => {
    const root = makeTmp('sec-root-inlink-');
    const target = join(root, 'target.md');
    writeFileSync(target, '# target');
    symlinkSync(target, join(root, 'inlink'));

    const result = await validatePath('inlink', root);
    expect(result.valid).toBe(true);
  });
});

// ─── Property 8: Git Argument Safety ─────────────────────────────────────────

describe('Property 8: Git Argument Safety', () => {
  const METACHARS = [';', '&', '|', '`', '$', '(', ')', '{', '}', '!', '<', '>', '\\', "'", '"', '*', '?', '[', ']', '\n', '\r'];

  test('any argument containing a shell metacharacter is rejected', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 10 }),
        fc.constantFrom(...METACHARS),
        fc.string({ maxLength: 10 }),
        (pre, meta, post) => {
          const arg = `${pre}${meta}${post}`;
          const result = validateArgs([arg]);
          expect(result.valid).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  test('forbidden git options are always rejected (exact or key=value form)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...FORBIDDEN_GIT_ARGS),
        fc.boolean(),
        fc.string({ maxLength: 8 }).filter((s) => !/[;&|`$(){}!<>\\'"*?\[\]\n\r=]/.test(s)),
        (forbidden, asKeyValue, val) => {
          const arg = asKeyValue ? `${forbidden}=${val}` : (forbidden as string);
          const result = validateArgs([arg]);
          expect(result.valid).toBe(false);
          expect(result.reason).toContain('Forbidden');
        },
      ),
      { numRuns: 100 },
    );
  });

  test('clean arguments (no metachars, not forbidden) are accepted', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc
            .string({ minLength: 1, maxLength: 12 })
            .filter(
              (s) =>
                !/[;&|`$(){}!<>\\'"*?\[\]\n\r]/.test(s) &&
                !FORBIDDEN_GIT_ARGS.some(
                  (f) => s.toLowerCase() === f || s.toLowerCase().startsWith(f + '='),
                ),
            ),
          { maxLength: 6 },
        ),
        (args) => {
          expect(validateArgs(args).valid).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 9: Credential Redaction Completeness ───────────────────────────

describe('Property 9: Credential Redaction Completeness', () => {
  const REDACTED = '[REDACTED]';

  test('AWS access key IDs are fully redacted', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('AKIA', 'ASIA'),
        fc.stringMatching(/^[A-Z0-9]{16}$/),
        fc.string({ maxLength: 20 }),
        fc.string({ maxLength: 20 }),
        (prefix, body, pre, post) => {
          const secret = `${prefix}${body}`;
          const out = redact(`${pre} ${secret} ${post}`);
          expect(out).not.toContain(secret);
          expect(out).toContain(REDACTED);
        },
      ),
      { numRuns: 100 },
    );
  });

  test('GitHub PATs are fully redacted', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('ghp_', 'ghs_'),
        fc.stringMatching(/^[A-Za-z0-9_]{36,40}$/),
        (prefix, body) => {
          const secret = `${prefix}${body}`;
          const out = redact(`token=${secret}`);
          expect(out).not.toContain(secret);
          expect(out).toContain(REDACTED);
        },
      ),
      { numRuns: 100 },
    );
  });

  test('password fields are redacted', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('password', 'passwd', 'pwd'),
        fc.stringMatching(/^[^\s'"]{8,24}$/),
        (key, val) => {
          const line = `${key}: ${val}`;
          const out = redact(line);
          expect(out).not.toContain(val);
          expect(out).toContain(REDACTED);
        },
      ),
      { numRuns: 100 },
    );
  });

  test('PEM private key blocks are redacted', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[A-Za-z0-9+/=\n]{20,80}$/), (body) => {
        const secret = `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----`;
        const out = redact(`key:\n${secret}\ndone`);
        expect(out).not.toContain(body.trim() || 'x');
        expect(out).toContain(REDACTED);
      }),
      { numRuns: 100 },
    );
  });

  test('content with no credentials is returned unchanged', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 60 }).filter((s) => !/AKIA|ASIA|ghp_|ghs_|BEGIN|password|passwd|pwd|Bearer|:\/\//i.test(s)),
        (clean) => {
          expect(redact(clean)).toBe(clean);
        },
      ),
      { numRuns: 100 },
    );
  });
});
