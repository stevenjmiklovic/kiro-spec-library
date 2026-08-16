import { Elysia, t } from "elysia";
import type { Database } from "bun:sqlite";
import {
  listSpecs,
  countSpecs,
  findByKey,
  type SpecFilters,
  type SpecRow,
} from "../db/queries/specs.js";
import { getOverlay, overlayRowToMetadataOverlay } from "../db/queries/metadata.js";
import { RevisionConflictError } from "../db/queries/metadata.js";
import { applyPatch, resolveMetadata, evaluateCompleteness } from "../services/metadata.js";
import { listBySourceKeys } from "../db/queries/relationships.js";
import { listPendingBySourceKeys } from "../db/queries/suggestions.js";
import { recordEvent } from "../services/audit.js";

/** Attach each spec's outgoing accepted relationships and pending suggestions (for the graph view). */
function attachRelationshipData(db: Database, specs: SpecRow[]) {
  const keys = specs.map((spec) => spec.key);
  const relationships = listBySourceKeys(db, keys);
  const suggestions = listPendingBySourceKeys(db, keys);

  const relsByKey = new Map<string, Array<{ targetKey: string; type: string }>>();
  for (const rel of relationships) {
    const list = relsByKey.get(rel.source_spec_key) ?? [];
    list.push({ targetKey: rel.target_spec_key, type: rel.type });
    relsByKey.set(rel.source_spec_key, list);
  }

  const sugsByKey = new Map<string, Array<{ targetKey: string; type: string }>>();
  for (const sug of suggestions) {
    const list = sugsByKey.get(sug.source_spec_key) ?? [];
    list.push({ targetKey: sug.target_spec_key, type: sug.type });
    sugsByKey.set(sug.source_spec_key, list);
  }

  return specs.map((spec) => ({
    ...spec,
    relationships: relsByKey.get(spec.key) ?? [],
    suggestions: sugsByKey.get(spec.key) ?? [],
  }));
}

export function specRoutes(deps: { db: Database }) {
  const { db } = deps;

  return new Elysia({ prefix: "/specs" })
    .get(
      "/",
      ({ query }) => {
        const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 250);
        const offset = Math.max(Number(query.offset) || 0, 0);

        const filters: SpecFilters = {
          type: query.type || undefined,
          stage: query.stage || undefined,
          owner: query.owner || undefined,
          theme: query.theme || undefined,
          repository: query.repository || undefined,
          query: query.q || undefined,
          limit,
          offset,
        };

        // If metadataComplete filter is set, we need post-filter
        // (completeness is computed, not stored)
        const metadataComplete = query.metadataComplete;

        let specs: SpecRow[];
        let total: number;

        if (metadataComplete !== undefined) {
          // Fetch all matching specs and filter by completeness
          const wantComplete = metadataComplete === "true";
          const allFilters = { ...filters, limit: 10000, offset: 0 };
          const allSpecs = listSpecs(db, allFilters);

          const filtered = allSpecs.filter((spec) => {
            const overlay = getOverlay(db, spec.key);
            const resolved = resolveMetadata(
              { title: spec.title, owner: spec.owner } as any,
              overlay ? overlayRowToMetadataOverlay(overlay) : null,
              null,
            );
            const completeness = evaluateCompleteness(resolved, spec.stage as any);
            return completeness.complete === wantComplete;
          });

          total = filtered.length;
          specs = filtered.slice(offset, offset + limit);
        } else {
          specs = listSpecs(db, filters);
          const { type, stage, owner, theme, repository, query: q } = filters;
          total = countSpecs(db, { type, stage, owner, theme, repository, query: q });
        }

        return { specs: attachRelationshipData(db, specs), total, limit, offset };
      },
      {
        query: t.Object({
          type: t.Optional(t.String()),
          stage: t.Optional(t.String()),
          owner: t.Optional(t.String()),
          theme: t.Optional(t.String()),
          repository: t.Optional(t.String()),
          metadataComplete: t.Optional(t.String()),
          q: t.Optional(t.String()),
          limit: t.Optional(t.String()),
          offset: t.Optional(t.String()),
        }),
      },
    )
    .get(
      "/:id",
      ({ params, set }) => {
        const spec = findByKey(db, params.id);
        if (!spec) {
          set.status = 404;
          return { code: "NOT_FOUND", message: `Spec '${params.id}' not found` };
        }

        const overlay = getOverlay(db, spec.key);
        const metadata = resolveMetadata(
          { title: spec.title, owner: spec.owner } as any,
          overlay ? overlayRowToMetadataOverlay(overlay) : null,
          null,
        );

        return { spec, metadata, revision: overlay?.revision ?? 0 };
      },
      {
        params: t.Object({ id: t.String() }),
      },
    )
    .patch(
      "/:id/metadata",
      ({ params, body, set }) => {
        const spec = findByKey(db, params.id);
        if (!spec) {
          set.status = 404;
          return { code: "NOT_FOUND", message: `Spec '${params.id}' not found` };
        }

        const { expectedRevision, patch } = body;

        try {
          const result = applyPatch(db, spec.key, patch, expectedRevision);
          recordEvent(db, "metadata_updated", { specKey: spec.key });
          return { revision: result.revision, updatedAt: result.updatedAt };
        } catch (err) {
          if (err instanceof RevisionConflictError) {
            set.status = 409;
            return {
              code: "REVISION_CONFLICT",
              message: err.message,
              expected: err.expectedRevision,
              actual: err.actualRevision,
            };
          }
          throw err;
        }
      },
      {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          expectedRevision: t.Number({ minimum: 0 }),
          patch: t.Object({
            title: t.Optional(t.String({ maxLength: 200 })),
            summary: t.Optional(t.String({ maxLength: 2000 })),
            owner: t.Optional(t.String({ maxLength: 100 })),
            theme: t.Optional(t.String({ maxLength: 100 })),
            tags: t.Optional(t.Array(t.String({ maxLength: 50 }), { maxItems: 20 })),
            targetRelease: t.Optional(t.String({ maxLength: 50 })),
            retentionPolicy: t.Optional(
              t.Object({
                type: t.String(),
                customDate: t.Optional(t.String()),
              }),
            ),
            approvers: t.Optional(t.Array(t.String({ maxLength: 100 }), { maxItems: 20 })),
            implementationRef: t.Optional(t.String({ maxLength: 500 })),
            reviewedAt: t.Optional(t.String()),
          }),
        }),
      },
    );
}
