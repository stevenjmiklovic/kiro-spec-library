import type { Database } from 'bun:sqlite';
import type { Source, ScanResult, ScanError, NormalizedSpec } from '@kiro-spec-library/shared';
import { REMOTE_TIMEOUT_SECONDS, SPEC_ARTIFACTS } from '@kiro-spec-library/shared';
import { validatePath } from '../security/path-validator.js';
import { validateArgs, buildFetchCommand, buildCloneCommand } from '../security/git-validator.js';
import { normalize, type RawSpecArtifacts } from './normalizer.js';
import { autoPopulate } from './auto-metadata.js';
import { getOverlay, upsertOverlay, overlayRowToMetadataOverlay } from '../db/queries/metadata.js';
import { resolveMetadata, type ResolvedMetadata } from './metadata.js';
import { generateAll } from './suggester.js';
import type { ArchiverService } from './archiver.js';
import { ConfigKiroSchema } from '@kiro-spec-library/shared';
import { insertScan, updateScan } from '../db/queries/scan-history.js';
import { upsertSpec, syncSpecFts } from '../db/queries/specs.js';
import { suggestionExists, createSuggestion, listAllRejections } from '../db/queries/suggestions.js';
import { join, relative } from 'node:path';
import { readdirSync, existsSync } from 'node:fs';

export interface SpecDirectory {
  slug: string;
  absolutePath: string;
  relativePath: string;
  sourceId: string;
}

export class ScannerService {
  private db: Database;
  private dataDir: string;
  private archiver: ArchiverService;
  private inFlight: Promise<ScanResult> | null = null;

  constructor(db: Database, dataDir: string, archiver: ArchiverService) {
    this.db = db;
    this.dataDir = dataDir;
    this.archiver = archiver;
  }

  async triggerScan(sources: Source[]): Promise<ScanResult> {
    // Single-flight guard: reuse in-progress scan
    if (this.inFlight) {
      return this.inFlight;
    }

    const promise = this.executeScan(sources);
    this.inFlight = promise;

    try {
      return await promise;
    } finally {
      this.inFlight = null;
    }
  }

  private async executeScan(sources: Source[]): Promise<ScanResult> {
    const runId = crypto.randomUUID();
    const startedAt = new Date().toISOString();
    const errors: ScanError[] = [];
    let specsDiscovered = 0;
    const allSpecs: NormalizedSpec[] = [];
    const contentMap = new Map<string, string>();

    insertScan(this.db, { runId, startedAt, status: 'running' });

    for (const source of sources) {
      try {
        const specs = await this.scanSource(source, contentMap);
        specsDiscovered += specs.length;
        allSpecs.push(...specs);
      } catch (err: unknown) {
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

    // Suggestions are cross-repo, so they're generated once per scan cycle
    // over the full corpus rather than per-source.
    if (allSpecs.length >= 2) {
      try {
        this.generateSuggestions(allSpecs, contentMap);
      } catch (err: unknown) {
        console.warn(
          '[scanner] Suggestion generation failed:',
          err instanceof Error ? err.message : err,
        );
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

  /** Generate and persist cross-repo suggestions for this scan cycle's full corpus. */
  private generateSuggestions(specs: NormalizedSpec[], contentMap: Map<string, string>): void {
    const metadataMap = new Map<string, ResolvedMetadata>();
    for (const spec of specs) {
      const overlay = getOverlay(this.db, spec.key);
      metadataMap.set(
        spec.key,
        resolveMetadata(spec, overlay ? overlayRowToMetadataOverlay(overlay) : null, null),
      );
    }

    const rejections = listAllRejections(this.db).map((r) => ({
      sourceSpecKey: r.source_spec_key,
      targetSpecKey: r.target_spec_key,
      type: r.type,
      dataHash: r.data_hash,
    }));

    const suggestions = generateAll(specs, metadataMap, contentMap, rejections);
    for (const s of suggestions) {
      if (suggestionExists(this.db, s.sourceSpecKey, s.targetSpecKey, s.type)) continue;
      createSuggestion(this.db, {
        id: s.id,
        sourceSpecKey: s.sourceSpecKey,
        targetSpecKey: s.targetSpecKey,
        type: s.type,
        confidence: s.confidence,
        reason: s.reason,
        evidence: s.evidence,
        dataHash: s.dataHash,
      });
    }
  }

  private async scanSource(
    source: Source,
    contentMap: Map<string, string>,
  ): Promise<NormalizedSpec[]> {
    if (source.type === 'remote') {
      await this.refreshRemote(source);
    }

    const repoPath = source.type === 'local'
      ? source.path!
      : join(this.dataDir, 'clones', source.id);

    const specDirs = this.discoverSpecDirs(repoPath, source.id);
    const results: NormalizedSpec[] = [];

    for (const specDir of specDirs) {
      try {
        const raw = await this.readArtifacts(specDir, source);
        const normalized = normalize(raw, source);

        // Persist the spec first — metadata_overlays.spec_key has a foreign
        // key to specs.key, so auto-populate's upsertOverlay() below would
        // fail on every spec's first scan (before its specs row exists)
        // if this ran after it instead.
        const rowid = upsertSpec(this.db, normalized);

        // Auto-populate metadata for specs without an existing overlay
        try {
          const existingOverlay = getOverlay(this.db, normalized.key);
          if (!existingOverlay) {
            const autoFields = await autoPopulate(raw, repoPath, normalized.owner);
            // Build a patch from non-empty auto-populated fields
            const patch: Record<string, unknown> = {};
            if (autoFields.approvers && autoFields.approvers.length > 0) patch.approvers = autoFields.approvers;
            if (autoFields.implementationRef) patch.implementationRef = autoFields.implementationRef;
            if (autoFields.summary) patch.summary = autoFields.summary;
            if (autoFields.tags && autoFields.tags.length > 0) patch.tags = autoFields.tags;

            if (Object.keys(patch).length > 0) {
              upsertOverlay(this.db, normalized.key, patch, 0);
            }
          } else {
            // Only fill empty fields — never overwrite human edits
            const autoFields = await autoPopulate(raw, repoPath, normalized.owner);
            const patch: Record<string, unknown> = {};

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
        } catch (autoErr: unknown) {
          // Auto-population is non-critical; log and continue
          console.warn(
            `[scanner] Auto-populate failed for ${specDir.slug}:`,
            autoErr instanceof Error ? autoErr.message : autoErr,
          );
        }

        const contentText = Object.values(raw.contents).join('\n');
        contentMap.set(normalized.key, contentText);

        let resolved: ResolvedMetadata | undefined;
        try {
          const overlay = getOverlay(this.db, normalized.key);
          resolved = resolveMetadata(
            normalized,
            overlay ? overlayRowToMetadataOverlay(overlay) : null,
            null,
          );
          syncSpecFts(this.db, rowid, {
            title: normalized.title,
            content: contentText,
            owner: normalized.owner,
            theme: resolved.theme ?? '',
            tags: resolved.tags.join(' '),
            repository: normalized.provenance.repository,
          });
        } catch (ftsErr: unknown) {
          // Search indexing is non-critical; log and continue
          console.warn(
            `[scanner] FTS sync failed for ${specDir.slug}:`,
            ftsErr instanceof Error ? ftsErr.message : ftsErr,
          );
        }

        if (normalized.stage === 'done' && resolved) {
          try {
            const artifactContents = Object.entries(raw.contents).map(([name, content]) => ({
              name,
              content,
            }));
            await this.archiver.maybeCreateSnapshot(normalized, resolved, artifactContents);
          } catch (snapshotErr: unknown) {
            // Snapshot creation is non-critical; log and continue
            console.warn(
              `[scanner] Snapshot auto-creation failed for ${specDir.slug}:`,
              snapshotErr instanceof Error ? snapshotErr.message : snapshotErr,
            );
          }
        }

        results.push(normalized);
      } catch (err: unknown) {
        console.error(
          `[scanner] Failed to read spec ${specDir.slug} in source ${source.id}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    return results;
  }

  private async refreshRemote(source: Source): Promise<void> {
    const clonePath = join(this.dataDir, 'clones', source.id);
    const branch = source.branch ?? 'main';

    if (!existsSync(clonePath)) {
      // Clone
      const cmd = buildCloneCommand(source.url!, clonePath, branch);
      await this.execGit(cmd);
    } else {
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

  private discoverSpecDirs(repoPath: string, sourceId: string): SpecDirectory[] {
    const specsRoot = join(repoPath, '.kiro', 'specs');

    if (!existsSync(specsRoot)) {
      return [];
    }

    const entries = readdirSync(specsRoot, { withFileTypes: true });
    const dirs: SpecDirectory[] = [];

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

  private async readArtifacts(specDir: SpecDirectory, source: Source): Promise<RawSpecArtifacts> {
    const repoPath = source.type === 'local'
      ? source.path!
      : join(this.dataDir, 'clones', source.id);

    const contents: Record<string, string> = {};
    let config: ReturnType<typeof ConfigKiroSchema.safeParse>['data'] | null = null;

    const artifactNames: string[] = Object.values(SPEC_ARTIFACTS);

    for (const filename of artifactNames) {
      const filePath = join(specDir.absolutePath, filename);
      const relFromRepo = relative(repoPath, filePath);

      // Validate path before reading
      const validation = await validatePath(relFromRepo, repoPath);
      if (!validation.valid) {
        console.warn(
          `[scanner] Skipping invalid path ${relFromRepo}: ${validation.reason}`,
        );
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
            } else {
              console.warn(
                `[scanner] Invalid .config.kiro in ${specDir.slug}:`,
                parsed.error.message,
              );
            }
          }
        }
      } catch (err: unknown) {
        // Non-critical: file might not exist or be unreadable
        console.warn(
          `[scanner] Could not read ${filename} in ${specDir.slug}:`,
          err instanceof Error ? err.message : err,
        );
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

  private async getProvenance(
    repoPath: string,
    relativePath: string,
  ): Promise<RawSpecArtifacts['provenance']> {
    const defaultProvenance = {
      repository: repoPath,
      relativePath,
      branch: 'unknown',
      commitHash: 'unknown',
      isDirty: false,
    };

    try {
      // Get current branch
      const branchProc = Bun.spawn(
        ['git', '-C', repoPath, 'rev-parse', '--abbrev-ref', 'HEAD'],
        { stdout: 'pipe', stderr: 'pipe' },
      );
      const branchOutput = await new Response(branchProc.stdout).text();
      await branchProc.exited;
      const branch = branchOutput.trim() || 'unknown';

      // Get current commit hash
      const hashProc = Bun.spawn(
        ['git', '-C', repoPath, 'rev-parse', 'HEAD'],
        { stdout: 'pipe', stderr: 'pipe' },
      );
      const hashOutput = await new Response(hashProc.stdout).text();
      await hashProc.exited;
      const commitHash = hashOutput.trim() || 'unknown';

      // Check dirty state
      const dirtyProc = Bun.spawn(
        ['git', '-C', repoPath, 'status', '--porcelain', '--', relativePath],
        { stdout: 'pipe', stderr: 'pipe' },
      );
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
    } catch {
      return defaultProvenance;
    }
  }

  private async execGit(cmd: string[]): Promise<string> {
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
        throw new Error(
          `Git command failed (exit ${exitCode}): ${cmd.join(' ')}\n${stderr}`,
        );
      }

      return stdout;
    } finally {
      clearTimeout(timeout);
    }
  }

  private categorizeError(err: unknown): ScanError['category'] {
    if (!(err instanceof Error)) return 'io';
    const msg = err.message.toLowerCase();

    if (msg.includes('timeout') || msg.includes('timed out')) return 'timeout';
    if (msg.includes('auth') || msg.includes('permission') || msg.includes('403') || msg.includes('401')) return 'auth';
    if (msg.includes('network') || msg.includes('econnrefused') || msg.includes('enotfound') || msg.includes('fetch')) return 'network';
    if (msg.includes('valid') || msg.includes('parse') || msg.includes('schema')) return 'validation';

    return 'io';
  }
}
