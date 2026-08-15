import React from 'react';
interface Props {
    specKey: string | undefined;
    /** 'rail' = right inspection rail (Relationship); 'drawer' = Archive drawer. */
    variant?: 'rail' | 'drawer';
    onClose?: () => void;
}
/**
 * Full spec inspection surface: identity header, spec actions (open in chat /
 * repo permalink), and the editable metadata panel with pending suggestions.
 * Rendered as a right rail in the Relationship View and inside a drawer on
 * narrow layouts.
 */
export declare function DetailPanel({ specKey, variant, onClose, }: Props): React.ReactElement | null;
export {};
//# sourceMappingURL=DetailPanel.d.ts.map