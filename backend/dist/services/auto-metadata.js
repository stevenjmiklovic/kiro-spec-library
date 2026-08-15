import { validateArgs } from '../security/git-validator.js';
// ─── Stop words for tag inference ────────────────────────────────────────────
const STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'shall', 'can', 'this', 'that',
    'these', 'those', 'it', 'its', 'not', 'no', 'if', 'then', 'else',
    'so', 'very', 'just', 'about', 'up', 'out', 'all', 'my', 'your',
    'our', 'we', 'they', 'them', 'their', 'what', 'which', 'who',
    'when', 'where', 'how', 'any', 'each', 'every', 'both', 'few',
    'more', 'most', 'other', 'some', 'such', 'than', 'too', 'only',
    'same', 'also', 'into', 'over', 'after', 'before', 'between',
    'under', 'again', 'further', 'once', 'here', 'there', 'why',
    'new', 'first', 'last', 'many', 'much', 'well', 'back', 'use',
    'make', 'like', 'need', 'see', 'must', 'set', 'simple', 'basic',
    'test', 'spec', 'kiro', 'specs',
]);
// ─── Git helper ──────────────────────────────────────────────────────────────
/**
 * Run a git command safely via Bun.spawn.
 * Validates user-supplied path arguments (after `--`) via the security validator.
 */
async function execGit(repoPath, args) {
    // Validate user-supplied path arguments that follow `--`
    const separatorIdx = args.indexOf('--');
    if (separatorIdx !== -1) {
        const pathArgs = args.slice(separatorIdx + 1);
        const validation = validateArgs(pathArgs);
        if (!validation.valid) {
            throw new Error(`Invalid git arguments: ${validation.reason}`);
        }
    }
    const proc = Bun.spawn(['git', '-C', repoPath, ...args], { stdout: 'pipe', stderr: 'pipe' });
    const output = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;
    if (exitCode !== 0)
        return '';
    return output.trim();
}
// ─── Extractors ──────────────────────────────────────────────────────────────
/**
 * Extract likely approvers from git log authors who have committed to this spec.
 * Identifies the primary committer (most commits) and excludes them.
 * Returns up to 5 unique secondary contributors.
 */
export async function extractApprovers(repoPath, specPath) {
    try {
        const output = await execGit(repoPath, ['log', '--format=%aN', '--', specPath]);
        if (!output)
            return [];
        const authors = output.split('\n').filter(Boolean);
        if (authors.length === 0)
            return [];
        // Count occurrences to identify primary owner
        const counts = new Map();
        for (const author of authors) {
            counts.set(author, (counts.get(author) ?? 0) + 1);
        }
        // Find the primary committer (most commits)
        let primaryAuthor = '';
        let maxCount = 0;
        for (const [name, count] of counts) {
            if (count > maxCount) {
                maxCount = count;
                primaryAuthor = name;
            }
        }
        // Return all others sorted by commit count descending, up to 5
        return [...counts.entries()]
            .filter(([name]) => name !== primaryAuthor)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name]) => name);
    }
    catch {
        return [];
    }
}
/**
 * Scan spec file contents for implementation references (PR/MR/issue URLs).
 * Checks content first, then falls back to .config.kiro tracking fields.
 */
export function extractImplementationRef(contents) {
    // Search all markdown content for URLs
    const allContent = Object.entries(contents)
        .filter(([name]) => name !== '.config.kiro')
        .map(([, content]) => content)
        .join('\n');
    // Full GitHub PR URL
    const prUrlMatch = allContent.match(/https?:\/\/github\.com\/[^\s)]+\/pull\/\d+/);
    if (prUrlMatch)
        return prUrlMatch[0];
    // Full GitHub issue URL
    const issueUrlMatch = allContent.match(/https?:\/\/github\.com\/[^\s)]+\/issues\/\d+/);
    if (issueUrlMatch)
        return issueUrlMatch[0];
    // Full GitLab MR URL
    const mrUrlMatch = allContent.match(/https?:\/\/gitlab\.com\/[^\s)]+\/-\/merge_requests\/\d+/);
    if (mrUrlMatch)
        return mrUrlMatch[0];
    // Fall back to .config.kiro fields
    const configContent = contents['.config.kiro'];
    if (configContent) {
        try {
            const config = JSON.parse(configContent);
            if (typeof config.tracking_issue === 'string')
                return config.tracking_issue;
            if (typeof config.implementation === 'string')
                return config.implementation;
        }
        catch {
            // Invalid JSON, skip
        }
    }
    return undefined;
}
/**
 * Extract a summary from the first non-heading, non-list paragraph in
 * requirements.md or design.md. Truncates to 200 characters.
 */
export function extractSummary(contents) {
    const source = contents['requirements.md'] ?? contents['design.md'];
    if (!source)
        return undefined;
    const lines = source.split('\n');
    let inParagraph = false;
    let paragraph = '';
    for (const line of lines) {
        const trimmed = line.trim();
        // Skip headings
        if (trimmed.startsWith('#')) {
            inParagraph = false;
            paragraph = '';
            continue;
        }
        // Skip list items
        if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
            inParagraph = false;
            paragraph = '';
            continue;
        }
        // Empty line ends a paragraph attempt
        if (trimmed === '') {
            if (inParagraph && paragraph.length > 0) {
                break; // Found a complete paragraph
            }
            inParagraph = false;
            paragraph = '';
            continue;
        }
        // Accumulate paragraph text
        inParagraph = true;
        paragraph += (paragraph ? ' ' : '') + trimmed;
    }
    if (!paragraph)
        return undefined;
    // Truncate to 200 characters
    if (paragraph.length > 200) {
        return paragraph.slice(0, 200);
    }
    return paragraph;
}
/**
 * Infer tags from the spec title, path segments, and high-TF terms in content.
 * Returns at most 8 unique lowercase tags.
 */
export function inferTags(title, relativePath, contents) {
    const candidates = new Map();
    // Extract from title words
    const titleWords = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
    for (const word of titleWords) {
        candidates.set(word, (candidates.get(word) ?? 0) + 3); // high weight for title
    }
    // Extract from path segments
    const pathSegments = relativePath
        .split('/')
        .filter((seg) => seg !== '.kiro' && seg !== 'specs' && seg.length > 2);
    for (const seg of pathSegments) {
        const normalized = seg.toLowerCase();
        if (!STOP_WORDS.has(normalized)) {
            candidates.set(normalized, (candidates.get(normalized) ?? 0) + 2);
        }
    }
    // Extract high-frequency terms from content
    const allContent = Object.entries(contents)
        .filter(([name]) => name.endsWith('.md'))
        .map(([, content]) => content)
        .join(' ');
    const contentWords = allContent
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
    const wordFreq = new Map();
    for (const word of contentWords) {
        wordFreq.set(word, (wordFreq.get(word) ?? 0) + 1);
    }
    // Add high-frequency content words
    for (const [word, count] of wordFreq) {
        if (count >= 2) {
            candidates.set(word, (candidates.get(word) ?? 0) + count);
        }
    }
    // Sort by weight and take top 8
    return [...candidates.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([tag]) => tag);
}
/**
 * Get the earliest commit date for files under the spec path.
 */
export async function extractCreatedAt(repoPath, specPath) {
    try {
        // Use --reverse to get oldest commit first, then take the first line
        const output = await execGit(repoPath, ['log', '--format=%aI', '--reverse', '--', specPath]);
        if (!output)
            return undefined;
        const firstLine = output.split('\n')[0];
        return firstLine || undefined;
    }
    catch {
        return undefined;
    }
}
/**
 * Get the last commit date for files under the spec path — only meaningful
 * when the spec stage is 'completed'.
 */
export async function extractCompletedAt(stage, repoPath, specPath) {
    if (stage !== 'completed')
        return undefined;
    try {
        const output = await execGit(repoPath, ['log', '--format=%aI', '-1', '--', specPath]);
        if (!output)
            return undefined;
        const date = output.split('\n')[0];
        return date || undefined;
    }
    catch {
        return undefined;
    }
}
// ─── Main Entry ──────────────────────────────────────────────────────────────
/**
 * Auto-populate metadata fields by inspecting git history and spec content.
 * Non-throwing: returns whatever fields were successfully extracted.
 *
 * @param raw - The raw spec artifacts (for access to relativePath and contents)
 * @param repoPath - Absolute path to the repository root
 * @param currentOwner - The currently assigned owner (used to exclude from approvers)
 */
export async function autoPopulate(raw, repoPath, currentOwner) {
    const specPath = raw.relativePath;
    // Determine completion stage heuristically from task content
    const stage = isCompleted(raw.contents['tasks.md']) ? 'completed' : 'tasks';
    const [approversRaw, createdAt, completedAt] = await Promise.all([
        extractApprovers(repoPath, specPath),
        extractCreatedAt(repoPath, specPath),
        extractCompletedAt(stage, repoPath, specPath),
    ]);
    // Filter out the current owner from approvers (belt-and-suspenders)
    const approvers = approversRaw.filter((name) => name !== currentOwner);
    const implementationRef = extractImplementationRef(raw.contents);
    const summary = extractSummary(raw.contents);
    const tags = inferTags(raw.slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), raw.relativePath, raw.contents);
    return {
        approvers,
        implementationRef,
        summary,
        tags: tags.length > 0 ? tags : undefined,
        createdAt,
        completedAt,
    };
}
// ─── Internal helpers ────────────────────────────────────────────────────────
/** Check if all tasks in a tasks.md are completed */
function isCompleted(tasksContent) {
    if (!tasksContent)
        return false;
    const matches = [...tasksContent.matchAll(/^\s*-\s*\[([x ~])\]/gm)];
    if (matches.length === 0)
        return false;
    return matches.every((m) => m[1] === 'x');
}
