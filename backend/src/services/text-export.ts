// Textual/git-committable library export — a zip of human-readable, diffable
// JSON files suitable for committing into a dedicated version-control repo.
//
// Scope: the per-spec sidecar files, sources, suggestions, rejections, and
// proposals are the "current state" data this format can both export AND
// re-apply (upsert) onto an existing library. snapshots.json and
// audit-log.jsonl are export-only — they're historical/log data with no
// sensible "re-apply" semantics, and (for snapshots) the archived artifact
// bytes live on disk, not in this export. Exact, byte-for-byte restoration of
// all of that is what the single-file DB backup (services/backup.ts) is for.
import type { Database } from "bun:sqlite";
import { zipSync, unzipSync } from "fflate";
import {
  SpecLibrarySidecarV1Schema,
  TextExportSuggestionSchema,
  TextExportRejectionSchema,
  TextExportProposalSchema,
  type SpecLibrarySidecarV1,
  type TextExportManifest,
  type TextExportSource,
  type TextExportSuggestion,
  type TextExportRejection,
  type TextExportProposal,
  type TextExportSnapshot,
  type RelationshipType,
  type SuggestionReason,
} from "@kiro-spec-library/shared";
import { listSpecs, type SpecRow } from "../db/queries/specs.js";
import { getOverlay, upsertOverlay } from "../db/queries/metadata.js";
import {
  listAllRelationships,
  replaceOutgoingRelationships,
} from "../db/queries/relationships.js";
import {
  listAllSuggestions,
  listAllRejections,
  createSuggestion,
  createRejection,
  suggestionExists,
  isRejected,
} from "../db/queries/suggestions.js";
import { listAllProposals, createProposal, getProposal } from "../db/queries/proposals.js";
import { listAllSnapshots, getSnapshotArtifacts } from "../db/queries/snapshots.js";
import { listSources } from "../db/queries/sources.js";
import { listAllAuditEvents } from "../db/queries/audit.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sanitizeSegment(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9_.-]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned.length > 0 ? cleaned : "unnamed";
}

interface SpecIndex {
  byKey: Map<string, SpecRow>;
  /** `${sanitize(repository)}/${sanitize(specId)}` -> row — mirrors the export's file paths exactly. */
  byPath: Map<string, SpecRow>;
  /** `${repository}::${specId}` -> row — exact (unsanitized) match, used for relationship/suggestion refs. */
  byRef: Map<string, SpecRow>;
}

function refKey(repository: string, specId: string): string {
  return `${repository}::${specId}`;
}

function buildSpecIndex(specs: SpecRow[]): SpecIndex {
  const byKey = new Map<string, SpecRow>();
  const byPath = new Map<string, SpecRow>();
  const byRef = new Map<string, SpecRow>();
  for (const s of specs) {
    byKey.set(s.key, s);
    byPath.set(`${sanitizeSegment(s.repository)}/${sanitizeSegment(s.spec_id)}`, s);
    byRef.set(refKey(s.repository, s.spec_id), s);
  }
  return { byKey, byPath, byRef };
}

function putJson(files: Record<string, Uint8Array>, path: string, value: unknown): void {
  files[path] = new TextEncoder().encode(`${JSON.stringify(value, null, 2)}\n`);
}

// ─── Build (export) ──────────────────────────────────────────────────────────

export function buildTextExportZip(db: Database): Uint8Array {
  const specs = listSpecs(db, { limit: 10_000, offset: 0 });
  const index = buildSpecIndex(specs);
  const files: Record<string, Uint8Array> = {};

  const relsBySource = new Map<string, Array<{ target_spec_key: string; type: string }>>();
  for (const rel of listAllRelationships(db)) {
    const list = relsBySource.get(rel.source_spec_key) ?? [];
    list.push(rel);
    relsBySource.set(rel.source_spec_key, list);
  }

  for (const spec of specs) {
    const overlay = getOverlay(db, spec.key);
    const metadata: SpecLibrarySidecarV1["metadata"] = {};
    if (overlay?.title) metadata.displayTitle = overlay.title;
    if (overlay?.summary) metadata.summary = overlay.summary;
    if (overlay?.owner) metadata.owner = { name: overlay.owner };
    if (overlay?.theme) metadata.theme = overlay.theme;
    if (overlay?.tags) {
      try {
        metadata.tags = JSON.parse(overlay.tags);
      } catch {
        /* malformed tag JSON — omit rather than fail the whole export */
      }
    }
    if (overlay?.target_release) metadata.targetRelease = overlay.target_release;
    if (overlay?.retention_policy) {
      try {
        metadata.retentionPolicy = JSON.parse(overlay.retention_policy);
      } catch {
        /* malformed retention JSON — omit */
      }
    }

    const relationships = (relsBySource.get(spec.key) ?? [])
      .map((rel) => {
        const target = index.byKey.get(rel.target_spec_key);
        if (!target) return null;
        return {
          targetSpecId: target.spec_id,
          targetRepository: target.repository,
          type: rel.type as RelationshipType,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    const sidecar: SpecLibrarySidecarV1 = {
      schemaVersion: 1,
      specId: spec.spec_id,
      metadata,
      ...(relationships.length > 0 ? { relationships } : {}),
    };

    putJson(files, `specs/${sanitizeSegment(spec.repository)}/${sanitizeSegment(spec.spec_id)}.json`, sidecar);
  }

  const sources: TextExportSource[] = listSources(db).map((s) => ({
    id: s.id,
    type: s.type as "local" | "remote",
    path: s.path ?? undefined,
    url: s.url ?? undefined,
    branch: s.branch ?? undefined,
    webUrlTemplate: s.web_url_template ?? undefined,
    addedAt: s.added_at,
  }));
  putJson(files, "sources.json", sources);

  const suggestions: TextExportSuggestion[] = listAllSuggestions(db)
    .map((row) => {
      const source = index.byKey.get(row.source_spec_key);
      const target = index.byKey.get(row.target_spec_key);
      if (!source || !target) return null;
      return {
        source: { specId: source.spec_id, repository: source.repository },
        target: { specId: target.spec_id, repository: target.repository },
        type: row.type as RelationshipType,
        confidence: row.confidence,
        reason: row.reason,
        evidence: row.evidence,
        status: row.status as "pending" | "accepted" | "rejected",
        createdAt: row.created_at,
        resolvedAt: row.resolved_at ?? undefined,
        dataHash: row.data_hash,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);
  putJson(files, "suggestions.json", suggestions);

  const rejections: TextExportRejection[] = listAllRejections(db)
    .map((row) => {
      const source = index.byKey.get(row.source_spec_key);
      const target = index.byKey.get(row.target_spec_key);
      if (!source || !target) return null;
      return {
        source: { specId: source.spec_id, repository: source.repository },
        target: { specId: target.spec_id, repository: target.repository },
        type: row.type as RelationshipType,
        dataHash: row.data_hash,
        rejectedAt: row.rejected_at,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  putJson(files, "rejections.json", rejections);

  const proposals: TextExportProposal[] = listAllProposals(db)
    .map((row) => {
      const spec = index.byKey.get(row.spec_key);
      if (!spec) return null;
      let patch: Record<string, unknown> = {};
      try {
        patch = JSON.parse(row.patch);
      } catch {
        /* malformed patch JSON — export as empty */
      }
      return {
        id: row.id,
        spec: { specId: spec.spec_id, repository: spec.repository },
        patch,
        status: row.status as "pending" | "accepted" | "rejected",
        submittedAt: row.submitted_at,
        resolvedAt: row.resolved_at ?? undefined,
        resolvedBy: row.resolved_by ?? undefined,
        rationale: row.rationale ?? undefined,
        source: row.source ?? undefined,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);
  putJson(files, "proposals.json", proposals);

  const snapshots: TextExportSnapshot[] = listAllSnapshots(db)
    .map((row) => {
      const spec = index.byKey.get(row.spec_key);
      if (!spec) return null;
      const artifacts = getSnapshotArtifacts(db, row.id);
      return {
        id: row.id,
        spec: { specId: spec.spec_id, repository: spec.repository },
        createdAt: row.created_at,
        contentDigest: row.content_digest,
        retentionPolicy: row.retention_policy ?? undefined,
        purged: row.purged === 1,
        purgedAt: row.purged_at ?? undefined,
        artifactNames: artifacts.map((a) => a.name),
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);
  putJson(files, "snapshots.json", snapshots);

  const auditEvents = listAllAuditEvents(db);
  const auditLines = auditEvents.map((e) => {
    const spec = e.spec_key ? index.byKey.get(e.spec_key) : undefined;
    return JSON.stringify({
      id: e.id,
      operation: e.operation,
      spec: spec ? { specId: spec.spec_id, repository: spec.repository } : undefined,
      snapshotId: e.snapshot_id ?? undefined,
      actor: e.actor,
      timestamp: e.timestamp,
    });
  });
  files["audit-log.jsonl"] = new TextEncoder().encode(
    auditLines.length > 0 ? `${auditLines.join("\n")}\n` : "",
  );

  const manifest: TextExportManifest = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    counts: {
      sources: sources.length,
      specs: specs.length,
      suggestions: suggestions.length,
      rejections: rejections.length,
      proposals: proposals.length,
      snapshots: snapshots.length,
      auditEvents: auditEvents.length,
    },
  };
  putJson(files, "manifest.json", manifest);

  return zipSync(files, { level: 6 });
}

// ─── Apply (restore) ─────────────────────────────────────────────────────────

export interface ApplyTextExportResult {
  specsUpdated: string[];
  specsSkipped: string[];
  relationshipsApplied: number;
  suggestionsAdded: number;
  rejectionsAdded: number;
  proposalsAdded: number;
  errors: string[];
}

export function applyTextExportZip(db: Database, zipBytes: Uint8Array): ApplyTextExportResult {
  const files = unzipSync(zipBytes);
  const decoder = new TextDecoder();
  const readJsonArray = (path: string): unknown[] => {
    const bytes = files[path];
    if (!bytes) return [];
    const parsed: unknown = JSON.parse(decoder.decode(bytes));
    return Array.isArray(parsed) ? parsed : [];
  };

  const specs = listSpecs(db, { limit: 10_000, offset: 0 });
  const index = buildSpecIndex(specs);

  const result: ApplyTextExportResult = {
    specsUpdated: [],
    specsSkipped: [],
    relationshipsApplied: 0,
    suggestionsAdded: 0,
    rejectionsAdded: 0,
    proposalsAdded: 0,
    errors: [],
  };

  for (const [path, bytes] of Object.entries(files)) {
    if (!path.startsWith("specs/") || !path.endsWith(".json")) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(decoder.decode(bytes));
    } catch {
      result.errors.push(`${path}: invalid JSON`);
      continue;
    }

    const sidecarResult = SpecLibrarySidecarV1Schema.safeParse(parsed);
    if (!sidecarResult.success) {
      result.errors.push(`${path}: ${sidecarResult.error.issues.map((i) => i.message).join("; ")}`);
      continue;
    }
    const sidecar = sidecarResult.data;

    // specs/<repo>/<specId>.json — the repo segment came from the export's
    // own sanitizeSegment(), so byPath (built the same way) is the exact match.
    const repoSegment = path.split("/")[1] ?? "";
    const specRow = index.byPath.get(`${repoSegment}/${sanitizeSegment(sidecar.specId)}`);

    if (!specRow) {
      result.specsSkipped.push(sidecar.specId);
      continue;
    }

    const patch: Record<string, unknown> = {};
    const m = sidecar.metadata;
    if (m.displayTitle) patch.title = m.displayTitle;
    if (m.summary) patch.summary = m.summary;
    if (m.owner) patch.owner = m.owner.name;
    if (m.theme) patch.theme = m.theme;
    if (m.tags) patch.tags = m.tags;
    if (m.targetRelease) patch.targetRelease = m.targetRelease;
    if (m.retentionPolicy) patch.retentionPolicy = m.retentionPolicy;

    if (Object.keys(patch).length > 0) {
      const existing = getOverlay(db, specRow.key);
      upsertOverlay(db, specRow.key, patch, existing?.revision ?? 0);
    }

    const resolvedRelationships: Array<{ targetSpecKey: string; type: RelationshipType }> = [];
    for (const rel of sidecar.relationships ?? []) {
      const targetRepo = rel.targetRepository ?? repoSegment;
      const target = index.byRef.get(refKey(targetRepo, rel.targetSpecId));
      if (!target) {
        result.errors.push(`${path}: relationship target "${rel.targetSpecId}" not found`);
        continue;
      }
      resolvedRelationships.push({ targetSpecKey: target.key, type: rel.type as RelationshipType });
    }
    replaceOutgoingRelationships(db, specRow.key, resolvedRelationships);
    result.relationshipsApplied += resolvedRelationships.length;
    result.specsUpdated.push(sidecar.specId);
  }

  const suggestionsParsed = TextExportSuggestionSchema.array().safeParse(readJsonArray("suggestions.json"));
  if (suggestionsParsed.success) {
    for (const s of suggestionsParsed.data) {
      if (s.status !== "pending") continue;
      const source = index.byRef.get(refKey(s.source.repository, s.source.specId));
      const target = index.byRef.get(refKey(s.target.repository, s.target.specId));
      if (!source || !target) continue;
      const type = s.type as RelationshipType;
      if (suggestionExists(db, source.key, target.key, type)) continue;
      createSuggestion(db, {
        id: crypto.randomUUID(),
        sourceSpecKey: source.key,
        targetSpecKey: target.key,
        type,
        confidence: s.confidence,
        reason: s.reason as SuggestionReason,
        evidence: s.evidence,
        dataHash: s.dataHash,
      });
      result.suggestionsAdded++;
    }
  } else {
    result.errors.push(`suggestions.json: ${suggestionsParsed.error.issues.map((i) => i.message).join("; ")}`);
  }

  const rejectionsParsed = TextExportRejectionSchema.array().safeParse(readJsonArray("rejections.json"));
  if (rejectionsParsed.success) {
    for (const r of rejectionsParsed.data) {
      const source = index.byRef.get(refKey(r.source.repository, r.source.specId));
      const target = index.byRef.get(refKey(r.target.repository, r.target.specId));
      if (!source || !target) continue;
      const type = r.type as RelationshipType;
      if (isRejected(db, source.key, target.key, type, r.dataHash)) continue;
      createRejection(db, {
        sourceSpecKey: source.key,
        targetSpecKey: target.key,
        type,
        dataHash: r.dataHash,
        rejectedAt: r.rejectedAt,
      });
      result.rejectionsAdded++;
    }
  } else {
    result.errors.push(`rejections.json: ${rejectionsParsed.error.issues.map((i) => i.message).join("; ")}`);
  }

  const proposalsParsed = TextExportProposalSchema.array().safeParse(readJsonArray("proposals.json"));
  if (proposalsParsed.success) {
    for (const p of proposalsParsed.data) {
      if (p.status !== "pending") continue;
      if (getProposal(db, p.id)) continue;
      const spec = index.byRef.get(refKey(p.spec.repository, p.spec.specId));
      if (!spec) continue;
      createProposal(db, {
        id: p.id,
        specKey: spec.key,
        patch: p.patch,
        submittedAt: p.submittedAt,
        rationale: p.rationale,
        source: p.source,
      });
      result.proposalsAdded++;
    }
  } else {
    result.errors.push(`proposals.json: ${proposalsParsed.error.issues.map((i) => i.message).join("; ")}`);
  }

  return result;
}
