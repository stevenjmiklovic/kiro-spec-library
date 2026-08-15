import { upsertOverlay } from "../db/queries/metadata.js";
/**
 * Resolve metadata with priority: overlay > sidecar > artifact-derived.
 * NormalizedSpec only carries title and owner from artifacts; the rest
 * comes from overlay or sidecar.
 */
export function resolveMetadata(spec, overlay, sidecar) {
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
    };
}
/**
 * Evaluate metadata completeness.
 * Required for all stages: title, owner, theme, at least one tag.
 */
export function evaluateCompleteness(resolved, _stage) {
    const missing = [];
    if (!resolved.title)
        missing.push("title");
    if (!resolved.owner)
        missing.push("owner");
    if (!resolved.theme)
        missing.push("theme");
    if (!resolved.tags || resolved.tags.length === 0)
        missing.push("tags");
    return { complete: missing.length === 0, missing };
}
/**
 * Apply a metadata patch with optimistic concurrency.
 * Delegates revision checking to upsertOverlay which verifies expectedRevision
 * matches the current DB state and increments atomically within a transaction.
 */
export function applyPatch(db, specKey, patch, expectedRevision) {
    const result = upsertOverlay(db, specKey, patch, expectedRevision);
    return { revision: result.revision, updatedAt: result.updated_at };
}
