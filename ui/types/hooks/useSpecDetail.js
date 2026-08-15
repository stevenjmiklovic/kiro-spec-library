import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCrew } from './useCrewIntegration.js';
// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------
function str(v, fallback = '') {
    return typeof v === 'string' ? v : fallback;
}
function num(v, fallback = 0) {
    return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}
function normalizeDetail(raw) {
    const r = raw;
    if (!r || typeof r !== 'object')
        return null;
    const spec = (r['spec'] ?? {});
    const meta = (r['metadata'] ?? {});
    const tags = Array.isArray(meta['tags'])
        ? meta['tags'].filter((t) => typeof t === 'string')
        : [];
    const approvers = Array.isArray(meta['approvers'])
        ? meta['approvers'].filter((a) => typeof a === 'string')
        : [];
    const retention = meta['retentionPolicy'];
    const legal = meta['legalHold'];
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
            legalHold: legal
                ? { active: legal.active === true, reason: str(legal.reason) || undefined }
                : undefined,
            approvers,
            implementationRef: str(meta['implementationRef']) || undefined,
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
function normalizeSuggestions(raw) {
    const r = raw;
    const arr = r?.['suggestions'];
    if (!Array.isArray(arr))
        return [];
    return arr
        .filter((s) => !!s && typeof s === 'object')
        .map((s) => ({
        id: str(s['id']),
        targetSpecKey: str(s['target_spec_key'] ?? s['targetSpecKey']),
        type: str(s['type'], 'related'),
        confidence: num(s['confidence']),
        reason: str(s['reason']),
        evidence: str(s['evidence']),
    }))
        .filter((s) => s.id !== '');
}
function normalizeProposals(raw) {
    const r = raw;
    const arr = r?.['proposals'];
    if (!Array.isArray(arr))
        return [];
    return arr
        .filter((p) => !!p && typeof p === 'object')
        .map((p) => ({
        id: str(p['id']),
        specKey: str(p['spec_key'] ?? p['specKey']),
        patch: (typeof p['patch'] === 'string' ? JSON.parse(p['patch']) : p['patch'] ?? {}),
        status: str(p['status'], 'pending'),
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
export function useSpecDetail(specKey) {
    const { api, notify } = useCrew();
    const [detail, setDetail] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
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
                api.fetch(`/specs/${encodeURIComponent(specKey)}`),
                api.fetch(`/specs/${encodeURIComponent(specKey)}/suggestions`),
                api.fetch(`/specs/${encodeURIComponent(specKey)}/proposals`),
            ]);
            if (!detailRes.ok)
                throw new Error(`Failed to load spec: ${detailRes.status}`);
            const detailData = await detailRes.json();
            const sugData = sugRes.ok ? await sugRes.json() : { suggestions: [] };
            const propData = propRes.ok ? await propRes.json() : { proposals: [] };
            if (id === fetchIdRef.current) {
                setDetail(normalizeDetail(detailData));
                setSuggestions(normalizeSuggestions(sugData));
                setProposals(normalizeProposals(propData));
            }
        }
        catch (err) {
            if (id === fetchIdRef.current) {
                setError(err instanceof Error ? err.message : String(err));
                setDetail(null);
                setSuggestions([]);
                setProposals([]);
            }
        }
        finally {
            if (id === fetchIdRef.current)
                setLoading(false);
        }
    }, [api, specKey]);
    useEffect(() => {
        void load();
    }, [load]);
    const save = useCallback(async (patch) => {
        if (!specKey || !detail)
            return false;
        setSaving(true);
        setError(null);
        const attempt = async (expectedRevision) => {
            const res = await api.fetch(`/specs/${encodeURIComponent(specKey)}/metadata`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expectedRevision, patch }),
            });
            if (res.ok) {
                const body = (await res.json());
                setDetail((prev) => prev
                    ? {
                        ...prev,
                        revision: body.revision,
                        metadata: { ...prev.metadata, ...patch },
                    }
                    : prev);
                return true;
            }
            if (res.status === 409) {
                // Revision conflict — adopt the server's actual revision and retry once.
                const body = (await res.json().catch(() => null));
                if (body && typeof body.actual === 'number') {
                    return attempt(body.actual);
                }
            }
            const body = (await res.json().catch(() => null));
            throw new Error(body?.message ?? `Save failed: ${res.status}`);
        };
        try {
            const ok = await attempt(detail.revision);
            if (ok)
                notify.success('Metadata saved.');
            return ok;
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(msg);
            notify.error(msg);
            return false;
        }
        finally {
            setSaving(false);
        }
    }, [api, specKey, detail, notify]);
    const acceptSuggestion = useCallback(async (id) => {
        try {
            const res = await api.fetch(`/suggestions/${encodeURIComponent(id)}/accept`, {
                method: 'POST',
            });
            if (!res.ok)
                throw new Error(`Accept failed: ${res.status}`);
            setSuggestions((prev) => prev.filter((s) => s.id !== id));
            notify.success('Suggestion accepted.');
        }
        catch (err) {
            notify.error(err instanceof Error ? err.message : String(err));
        }
    }, [api, notify]);
    const rejectSuggestion = useCallback(async (id) => {
        try {
            const res = await api.fetch(`/suggestions/${encodeURIComponent(id)}/reject`, {
                method: 'POST',
            });
            if (!res.ok)
                throw new Error(`Reject failed: ${res.status}`);
            setSuggestions((prev) => prev.filter((s) => s.id !== id));
            notify.info('Suggestion dismissed.');
        }
        catch (err) {
            notify.error(err instanceof Error ? err.message : String(err));
        }
    }, [api, notify]);
    const acceptProposal = useCallback(async (id) => {
        try {
            const res = await api.fetch(`/proposals/${encodeURIComponent(id)}/accept`, {
                method: 'POST',
            });
            if (!res.ok)
                throw new Error(`Accept proposal failed: ${res.status}`);
            setProposals((prev) => prev.filter((p) => p.id !== id));
            // Refetch detail to get the updated metadata after the patch was applied
            void load();
            notify.success('Proposal accepted — metadata updated.');
        }
        catch (err) {
            notify.error(err instanceof Error ? err.message : String(err));
        }
    }, [api, notify, load]);
    const rejectProposal = useCallback(async (id) => {
        try {
            const res = await api.fetch(`/proposals/${encodeURIComponent(id)}/reject`, {
                method: 'POST',
            });
            if (!res.ok)
                throw new Error(`Reject proposal failed: ${res.status}`);
            setProposals((prev) => prev.filter((p) => p.id !== id));
            notify.info('Proposal rejected.');
        }
        catch (err) {
            notify.error(err instanceof Error ? err.message : String(err));
        }
    }, [api, notify]);
    return useMemo(() => ({
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
    }), [detail, suggestions, proposals, loading, saving, error, save, acceptSuggestion, rejectSuggestion, acceptProposal, rejectProposal, load]);
}
