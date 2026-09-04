import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useCallback, useEffect, useState } from 'react';
import { X, Trash2, Plus, Package, RefreshCw, Search, ArrowUp, Home } from 'lucide-react';
import { useCrew } from '../hooks/useCrewIntegration.js';
/** Derive a stable, human-friendly id from a path or URL (repo folder name). */
function deriveId(value) {
    const trimmed = value.replace(/[/\\]+$/, '').replace(/\.git$/, '');
    const seg = trimmed.split(/[/\\:]/).filter(Boolean).pop() ?? trimmed;
    const slug = seg
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug || `source-${Date.now()}`;
}
/**
 * Source management + getting-started surface. Lists configured repository
 * sources, lets the user add local paths or remote Git URLs, remove them, and
 * "Save & rescan" — which persists the set via PUT /settings/sources then
 * triggers POST /sync and polls it to completion. This is the primary
 * onboarding path: a fresh install has no sources, so nothing appears until
 * one is added here.
 */
export function SourcesPanel({ onClose }) {
    const { api, notify } = useCrew();
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    // Add-form state
    const [newType, setNewType] = useState('local');
    const [newPath, setNewPath] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newBranch, setNewBranch] = useState('main');
    const [browseOpen, setBrowseOpen] = useState(false);
    const [browse, setBrowse] = useState(null);
    const [browseLoading, setBrowseLoading] = useState(false);
    const loadBrowse = useCallback(async (path) => {
        setBrowseLoading(true);
        try {
            const qs = path ? `?path=${encodeURIComponent(path)}` : '';
            const res = await api.fetch(`/settings/browse${qs}`);
            if (!res.ok) {
                const body = (await res.json().catch(() => null));
                throw new Error(body?.message ?? `Browse failed: ${res.status}`);
            }
            setBrowse((await res.json()));
        }
        catch (err) {
            notify.error(err instanceof Error ? err.message : 'Browse failed.');
        }
        finally {
            setBrowseLoading(false);
        }
    }, [api, notify]);
    const openBrowser = () => {
        setBrowseOpen(true);
        // Start from the current input path if set, else home (undefined).
        void loadBrowse(newPath.trim() || undefined);
    };
    const useBrowsedFolder = () => {
        if (browse)
            setNewPath(browse.path);
        setBrowseOpen(false);
    };
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);
    const loadSources = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.fetch('/settings/sources');
            if (!res.ok)
                throw new Error(`Failed to load sources: ${res.status}`);
            const data = (await res.json());
            setSources(Array.isArray(data.sources) ? data.sources : []);
        }
        catch (err) {
            notify.error(err instanceof Error ? err.message : 'Failed to load sources.');
        }
        finally {
            setLoading(false);
        }
    }, [api, notify]);
    useEffect(() => {
        void loadSources();
    }, [loadSources]);
    const handleAdd = () => {
        if (newType === 'local') {
            const path = newPath.trim();
            if (!path) {
                notify.error('Enter a local repository path.');
                return;
            }
            const id = deriveId(path);
            if (sources.some((s) => s.id === id)) {
                notify.error(`A source named "${id}" already exists.`);
                return;
            }
            setSources((prev) => [
                ...prev,
                { id, type: 'local', path, addedAt: new Date().toISOString() },
            ]);
            setNewPath('');
        }
        else {
            const url = newUrl.trim();
            if (!url) {
                notify.error('Enter a remote Git URL.');
                return;
            }
            const id = deriveId(url);
            if (sources.some((s) => s.id === id)) {
                notify.error(`A source named "${id}" already exists.`);
                return;
            }
            setSources((prev) => [
                ...prev,
                {
                    id,
                    type: 'remote',
                    url,
                    branch: newBranch.trim() || 'main',
                    addedAt: new Date().toISOString(),
                },
            ]);
            setNewUrl('');
            setNewBranch('main');
        }
    };
    const handleRemove = (id) => {
        setSources((prev) => prev.filter((s) => s.id !== id));
    };
    // Id of the source currently being scanned on its own (per-project scan).
    const [scanningId, setScanningId] = useState(null);
    /**
     * Scan a SINGLE source for new specs, without re-scanning the others.
     * The source must already be persisted (POST /sync only scans what it's
     * given, but a source added-but-not-saved wouldn't be in the DB for the
     * graph to resolve), so we persist the current set first, then scan just
     * this one.
     */
    const handleScanOne = async (source) => {
        setScanningId(source.id);
        try {
            // Ensure the full set (including this source) is persisted first.
            const putRes = await api.fetch('/settings/sources', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sources),
            });
            if (!putRes.ok) {
                const body = (await putRes.json().catch(() => null));
                throw new Error(body?.message ?? `Failed to save sources: ${putRes.status}`);
            }
            // Scan ONLY this source.
            const syncRes = await api.fetch('/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sources: [source] }),
            });
            if (!syncRes.ok)
                throw new Error(`Scan failed: ${syncRes.status}`);
            const { runId } = (await syncRes.json());
            notify.info(`Scanning ${source.id}…`);
            const result = runId ? await pollScan(runId) : null;
            if (result) {
                const n = result.specsDiscovered ?? 0;
                const errs = Array.isArray(result.errors) ? result.errors.length : 0;
                notify.success(errs > 0
                    ? `${source.id}: ${n} spec${n === 1 ? '' : 's'} indexed, ${errs} error${errs === 1 ? '' : 's'}.`
                    : `${source.id}: ${n} spec${n === 1 ? '' : 's'} indexed.`);
            }
            else {
                notify.success(`Scan of ${source.id} triggered.`);
            }
            window.dispatchEvent(new CustomEvent('spec-library:rescan-complete'));
        }
        catch (err) {
            notify.error(err instanceof Error ? err.message : `Scan of ${source.id} failed.`);
        }
        finally {
            setScanningId(null);
        }
    };
    /** Poll GET /sync/:runId until the scan leaves "running". */
    const pollScan = useCallback(async (runId) => {
        for (let attempt = 0; attempt < 40; attempt += 1) {
            try {
                const res = await api.fetch(`/sync/${encodeURIComponent(runId)}`);
                if (res.ok) {
                    const scan = (await res.json());
                    if (scan.status && scan.status !== 'running') {
                        const errors = typeof scan.errors === 'string'
                            ? JSON.parse(scan.errors)
                            : Array.isArray(scan.errors)
                                ? scan.errors
                                : [];
                        return {
                            status: scan.status,
                            specsDiscovered: scan.specsDiscovered ?? scan.specs_discovered ?? 0,
                            errors,
                        };
                    }
                }
            }
            catch {
                /* transient — keep polling */
            }
            await new Promise((r) => setTimeout(r, 1000));
        }
        return null;
    }, [api]);
    const handleSaveAndRescan = async () => {
        setSaving(true);
        try {
            // Persist the full set (PUT replaces the source list).
            const putRes = await api.fetch('/settings/sources', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sources),
            });
            if (!putRes.ok) {
                const body = (await putRes.json().catch(() => null));
                throw new Error(body?.message ?? `Failed to save sources: ${putRes.status}`);
            }
            const saved = (await putRes.json());
            setSources(Array.isArray(saved.sources) ? saved.sources : sources);
            if (sources.length === 0) {
                notify.success('Sources cleared.');
                window.dispatchEvent(new CustomEvent('spec-library:rescan-complete'));
                return;
            }
            // Trigger a scan and poll to completion.
            const syncRes = await api.fetch('/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sources: saved.sources }),
            });
            if (!syncRes.ok)
                throw new Error(`Rescan failed: ${syncRes.status}`);
            const { runId } = (await syncRes.json());
            notify.info('Scanning sources…');
            const result = runId ? await pollScan(runId) : null;
            if (result) {
                const n = result.specsDiscovered ?? 0;
                const errs = Array.isArray(result.errors) ? result.errors.length : 0;
                notify.success(errs > 0
                    ? `Scan complete: ${n} spec${n === 1 ? '' : 's'} indexed, ${errs} source error${errs === 1 ? '' : 's'}.`
                    : `Scan complete: ${n} spec${n === 1 ? '' : 's'} indexed.`);
            }
            else {
                notify.success('Sources saved. Scan triggered.');
            }
            // Refresh the graph.
            window.dispatchEvent(new CustomEvent('spec-library:rescan-complete'));
        }
        catch (err) {
            notify.error(err instanceof Error ? err.message : 'Save failed.');
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsx("div", { className: "modal-backdrop", role: "presentation", onMouseDown: onClose, children: _jsxs("div", { className: "backup-panel sources-panel", role: "dialog", "aria-modal": "true", "aria-label": "Manage sources", onMouseDown: (e) => e.stopPropagation(), children: [_jsxs("header", { className: "backup-panel__header", children: [_jsx("h2", { children: "Sources" }), _jsx("button", { type: "button", className: "backup-panel__close", onClick: onClose, "aria-label": "Close", children: _jsx(X, { size: 16 }) })] }), _jsxs("section", { className: "backup-panel__section", children: [_jsxs("p", { children: ["Spec Library indexes ", _jsx("code", { children: ".kiro/specs/" }), " directories from the repositories you add here. Add a local repository path or a remote Git URL, then", ' ', _jsx("strong", { children: "Save & rescan" }), " to populate the graph. The app never writes to your repositories."] }), _jsx("h3", { children: "Configured sources" }), loading ? (_jsx("p", { role: "status", children: "Loading\u2026" })) : sources.length === 0 ? (_jsx("p", { className: "sources-panel__empty", children: "No sources yet. Add your first one below to get started." })) : (_jsx("ul", { className: "sources-panel__list", children: sources.map((s) => (_jsxs("li", { className: "sources-panel__item", children: [_jsx(Package, { size: 14, "aria-hidden": "true" }), _jsxs("span", { className: "sources-panel__item-body", children: [_jsx("span", { className: "sources-panel__item-id", children: s.id }), _jsx("span", { className: "sources-panel__item-detail", children: s.type === 'local' ? s.path : `${s.url}${s.branch ? ` @ ${s.branch}` : ''}` })] }), _jsxs("button", { type: "button", className: "sources-panel__scan", onClick: () => void handleScanOne(s), disabled: scanningId !== null, "aria-label": `Scan project ${s.id} for new specs`, title: "Scan this project for new specs", children: [_jsx(RefreshCw, { size: 13, "aria-hidden": "true", className: scanningId === s.id ? 'is-spinning' : undefined }), scanningId === s.id ? 'Scanning…' : 'Scan'] }), _jsx("button", { type: "button", className: "sources-panel__remove", onClick: () => handleRemove(s.id), "aria-label": `Remove source ${s.id}`, title: "Remove", children: _jsx(Trash2, { size: 14 }) })] }, s.id))) }))] }), _jsxs("section", { className: "backup-panel__section", children: [_jsx("h3", { children: "Add a source" }), _jsxs("div", { className: "sources-panel__type-toggle", role: "group", "aria-label": "Source type", children: [_jsx("button", { type: "button", "aria-pressed": newType === 'local', onClick: () => setNewType('local'), children: "Local path" }), _jsx("button", { type: "button", "aria-pressed": newType === 'remote', onClick: () => setNewType('remote'), children: "Remote Git URL" })] }), newType === 'local' ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: "sources-panel__field", children: [_jsx("span", { children: "Repository path" }), _jsxs("div", { className: "sources-panel__path-row", children: [_jsx("input", { type: "text", value: newPath, onChange: (e) => setNewPath(e.target.value), placeholder: "/Users/you/code/my-repo", "aria-label": "Local repository path" }), _jsxs("button", { type: "button", className: "sources-panel__browse-btn", onClick: openBrowser, "aria-expanded": browseOpen, title: "Browse for a folder", children: [_jsx(Search, { size: 13, "aria-hidden": "true" }), " Browse\u2026"] })] })] }), browseOpen && (_jsxs("div", { className: "dir-browser", role: "group", "aria-label": "Folder browser", children: [_jsxs("div", { className: "dir-browser__bar", children: [_jsx("button", { type: "button", className: "dir-browser__up", onClick: () => browse?.parent && void loadBrowse(browse.parent), disabled: !browse?.parent || browseLoading, "aria-label": "Go to parent folder", title: "Parent folder", children: _jsx(ArrowUp, { size: 13, "aria-hidden": "true" }) }), _jsx("span", { className: "dir-browser__cwd", title: browse?.path, children: browse?.path ?? '…' }), _jsx("button", { type: "button", className: "dir-browser__home", onClick: () => void loadBrowse(undefined), disabled: browseLoading, title: "Home", children: _jsx(Home, { size: 13, "aria-hidden": "true" }) })] }), _jsx("ul", { className: "dir-browser__list", children: browseLoading ? (_jsx("li", { className: "dir-browser__loading", role: "status", children: "Loading\u2026" })) : browse && browse.directories.length === 0 ? (_jsx("li", { className: "dir-browser__empty", children: "No subfolders here." })) : (browse?.directories.map((d) => (_jsx("li", { children: _jsxs("button", { type: "button", className: "dir-browser__entry", onClick: () => void loadBrowse(d.path), title: d.path, children: [_jsx(Package, { size: 13, "aria-hidden": "true" }), _jsx("span", { className: "dir-browser__entry-name", children: d.name }), d.hasSpecs && (_jsx("span", { className: "dir-browser__badge", title: "Contains .kiro/specs", children: "specs" }))] }) }, d.path)))) }), _jsxs("div", { className: "dir-browser__actions", children: [_jsx("span", { className: "dir-browser__hint", children: browse?.hasSpecs
                                                        ? 'This folder contains .kiro/specs — good to index.'
                                                        : 'Pick the repo root (the folder that contains .kiro/specs).' }), _jsxs("div", { className: "dir-browser__buttons", children: [_jsx("button", { type: "button", className: "dir-browser__cancel", onClick: () => setBrowseOpen(false), children: "Cancel" }), _jsx("button", { type: "button", className: "sources-panel__add", onClick: useBrowsedFolder, disabled: !browse, children: "Use this folder" })] })] })] }))] })) : (_jsxs(_Fragment, { children: [_jsxs("label", { className: "sources-panel__field", children: [_jsx("span", { children: "Git URL (HTTPS or SSH)" }), _jsx("input", { type: "text", value: newUrl, onChange: (e) => setNewUrl(e.target.value), placeholder: "git@github.com:org/repo.git", "aria-label": "Remote Git URL" })] }), _jsxs("label", { className: "sources-panel__field", children: [_jsx("span", { children: "Branch" }), _jsx("input", { type: "text", value: newBranch, onChange: (e) => setNewBranch(e.target.value), placeholder: "main", "aria-label": "Branch" })] })] })), _jsxs("button", { type: "button", className: "sources-panel__add", onClick: handleAdd, children: [_jsx(Plus, { size: 14, "aria-hidden": "true" }), " Add to list"] })] }), _jsxs("section", { className: "backup-panel__section", children: [_jsxs("button", { type: "button", className: "backup-panel__primary", onClick: handleSaveAndRescan, disabled: saving, children: [_jsx(RefreshCw, { size: 14, "aria-hidden": "true", className: saving ? 'is-spinning' : undefined }), saving ? 'Saving & scanning…' : 'Save & rescan'] }), _jsx("p", { className: "sources-panel__hint", children: "Saving replaces the entire source list with what is shown above, then scans it." })] })] }) }));
}
