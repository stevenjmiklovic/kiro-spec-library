import type { Database } from "bun:sqlite";
import type {
  MetadataCompleteness,
  MetadataOverlay,
  NormalizedSpec,
  LifecycleStage,
} from "@kiro-spec-library/shared";
import type { SpecLibrarySidecarV1 } from "@kiro-spec-library/shared";
import { upsertOverlay } from "../db/queries/metadata.js";

export interface ResolvedMetadata {
  title: string;
  summary?: string;
  owner: string;
  theme?: string;
  tags: string[];
  targetRelease?: string;
  retentionPolicy?: { type: string; customDate?: string };
  approvers: string[];
  implementationRef?: string;
  reviewedAt?: string;
}

/**
 * Resolve metadata with priority: overlay > sidecar > artifact-derived.
 * NormalizedSpec only carries title and owner from artifacts; the rest
 * comes from overlay or sidecar.
 */
export function resolveMetadata(
  spec: NormalizedSpec,
  overlay: MetadataOverlay | null,
  sidecar: SpecLibrarySidecarV1 | null,
): ResolvedMetadata {
  const sm = sidecar?.metadata;

  return {
    title: overlay?.title ?? sm?.displayTitle ?? spec.title,
    summary: overlay?.summary ?? sm?.summary,
    owner: overlay?.owner ?? sm?.owner?.name ?? spec.owner,
    theme: overlay?.theme ?? sm?.theme,
    tags: overlay?.tags ?? sm?.tags ?? [],
    targetRelease: overlay?.targetRelease ?? sm?.targetRelease,
    retentionPolicy: overlay?.retentionPolicy ?? sm?.retentionPolicy,
    approvers: overlay?.approvers ?? [],
    implementationRef: overlay?.implementationRef,
    reviewedAt: overlay?.reviewedAt,
  };
}

/**
 * Evaluate metadata completeness.
 * Required for all stages: title, owner, theme, at least one tag.
 */
export function evaluateCompleteness(
  resolved: ResolvedMetadata,
  _stage: LifecycleStage,
): MetadataCompleteness {
  const missing: string[] = [];

  if (!resolved.title) missing.push("title");
  if (!resolved.owner) missing.push("owner");
  if (!resolved.theme) missing.push("theme");
  if (!resolved.tags || resolved.tags.length === 0) missing.push("tags");

  return { complete: missing.length === 0, missing };
}

/**
 * Apply a metadata patch with optimistic concurrency.
 * Delegates revision checking to upsertOverlay which verifies expectedRevision
 * matches the current DB state and increments atomically within a transaction.
 */
export function applyPatch(
  db: Database,
  specKey: string,
  patch: Record<string, unknown>,
  expectedRevision: number,
): { revision: number; updatedAt: string } {
  const result = upsertOverlay(db, specKey, patch, expectedRevision);
  return { revision: result.revision, updatedAt: result.updated_at };
}
