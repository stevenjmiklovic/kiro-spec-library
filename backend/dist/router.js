// Elysia router — global middleware + health/bootstrap routes (Tasks 11.1, 11.2)
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { MAX_ERROR_MESSAGE_LENGTH, } from "@kiro-spec-library/shared";
import { specRoutes } from "./routes/specs.js";
import { syncRoutes } from "./routes/sync.js";
import { settingsRoutes } from "./routes/settings.js";
import { archiveRoutes } from "./routes/archive.js";
import { relationshipRoutes } from "./routes/relationships.js";
import { proposalRoutes } from "./routes/proposals.js";
import { auditRoutes } from "./routes/audit.js";
import { backupRoutes } from "./routes/backup.js";
import { textExportRoutes } from "./routes/text-export.js";
import { findByKey } from "./db/queries/specs.js";
import { getOverlay, overlayRowToMetadataOverlay } from "./db/queries/metadata.js";
import { resolveMetadata } from "./services/metadata.js";
import { listPending as listPendingSuggestions } from "./db/queries/suggestions.js";
import { listPendingProposals } from "./db/queries/proposals.js";
// ─── Helpers ─────────────────────────────────────────────────────────────────
function truncate(msg, max) {
    return msg.length > max ? msg.slice(0, max - 1) + "…" : msg;
}
function isKnownError(err) {
    return (err instanceof Error &&
        typeof err.code === "string");
}
function isValidationError(err) {
    return (err instanceof Error &&
        err.code === "VALIDATION_ERROR");
}
// ─── Factory ─────────────────────────────────────────────────────────────────
export function createRouter(deps) {
    const { db, scanner, archiver, ready, dataDir, mcpToken, enforceMcpAuth } = deps;
    const app = new Elysia({ prefix: "/api" })
        // Content-Disposition isn't in the CORS-safelisted response headers by
        // default, so cross-origin fetch() can't read it (and downloads fall
        // back to a generic filename) unless it's explicitly exposed here.
        .use(cors({ exposeHeaders: ["Content-Disposition"] }))
        // Global error handler
        .onError(({ error, set }) => {
        const requestId = crypto.randomUUID();
        if (isValidationError(error)) {
            const details = (error.all ?? []).map((e) => ({
                field: e.path,
                message: e.message,
            }));
            set.status = 400;
            return {
                code: "VALIDATION_ERROR",
                message: truncate(error.message, MAX_ERROR_MESSAGE_LENGTH),
                details,
                requestId,
            };
        }
        if (isKnownError(error)) {
            set.status = 400;
            return {
                code: error.code,
                message: truncate(error.message, MAX_ERROR_MESSAGE_LENGTH),
                requestId,
            };
        }
        // Unknown / unexpected errors — never leak internals
        set.status = 500;
        return {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred",
            requestId,
        };
    })
        // ─── MCP token auth ────────────────────────────────────────────────────
        // Off by default (see RouterDeps.enforceMcpAuth) — the UI shares this
        // port and has no established way to obtain the token yet.
        .onBeforeHandle(({ request, path, set }) => {
        if (!enforceMcpAuth || path.endsWith("/health"))
            return;
        const provided = request.headers.get("x-mcp-token");
        if (!provided || provided !== mcpToken) {
            set.status = 401;
            return {
                code: "UNAUTHORIZED",
                message: "Missing or invalid X-MCP-Token",
                requestId: crypto.randomUUID(),
            };
        }
    })
        // ─── Health (Task 11.1) ────────────────────────────────────────────────
        .get("/health", ({ set }) => {
        if (!ready()) {
            set.status = 503;
            return { status: "starting" };
        }
        return { status: "ok" };
    })
        // ─── Bootstrap (Task 11.2) ─────────────────────────────────────────────
        .get("/bootstrap", ({ set }) => {
        if (!ready()) {
            set.status = 503;
            return { status: "starting" };
        }
        // Spec count
        const specRow = db
            .query("SELECT COUNT(*) as count FROM specs")
            .get();
        const specCount = specRow?.count ?? 0;
        // Archive (snapshot) count
        const archiveRow = db
            .query("SELECT COUNT(*) as count FROM snapshots WHERE purged = 0")
            .get();
        const archiveCount = archiveRow?.count ?? 0;
        // Last sync
        const lastSyncRow = db
            .query("SELECT started_at, status FROM scan_history ORDER BY started_at DESC LIMIT 1")
            .get();
        const lastSyncAt = lastSyncRow?.started_at ?? null;
        const syncStatus = lastSyncRow?.status ?? "never";
        // Facets — distinct values for filtering
        const types = db
            .query("SELECT DISTINCT type FROM specs")
            .all()
            .map((r) => r.type);
        const stages = db
            .query("SELECT DISTINCT stage FROM specs")
            .all()
            .map((r) => r.stage);
        const themes = db
            .query("SELECT DISTINCT theme FROM metadata_overlays WHERE theme IS NOT NULL AND theme != ''")
            .all()
            .map((r) => r.theme);
        const owners = db
            .query("SELECT DISTINCT owner FROM specs WHERE owner IS NOT NULL AND owner != ''")
            .all()
            .map((r) => r.owner);
        const repositories = db
            .query("SELECT DISTINCT repository FROM specs WHERE repository IS NOT NULL AND repository != ''")
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
        // ─── Spec lookup by key (query param) ──────────────────────────────────
        // These endpoints use query params instead of path params because spec keys
        // can contain slashes (e.g. "counter-table::.kiro/specs/foo") which break
        // URL path routing when the gateway proxy decodes %2F back to /.
        .get("/spec-detail", ({ query, set }) => {
        const key = query.key;
        if (!key) {
            set.status = 400;
            return { code: "BAD_REQUEST", message: "key required" };
        }
        const spec = findByKey(db, key);
        if (!spec) {
            set.status = 404;
            return { code: "NOT_FOUND", message: `Spec '${key}' not found` };
        }
        const overlay = getOverlay(db, spec.key);
        const metadata = resolveMetadata({ title: spec.title, owner: spec.owner }, overlay ? overlayRowToMetadataOverlay(overlay) : null, null);
        return { spec, metadata, revision: overlay?.revision ?? 0 };
    })
        .get("/spec-suggestions", ({ query }) => {
        const key = query.key ?? "";
        return { suggestions: listPendingSuggestions(db, key) };
    })
        .get("/spec-proposals", ({ query, set }) => {
        const key = query.key ?? "";
        const spec = findByKey(db, key);
        if (!spec) {
            set.status = 404;
            return { code: "NOT_FOUND", message: "Spec not found" };
        }
        return { proposals: listPendingProposals(db, spec.key) };
    })
        // ─── Sub-routes ──────────────────────────────────────────────────────────
        .use(specRoutes({ db }))
        .use(syncRoutes({ db, scanner }))
        .use(settingsRoutes({ db }))
        .use(archiveRoutes({ db, archiver }))
        .use(relationshipRoutes({ db }))
        .use(proposalRoutes({ db }))
        .use(auditRoutes({ db }))
        .use(backupRoutes({ db, dataDir }))
        .use(textExportRoutes({ db }));
    return app;
}
