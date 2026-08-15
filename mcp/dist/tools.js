// MCP tool implementations — search_specs, get_spec_context, submit_metadata_proposal
import { sanitizeJsonResponse } from "./redactor.js";
import { API_PREFIX } from "@kiro-spec-library/shared";
// ─── Backend HTTP Client ─────────────────────────────────────────────────────
async function backendFetch(client, path, options = {}) {
    const url = `${client.baseUrl}${API_PREFIX}${path}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "X-MCP-Token": client.token,
            ...options.headers,
        },
    });
    return response;
}
// ─── Tool: search_specs ──────────────────────────────────────────────────────
export async function searchSpecs(client, params) {
    const { query, filters, limit } = params;
    // Cap limit at 100
    const effectiveLimit = Math.min(limit ?? 50, 100);
    const searchParams = new URLSearchParams();
    searchParams.set("query", query);
    searchParams.set("limit", String(effectiveLimit));
    if (filters) {
        if (filters.type)
            searchParams.set("type", filters.type);
        if (filters.stage)
            searchParams.set("stage", filters.stage);
        if (filters.theme)
            searchParams.set("theme", filters.theme);
        if (filters.owner)
            searchParams.set("owner", filters.owner);
        if (filters.repository)
            searchParams.set("repository", filters.repository);
    }
    const response = await backendFetch(client, `/specs?${searchParams}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Search failed: ${error.message ?? response.statusText}`);
    }
    const data = await response.json();
    return sanitizeJsonResponse(data);
}
// ─── Tool: get_spec_context ──────────────────────────────────────────────────
export async function getSpecContext(client, params) {
    const { specId, revisionId } = params;
    let path = `/specs/${encodeURIComponent(specId)}`;
    if (revisionId) {
        path += `?revision=${encodeURIComponent(revisionId)}`;
    }
    const response = await backendFetch(client, path);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Get spec failed: ${error.message ?? response.statusText}`);
    }
    const data = await response.json();
    return sanitizeJsonResponse(data);
}
// ─── Tool: submit_metadata_proposal ──────────────────────────────────────────
/**
 * Submit a metadata proposal via the proposal queue (backend/src/routes/proposals.ts).
 * Supports both human-authored and auto-populated field proposals.
 * All proposals require human approval before being applied to the overlay.
 */
export async function submitMetadataProposal(client, params) {
    const { specId, baseRevision, metadataPatch, relationshipAdds, rationale } = params;
    // Submit as a pending proposal via the proposal queue — requires human approval.
    // Auto-populated fields (approvers, implementationRef, timestamps) can be
    // included in metadataPatch and go through the same approval flow.
    const body = {
        expectedRevision: baseRevision,
        patch: metadataPatch,
        relationshipAdds,
        rationale,
        source: "agent",
    };
    const response = await backendFetch(client, `/specs/${encodeURIComponent(specId)}/proposals`, {
        method: "POST",
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Proposal failed: ${error.message ?? response.statusText}`);
    }
    const data = await response.json();
    return sanitizeJsonResponse({
        id: data.id,
        status: data.status ?? "pending",
    });
}
