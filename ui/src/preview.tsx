import { createRoot } from "react-dom/client";
import { type CrewIntegration } from "./hooks/useCrewIntegration.js";
import { App } from "./App.js";
import "./styles/global.css";

const sampleSpecs = [
  { key: "agent-memory", title: "Agent Memory v2", type: "feature", stage: "scoped", progress: 66, owner: "Maya Chen", theme: "AI Foundations", repository: "crew-platform", indexed_at: "2026-06-02T10:00:00Z", relationships: [{ targetKey: "retention", type: "depends_on" }] },
  { key: "retention", title: "Memory retention controls", type: "feature", stage: "in-flight", progress: 78, owner: "Maya Chen", theme: "AI Foundations", repository: "crew-platform", indexed_at: "2026-07-14T10:00:00Z", suggestions: [{ targetKey: "usage-alerts", type: "related" }] },
  { key: "usage-alerts", title: "Usage anomaly alerts", type: "feature", stage: "new", progress: 33, owner: "Daniel Kim", theme: "Platform Reliability", repository: "crew-platform", indexed_at: "2026-08-05T10:00:00Z" },
  { key: "observability", title: "Trace correlation", type: "quick", stage: "done", progress: 100, owner: "Ravi Patel", theme: "Platform Reliability", repository: "crew-platform", indexed_at: "2026-06-20T10:00:00Z" },
  { key: "workspace-export", title: "Workspace export fixes", type: "bugfix", stage: "in-flight", progress: 68, owner: "Maya Chen", theme: "Developer Experience", repository: "crew-platform", indexed_at: "2026-08-10T10:00:00Z", relationships: [{ targetKey: "agent-memory", type: "blocks" }] },
];

// Representative archive snapshots (backend row shape: JSON string columns).
const sampleSnapshots = [
  {
    id: "snap-workspace",
    spec_key: "workspace-index",
    created_at: "2026-08-07T10:14:00Z",
    content_digest: "a1b2c3d4e5f60011",
    metadata_projection: JSON.stringify({ title: "Workspace semantic index", type: "quick", theme: "AI Foundations", owner: "Priya Shah", tags: ["search", "index"] }),
    provenance: JSON.stringify({ repository: "crew-platform", relativePath: ".kiro/specs/workspace-index", branch: "main", commitHash: "a1b2c3d4e5f6" }),
    retention_policy: JSON.stringify({ type: "active_plus_2_years" }),
    legal_hold_active: 0,
  },
  {
    id: "snap-billing",
    spec_key: "billing-export-v3",
    created_at: "2026-08-03T09:02:00Z",
    content_digest: "b2c3d4e5f6001122",
    metadata_projection: JSON.stringify({ title: "Billing export v3", type: "feature", theme: "Commerce", owner: "Lena Ortiz", tags: ["billing", "export"] }),
    provenance: JSON.stringify({ repository: "web-console", relativePath: ".kiro/specs/billing-export-v3", branch: "main", commitHash: "b2c3d4e5f600" }),
    retention_policy: JSON.stringify({ type: "permanent" }),
    legal_hold_active: 1,
    legal_hold_reason: "Under audit",
  },
  {
    id: "snap-oauth",
    spec_key: "oauth-callback-loop",
    created_at: "2026-07-29T16:40:00Z",
    content_digest: "c3d4e5f600112233",
    metadata_projection: JSON.stringify({ title: "OAuth callback loop", type: "bugfix", theme: "Security", owner: "Theo Grant", tags: [] }),
    provenance: JSON.stringify({ repository: "identity-service", relativePath: ".kiro/specs/oauth-callback-loop", branch: "main", commitHash: "c3d4e5f60011" }),
    retention_policy: null,
    legal_hold_active: 0,
  },
  {
    id: "snap-approval",
    spec_key: "agent-tool-approval-audit",
    created_at: "2026-07-18T11:20:00Z",
    content_digest: "d4e5f60011223344",
    metadata_projection: JSON.stringify({ title: "Agent tool approval audit", type: "feature", theme: "Governance", owner: "Maya Chen", tags: ["audit", "governance"] }),
    provenance: JSON.stringify({ repository: "crew-platform", relativePath: ".kiro/specs/agent-tool-approval-audit", branch: "main", commitHash: "d4e5f6001122" }),
    retention_policy: JSON.stringify({ type: "active_plus_2_years" }),
    legal_hold_active: 0,
  },
];

// In-memory overlay store so metadata edits persist across GETs in the preview.
const metadataOverlays = new Map<string, Record<string, unknown>>();
const revisionCounters = new Map<string, number>();

const overrides: Partial<CrewIntegration> = {
  theme: { mode: "dark", colors: {} },
  api: {
    async fetch(path: string, init?: RequestInit) {
      const json = (data: unknown, status = 200): Response =>
        new Response(JSON.stringify(data), {
          status,
          headers: { "Content-Type": "application/json" },
        });

      // Metadata PATCH — persist the patch into the in-memory overlay.
      if (init?.method === "PATCH" && /\/specs\/.+\/metadata$/.test(path)) {
        const specKey = decodeURIComponent(path.replace(/\/specs\/(.+?)\/metadata$/, "$1"));
        const body = JSON.parse(String(init.body ?? "{}")) as { patch?: Record<string, unknown> };
        const existing = metadataOverlays.get(specKey) ?? {};
        metadataOverlays.set(specKey, { ...existing, ...(body.patch ?? {}) });
        const rev = (revisionCounters.get(specKey) ?? 0) + 1;
        revisionCounters.set(specKey, rev);
        return json({ revision: rev, updatedAt: new Date().toISOString() });
      }
      // Accept / reject suggestions.
      if (init?.method === "POST" && /\/suggestions\/.+\/(accept|reject)$/.test(path)) {
        return json({ status: "ok" });
      }
      // Pending suggestions for a spec.
      const sug = path.match(/\/specs\/([^/]+)\/suggestions/);
      if (sug) {
        const key = decodeURIComponent(sug[1] ?? "");
        const suggestions =
          key === "retention"
            ? [
                {
                  id: "sug-1",
                  target_spec_key: "usage-alerts",
                  type: "related",
                  confidence: 0.72,
                  reason: "shared_tokens",
                  evidence: "Both reference retention windows and usage metrics.",
                },
              ]
            : [];
        return json({ suggestions });
      }
      // Accept / reject proposals.
      if (init?.method === "POST" && /\/proposals\/.+\/(accept|reject)$/.test(path)) {
        return json({ id: "mock", status: "accepted", resolved_at: new Date().toISOString() });
      }
      // Pending proposals for a spec.
      const prop = path.match(/\/specs\/([^/]+)\/proposals/);
      if (prop) {
        if (init?.method === "POST") {
          return json({ id: crypto.randomUUID(), status: "pending" }, 201);
        }
        const key = decodeURIComponent(prop[1] ?? "");
        const proposals =
          key === "retention"
            ? [
                {
                  id: "prop-1",
                  spec_key: "retention",
                  patch: JSON.stringify({ summary: "Updated memory retention controls with 30-day window", tags: ["retention", "memory", "controls"] }),
                  status: "pending",
                  submitted_at: "2026-08-15T06:30:00Z",
                  rationale: "Auto-populated from code analysis: the implementation defines a 30-day retention window.",
                  source: "agent",
                },
              ]
            : [];
        return json({ proposals });
      }
      // Single spec detail — merges persisted overlay on top of default data.
      const det = path.match(/^\/specs\/([^/?]+)$/);
      if (det) {
        const key = decodeURIComponent(det[1] ?? "");
        const s = sampleSpecs.find((x) => x.key === key) ?? sampleSpecs[0]!;
        const overlay = metadataOverlays.get(key) ?? {};
        const rev = revisionCounters.get(key) ?? 0;
        const defaultMeta = {
          title: s.title,
          summary: `${s.title} — normalized from .kiro/specs/${s.key}.`,
          owner: s.owner,
          theme: s.theme,
          tags: ["kiro", s.type],
          targetRelease: "2026.09",
          retentionPolicy: { type: "active_plus_2_years" },
          legalHold: { active: false },
          approvers: ["Maya Chen", "Daniel Kim"],
          implementationRef: "https://github.com/crew-platform/crew/pull/847",
          createdAt: "2026-07-12T09:15:00Z",
          lastModifiedAt: "2026-08-14T16:30:00Z",
        };
        return json({
          spec: {
            key: s.key,
            spec_id: s.key,
            type: s.type,
            stage: s.stage,
            progress: s.progress,
            owner: s.owner,
            title: s.title,
            repository: s.repository,
            relative_path: `.kiro/specs/${s.key}`,
            branch: "main",
            commit_hash: "a1b2c3d4e5f6",
            is_dirty: s.key === "workspace-export" ? 1 : 0,
            remote_url: "https://github.com/crew-platform/crew.git",
          },
          metadata: { ...defaultMeta, ...overlay },
          revision: rev,
        });
      }
      // Archive listing.
      if (path.startsWith("/archive")) {
        return json({ snapshots: sampleSnapshots, nextCursor: null });
      }
      // Spec listing.
      return json({ specs: sampleSpecs, total: sampleSpecs.length });
    },
  },
};

createRoot(document.getElementById("root")!).render(
  <App crewOverrides={overrides} />,
);
