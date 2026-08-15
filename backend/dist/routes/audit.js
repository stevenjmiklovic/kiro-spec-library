import { Elysia, t } from "elysia";
import { AUDIT_OPERATIONS } from "@kiro-spec-library/shared";
import { queryAuditEvents } from "../db/queries/audit.js";
export function auditRoutes(deps) {
    const { db } = deps;
    return new Elysia({ prefix: "" })
        .get("/audit", ({ query, set }) => {
        const { specKey, operation, actor, after, before, limit: rawLimit, } = query;
        // Validate operation if provided
        if (operation && !AUDIT_OPERATIONS.includes(operation)) {
            set.status = 400;
            return {
                code: "VALIDATION_ERROR",
                message: `Invalid operation. Must be one of: ${AUDIT_OPERATIONS.join(", ")}`,
            };
        }
        // Validate ISO dates if provided
        if (after && Number.isNaN(Date.parse(after))) {
            set.status = 400;
            return {
                code: "VALIDATION_ERROR",
                message: "Invalid 'after' date. Must be ISO 8601.",
            };
        }
        if (before && Number.isNaN(Date.parse(before))) {
            set.status = 400;
            return {
                code: "VALIDATION_ERROR",
                message: "Invalid 'before' date. Must be ISO 8601.",
            };
        }
        const limit = Math.min(Math.max(Number(rawLimit) || 50, 1), 200);
        const filters = {
            specKey: specKey || undefined,
            operation: operation || undefined,
            actor: actor || undefined,
            after: after || undefined,
            before: before || undefined,
            limit,
        };
        const events = queryAuditEvents(db, filters);
        return {
            events,
            total: events.length,
        };
    }, {
        query: t.Object({
            specKey: t.Optional(t.String()),
            operation: t.Optional(t.String()),
            actor: t.Optional(t.String()),
            after: t.Optional(t.String()),
            before: t.Optional(t.String()),
            limit: t.Optional(t.String()),
        }),
    });
}
