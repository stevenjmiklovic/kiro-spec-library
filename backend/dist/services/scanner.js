import { REMOTE_TIMEOUT_SECONDS, SPEC_ARTIFACTS } from '@kiro-spec-library/shared';
import { validatePath } from '../security/path-validator.js';
import { validateArgs, buildFetchCommand, buildCloneCommand } from '../security/git-validator.js';
import { normalize } from './normalizer.js';
import { autoPopulate } from './auto-metadata.js';
import { getOverlay, upsertOverlay } from '../db/queries/metadata.js';
import { ConfigKiroSchema } from '@kiro-spec-library/shared';
import { insertScan, updateScan } from '../db/queries/scan-history.js';
import { upsertSpec } from '../db/queries/specs.js';
import { join, relative } from 'node:path';
import { readdirSync, existsSync } from 'node:fs';
export class ScannerService {
    db;
    dataDir;
    inFlight = null;
    constructor(db, dataDir) {
        this.db = db;
        this.dataDir = dataDir;
    }
    async triggerScan(sources) {
        // Single-flight guard: reuse in-progress scan
        if (this.inFlight) {
            return this.inFlight;
        }
        const promise = this.executeScan(sources);
        this.inFlight = promise;
        try {
            return await promise;
        }
        finally {
            this.inFlight = null;
        }
    }
    async executeScan(sources) {
        const runId = crypto.randomUUID();
        const startedAt = new Date().toISOString();
        const errors = [];
        let specsDiscovered = 0;
        insertScan(this.db, { runId, startedAt, status: 'running' });
        for (const source of sources) {
            try {
                const specs = await this.scanSource(source);
                specsDiscovered += specs.length;
                for (const spec of specs) {
                    upsertSpec(this.db, spec);
                }
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                const category = this.categorizeError(err);
                errors.push({
                    sourceId: source.id,
                    category,
                    message,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        const completedAt = new Date().toISOString();
        const status = errors.length === 0
            ? 'completed'
            : errors.length < sources.length
                ? 'partial_failure'
                : 'partial_failure';
        updateScan(this.db, runId, {
            completedAt,
            status,
            specsDiscovered,
            errors: errors.length > 0 ? JSON.stringify(errors) : undefined,
        });
        return {
            runId,
            startedAt,
            completedAt,
            status,
            sourcesScanned: sources.length,
            specsDiscovered,
            errors,
        };
    }
    async scanSource(source) {
        if (source.type === 'remote') {
            await this.refreshRemote(source);
        }
        const repoPath = source.type === 'local'
            ? source.path
            : join(this.dataDir, 'clones', source.id);
        const specDirs = this.discoverSpecDirs(repoPath, source.id);
        const results = [];
        for (const specDir of specDirs) {
            try {
                const raw = await this.readArtifacts(specDir, source);
                const normalized = normalize(raw, source);
                // Auto-populate metadata for specs without an existing overlay
                try {
                    const existingOverlay = getOverlay(this.db, normalized.key);
                    if (!existingOverlay) {
                        const autoFields = await autoPopulate(raw, repoPath, normalized.owner);
                        // Build a patch from non-empty auto-populated fields
                        const patch = {};
                        if (autoFields.approvers && autoFields.approvers.length > 0)
                            patch.approvers = autoFields.approvers;
                        if (autoFields.implementationRef)
                            patch.implementationRef = autoFields.implementationRef;
                        if (autoFields.summary)
                            patch.summary = autoFields.summary;
                        if (autoFields.tags && autoFields.tags.length > 0)
                            patch.tags = autoFields.tags;
                        if (Object.keys(patch).length > 0) {
                            upsertOverlay(this.db, normalized.key, patch, 0);
                        }
                    }
                    else {
                        // Only fill empty fields — never overwrite human edits
                        const autoFields = await autoPopulate(raw, repoPath, normalized.owner);
                        const patch = {};
                        if (autoFields.approvers && autoFields.approvers.length > 0 && !existingOverlay.tags) {
                            patch.approvers = autoFields.approvers;
                        }
                        if (autoFields.summary && !existingOverlay.summary) {
                            patch.summary = autoFields.summary;
                        }
                        if (autoFields.implementationRef && !existingOverlay.target_release) {
                            patch.implementationRef = autoFields.implementationRef;
                        }
                        // Only upsert if we have something new to add
                        if (Object.keys(patch).length > 0) {
                            upsertOverlay(this.db, normalized.key, patch, existingOverlay.revision);
                        }
                    }
                }
                catch (autoErr) {
                    // Auto-population is non-critical; log and continue
                    console.warn(`[scanner] Auto-populate failed for ${specDir.slug}:`, autoErr instanceof Error ? autoErr.message : autoErr);
                }
                results.push(normalized);
            }
            catch (err) {
                console.error(`[scanner] Failed to read spec ${specDir.slug} in source ${source.id}:`, err instanceof Error ? err.message : err);
            }
        }
        return results;
    }
    async refreshRemote(source) {
        const clonePath = join(this.dataDir, 'clones', source.id);
        const branch = source.branch ?? 'main';
        if (!existsSync(clonePath)) {
            // Clone
            const cmd = buildCloneCommand(source.url, clonePath, branch);
            await this.execGit(cmd);
        }
        else {
            // Fetch + reset
            const fetchCmd = buildFetchCommand(clonePath, branch);
            await this.execGit(fetchCmd);
            const resetCmd = [
                'git', '-C', clonePath,
                'reset', '--hard', `origin/${branch}`,
            ];
            const resetValidation = validateArgs(resetCmd.slice(1));
            if (!resetValidation.valid) {
                throw new Error(`Invalid reset arguments: ${resetValidation.reason}`);
            }
            await this.execGit(resetCmd);
        }
    }
    discoverSpecDirs(repoPath, sourceId) {
        const specsRoot = join(repoPath, '.kiro', 'specs');
        if (!existsSync(specsRoot)) {
            return [];
        }
        const entries = readdirSync(specsRoot, { withFileTypes: true });
        const dirs = [];
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const absolutePath = join(specsRoot, entry.name);
                const relativePath = relative(repoPath, absolutePath);
                dirs.push({
                    slug: entry.name,
                    absolutePath,
                    relativePath,
                    sourceId,
                });
            }
        }
        return dirs;
    }
    async readArtifacts(specDir, source) {
        const repoPath = source.type === 'local'
            ? source.path
            : join(this.dataDir, 'clones', source.id);
        const contents = {};
        let config = null;
        const artifactNames = Object.values(SPEC_ARTIFACTS);
        for (const filename of artifactNames) {
            const filePath = join(specDir.absolutePath, filename);
            const relFromRepo = relative(repoPath, filePath);
            // Validate path before reading
            const validation = await validatePath(relFromRepo, repoPath);
            if (!validation.valid) {
                console.warn(`[scanner] Skipping invalid path ${relFromRepo}: ${validation.reason}`);
                continue;
            }
            try {
                const file = Bun.file(filePath);
                if (await file.exists()) {
                    const text = await file.text();
                    contents[filename] = text;
                    // Parse .config.kiro
                    if (filename === SPEC_ARTIFACTS.CONFIG) {
                        const parsed = ConfigKiroSchema.safeParse(JSON.parse(text));
                        if (parsed.success) {
                            config = parsed.data;
                        }
                        else {
                            console.warn(`[scanner] Invalid .config.kiro in ${specDir.slug}:`, parsed.error.message);
                        }
                    }
                }
            }
            catch (err) {
                // Non-critical: file might not exist or be unreadable
                console.warn(`[scanner] Could not read ${filename} in ${specDir.slug}:`, err instanceof Error ? err.message : err);
            }
        }
        // Get git provenance
        const provenance = await this.getProvenance(repoPath, specDir.relativePath);
        return {
            slug: specDir.slug,
            relativePath: specDir.relativePath,
            config,
            contents,
            provenance,
        };
    }
    async getProvenance(repoPath, relativePath) {
        const defaultProvenance = {
            repository: repoPath,
            relativePath,
            branch: 'unknown',
            commitHash: 'unknown',
            isDirty: false,
        };
        try {
            // Get current branch
            const branchProc = Bun.spawn(['git', '-C', repoPath, 'rev-parse', '--abbrev-ref', 'HEAD'], { stdout: 'pipe', stderr: 'pipe' });
            const branchOutput = await new Response(branchProc.stdout).text();
            await branchProc.exited;
            const branch = branchOutput.trim() || 'unknown';
            // Get current commit hash
            const hashProc = Bun.spawn(['git', '-C', repoPath, 'rev-parse', 'HEAD'], { stdout: 'pipe', stderr: 'pipe' });
            const hashOutput = await new Response(hashProc.stdout).text();
            await hashProc.exited;
            const commitHash = hashOutput.trim() || 'unknown';
            // Check dirty state
            const dirtyProc = Bun.spawn(['git', '-C', repoPath, 'status', '--porcelain', '--', relativePath], { stdout: 'pipe', stderr: 'pipe' });
            const dirtyOutput = await new Response(dirtyProc.stdout).text();
            await dirtyProc.exited;
            const isDirty = dirtyOutput.trim().length > 0;
            return {
                repository: repoPath,
                relativePath,
                branch,
                commitHash,
                isDirty,
            };
        }
        catch {
            return defaultProvenance;
        }
    }
    async execGit(cmd) {
        const proc = Bun.spawn(cmd, {
            stdout: 'pipe',
            stderr: 'pipe',
        });
        // Enforce timeout
        const timeout = setTimeout(() => {
            proc.kill();
        }, REMOTE_TIMEOUT_SECONDS * 1000);
        try {
            const [stdout, stderr] = await Promise.all([
                new Response(proc.stdout).text(),
                new Response(proc.stderr).text(),
            ]);
            const exitCode = await proc.exited;
            if (exitCode !== 0) {
                throw new Error(`Git command failed (exit ${exitCode}): ${cmd.join(' ')}\n${stderr}`);
            }
            return stdout;
        }
        finally {
            clearTimeout(timeout);
        }
    }
    categorizeError(err) {
        if (!(err instanceof Error))
            return 'io';
        const msg = err.message.toLowerCase();
        if (msg.includes('timeout') || msg.includes('timed out'))
            return 'timeout';
        if (msg.includes('auth') || msg.includes('permission') || msg.includes('403') || msg.includes('401'))
            return 'auth';
        if (msg.includes('network') || msg.includes('econnrefused') || msg.includes('enotfound') || msg.includes('fetch'))
            return 'network';
        if (msg.includes('valid') || msg.includes('parse') || msg.includes('schema'))
            return 'validation';
        return 'io';
    }
}
