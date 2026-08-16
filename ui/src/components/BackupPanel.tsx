import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useCrew } from '../hooks/useCrewIntegration.js';

interface Props {
  onClose: () => void;
}

interface RestoreResponse {
  restored: boolean;
  requiresRestart: boolean;
  message: string;
  safetyBackupPath: string;
}

interface ApplyTextExportResponse {
  specsUpdated: string[];
  specsSkipped: string[];
  relationshipsApplied: number;
  suggestionsAdded: number;
  rejectionsAdded: number;
  proposalsAdded: number;
  errors: string[];
}

interface ErrorResponse {
  code: string;
  message: string;
}

const RESTORE_CONFIRMATION = 'RESTORE';

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function filenameFromContentDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const match = /filename="?([^"]+)"?/.exec(header);
  return match?.[1] ?? fallback;
}

/**
 * Backup & restore surface: a whole-library binary backup (download/restore,
 * full replace, requires a backend restart) and a textual/git-committable
 * export (download/apply, merges metadata + relationships + suggestions +
 * rejections + proposals into the current library — it doesn't touch audit
 * history or archived snapshot content).
 */
export function BackupPanel({ onClose }: Props): React.ReactElement {
  const { api, notify } = useCrew();

  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [downloadingExport, setDownloadingExport] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [applying, setApplying] = useState(false);

  const [restoreConfirmText, setRestoreConfirmText] = useState('');
  const [restoreResult, setRestoreResult] = useState<RestoreResponse | null>(null);
  const [applyResult, setApplyResult] = useState<ApplyTextExportResponse | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleDownloadBackup = async (): Promise<void> => {
    setDownloadingBackup(true);
    try {
      const res = await api.fetch('/backup');
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      const blob = await res.blob();
      const filename = filenameFromContentDisposition(
        res.headers.get('content-disposition'),
        'spec-library-backup.db',
      );
      triggerDownload(blob, filename);
      notify.success('Backup downloaded.');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Backup download failed.');
    } finally {
      setDownloadingBackup(false);
    }
  };

  const handleDownloadTextExport = async (): Promise<void> => {
    setDownloadingExport(true);
    try {
      const res = await api.fetch('/export/text');
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      const blob = await res.blob();
      const filename = filenameFromContentDisposition(
        res.headers.get('content-disposition'),
        'spec-library-export.zip',
      );
      triggerDownload(blob, filename);
      notify.success('Text export downloaded.');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Text export download failed.');
    } finally {
      setDownloadingExport(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setRestoring(true);
    setRestoreResult(null);
    try {
      const form = new FormData();
      form.set('confirmation', restoreConfirmText);
      form.set('file', file);
      const res = await api.fetch('/backup/restore', { method: 'POST', body: form });
      const data = (await res.json()) as RestoreResponse | ErrorResponse;
      if (!res.ok) throw new Error((data as ErrorResponse).message || `Restore failed: ${res.status}`);
      setRestoreResult(data as RestoreResponse);
      notify.success('Backup restored to disk — restart the backend to load it.');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Restore failed.');
    } finally {
      setRestoring(false);
    }
  };

  const handleApply = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setApplying(true);
    setApplyResult(null);
    try {
      const form = new FormData();
      form.set('file', file);
      const res = await api.fetch('/export/text/apply', { method: 'POST', body: form });
      const data = (await res.json()) as ApplyTextExportResponse | ErrorResponse;
      if (!res.ok) throw new Error((data as ErrorResponse).message || `Apply failed: ${res.status}`);
      const applied = data as ApplyTextExportResponse;
      setApplyResult(applied);
      notify.success(`Applied export — ${applied.specsUpdated.length} spec(s) updated.`);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Apply failed.');
    } finally {
      setApplying(false);
    }
  };

  const restoreReady = restoreConfirmText === RESTORE_CONFIRMATION;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="backup-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Backup and restore"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="backup-panel__header">
          <h2>Backup &amp; restore</h2>
          <button type="button" className="backup-panel__close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>

        <section className="backup-panel__section">
          <h3>Full backup</h3>
          <p>
            One file with the entire library&rsquo;s contents — specs, metadata, relationships,
            suggestions, proposals, and audit history. Restoring replaces everything and requires
            a backend restart to take effect.
          </p>
          <button
            type="button"
            className="backup-panel__primary"
            onClick={handleDownloadBackup}
            disabled={downloadingBackup}
          >
            {downloadingBackup ? 'Downloading…' : 'Download backup (.db)'}
          </button>

          <div className="backup-panel__restore">
            <label className="backup-panel__confirm-label">
              <span>
                Type <code>{RESTORE_CONFIRMATION}</code> to enable restore:
              </span>
              <input
                type="text"
                value={restoreConfirmText}
                onChange={(e) => setRestoreConfirmText(e.target.value)}
                placeholder={RESTORE_CONFIRMATION}
                aria-label={`Type ${RESTORE_CONFIRMATION} to confirm`}
              />
            </label>
            <label className={`backup-panel__file-button${restoreReady ? '' : ' is-disabled'}`}>
              {restoring ? 'Restoring…' : 'Choose backup file…'}
              <input
                type="file"
                accept=".db,application/octet-stream"
                disabled={!restoreReady || restoring}
                onChange={handleRestore}
                className="visually-hidden"
              />
            </label>
            {restoreResult && (
              <p className="backup-panel__result" role="status">
                {restoreResult.message}
              </p>
            )}
          </div>
        </section>

        <section className="backup-panel__section">
          <h3>Text export</h3>
          <p>
            Human-readable JSON files — one per spec, plus sources, suggestions, rejections, and
            proposals — meant for committing into its own version-control repo. Applying merges
            its contents into the current library; it doesn&rsquo;t touch audit history or
            archived snapshot content (use the full backup for exact historical fidelity).
          </p>
          <button
            type="button"
            className="backup-panel__primary"
            onClick={handleDownloadTextExport}
            disabled={downloadingExport}
          >
            {downloadingExport ? 'Downloading…' : 'Download text export (.zip)'}
          </button>

          <div className="backup-panel__restore">
            <label className="backup-panel__file-button">
              {applying ? 'Applying…' : 'Choose export file…'}
              <input
                type="file"
                accept=".zip,application/zip"
                disabled={applying}
                onChange={handleApply}
                className="visually-hidden"
              />
            </label>
            {applyResult && (
              <div className="backup-panel__result" role="status">
                <p>
                  {applyResult.specsUpdated.length} spec(s) updated
                  {applyResult.specsSkipped.length > 0
                    ? `, ${applyResult.specsSkipped.length} skipped (not found)`
                    : ''}
                  . {applyResult.relationshipsApplied} relationship(s),{' '}
                  {applyResult.suggestionsAdded} suggestion(s), {applyResult.rejectionsAdded}{' '}
                  rejection(s), {applyResult.proposalsAdded} proposal(s) applied.
                </p>
                {applyResult.errors.length > 0 && (
                  <ul className="backup-panel__errors">
                    {applyResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
