import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useCrew } from '../hooks/useCrewIntegration.js';

interface Props {
  onClose: () => void;
}

// Mirrors shared/src/constants.ts's AUDIT_OPERATIONS — duplicated locally
// rather than imported since the ui package doesn't depend on the shared
// workspace package at runtime (only via a type-checking project reference).
type AuditOperation =
  | 'metadata_created'
  | 'metadata_updated'
  | 'metadata_deleted'
  | 'relationship_created'
  | 'relationship_deleted'
  | 'suggestion_accepted'
  | 'suggestion_rejected'
  | 'snapshot_created'
  | 'snapshot_purged'
  | 'backup_created'
  | 'backup_restored'
  | 'text_export_created'
  | 'text_export_applied';

const AUDIT_OPERATIONS: readonly AuditOperation[] = [
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

interface AuditEvent {
  id: string;
  operation: string;
  spec_key: string | null;
  snapshot_id: string | null;
  actor: string;
  timestamp: string;
}

function formatOperation(op: string): string {
  return op.replace(/_/g, ' ');
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

/**
 * Read-only view over the audit trail (routes/audit.ts's GET /audit) —
 * every relationship, suggestion, snapshot, backup, and metadata edit is
 * recorded; this is the first UI surface that shows any of it.
 */
export function AuditLogPanel({ onClose }: Props): React.ReactElement {
  const { api } = useCrew();

  const [operation, setOperation] = useState<AuditOperation | ''>('');
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ limit: '100' });
    if (operation) params.set('operation', operation);

    api
      .fetch(`/audit?${params}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load audit log: ${res.status}`);
        const data = (await res.json()) as { events: AuditEvent[] };
        if (!cancelled) setEvents(data.events);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load audit log.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [api, operation]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="backup-panel audit-log-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Audit log"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="backup-panel__header">
          <h2>Audit log</h2>
          <button type="button" className="backup-panel__close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>

        <section className="backup-panel__section">
          <label className="backup-panel__confirm-label">
            <span>Operation</span>
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value as AuditOperation | '')}
              aria-label="Filter by operation"
            >
              <option value="">All operations</option>
              {AUDIT_OPERATIONS.map((op) => (
                <option key={op} value={op}>
                  {formatOperation(op)}
                </option>
              ))}
            </select>
          </label>

          {loading && <p role="status">Loading…</p>}
          {error && (
            <p role="alert" className="audit-log-panel__error">
              {error}
            </p>
          )}

          {!loading && !error && (
            <div className="audit-log-panel__table-wrap">
              <table className="audit-log-panel__table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Operation</th>
                    <th>Actor</th>
                    <th>Spec</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 && (
                    <tr>
                      <td colSpan={4}>No matching events.</td>
                    </tr>
                  )}
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td>{formatTimestamp(event.timestamp)}</td>
                      <td>{formatOperation(event.operation)}</td>
                      <td>{event.actor}</td>
                      <td>{event.spec_key ?? event.snapshot_id ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
