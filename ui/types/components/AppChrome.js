import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Download, Clock, ExternalLink, Moon, RefreshCw, Sun, Users, Package } from 'lucide-react';
import { useCrew } from '../hooks/useCrewIntegration.js';
import { BackupPanel } from './BackupPanel.js';
import { AliasesPanel } from './AliasesPanel.js';
import { AuditLogPanel } from './AuditLogPanel.js';
import { SourcesPanel } from './SourcesPanel.js';
/**
 * App chrome shown in both views: a view switcher (Relationship / Archive)
 * and a light/dark theme switcher. Theme applies to whichever view is active.
 */
export function AppChrome({ view, themeMode, onViewChange, onThemeChange, }) {
    const nextTheme = themeMode === 'dark' ? 'light' : 'dark';
    const { api, notify } = useCrew();
    const [copyLabel, setCopyLabel] = useState('Copy link');
    const [backupPanelOpen, setBackupPanelOpen] = useState(false);
    const [aliasesPanelOpen, setAliasesPanelOpen] = useState(false);
    const [auditLogPanelOpen, setAuditLogPanelOpen] = useState(false);
    const [sourcesPanelOpen, setSourcesPanelOpen] = useState(false);
    const [rescanning, setRescanning] = useState(false);
    // The first-run empty state (RelationshipView) opens this panel via an event,
    // so the CTA there doesn't need to own the panel's state.
    React.useEffect(() => {
        const open = () => setSourcesPanelOpen(true);
        window.addEventListener('spec-library:open-sources', open);
        return () => window.removeEventListener('spec-library:open-sources', open);
    }, []);
    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopyLabel('Copied!');
        setTimeout(() => setCopyLabel('Copy link'), 1500);
    };
    const handleRescan = async () => {
        setRescanning(true);
        try {
            const sourcesRes = await api.fetch('/settings/sources');
            if (!sourcesRes.ok)
                throw new Error(`Failed to load sources: ${sourcesRes.status}`);
            const { sources } = (await sourcesRes.json());
            // A rescan with no configured sources silently scans nothing and looks
            // like a dead button — tell the user why instead.
            if (!Array.isArray(sources) || sources.length === 0) {
                notify.error('No sources are configured, so there is nothing to scan. Add a repository source in settings first.');
                return;
            }
            const syncRes = await api.fetch('/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sources }),
            });
            if (!syncRes.ok)
                throw new Error(`Rescan failed: ${syncRes.status}`);
            const { runId } = (await syncRes.json());
            notify.info('Rescan started…');
            // Poll the scan to completion so we can report a real result and refresh
            // the graph, instead of firing and forgetting.
            const result = runId ? await pollScan(runId) : null;
            if (result && (result.status === 'completed' || result.status === 'partial_failure')) {
                const n = result.specsDiscovered ?? 0;
                const errs = Array.isArray(result.errors) ? result.errors.length : 0;
                notify.success(errs > 0
                    ? `Rescan complete: ${n} spec${n === 1 ? '' : 's'} indexed, ${errs} source error${errs === 1 ? '' : 's'}.`
                    : `Rescan complete: ${n} spec${n === 1 ? '' : 's'} indexed.`);
            }
            else {
                notify.success('Rescan triggered.');
            }
            // Signal open views to refetch their spec data (see useSpecData).
            window.dispatchEvent(new CustomEvent('spec-library:rescan-complete'));
        }
        catch (err) {
            notify.error(err instanceof Error ? err.message : 'Rescan failed.');
        }
        finally {
            setRescanning(false);
        }
    };
    /** Poll GET /sync/:runId until the scan leaves the "running" state (or times out). */
    const pollScan = async (runId) => {
        const MAX_ATTEMPTS = 40; // ~40s at 1s intervals
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
            try {
                const res = await api.fetch(`/sync/${encodeURIComponent(runId)}`);
                if (res.ok) {
                    const scan = (await res.json());
                    const status = scan.status;
                    if (status && status !== 'running') {
                        const errors = typeof scan.errors === 'string'
                            ? JSON.parse(scan.errors)
                            : Array.isArray(scan.errors)
                                ? scan.errors
                                : [];
                        return {
                            status,
                            specsDiscovered: scan.specsDiscovered ?? scan.specs_discovered ?? 0,
                            errors,
                        };
                    }
                }
            }
            catch {
                // transient — keep polling
            }
            await new Promise((r) => setTimeout(r, 1000));
        }
        return null;
    };
    return (_jsxs("div", { className: "app-chrome", children: [_jsxs("div", { className: "view-switcher", role: "tablist", "aria-label": "View", children: [_jsx("button", { type: "button", role: "tab", "aria-selected": view === 'relationship', className: view === 'relationship' ? 'active' : undefined, onClick: () => onViewChange('relationship'), children: "Relationships" }), _jsx("button", { type: "button", role: "tab", "aria-selected": view === 'archive', className: view === 'archive' ? 'active' : undefined, onClick: () => onViewChange('archive'), children: "Archive" })] }), _jsxs("div", { className: "chrome-actions", children: [_jsxs("button", { type: "button", className: "chrome-icon-btn", onClick: () => setSourcesPanelOpen(true), "aria-label": "Manage repository sources", title: "Manage repository sources", children: [_jsx(Package, { size: 14, "aria-hidden": "true" }), "Sources"] }), _jsxs("button", { type: "button", className: "chrome-icon-btn", onClick: () => setAliasesPanelOpen(true), "aria-label": "Set your aliases for the Mine filter", title: "Set your aliases for the Mine filter", children: [_jsx(Users, { size: 14, "aria-hidden": "true" }), "Mine"] }), _jsxs("button", { type: "button", className: "chrome-icon-btn", onClick: () => setBackupPanelOpen(true), "aria-label": "Backup and restore", title: "Backup and restore", children: [_jsx(Download, { size: 14, "aria-hidden": "true" }), "Backup"] }), _jsxs("button", { type: "button", className: "chrome-icon-btn", onClick: () => setAuditLogPanelOpen(true), "aria-label": "View audit log", title: "View audit log", children: [_jsx(Clock, { size: 14, "aria-hidden": "true" }), "Audit"] }), _jsxs("button", { type: "button", className: "chrome-icon-btn", onClick: handleRescan, disabled: rescanning, "aria-label": "Rescan sources now", title: "Rescan sources now", children: [_jsx(RefreshCw, { size: 14, "aria-hidden": "true", className: rescanning ? 'is-spinning' : undefined }), rescanning ? 'Rescanning…' : 'Rescan'] }), _jsxs("button", { type: "button", className: "copy-link-btn", onClick: handleCopyLink, "aria-label": "Copy current page link", title: "Copy current page link", children: [_jsx(ExternalLink, { size: 14, "aria-hidden": "true" }), copyLabel] }), _jsxs("button", { type: "button", className: "theme-switcher", onClick: () => onThemeChange(nextTheme), "aria-label": `Switch to ${nextTheme} theme`, title: `Switch to ${nextTheme} theme`, children: [themeMode === 'dark' ? _jsx(Moon, { size: 14, "aria-hidden": "true" }) : _jsx(Sun, { size: 14, "aria-hidden": "true" }), themeMode === 'dark' ? 'Dark' : 'Light'] })] }), backupPanelOpen && _jsx(BackupPanel, { onClose: () => setBackupPanelOpen(false) }), aliasesPanelOpen && _jsx(AliasesPanel, { onClose: () => setAliasesPanelOpen(false) }), auditLogPanelOpen && _jsx(AuditLogPanel, { onClose: () => setAuditLogPanelOpen(false) }), sourcesPanelOpen && _jsx(SourcesPanel, { onClose: () => setSourcesPanelOpen(false) })] }));
}
