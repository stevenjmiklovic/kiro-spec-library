import React, { useState } from 'react';
import { Download, Clock, ExternalLink, Moon, RefreshCw, Sun, Users } from 'lucide-react';
import type { ThemeMode, ViewMode } from '../hooks/useUrlState.js';
import { useCrew } from '../hooks/useCrewIntegration.js';
import { BackupPanel } from './BackupPanel.js';
import { AliasesPanel } from './AliasesPanel.js';
import { AuditLogPanel } from './AuditLogPanel.js';

interface Props {
  view: ViewMode;
  themeMode: ThemeMode;
  onViewChange: (view: ViewMode) => void;
  onThemeChange: (mode: ThemeMode) => void;
}

/**
 * App chrome shown in both views: a view switcher (Relationship / Archive)
 * and a light/dark theme switcher. Theme applies to whichever view is active.
 */
export function AppChrome({
  view,
  themeMode,
  onViewChange,
  onThemeChange,
}: Props): React.ReactElement {
  const nextTheme: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
  const { api, notify } = useCrew();
  const [copyLabel, setCopyLabel] = useState('Copy link');
  const [backupPanelOpen, setBackupPanelOpen] = useState(false);
  const [aliasesPanelOpen, setAliasesPanelOpen] = useState(false);
  const [auditLogPanelOpen, setAuditLogPanelOpen] = useState(false);
  const [rescanning, setRescanning] = useState(false);

  const handleCopyLink = (): void => {
    navigator.clipboard.writeText(window.location.href);
    setCopyLabel('Copied!');
    setTimeout(() => setCopyLabel('Copy link'), 1500);
  };

  const handleRescan = async (): Promise<void> => {
    setRescanning(true);
    try {
      const sourcesRes = await api.fetch('/settings/sources');
      if (!sourcesRes.ok) throw new Error(`Failed to load sources: ${sourcesRes.status}`);
      const { sources } = (await sourcesRes.json()) as { sources: unknown[] };

      const syncRes = await api.fetch('/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources }),
      });
      if (!syncRes.ok) throw new Error(`Rescan failed: ${syncRes.status}`);
      notify.success('Rescan triggered.');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Rescan failed.');
    } finally {
      setRescanning(false);
    }
  };

  return (
    <div className="app-chrome">
      <div
        className="view-switcher"
        role="tablist"
        aria-label="View"
      >
        <button
          type="button"
          role="tab"
          aria-selected={view === 'relationship'}
          className={view === 'relationship' ? 'active' : undefined}
          onClick={() => onViewChange('relationship')}
        >
          Relationships
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'archive'}
          className={view === 'archive' ? 'active' : undefined}
          onClick={() => onViewChange('archive')}
        >
          Archive
        </button>
      </div>

      <div className="chrome-actions">
        <button
          type="button"
          className="chrome-icon-btn"
          onClick={() => setAliasesPanelOpen(true)}
          aria-label="Set your aliases for the Mine filter"
          title="Set your aliases for the Mine filter"
        >
          <Users size={14} aria-hidden="true" />
          Mine
        </button>

        <button
          type="button"
          className="chrome-icon-btn"
          onClick={() => setBackupPanelOpen(true)}
          aria-label="Backup and restore"
          title="Backup and restore"
        >
          <Download size={14} aria-hidden="true" />
          Backup
        </button>

        <button
          type="button"
          className="chrome-icon-btn"
          onClick={() => setAuditLogPanelOpen(true)}
          aria-label="View audit log"
          title="View audit log"
        >
          <Clock size={14} aria-hidden="true" />
          Audit
        </button>

        <button
          type="button"
          className="chrome-icon-btn"
          onClick={handleRescan}
          disabled={rescanning}
          aria-label="Rescan sources now"
          title="Rescan sources now"
        >
          <RefreshCw size={14} aria-hidden="true" className={rescanning ? 'is-spinning' : undefined} />
          {rescanning ? 'Rescanning…' : 'Rescan'}
        </button>

        <button
          type="button"
          className="copy-link-btn"
          onClick={handleCopyLink}
          aria-label="Copy current page link"
          title="Copy current page link"
        >
          <ExternalLink size={14} aria-hidden="true" />
          {copyLabel}
        </button>

        <button
          type="button"
          className="theme-switcher"
          onClick={() => onThemeChange(nextTheme)}
          aria-label={`Switch to ${nextTheme} theme`}
          title={`Switch to ${nextTheme} theme`}
        >
          {themeMode === 'dark' ? <Moon size={14} aria-hidden="true" /> : <Sun size={14} aria-hidden="true" />}
          {themeMode === 'dark' ? 'Dark' : 'Light'}
        </button>
      </div>

      {backupPanelOpen && <BackupPanel onClose={() => setBackupPanelOpen(false)} />}
      {aliasesPanelOpen && <AliasesPanel onClose={() => setAliasesPanelOpen(false)} />}
      {auditLogPanelOpen && <AuditLogPanel onClose={() => setAuditLogPanelOpen(false)} />}
    </div>
  );
}
