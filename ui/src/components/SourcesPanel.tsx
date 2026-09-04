import React, { useCallback, useEffect, useState } from 'react';
import { X, Trash2, Plus, Package, RefreshCw, Search, ArrowUp, Home } from 'lucide-react';
import { useCrew } from '../hooks/useCrewIntegration.js';

interface Props {
  onClose: () => void;
}

/** A source as stored/returned by the backend (`GET /settings/sources`). */
interface Source {
  id: string;
  type: 'local' | 'remote';
  path?: string | null;
  url?: string | null;
  branch?: string | null;
  webUrlTemplate?: string | null;
  addedAt?: string;
}

/** Derive a stable, human-friendly id from a path or URL (repo folder name). */
function deriveId(value: string): string {
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
export function SourcesPanel({ onClose }: Props): React.ReactElement {
  const { api, notify } = useCrew();

  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add-form state
  const [newType, setNewType] = useState<'local' | 'remote'>('local');
  const [newPath, setNewPath] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newBranch, setNewBranch] = useState('main');

  // Directory-browser state
  interface BrowseDir {
    name: string;
    path: string;
    hasSpecs: boolean;
  }
  interface BrowseResult {
    path: string;
    name: string;
    parent: string | null;
    home: string;
    hasSpecs: boolean;
    directories: BrowseDir[];
  }
  const [browseOpen, setBrowseOpen] = useState(false);
  const [browse, setBrowse] = useState<BrowseResult | null>(null);
  const [browseLoading, setBrowseLoading] = useState(false);

  const loadBrowse = useCallback(
    async (path?: string) => {
      setBrowseLoading(true);
      try {
        const qs = path ? `?path=${encodeURIComponent(path)}` : '';
        const res = await api.fetch(`/settings/browse${qs}`);
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { message?: string } | null;
          throw new Error(body?.message ?? `Browse failed: ${res.status}`);
        }
        setBrowse((await res.json()) as BrowseResult);
      } catch (err) {
        notify.error(err instanceof Error ? err.message : 'Browse failed.');
      } finally {
        setBrowseLoading(false);
      }
    },
    [api, notify],
  );

  const openBrowser = (): void => {
    setBrowseOpen(true);
    // Start from the current input path if set, else home (undefined).
    void loadBrowse(newPath.trim() || undefined);
  };

  const useBrowsedFolder = (): void => {
    if (browse) setNewPath(browse.path);
    setBrowseOpen(false);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const loadSources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetch('/settings/sources');
      if (!res.ok) throw new Error(`Failed to load sources: ${res.status}`);
      const data = (await res.json()) as { sources: Source[] };
      setSources(Array.isArray(data.sources) ? data.sources : []);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to load sources.');
    } finally {
      setLoading(false);
    }
  }, [api, notify]);

  useEffect(() => {
    void loadSources();
  }, [loadSources]);

  const handleAdd = (): void => {
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
    } else {
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

  const handleRemove = (id: string): void => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  };

  // Id of the source currently being scanned on its own (per-project scan).
  const [scanningId, setScanningId] = useState<string | null>(null);

  /**
   * Scan a SINGLE source for new specs, without re-scanning the others.
   * The source must already be persisted (POST /sync only scans what it's
   * given, but a source added-but-not-saved wouldn't be in the DB for the
   * graph to resolve), so we persist the current set first, then scan just
   * this one.
   */
  const handleScanOne = async (source: Source): Promise<void> => {
    setScanningId(source.id);
    try {
      // Ensure the full set (including this source) is persisted first.
      const putRes = await api.fetch('/settings/sources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sources),
      });
      if (!putRes.ok) {
        const body = (await putRes.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? `Failed to save sources: ${putRes.status}`);
      }

      // Scan ONLY this source.
      const syncRes = await api.fetch('/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: [source] }),
      });
      if (!syncRes.ok) throw new Error(`Scan failed: ${syncRes.status}`);
      const { runId } = (await syncRes.json()) as { runId?: string };
      notify.info(`Scanning ${source.id}…`);

      const result = runId ? await pollScan(runId) : null;
      if (result) {
        const n = result.specsDiscovered ?? 0;
        const errs = Array.isArray(result.errors) ? result.errors.length : 0;
        notify.success(
          errs > 0
            ? `${source.id}: ${n} spec${n === 1 ? '' : 's'} indexed, ${errs} error${errs === 1 ? '' : 's'}.`
            : `${source.id}: ${n} spec${n === 1 ? '' : 's'} indexed.`,
        );
      } else {
        notify.success(`Scan of ${source.id} triggered.`);
      }
      window.dispatchEvent(new CustomEvent('spec-library:rescan-complete'));
    } catch (err) {
      notify.error(err instanceof Error ? err.message : `Scan of ${source.id} failed.`);
    } finally {
      setScanningId(null);
    }
  };

  /** Poll GET /sync/:runId until the scan leaves "running". */
  const pollScan = useCallback(
    async (runId: string): Promise<{ status?: string; specsDiscovered?: number; errors?: unknown[] } | null> => {
      for (let attempt = 0; attempt < 40; attempt += 1) {
        try {
          const res = await api.fetch(`/sync/${encodeURIComponent(runId)}`);
          if (res.ok) {
            const scan = (await res.json()) as {
              status?: string;
              specsDiscovered?: number;
              specs_discovered?: number;
              errors?: unknown;
            };
            if (scan.status && scan.status !== 'running') {
              const errors =
                typeof scan.errors === 'string'
                  ? (JSON.parse(scan.errors) as unknown[])
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
        } catch {
          /* transient — keep polling */
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      return null;
    },
    [api],
  );

  const handleSaveAndRescan = async (): Promise<void> => {
    setSaving(true);
    try {
      // Persist the full set (PUT replaces the source list).
      const putRes = await api.fetch('/settings/sources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sources),
      });
      if (!putRes.ok) {
        const body = (await putRes.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? `Failed to save sources: ${putRes.status}`);
      }
      const saved = (await putRes.json()) as { sources: Source[] };
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
      if (!syncRes.ok) throw new Error(`Rescan failed: ${syncRes.status}`);
      const { runId } = (await syncRes.json()) as { runId?: string };
      notify.info('Scanning sources…');

      const result = runId ? await pollScan(runId) : null;
      if (result) {
        const n = result.specsDiscovered ?? 0;
        const errs = Array.isArray(result.errors) ? result.errors.length : 0;
        notify.success(
          errs > 0
            ? `Scan complete: ${n} spec${n === 1 ? '' : 's'} indexed, ${errs} source error${errs === 1 ? '' : 's'}.`
            : `Scan complete: ${n} spec${n === 1 ? '' : 's'} indexed.`,
        );
      } else {
        notify.success('Sources saved. Scan triggered.');
      }

      // Refresh the graph.
      window.dispatchEvent(new CustomEvent('spec-library:rescan-complete'));
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="backup-panel sources-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Manage sources"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="backup-panel__header">
          <h2>Sources</h2>
          <button type="button" className="backup-panel__close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>

        <section className="backup-panel__section">
          <p>
            Spec Library indexes <code>.kiro/specs/</code> directories from the repositories you
            add here. Add a local repository path or a remote Git URL, then{' '}
            <strong>Save &amp; rescan</strong> to populate the graph. The app never writes to your
            repositories.
          </p>

          {/* Current sources */}
          <h3>Configured sources</h3>
          {loading ? (
            <p role="status">Loading…</p>
          ) : sources.length === 0 ? (
            <p className="sources-panel__empty">
              No sources yet. Add your first one below to get started.
            </p>
          ) : (
            <ul className="sources-panel__list">
              {sources.map((s) => (
                <li key={s.id} className="sources-panel__item">
                  <Package size={14} aria-hidden="true" />
                  <span className="sources-panel__item-body">
                    <span className="sources-panel__item-id">{s.id}</span>
                    <span className="sources-panel__item-detail">
                      {s.type === 'local' ? s.path : `${s.url}${s.branch ? ` @ ${s.branch}` : ''}`}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="sources-panel__scan"
                    onClick={() => void handleScanOne(s)}
                    disabled={scanningId !== null}
                    aria-label={`Scan project ${s.id} for new specs`}
                    title="Scan this project for new specs"
                  >
                    <RefreshCw
                      size={13}
                      aria-hidden="true"
                      className={scanningId === s.id ? 'is-spinning' : undefined}
                    />
                    {scanningId === s.id ? 'Scanning…' : 'Scan'}
                  </button>
                  <button
                    type="button"
                    className="sources-panel__remove"
                    onClick={() => handleRemove(s.id)}
                    aria-label={`Remove source ${s.id}`}
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Add source */}
        <section className="backup-panel__section">
          <h3>Add a source</h3>
          <div className="sources-panel__type-toggle" role="group" aria-label="Source type">
            <button
              type="button"
              aria-pressed={newType === 'local'}
              onClick={() => setNewType('local')}
            >
              Local path
            </button>
            <button
              type="button"
              aria-pressed={newType === 'remote'}
              onClick={() => setNewType('remote')}
            >
              Remote Git URL
            </button>
          </div>

          {newType === 'local' ? (
            <>
              <label className="sources-panel__field">
                <span>Repository path</span>
                <div className="sources-panel__path-row">
                  <input
                    type="text"
                    value={newPath}
                    onChange={(e) => setNewPath(e.target.value)}
                    placeholder="/Users/you/code/my-repo"
                    aria-label="Local repository path"
                  />
                  <button
                    type="button"
                    className="sources-panel__browse-btn"
                    onClick={openBrowser}
                    aria-expanded={browseOpen}
                    title="Browse for a folder"
                  >
                    <Search size={13} aria-hidden="true" /> Browse…
                  </button>
                </div>
              </label>

              {browseOpen && (
                <div className="dir-browser" role="group" aria-label="Folder browser">
                  <div className="dir-browser__bar">
                    <button
                      type="button"
                      className="dir-browser__up"
                      onClick={() => browse?.parent && void loadBrowse(browse.parent)}
                      disabled={!browse?.parent || browseLoading}
                      aria-label="Go to parent folder"
                      title="Parent folder"
                    >
                      <ArrowUp size={13} aria-hidden="true" />
                    </button>
                    <span className="dir-browser__cwd" title={browse?.path}>
                      {browse?.path ?? '…'}
                    </span>
                    <button
                      type="button"
                      className="dir-browser__home"
                      onClick={() => void loadBrowse(undefined)}
                      disabled={browseLoading}
                      title="Home"
                    >
                      <Home size={13} aria-hidden="true" />
                    </button>
                  </div>

                  <ul className="dir-browser__list">
                    {browseLoading ? (
                      <li className="dir-browser__loading" role="status">Loading…</li>
                    ) : browse && browse.directories.length === 0 ? (
                      <li className="dir-browser__empty">No subfolders here.</li>
                    ) : (
                      browse?.directories.map((d) => (
                        <li key={d.path}>
                          <button
                            type="button"
                            className="dir-browser__entry"
                            onClick={() => void loadBrowse(d.path)}
                            title={d.path}
                          >
                            <Package size={13} aria-hidden="true" />
                            <span className="dir-browser__entry-name">{d.name}</span>
                            {d.hasSpecs && (
                              <span className="dir-browser__badge" title="Contains .kiro/specs">
                                specs
                              </span>
                            )}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>

                  <div className="dir-browser__actions">
                    <span className="dir-browser__hint">
                      {browse?.hasSpecs
                        ? 'This folder contains .kiro/specs — good to index.'
                        : 'Pick the repo root (the folder that contains .kiro/specs).'}
                    </span>
                    <div className="dir-browser__buttons">
                      <button
                        type="button"
                        className="dir-browser__cancel"
                        onClick={() => setBrowseOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="sources-panel__add"
                        onClick={useBrowsedFolder}
                        disabled={!browse}
                      >
                        Use this folder
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <label className="sources-panel__field">
                <span>Git URL (HTTPS or SSH)</span>
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="git@github.com:org/repo.git"
                  aria-label="Remote Git URL"
                />
              </label>
              <label className="sources-panel__field">
                <span>Branch</span>
                <input
                  type="text"
                  value={newBranch}
                  onChange={(e) => setNewBranch(e.target.value)}
                  placeholder="main"
                  aria-label="Branch"
                />
              </label>
            </>
          )}

          <button type="button" className="sources-panel__add" onClick={handleAdd}>
            <Plus size={14} aria-hidden="true" /> Add to list
          </button>
        </section>

        <section className="backup-panel__section">
          <button
            type="button"
            className="backup-panel__primary"
            onClick={handleSaveAndRescan}
            disabled={saving}
          >
            <RefreshCw size={14} aria-hidden="true" className={saving ? 'is-spinning' : undefined} />
            {saving ? 'Saving & scanning…' : 'Save & rescan'}
          </button>
          <p className="sources-panel__hint">
            Saving replaces the entire source list with what is shown above, then scans it.
          </p>
        </section>
      </div>
    </div>
  );
}
