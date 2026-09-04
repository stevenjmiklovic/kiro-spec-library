import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getLocalAliases, setLocalAliases } from '../hooks/useLocalAliases.js';
/**
 * Lets a person tell this browser which git author names/emails are
 * "theirs" — RelationshipView.tsx's "Mine" scope filter reads this list to
 * decide which specs to show. Client-only/localStorage-backed by design
 * (see useLocalAliases.ts): there's no server-side user-identity concept
 * in this app yet.
 */
export function AliasesPanel({ onClose }) {
    const [text, setText] = useState(() => getLocalAliases().join(', '));
    const [saved, setSaved] = useState(false);
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);
    const handleSave = () => {
        const aliases = text
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        setLocalAliases(aliases);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
    };
    return (_jsx("div", { className: "modal-backdrop", role: "presentation", onMouseDown: onClose, children: _jsxs("div", { className: "backup-panel", role: "dialog", "aria-modal": "true", "aria-label": "Mine \u2014 your aliases", onMouseDown: (e) => e.stopPropagation(), children: [_jsxs("header", { className: "backup-panel__header", children: [_jsx("h2", { children: "Mine \u2014 your aliases" }), _jsx("button", { type: "button", className: "backup-panel__close", onClick: onClose, "aria-label": "Close", children: _jsx(X, { size: 16 }) })] }), _jsxs("section", { className: "backup-panel__section", children: [_jsx("p", { children: "Comma-separated git author names or emails that are yours. The Relationship view\u2019s \u201CMine\u201D scope filter uses this list \u2014 stored only in this browser, not shared with anyone else." }), _jsxs("label", { className: "backup-panel__confirm-label", children: [_jsx("span", { children: "Your aliases" }), _jsx("input", { type: "text", value: text, onChange: (e) => setText(e.target.value), placeholder: "Maya Chen, maya@example.com", "aria-label": "Comma-separated aliases" })] }), _jsx("button", { type: "button", className: "backup-panel__primary", onClick: handleSave, children: saved ? 'Saved!' : 'Save' })] })] }) }));
}
