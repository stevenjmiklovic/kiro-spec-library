// Knowledge Library export sync.
//
// Pushes each indexed spec into the KiroCrew *Knowledge Library* — the
// graph-based, embeddings-optional store that extracts entities/relationships
// from documents and connects them across documents through shared entity
// names (see ~/.kiro/crew/docs/knowledge-library-how-it-works.md). Once synced,
// the user can ask cross-spec questions like "what's the relationship between
// player-presence-awareness and harbormaster-personality?" and get an answer
// grounded in the extracted graph rather than TF-IDF similarity.
//
// Why the per-document push (POST /api/knowledge/agent-document) and NOT a
// folder source:
//   * We send the NORMALIZED, metadata-enriched serialization the library
//     already curates (title/owner/theme/tags/stage + typed relationships),
//     which is richer and cleaner than the raw scattered .md files a folder
//     scan would see, and it makes the spec IDs, owners, and themes first-class
//     graph entities.
//   * `source_uri` is a stable per-spec identity: re-posting the same spec
//     REPLACES its document (idempotent sync), and identical content is refused
//     (status "duplicate") — free change-detection with no duplicates.
//   * No absolute filesystem path, no pending_confirmation/confirm dance.
//
// The endpoint is gated on the gateway config flag `knowledge.auto_add_documents`.
// When it's off the gateway returns 403 with code "auto_add_documents_disabled";
// we surface that verbatim so the caller knows exactly what to flip, rather than
// treating it as an opaque failure.
import { join, relative } from "node:path";
import { SPEC_ARTIFACTS } from "@kiro-spec-library/shared";
import { getOverlay } from "../db/queries/metadata.js";
import { listAllRelationships } from "../db/queries/relationships.js";
import { listSources } from "../db/queries/sources.js";
import { findByKey, listSpecs } from "../db/queries/specs.js";
import { validatePath } from "../security/path-validator.js";
// ─── Config ──────────────────────────────────────────────────────────────────
/**
 * Base URL of the KiroCrew gateway API. The gateway serves the Knowledge
 * Library endpoints under `/api/knowledge/*` on port 5476 (see the
 * gateway-sdk-routing steering doc). Overridable for tests / non-default
 * gateways via KIROCREW_GATEWAY_URL.
 */
function gatewayBaseUrl() {
    const raw = process.env["KIROCREW_GATEWAY_URL"] || "http://127.0.0.1:5476";
    return raw.replace(/\/+$/, "");
}
/** The stable per-spec identity used as the Knowledge Library document key. */
function specSourceUri(spec) {
    // Namespaced so it never collides with a real file path and is obviously
    // ours in the library's source list. repository::spec_id is the same pair
    // the text-export uses to identify a spec uniquely.
    return `spec-library://${spec.repository}/${spec.spec_id}`;
}
// ─── Artifact bodies ─────────────────────────────────────────────────────
/**
 * The narrative artifact files whose full text we fold into the synced
 * document. Deliberately NOT `.config.kiro` / `tasks.meta.json` / the sidecar:
 * those are machine-readable config, not prose the extractor should mine for
 * entities (per the Knowledge Library's own "do NOT add generated/
 * machine-readable files" guidance).
 */
const BODY_ARTIFACTS = [
    SPEC_ARTIFACTS.REQUIREMENTS,
    SPEC_ARTIFACTS.BUGFIX,
    SPEC_ARTIFACTS.DESIGN,
    SPEC_ARTIFACTS.TASKS,
];
/** Total artifact-body bytes folded into ONE spec document, before truncation. */
const MAX_BODY_BYTES_PER_SPEC = 256 * 1024;
/**
 * Read a spec's narrative artifact bodies off disk, mirroring the scanner's
 * exact path composition and `validatePath` security (traversal, symlink
 * escape, credential paths, size). `repoPath` is the source root:
 * `source.path` for local, `join(dataDir, "clones", source.id)` for remote —
 * the same mapping `scanner.scanSource` uses.
 *
 * A missing/oversized/unreadable file is skipped, never fatal: the sync must
 * still push the metadata document for a spec whose bodies can't be read.
 */
export async function readSpecArtifactBodies(spec, repoPath, opts = {}) {
    const readFile = opts.fileReader ??
        (async (p) => {
            const file = Bun.file(p);
            return (await file.exists()) ? file.text() : null;
        });
    const specDir = join(repoPath, spec.relative_path);
    const contents = {};
    let budget = MAX_BODY_BYTES_PER_SPEC;
    let truncated = false;
    for (const filename of BODY_ARTIFACTS) {
        if (budget <= 0) {
            truncated = true;
            break;
        }
        const filePath = join(specDir, filename);
        const relFromRepo = relative(repoPath, filePath);
        const validation = await validatePath(relFromRepo, repoPath);
        if (!validation.valid) {
            // A body we can't safely read is skipped, not fatal — but note it so the
            // caller can surface that the document is metadata-only for this file.
            truncated = true;
            continue;
        }
        let text;
        try {
            text = await readFile(filePath);
        }
        catch {
            truncated = true;
            continue;
        }
        if (text === null)
            continue; // file simply doesn't exist for this spec
        if (text.length > budget) {
            text = `${text.slice(0, budget)}\n\n…[truncated]`;
            truncated = true;
        }
        contents[filename] = text;
        budget -= text.length;
    }
    return { contents, truncated };
}
/**
 * Build the document text pushed to the Knowledge Library for one spec.
 *
 * The shape is deliberately prose-with-structure: the extractor reads it as a
 * design/spec document and lifts entities (the spec id, its owner, theme, and
 * every related spec id) plus relations. Because cross-document links in the
 * library form ONLY through shared entity names, naming each related spec by
 * its exact spec_id here is what wires two specs together in the graph.
 */
export function buildSpecKnowledgeDoc(spec, overlay, outgoing, bodies) {
    const displayTitle = overlay?.title || spec.title || spec.spec_id;
    const title = `Spec: ${displayTitle} (${spec.spec_id})`;
    const tags = (() => {
        if (!overlay?.tags)
            return [];
        try {
            const parsed = JSON.parse(overlay.tags);
            return Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string") : [];
        }
        catch {
            return [];
        }
    })();
    const lines = [];
    lines.push(`# ${displayTitle}`);
    lines.push("");
    lines.push(`Spec ID: ${spec.spec_id}`);
    lines.push(`Repository: ${spec.repository}`);
    lines.push(`Type: ${spec.type}`);
    lines.push(`Workflow: ${spec.workflow}`);
    lines.push(`Lifecycle stage: ${spec.stage}`);
    lines.push(`Progress: ${spec.completed_tasks}/${spec.total_tasks} tasks complete (${spec.progress}%)`);
    if (overlay?.owner || spec.owner)
        lines.push(`Owner: ${overlay?.owner || spec.owner}`);
    if (overlay?.theme)
        lines.push(`Theme: ${overlay.theme}`);
    if (tags.length > 0)
        lines.push(`Tags: ${tags.join(", ")}`);
    if (overlay?.target_release)
        lines.push(`Target release: ${overlay.target_release}`);
    lines.push("");
    if (overlay?.summary) {
        lines.push("## Summary");
        lines.push("");
        lines.push(overlay.summary);
        lines.push("");
    }
    if (outgoing.length > 0) {
        lines.push("## Relationships");
        lines.push("");
        for (const rel of outgoing) {
            // e.g. "This spec depends_on spec harbormaster-personality (in repo X)."
            lines.push(`- The ${spec.spec_id} spec ${rel.type} the ${rel.targetSpecId} spec` +
                (rel.targetRepository && rel.targetRepository !== spec.repository
                    ? ` (in repository ${rel.targetRepository}).`
                    : "."));
        }
        lines.push("");
    }
    // Full artifact bodies, each under a friendly heading so the extractor reads
    // requirements/design/tasks as distinct sections of the same document.
    const BODY_HEADINGS = {
        [SPEC_ARTIFACTS.REQUIREMENTS]: "Requirements",
        [SPEC_ARTIFACTS.BUGFIX]: "Bug analysis",
        [SPEC_ARTIFACTS.DESIGN]: "Design",
        [SPEC_ARTIFACTS.TASKS]: "Tasks",
    };
    for (const filename of BODY_ARTIFACTS) {
        const body = bodies?.contents[filename];
        if (!body)
            continue;
        lines.push(`## ${BODY_HEADINGS[filename] ?? filename}`);
        lines.push("");
        lines.push(body.trimEnd());
        lines.push("");
    }
    return { title, content: lines.join("\n") };
}
/**
 * Build one spec's document (metadata + relationships + bodies) and POST it to
 * the gateway's agent-document endpoint. Shared by the batch sync and the
 * single-spec sync so there is exactly ONE serialization + push code path.
 */
async function pushSpecDocument(spec, overlay, outgoing, bodies, ctx) {
    const { title, content } = buildSpecKnowledgeDoc(spec, overlay, outgoing, bodies);
    let resp;
    try {
        resp = await ctx.doFetch(ctx.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title,
                content,
                reason: "Synced from Kiro Spec Library",
                source_uri: specSourceUri(spec),
            }),
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { kind: "unreachable", error: `gateway unreachable: ${message}` };
    }
    if (resp.status === 403) {
        let body = {};
        try {
            body = (await resp.json());
        }
        catch {
            /* non-JSON 403 — fall through to the generic message */
        }
        return {
            kind: "disabled",
            error: body.error ||
                "Knowledge Library rejected the document: knowledge.auto_add_documents is off. " +
                    "Enable it in the gateway config (~/.kiro/crew/config.json) to allow spec sync.",
        };
    }
    let body = {};
    try {
        body = (await resp.json());
    }
    catch {
        /* leave body empty; handled below */
    }
    if (!resp.ok || body.error) {
        return { kind: "failed", error: body.error || `HTTP ${resp.status}` };
    }
    return body.status === "duplicate" ? { kind: "duplicate" } : { kind: "added" };
}
/**
 * Resolve every spec's source root on disk, mirroring scanner.scanSource:
 * local -> source.path, remote -> clones/<id> (only when dataDir is known).
 */
function repoPathMap(db, dataDir) {
    const map = new Map();
    for (const source of listSources(db)) {
        if (source.type === "local" && source.path) {
            map.set(source.id, source.path);
        }
        else if (source.type === "remote" && dataDir) {
            map.set(source.id, join(dataDir, "clones", source.id));
        }
    }
    return map;
}
/**
 * A spec's outgoing relationships, resolved to target spec_ids. Built for a
 * single spec (the single-spec sync) without materializing the whole map.
 */
function outgoingFor(db, spec) {
    const out = [];
    for (const rel of listAllRelationships(db)) {
        if (rel.source_spec_key !== spec.key)
            continue;
        const target = findByKey(db, rel.target_spec_key);
        if (!target)
            continue;
        out.push({
            targetSpecId: target.spec_id,
            targetRepository: target.repository,
            type: rel.type,
        });
    }
    return out;
}
/**
 * Push ONE spec to the Knowledge Library, by its spec key. Backs the UI's
 * per-spec "Send to Knowledge Library" button. Idempotent (re-sending an
 * unchanged spec is refused as a duplicate). Returns a typed status the UI
 * turns into a success/info/error toast; `null` when no spec has that key.
 */
export async function syncOneSpecToKnowledgeLibrary(db, specKey, opts = {}) {
    const spec = findByKey(db, specKey);
    if (!spec)
        return null;
    const ctx = {
        doFetch: opts.fetchImpl ?? fetch,
        url: `${gatewayBaseUrl()}/api/knowledge/agent-document`,
    };
    const repoPath = repoPathMap(db, opts.dataDir).get(spec.source_id);
    const bodies = repoPath
        ? await readSpecArtifactBodies(spec, repoPath, { fileReader: opts.fileReader })
        : undefined;
    const outcome = await pushSpecDocument(spec, getOverlay(db, spec.key), outgoingFor(db, spec), bodies, ctx);
    const bodiesTruncated = bodies?.truncated ?? false;
    switch (outcome.kind) {
        case "added":
            return { status: "added", specId: spec.spec_id, bodiesTruncated };
        case "duplicate":
            return { status: "duplicate", specId: spec.spec_id, bodiesTruncated };
        case "disabled":
            return { status: "disabled", specId: spec.spec_id, bodiesTruncated, error: outcome.error };
        // Network-unreachable and per-spec failure both surface as "failed" to a
        // single-spec caller — there is no run to abort, just one thing that failed.
        default:
            return { status: "failed", specId: spec.spec_id, bodiesTruncated, error: outcome.error };
    }
}
/**
 * Serialize every indexed spec and push it to the Knowledge Library, one
 * document per spec. Idempotent: re-running replaces changed specs and skips
 * unchanged ones (the library refuses identical content per source_uri).
 *
 * Each document includes the spec's full requirements/design/tasks bodies,
 * read off disk via the same path composition and `validatePath` security the
 * scanner uses. `dataDir` resolves remote clones (`clones/<source.id>`); when
 * omitted, remote-source bodies are skipped (their metadata still syncs).
 *
 * Sequential on purpose — each push triggers LLM extraction (one call per
 * chunk) on the gateway's bounded worker pool, so firing all specs at once
 * would just queue behind that pool while multiplying failure blast radius.
 */
export async function syncSpecsToKnowledgeLibrary(db, opts = {}) {
    const ctx = {
        doFetch: opts.fetchImpl ?? fetch,
        url: `${gatewayBaseUrl()}/api/knowledge/agent-document`,
    };
    const specs = listSpecs(db, { limit: Number.MAX_SAFE_INTEGER, offset: 0 });
    const repoPathBySourceId = repoPathMap(db, opts.dataDir);
    // Index spec keys -> spec_id/repository so relationship targets resolve to
    // the human ids the extractor should treat as shared entity names.
    const byKey = new Map();
    for (const s of specs)
        byKey.set(s.key, s);
    const outgoingByKey = new Map();
    for (const rel of listAllRelationships(db)) {
        const target = byKey.get(rel.target_spec_key);
        if (!target)
            continue; // dangling target — skip rather than emit a bad edge
        const list = outgoingByKey.get(rel.source_spec_key) ?? [];
        list.push({
            targetSpecId: target.spec_id,
            targetRepository: target.repository,
            type: rel.type,
        });
        outgoingByKey.set(rel.source_spec_key, list);
    }
    const result = {
        attempted: 0,
        added: 0,
        duplicate: 0,
        failed: 0,
        bodiesTruncated: 0,
        errors: [],
    };
    for (const spec of specs) {
        // Read the full artifact bodies when we can resolve the source root.
        let bodies;
        const repoPath = repoPathBySourceId.get(spec.source_id);
        if (repoPath) {
            bodies = await readSpecArtifactBodies(spec, repoPath, { fileReader: opts.fileReader });
            if (bodies.truncated)
                result.bodiesTruncated++;
        }
        result.attempted++;
        const outcome = await pushSpecDocument(spec, getOverlay(db, spec.key), outgoingByKey.get(spec.key) ?? [], bodies, ctx);
        switch (outcome.kind) {
            case "added":
                result.added++;
                break;
            case "duplicate":
                result.duplicate++;
                break;
            case "unreachable":
                // Every subsequent spec would hit the same wall — abort the run rather
                // than emit N identical "connection refused" errors.
                result.failed++;
                result.errors.push({ specId: spec.spec_id, error: outcome.error });
                return result;
            case "disabled":
                // Configuration state, not a per-spec failure — report once and stop.
                result.disabled = true;
                result.errors.push({ specId: spec.spec_id, error: outcome.error });
                return result;
            default:
                result.failed++;
                result.errors.push({ specId: spec.spec_id, error: outcome.error });
                break;
        }
    }
    return result;
}
