import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useCrew } from '../hooks/useCrewIntegration.js';
const AUDIT_OPERATIONS = [
    'metadata_created',
    'metadata_updated',
    'metadata_deleted',
    'relationship_created',
    'relationship_deleted',
    'suggestion_accepted',
    'suggestion_rejected',
    'snapshot_created',
    'snapshot_purged',
    'backup_created',
    'backup_restored',
    'text_export_created',
    'text_export_applied',
];
function formatOperation(op) {
    return op.replace(/_/g, ' ');
}
function formatTimestamp(iso) {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}
/**
 * Read-only view over the audit trail (routes/audit.ts's GET /audit) —
 * every relationship, suggestion, snapshot, backup, and metadata edit is
 * recorded; this is the first UI surface that shows any of it.
 */
export function AuditLogPanel({ onClose }) {
    const { api } = useCrew();
    const [operation, setOperation] = useState('');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ limit: '100' });
        if (operation)
            params.set('operation', operation);
        api
            .fetch(`/audit?${params}`)
            .then(async (res) => {
            if (!res.ok)
                throw new Error(`Failed to load audit log: ${res.status}`);
            const data = (await res.json());
            if (!cancelled)
                setEvents(data.events);
        })
            .catch((err) => {
            if (!cancelled)
                setError(err instanceof Error ? err.message : 'Failed to load audit log.');
        })
            .finally(() => {
            if (!cancelled)
                setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [api, operation]);
    return (_jsx("div", { className: "modal-backdrop", role: "presentation", onMouseDown: onClose, children: _jsxs("div", { className: "backup-panel audit-log-panel", role: "dialog", "aria-modal": "true", "aria-label": "Audit log", onMouseDown: (e) => e.stopPropagation(), children: [_jsxs("header", { className: "backup-panel__header", children: [_jsx("h2", { children: "Audit log" }), _jsx("button", { type: "button", className: "backup-panel__close", onClick: onClose, "aria-label": "Close", children: _jsx(X, { size: 16 }) })] }), _jsxs("section", { className: "backup-panel__section", children: [_jsxs("label", { className: "backup-panel__confirm-label", children: [_jsx("span", { children: "Operation" }), _jsxs("select", { value: operation, onChange: (e) => setOperation(e.target.value), "aria-label": "Filter by operation", children: [_jsx("option", { value: "", children: "All operations" }), AUDIT_OPERATIONS.map((op) => (_jsx("option", { value: op, children: formatOperation(op) }, op)))] })] }), loading && _jsx("p", { role: "status", children: "Loading\u2026" }), error && (_jsx("p", { role: "alert", className: "audit-log-panel__error", children: error })), !loading && !error && (_jsx("div", { className: "audit-log-panel__table-wrap", children: _jsxs("table", { className: "audit-log-panel__table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "When" }), _jsx("th", { children: "Operation" }), _jsx("th", { children: "Actor" }), _jsx("th", { children: "Spec" })] }) }), _jsxs("tbody", { children: [events.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 4, children: "No matching events." }) })), events.map((event) => (_jsxs("tr", { children: [_jsx("td", { children: formatTimestamp(event.timestamp) }), _jsx("td", { children: formatOperation(event.operation) }), _jsx("td", { children: event.actor }), _jsx("td", { children: event.spec_key ?? event.snapshot_id ?? '—' })] }, event.id)))] })] }) }))] })] }) }));
}
