import { Elysia, t } from "elysia";
import type { Database } from "bun:sqlite";
import { findByKey } from "../db/queries/specs.js";
import {
  createProposal,
  listPendingProposals,
  acceptProposal,
  rejectProposal,
  getProposal,
} from "../db/queries/proposals.js";
import { applyPatch } from "../services/metadata.js";
import { getOverlay } from "../db/queries/metadata.js";

export function proposalRoutes(deps: { db: Database }) {
  const { db } = deps;

  return new Elysia()
    // List pending proposals for a spec
    .get(
      "/specs/:id/proposals",
      ({ params, set }) => {
        const spec = findByKey(db, params.id);
        if (!spec) {
          set.status = 404;
          return { code: "NOT_FOUND", message: `Spec '${params.id}' not found` };
        }

        const proposals = listPendingProposals(db, spec.key);
        return { proposals };
      },
      {
        params: t.Object({ id: t.String() }),
      },
    )
    .get(
      "/specs/proposals-by-key",
      ({ query, set }) => {
        const spec = findByKey(db, query.key);
        if (!spec) {
          set.status = 404;
          return { code: "NOT_FOUND", message: `Spec '${query.key}' not found` };
        }

        const proposals = listPendingProposals(db, spec.key);
        return { proposals };
      },
      {
        query: t.Object({ key: t.String() }),
      },
    )
    // Create a new proposal
    .post(
      "/specs/:id/proposals",
      ({ params, body, set }) => {
        const spec = findByKey(db, params.id);
        if (!spec) {
          set.status = 404;
          return { code: "NOT_FOUND", message: `Spec '${params.id}' not found` };
        }

        const id = crypto.randomUUID();
        const proposal = createProposal(db, {
          id,
          specKey: spec.key,
          patch: body.patch,
          submittedAt: new Date().toISOString(),
          rationale: body.rationale,
          source: body.source,
        });

        set.status = 201;
        return { id: proposal.id, status: proposal.status };
      },
      {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          patch: t.Record(t.String(), t.Unknown()),
          rationale: t.Optional(t.String()),
          source: t.Optional(t.String()),
          expectedRevision: t.Optional(t.Number()),
          relationshipAdds: t.Optional(t.Array(t.Object({
            targetSpecId: t.String(),
            type: t.String(),
            note: t.Optional(t.String()),
          }))),
        }),
      },
    )
    // Accept a proposal — applies the patch
    .post(
      "/proposals/:id/accept",
      ({ params, set }) => {
        const existing = getProposal(db, params.id);
        if (!existing) {
          set.status = 404;
          return { code: "NOT_FOUND", message: `Proposal '${params.id}' not found` };
        }
        if (existing.status !== "pending") {
          set.status = 409;
          return { code: "ALREADY_RESOLVED", message: `Proposal already ${existing.status}` };
        }

        // Apply the patch to metadata
        const patch = JSON.parse(existing.patch);
        const overlay = getOverlay(db, existing.spec_key);
        const currentRevision = overlay?.revision ?? 0;
        applyPatch(db, existing.spec_key, patch, currentRevision);

        // Mark proposal accepted
        const updated = acceptProposal(db, params.id);
        return { id: updated!.id, status: updated!.status, resolved_at: updated!.resolved_at };
      },
      {
        params: t.Object({ id: t.String() }),
      },
    )
    // Reject a proposal
    .post(
      "/proposals/:id/reject",
      ({ params, set }) => {
        const existing = getProposal(db, params.id);
        if (!existing) {
          set.status = 404;
          return { code: "NOT_FOUND", message: `Proposal '${params.id}' not found` };
        }
        if (existing.status !== "pending") {
          set.status = 409;
          return { code: "ALREADY_RESOLVED", message: `Proposal already ${existing.status}` };
        }

        const updated = rejectProposal(db, params.id);
        return { id: updated!.id, status: updated!.status, resolved_at: updated!.resolved_at };
      },
      {
        params: t.Object({ id: t.String() }),
      },
    );
}
