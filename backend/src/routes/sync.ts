import { Elysia, t } from "elysia";
import type { Database } from "bun:sqlite";
import type { Source } from "@kiro-spec-library/shared";
import type { ScannerService } from "../services/scanner.js";
import { getScan } from "../db/queries/scan-history.js";

export interface SyncDeps {
  db: Database;
  scanner: ScannerService;
}

export function syncRoutes(deps: SyncDeps) {
  const { db, scanner } = deps;

  return new Elysia({ prefix: "/sync" })
    .post(
      "/",
      async ({ body, set }) => {
        const sources = body.sources as Source[];
        const result = await scanner.triggerScan(sources);
        set.status = 202;
        return { runId: result.runId };
      },
      {
        body: t.Object({
          sources: t.Array(
            t.Object({
              id: t.String(),
              type: t.Union([t.Literal("local"), t.Literal("remote")]),
              path: t.Optional(t.String()),
              url: t.Optional(t.String()),
              branch: t.Optional(t.String()),
              webUrlTemplate: t.Optional(t.String()),
              addedAt: t.String(),
            }),
          ),
        }),
      },
    )
    .get(
      "/:runId",
      ({ params, set }) => {
        const scan = getScan(db, params.runId);
        if (!scan) {
          set.status = 404;
          return { code: "NOT_FOUND", message: `Scan run not found: ${params.runId}` };
        }
        return scan;
      },
      {
        params: t.Object({
          runId: t.String(),
        }),
      },
    );
}
