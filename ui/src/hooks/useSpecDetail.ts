import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCrew } from './useCrewIntegration.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpecDetailProvenance {
  repository: string;
  relativePath: string;
  branch: string;
  commitHash: string;
  isDirty: boolean;
  remoteUrl?: string;
}

export interface SpecDetailMetadata {
  title: string;
  summary?: string;
  owner: string;
  theme?: string;
  tags: string[];
  targetRelease?: string;
  retentionPolicy?: { type: string; customDate?: string };
  approvers: string[];
  implementationRef?: string;
  reviewedAt?: string;
}

export interface SpecDetail {
  key: string;
  specId: string;
  type: string;
  stage: string;
  progress: number;
  revision: number;
  metadata: SpecDetailMetadata;
  provenance: SpecDetailProvenance;
  createdAt: string;
  completedAt?: string;
}

/** A pending metadata/relationship suggestion awaiting accept/reject. */
export interface PendingSuggestion {
  id: string;
  sourceSpecKey: string;
  targetSpecKey: string;
  type: string;
  confidence: number;
  reason: string;
  evidence: string;
}

export interface MetadataPatch {
  title?: string;
  summary?: string;
  owner?: string;
  theme?: string;
  tags?: string[];
  targetRelease?: string;
  retentionPolicy?: { type: string; customDate?: string };
  implementationRef?: string;
  reviewedAt?: string;
}

/** A pending metadata proposal from an agent awaiting human approval. */
export interface PendingProposal {
  id: string;
  specKey: string;
  patch: Record<string, unknown>;
  status: 'pending' | 'accepted' | 'rejected';
  submittedAt: string;
  rationale?: string;
  source?: string;
}

export interface UseSpecDetailResult {
  detail: SpecDetail | null;
  suggestions: PendingSuggestion[];
  proposals: PendingProposal[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  /** Apply a metadata patch with optimistic-concurrency retry on conflict. */
  save: (patch: MetadataPatch) => Promise<boolean>;
  acceptSuggestion: (id: string) => Promise<void>;
  rejectSuggestion: (id: string) => Promise<void>;
  acceptProposal: (id: string) => Promise<void>;
  rejectProposal: (id: string) => Promise<void>;
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}
function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function normalizeDetail(raw: unknown): SpecDetail | null {
  const r = raw as Record<string, unknown> | null;
  if (!r || typeof r !== 'object') return null;

  const spec = (r['spec'] ?? {}) as Record<string, unknown>;
  const meta = (r['metadata'] ?? {}) as Record<string, unknown>;

  const tags = Array.isArray(meta['tags'])
    ? (meta['tags'] as unknown[]).filter((t): t is string => typeof t === 'string')
    : [];

  const approvers = Array.isArray(meta['approvers'])
    ? (meta['approvers'] as unknown[]).filter((a): a is string => typeof a === 'string')
    : [];

  const retention = meta['retentionPolicy'] as
    | { type?: unknown; customDate?: unknown }
    | undefined;

  const stage = str(spec['stage'], 'draft');
  const indexedAt = str(spec['indexed_at'] ?? spec['indexedAt']);

  return {
    key: str(spec['key']),
    specId: str(spec['spec_id']) || str(spec['specId']),
    type: str(spec['type'], 'unknown'),
    stage,
    progress: num(spec['progress']),
    revision: num(r['revision']),
    metadata: {
      title: str(meta['title']) || str(spec['title']) || 'Untitled',
      summary: str(meta['summary']) || undefined,
      owner: str(meta['owner']),
      theme: str(meta['theme']) || undefined,
      tags,
      targetRelease: str(meta['targetRelease']) || undefined,
      retentionPolicy: retention
        ? {
            type: str(retention.type, 'active_plus_2_years'),
            customDate: str(retention.customDate) || undefined,
          }
        : undefined,
      approvers,
      implementationRef: str(meta['implementationRef']) || undefined,
      reviewedAt: str(meta['reviewedAt']) || undefined,
    },
    provenance: {
      repository: str(spec['repository'], '—'),
      relativePath: str(spec['relative_path'] ?? spec['relativePath'], '—'),
      branch: str(spec['branch'], 'main'),
      commitHash: str(spec['commit_hash'] ?? spec['commitHash']),
      isDirty: spec['is_dirty'] === 1 || spec['is_dirty'] === true,
      remoteUrl: str(spec['remote_url'] ?? spec['remoteUrl']) || undefined,
    },
    createdAt: indexedAt || new Date().toISOString(),
    completedAt: stage === 'completed' ? indexedAt || undefined : undefined,
  };
}

function normalizeSuggestions(raw: unknown): PendingSuggestion[] {
  const r = raw as Record<string, unknown> | null;
  const arr = r?.['suggestions'];
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
    .map((s) => ({
      id: str(s['id']),
      sourceSpecKey: str(s['source_spec_key'] ?? s['sourceSpecKey']),
      targetSpecKey: str(s['target_spec_key'] ?? s['targetSpecKey']),
      type: str(s['type'], 'related'),
      confidence: num(s['confidence']),
      reason: str(s['reason']),
      evidence: str(s['evidence']),
    }))
    .filter((s) => s.id !== '');
}

function normalizeProposals(raw: unknown): PendingProposal[] {
  const r = raw as Record<string, unknown> | null;
  const arr = r?.['proposals'];
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
    .map((p) => ({
      id: str(p['id']),
      specKey: str(p['spec_key'] ?? p['specKey']),
      patch: (typeof p['patch'] === 'string' ? JSON.parse(p['patch']) : p['patch'] ?? {}) as Record<string, unknown>,
      status: (str(p['status'], 'pending') as 'pending' | 'accepted' | 'rejected'),
      submittedAt: str(p['submitted_at'] ?? p['submittedAt']),
      rationale: str(p['rationale']) || undefined,
      source: str(p['source']) || undefined,
    }))
    .filter((p) => p.id !== '' && p.status === 'pending');
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Loads full detail + pending suggestions for a single spec and provides
 * metadata editing (with optimistic-concurrency retry) and suggestion
 * accept/reject. Pass `undefined` to clear.
 */
export function useSpecDetail(specKey: string | undefined): UseSpecDetailResult {
  const { api, notify } = useCrew();

  const [detail, setDetail] = useState<SpecDetail | null>(null);
  const [suggestions, setSuggestions] = useState<PendingSuggestion[]>([]);
  const [proposals, setProposals] = useState<PendingProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdRef = useRef(0);

  const load = useCallback(async () => {
    if (!specKey) {
      setDetail(null);
      setSuggestions([]);
      setProposals([]);
      setError(null);
      return;
    }
    const id = ++fetchIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const [detailRes, sugRes, propRes] = await Promise.all([
        api.fetch(`/spec-detail?key=${encodeURIComponent(specKey)}`),
        api.fetch(`/spec-suggestions?key=${encodeURIComponent(specKey)}`),
        api.fetch(`/spec-proposals?key=${encodeURIComponent(specKey)}`),
      ]);
      if (!detailRes.ok) throw new Error(`Failed to load spec: ${detailRes.status}`);
      const detailData: unknown = await detailRes.json();
      const sugData: unknown = sugRes.ok ? await sugRes.json() : { suggestions: [] };
      const propData: unknown = propRes.ok ? await propRes.json() : { proposals: [] };

      if (id === fetchIdRef.current) {
        setDetail(normalizeDetail(detailData));
        setSuggestions(normalizeSuggestions(sugData));
        setProposals(normalizeProposals(propData));
      }
    } catch (err) {
      if (id === fetchIdRef.current) {
        setError(err instanceof Error ? err.message : String(err));
        setDetail(null);
        setSuggestions([]);
        setProposals([]);
      }
    } finally {
      if (id === fetchIdRef.current) setLoading(false);
    }
  }, [api, specKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(
    async (patch: MetadataPatch): Promise<boolean> => {
      if (!specKey || !detail) return false;
      setSaving(true);
      setError(null);

      const attempt = async (expectedRevision: number): Promise<boolean> => {
        const res = await api.fetch(
          `/specs/${encodeURIComponent(specKey)}/metadata`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expectedRevision, patch }),
          },
        );
        if (res.ok) {
          const body = (await res.json()) as { revision: number };
          setDetail((prev) =>
            prev
              ? {
                  ...prev,
                  revision: body.revision,
                  metadata: { ...prev.metadata, ...patch },
                }
              : prev,
          );
          return true;
        }
        if (res.status === 409) {
          // Revision conflict — adopt the server's actual revision and retry once.
          const body = (await res.json().catch(() => null)) as
            | { actual?: number }
            | null;
          if (body && typeof body.actual === 'number') {
            return attempt(body.actual);
          }
        }
        const body = (await res.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(body?.message ?? `Save failed: ${res.status}`);
      };

      try {
        const ok = await attempt(detail.revision);
        if (ok) notify.success('Metadata saved.');
        return ok;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        notify.error(msg);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [api, specKey, detail, notify],
  );

  const acceptSuggestion = useCallback(
    async (id: string) => {
      try {
        const res = await api.fetch(`/suggestions/${encodeURIComponent(id)}/accept`, {
          method: 'POST',
        });
        if (!res.ok) throw new Error(`Accept failed: ${res.status}`);
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
        notify.success('Suggestion accepted.');
      } catch (err) {
        notify.error(err instanceof Error ? err.message : String(err));
      }
    },
    [api, notify],
  );

  const rejectSuggestion = useCallback(
    async (id: string) => {
      try {
        const res = await api.fetch(`/suggestions/${encodeURIComponent(id)}/reject`, {
          method: 'POST',
        });
        if (!res.ok) throw new Error(`Reject failed: ${res.status}`);
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
        notify.info('Suggestion dismissed.');
      } catch (err) {
        notify.error(err instanceof Error ? err.message : String(err));
      }
    },
    [api, notify],
  );

  const acceptProposal = useCallback(
    async (id: string) => {
      try {
        const res = await api.fetch(`/proposals/${encodeURIComponent(id)}/accept`, {
          method: 'POST',
        });
        if (!res.ok) throw new Error(`Accept proposal failed: ${res.status}`);
        setProposals((prev) => prev.filter((p) => p.id !== id));
        // Refetch detail to get the updated metadata after the patch was applied
        void load();
        notify.success('Proposal accepted — metadata updated.');
      } catch (err) {
        notify.error(err instanceof Error ? err.message : String(err));
      }
    },
    [api, notify, load],
  );

  const rejectProposal = useCallback(
    async (id: string) => {
      try {
        const res = await api.fetch(`/proposals/${encodeURIComponent(id)}/reject`, {
          method: 'POST',
        });
        if (!res.ok) throw new Error(`Reject proposal failed: ${res.status}`);
        setProposals((prev) => prev.filter((p) => p.id !== id));
        notify.info('Proposal rejected.');
      } catch (err) {
        notify.error(err instanceof Error ? err.message : String(err));
      }
    },
    [api, notify],
  );

  return useMemo(
    () => ({
      detail,
      suggestions,
      proposals,
      loading,
      saving,
      error,
      save,
      acceptSuggestion,
      rejectSuggestion,
      acceptProposal,
      rejectProposal,
      refetch: load,
    }),
    [detail, suggestions, proposals, loading, saving, error, save, acceptSuggestion, rejectSuggestion, acceptProposal, rejectProposal, load],
  );
}
