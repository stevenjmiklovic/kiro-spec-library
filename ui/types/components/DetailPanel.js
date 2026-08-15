import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { useSpecDetail } from '../hooks/useSpecDetail.js';
import { SpecActions } from './SpecActions.js';
import { MetadataPanel } from './MetadataPanel.js';
import { ProposalQueue } from './ProposalQueue.js';
/**
 * Full spec inspection surface: identity header, spec actions (open in chat /
 * repo permalink), and the editable metadata panel with pending suggestions.
 * Rendered as a right rail in the Relationship View and inside a drawer on
 * narrow layouts.
 */
export function DetailPanel({ specKey, variant = 'rail', onClose, }) {
    const { detail, suggestions, proposals, loading, saving, error, save, acceptSuggestion, rejectSuggestion, acceptProposal, rejectProposal, } = useSpecDetail(specKey);
    // Escape-to-close (works for both rail and drawer variants)
    useEffect(() => {
        if (!onClose)
            return undefined;
        const handleKey = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);
    if (!specKey)
        return null;
    return (_jsxs("aside", { className: `detail-panel detail-panel--${variant}`, "aria-label": "Spec detail", "aria-busy": loading, children: [onClose && (_jsx("button", { type: "button", className: "detail-panel__close", onClick: onClose, "aria-label": "Close detail", children: "\u2715" })), loading && !detail && (_jsx("p", { className: "detail-panel__status", role: "status", children: "Loading spec\u2026" })), error && !detail && (_jsx("p", { className: "detail-panel__status", role: "alert", children: error })), detail && (_jsxs(_Fragment, { children: [_jsxs("header", { className: "detail-panel__header", children: [_jsxs("p", { className: "detail-panel__eyebrow", children: [detail.type, " \u00B7 ", detail.stage, " \u00B7 ", detail.progress, "%"] }), _jsxs("h2", { className: "detail-panel__title", children: [detail.metadata.title, saving && (_jsx("span", { className: "detail-panel__saving", role: "status", "aria-live": "polite", children: "Saving\u2026" }))] }), _jsx("p", { className: "detail-panel__key", children: detail.key })] }), _jsx(SpecActions, { detail: detail }), _jsx(ProposalQueue, { proposals: proposals, specKey: detail.key, specTitle: detail.metadata.title, onAccept: acceptProposal, onReject: rejectProposal }), _jsx(MetadataPanel, { detail: detail, suggestions: suggestions, saving: saving, onSave: save, onAcceptSuggestion: acceptSuggestion, onRejectSuggestion: rejectSuggestion })] }))] }));
}
