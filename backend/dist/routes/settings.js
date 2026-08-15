import { Elysia, t } from "elysia";
import { SourceConfigSchema } from "@kiro-spec-library/shared";
import { listSources, putSource } from "../db/queries/sources.js";
export function settingsRoutes(deps) {
    const { db } = deps;
    return new Elysia({ prefix: "/settings" })
        .get("/sources", () => {
        const sources = listSources(db);
        return { sources };
    })
        .put("/sources", ({ body, set }) => {
        const validated = [];
        for (const raw of body) {
            const result = SourceConfigSchema.safeParse(raw);
            if (!result.success) {
                set.status = 422;
                return {
                    code: "VALIDATION_ERROR",
                    message: `Invalid source config for id "${raw.id}": ${result.error.message}`,
                };
            }
            validated.push({
                id: raw.id,
                type: result.data.type,
                path: result.data.type === "local" ? result.data.path : undefined,
                url: result.data.type === "remote" ? result.data.url : undefined,
                branch: result.data.type === "remote" ? result.data.branch : undefined,
                webUrlTemplate: result.data.type === "remote" ? result.data.webUrlTemplate : undefined,
                addedAt: raw.addedAt ?? new Date().toISOString(),
            });
        }
        for (const source of validated) {
            putSource(db, source);
        }
        const sources = listSources(db);
        return { sources };
    }, {
        body: t.Array(t.Object({
            id: t.String(),
            type: t.Union([t.Literal("local"), t.Literal("remote")]),
            path: t.Optional(t.String()),
            url: t.Optional(t.String()),
            branch: t.Optional(t.String()),
            webUrlTemplate: t.Optional(t.String()),
            addedAt: t.Optional(t.String()),
        })),
    });
}
