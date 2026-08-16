// Elysia router — global middleware + health/bootstrap routes (Tasks 11.1, 11.2)
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import type { Database } from "bun:sqlite";
import {
  MAX_ERROR_MESSAGE_LENGTH,
} from "@kiro-spec-library/shared";
import type { ErrorEnvelope, FieldError } from "@kiro-spec-library/shared";
import type { ScannerService } from "./services/scanner.js";
import type { ArchiverService } from "./services/archiver.js";
import { specRoutes } from "./routes/specs.js";
import { syncRoutes } from "./routes/sync.js";
import { settingsRoutes } from "./routes/settings.js";
import { archiveRoutes } from "./routes/archive.js";
import { relationshipRoutes } from "./routes/relationships.js";
import { proposalRoutes } from "./routes/proposals.js";
import { auditRoutes } from "./routes/audit.js";
import { importExportRoutes } from "./routes/import-export.js";
import { backupRoutes } from "./routes/backup.js";
import { textExportRoutes } from "./routes/text-export.js";

// ─── Dependency interface ────────────────────────────────────────────────────

export interface RouterDeps {
  db: Database;
  scanner: ScannerService;
  archiver: ArchiverService;
  ready: () => boolean;
  /** Application-owned storage root — needed by backup/restore for file-level DB swaps. */
  dataDir: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function truncate(msg: string, max: number): string {
  return msg.length > max ? msg.slice(0, max - 1) + "…" : msg;
}

interface KnownError extends Error {
  code: string;
}

function isKnownError(err: unknown): err is KnownError {
  return (
    err instanceof Error &&
    typeof (err as unknown as Record<string, unknown>).code === "string"
  );
}

interface ValidationError extends Error {
  code: "VALIDATION_ERROR";
  all?: Array<{ path: string; message: string }>;
}

function isValidationError(err: unknown): err is ValidationError {
  return (
    err instanceof Error &&
    (err as unknown as Record<string, unknown>).code === "VALIDATION_ERROR"
  );
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createRouter(deps: RouterDeps) {
  const { db, scanner, archiver, ready, dataDir } = deps;

  const app = new Elysia({ prefix: "/api" })
    // Content-Disposition isn't in the CORS-safelisted response headers by
    // default, so cross-origin fetch() can't read it (and downloads fall
    // back to a generic filename) unless it's explicitly exposed here.
    .use(cors({ exposeHeaders: ["Content-Disposition"] }))
    // Global error handler
    .onError(({ error, set }) => {
      const requestId = crypto.randomUUID();

      if (isValidationError(error)) {
        const details: FieldError[] = (error.all ?? []).map((e) => ({
          field: e.path,
          message: e.message,
        }));
        set.status = 400;
        return {
          code: "VALIDATION_ERROR",
          message: truncate(error.message, MAX_ERROR_MESSAGE_LENGTH),
          details,
          requestId,
        } satisfies ErrorEnvelope;
      }

      if (isKnownError(error)) {
        set.status = 400;
        return {
          code: error.code,
          message: truncate(error.message, MAX_ERROR_MESSAGE_LENGTH),
          requestId,
        } satisfies ErrorEnvelope;
      }

      // Unknown / unexpected errors — never leak internals
      set.status = 500;
      return {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
        requestId,
      } satisfies ErrorEnvelope;
    })
    // ─── Health (Task 11.1) ────────────────────────────────────────────────
    .get("/health", ({ set }) => {
      if (!ready()) {
        set.status = 503;
        return { status: "starting" as const };
      }
      return { status: "ok" as const };
    })
    // ─── Bootstrap (Task 11.2) ─────────────────────────────────────────────
    .get("/bootstrap", ({ set }) => {
      if (!ready()) {
        set.status = 503;
        return { status: "starting" as const };
      }

      // Spec count
      const specRow = db
        .query<{ count: number }, []>("SELECT COUNT(*) as count FROM specs")
        .get();
      const specCount = specRow?.count ?? 0;

      // Archive (snapshot) count
      const archiveRow = db
        .query<{ count: number }, []>(
          "SELECT COUNT(*) as count FROM snapshots WHERE purged = 0",
        )
        .get();
      const archiveCount = archiveRow?.count ?? 0;

      // Last sync
      const lastSyncRow = db
        .query<{ started_at: string; status: string }, []>(
          "SELECT started_at, status FROM scan_history ORDER BY started_at DESC LIMIT 1",
        )
        .get();
      const lastSyncAt = lastSyncRow?.started_at ?? null;
      const syncStatus = lastSyncRow?.status ?? "never";

      // Facets — distinct values for filtering
      const types = db
        .query<{ type: string }, []>("SELECT DISTINCT type FROM specs")
        .all()
        .map((r) => r.type);

      const stages = db
        .query<{ stage: string }, []>("SELECT DISTINCT stage FROM specs")
        .all()
        .map((r) => r.stage);

      const themes = db
        .query<{ theme: string }, []>(
          "SELECT DISTINCT theme FROM metadata WHERE theme IS NOT NULL AND theme != ''",
        )
        .all()
        .map((r) => r.theme);

      const owners = db
        .query<{ owner: string }, []>(
          "SELECT DISTINCT owner FROM specs WHERE owner IS NOT NULL AND owner != ''",
        )
        .all()
        .map((r) => r.owner);

      const repositories = db
        .query<{ repository: string }, []>(
          "SELECT DISTINCT repository FROM specs WHERE repository IS NOT NULL AND repository != ''",
        )
        .all()
        .map((r) => r.repository);

      return {
        specCount,
        archiveCount,
        lastSyncAt,
        syncStatus,
        facets: {
          types,
          stages,
          themes,
          owners,
          repositories,
        },
      };
    })
    // ─── Sub-routes ──────────────────────────────────────────────────────────
    .use(specRoutes({ db }))
    .use(syncRoutes({ db, scanner }))
    .use(settingsRoutes({ db }))
    .use(archiveRoutes({ db, archiver }))
    .use(relationshipRoutes({ db }))
    .use(proposalRoutes({ db }))
    .use(auditRoutes({ db }))
    .use(importExportRoutes({ db }))
    .use(backupRoutes({ db, dataDir }))
    .use(textExportRoutes({ db }));

  return app;
}
