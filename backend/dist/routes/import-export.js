import { Elysia } from "elysia";
import { SpecLibrarySidecarV1Schema, } from "@kiro-spec-library/shared";
import { listSpecs } from "../db/queries/specs.js";
import { getOverlay, upsertOverlay } from "../db/queries/metadata.js";
function buildExportPayload(db) {
    const specs = listSpecs(db, { limit: 10_000, offset: 0 });
    const exported = [];
    for (const spec of specs) {
        const overlay = getOverlay(db, spec.key);
        const metadata = {};
        if (overlay) {
            if (overlay.title)
                metadata.displayTitle = overlay.title;
            if (overlay.summary)
                metadata.summary = overlay.summary;
            if (overlay.owner)
                metadata.owner = { name: overlay.owner };
            if (overlay.theme)
                metadata.theme = overlay.theme;
            if (overlay.tags) {
                try {
                    metadata.tags = JSON.parse(overlay.tags);
                }
                catch {
                    metadata.tags = [];
                }
            }
            if (overlay.target_release)
                metadata.targetRelease = overlay.target_release;
            if (overlay.retention_policy) {
                try {
                    metadata.retentionPolicy = JSON.parse(overlay.retention_policy);
                }
                catch { /* skip */ }
            }
        }
        exported.push({
            schemaVersion: 1,
            specId: spec.spec_id,
            metadata,
        });
    }
    return {
        exportedAt: new Date().toISOString(),
        specs: exported,
    };
}
function previewImport(db, sidecars) {
    const specs = listSpecs(db, { limit: 10_000, offset: 0 });
    const existingKeys = new Set(specs.map((s) => s.spec_id));
    let add = 0;
    let modify = 0;
    for (const sidecar of sidecars) {
        if (existingKeys.has(sidecar.specId)) {
            modify++;
        }
        else {
            add++;
        }
    }
    // Specs in DB but not in import — potential removals
    const importIds = new Set(sidecars.map((s) => s.specId));
    let remove = 0;
    for (const specId of existingKeys) {
        if (!importIds.has(specId)) {
            // Only count as remove if it has an overlay (we don't delete core specs)
            const specRow = specs.find((s) => s.spec_id === specId);
            if (specRow && getOverlay(db, specRow.key)) {
                remove++;
            }
        }
    }
    return {
        valid: true,
        specCount: sidecars.length,
        changes: { add, modify, remove },
    };
}
function applyImport(db, sidecars) {
    const specs = listSpecs(db, { limit: 10_000, offset: 0 });
    const specBySpecId = new Map();
    for (const s of specs) {
        specBySpecId.set(s.spec_id, s);
    }
    let applied = 0;
    for (const sidecar of sidecars) {
        const specRow = specBySpecId.get(sidecar.specId);
        if (!specRow)
            continue; // Cannot apply overlay without a spec row
        const existing = getOverlay(db, specRow.key);
        const expectedRevision = existing?.revision ?? 0;
        const patch = {};
        const m = sidecar.metadata;
        if (m.displayTitle)
            patch.title = m.displayTitle;
        if (m.summary)
            patch.summary = m.summary;
        if (m.owner)
            patch.owner = m.owner.name;
        if (m.theme)
            patch.theme = m.theme;
        if (m.tags)
            patch.tags = m.tags;
        if (m.targetRelease)
            patch.targetRelease = m.targetRelease;
        if (m.retentionPolicy)
            patch.retentionPolicy = m.retentionPolicy;
        if (Object.keys(patch).length > 0) {
            upsertOverlay(db, specRow.key, patch, expectedRevision);
            applied++;
        }
    }
    return { applied };
}
export function importExportRoutes(deps) {
    const { db } = deps;
    return new Elysia({ prefix: "" })
        .get("/export", () => {
        const payload = buildExportPayload(db);
        return new Response(JSON.stringify(payload, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": 'attachment; filename="spec-library.json"',
            },
        });
    })
        .post("/import/preview", async ({ body, set }) => {
        const parsed = SpecLibrarySidecarV1Schema.array().safeParse(body);
        if (!parsed.success) {
            set.status = 400;
            return {
                valid: false,
                specCount: 0,
                changes: { add: 0, modify: 0, remove: 0 },
                errors: parsed.error.issues.map((i) => ({
                    path: i.path.join("."),
                    message: i.message,
                })),
            };
        }
        const result = previewImport(db, parsed.data);
        return result;
    })
        .post("/import/apply", async ({ body, set }) => {
        const parsed = SpecLibrarySidecarV1Schema.array().safeParse(body);
        if (!parsed.success) {
            set.status = 400;
            return {
                code: "VALIDATION_ERROR",
                message: "Invalid sidecar payload",
            };
        }
        const result = applyImport(db, parsed.data);
        return result;
    });
}
