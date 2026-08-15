import React from 'react';
import type { MetadataPatch, PendingSuggestion, SpecDetail } from '../hooks/useSpecDetail.js';
interface Props {
    detail: SpecDetail;
    suggestions: PendingSuggestion[];
    saving: boolean;
    onSave: (patch: MetadataPatch) => Promise<boolean>;
    onAcceptSuggestion: (id: string) => void;
    onRejectSuggestion: (id: string) => void;
}
export declare function MetadataPanel({ detail, suggestions, saving, onSave, onAcceptSuggestion, onRejectSuggestion, }: Props): React.ReactElement;
export {};
//# sourceMappingURL=MetadataPanel.d.ts.map