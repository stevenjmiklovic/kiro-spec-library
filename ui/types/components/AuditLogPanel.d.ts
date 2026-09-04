import React from 'react';
interface Props {
    onClose: () => void;
}
/**
 * Read-only view over the audit trail (routes/audit.ts's GET /audit) —
 * every relationship, suggestion, snapshot, backup, and metadata edit is
 * recorded; this is the first UI surface that shows any of it.
 */
export declare function AuditLogPanel({ onClose }: Props): React.ReactElement;
export {};
//# sourceMappingURL=AuditLogPanel.d.ts.map