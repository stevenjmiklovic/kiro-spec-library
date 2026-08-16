import type { Database } from "bun:sqlite";
import { Elysia, t } from "elysia";
import type { RelationshipType } from "@kiro-spec-library/shared";
import {
  createRelationship,
  deleteRelationship,
  checkDuplicate,
} from "../db/queries/relationships.js";
import {
  listPending,
  acceptSuggestion,
  rejectSuggestion,
} from "../db/queries/suggestions.js";
import { recordEvent } from "../services/audit.js";

const RelationshipTypeValues = [
  "depends_on",
  "blocks",
  "supersedes",
  "duplicates",
  "related",
] as const;

export function relationshipRoutes(deps: { db: Database }) {
  const { db } = deps;

  return new Elysia()
    .post(
      "/specs/:id/relationships",
      ({ params, body, set }) => {
        const specKey = params.id;
        const { targetSpecKey, type } = body;

        if (checkDuplicate(db, specKey, targetSpecKey, type as RelationshipType)) {
          set.status = 409;
          return { code: "DUPLICATE", message: "Relationship already exists" };
        }

        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        createRelationship(db, {
          id,
          sourceSpecKey: specKey,
          targetSpecKey,
          type: type as RelationshipType,
        });

        recordEvent(db, "relationship_created", { specKey: specKey });

        set.status = 201;
        return { id, createdAt };
      },
      {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          targetSpecKey: t.String(),
          type: t.Union(RelationshipTypeValues.map((v) => t.Literal(v))),
          note: t.Optional(t.String()),
        }),
      },
    )
    .delete(
      "/specs/:id/relationships/:relId",
      ({ params, set }) => {
        const { id: specKey, relId } = params;

        deleteRelationship(db, relId);
        recordEvent(db, "relationship_deleted", { specKey: specKey });

        set.status = 204;
        return null;
      },
      {
        params: t.Object({ id: t.String(), relId: t.String() }),
      },
    )
    .get(
      "/specs/:id/suggestions",
      ({ params }) => {
        const specKey = params.id;
        const suggestions = listPending(db, specKey);
        return { suggestions };
      },
      {
        params: t.Object({ id: t.String() }),
      },
    )
    .get(
      "/specs/suggestions-by-key",
      ({ query }) => {
        const suggestions = listPending(db, query.key);
        return { suggestions };
      },
      {
        query: t.Object({ key: t.String() }),
      },
    )
    .post(
      "/suggestions/:id/accept",
      ({ params }) => {
        const suggestionId = params.id;

        // Fetch the suggestion before accepting to get its data
        const stmt = db.prepare("SELECT * FROM suggestions WHERE id = $id");
        const suggestion = stmt.get({ $id: suggestionId }) as {
          source_spec_key: string;
          target_spec_key: string;
          type: string;
        } | null;

        if (!suggestion) {
          return { code: "NOT_FOUND", message: "Suggestion not found" };
        }

        acceptSuggestion(db, suggestionId);

        const relationshipId = crypto.randomUUID();
        createRelationship(db, {
          id: relationshipId,
          sourceSpecKey: suggestion.source_spec_key,
          targetSpecKey: suggestion.target_spec_key,
          type: suggestion.type as RelationshipType,
        });

        recordEvent(db, "suggestion_accepted", {
          specKey: suggestion.source_spec_key,
        });

        return { relationshipId };
      },
      {
        params: t.Object({ id: t.String() }),
      },
    )
    .post(
      "/suggestions/:id/reject",
      ({ params }) => {
        const suggestionId = params.id;

        const stmt = db.prepare("SELECT * FROM suggestions WHERE id = $id");
        const suggestion = stmt.get({ $id: suggestionId }) as {
          data_hash: string;
          source_spec_key: string;
        } | null;

        if (!suggestion) {
          return { code: "NOT_FOUND", message: "Suggestion not found" };
        }

        rejectSuggestion(db, suggestionId, suggestion.data_hash);
        recordEvent(db, "suggestion_rejected", {
          specKey: suggestion.source_spec_key,
        });

        return { status: "rejected" as const };
      },
      {
        params: t.Object({ id: t.String() }),
      },
    );
}
