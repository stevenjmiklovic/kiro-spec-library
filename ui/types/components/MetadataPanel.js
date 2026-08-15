import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useRef, useState } from 'react';
import { useCrew } from '../hooks/useCrewIntegration.js';
// ---------------------------------------------------------------------------
// A single inline-editable text field
// ---------------------------------------------------------------------------
function EditableField({ label, value, placeholder, multiline, saving, commitTrigger, onCommit, }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const draftRef = useRef(draft);
    draftRef.current = draft;
    const valueRef = useRef(value);
    valueRef.current = value;
    const start = () => {
        setDraft(value);
        setEditing(true);
    };
    const cancel = () => setEditing(false);
    const commit = () => {
        setEditing(false);
        if (draft !== value)
            onCommit(draft.trim());
    };
    // Auto-commit when the selection changes (commitTrigger changes) while editing
    const isFirstTrigger = useRef(true);
    useEffect(() => {
        if (isFirstTrigger.current) {
            isFirstTrigger.current = false;
            return;
        }
        if (editing) {
            setEditing(false);
            if (draftRef.current !== valueRef.current) {
                onCommit(draftRef.current.trim());
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [commitTrigger]);
    return (_jsxs("div", { className: "meta-field", children: [_jsxs("div", { className: "meta-field__head", children: [_jsx("span", { className: "meta-field__label", children: label }), !editing && (_jsx("button", { type: "button", className: "meta-field__edit", onClick: start, "aria-label": `Edit ${label}`, children: "Edit" }))] }), editing ? (_jsxs("div", { className: "meta-field__editor", children: [multiline ? (_jsx("textarea", { value: draft, rows: 3, autoFocus: true, onChange: (e) => setDraft(e.target.value), "aria-label": label })) : (_jsx("input", { type: "text", value: draft, autoFocus: true, onChange: (e) => setDraft(e.target.value), "aria-label": label })), _jsxs("div", { className: "meta-field__actions", children: [_jsx("button", { type: "button", onClick: commit, disabled: saving, children: "Save" }), _jsx("button", { type: "button", onClick: cancel, className: "meta-field__cancel", children: "Cancel" })] })] })) : (_jsx("p", { className: `meta-field__value${value ? '' : ' meta-field__value--empty'}`, children: value || placeholder || '—' }))] }));
}
// ---------------------------------------------------------------------------
// MetadataPanel
// ---------------------------------------------------------------------------
export function MetadataPanel({ detail, suggestions, saving, onSave, onAcceptSuggestion, onRejectSuggestion, }) {
    const { notify, chatLauncher } = useCrew();
    const { metadata } = detail;
    const [tagsEditing, setTagsEditing] = useState(false);
    const [tagsDraft, setTagsDraft] = useState(metadata.tags.join(', '));
    const tagsDraftRef = useRef(tagsDraft);
    tagsDraftRef.current = tagsDraft;
    const commitTags = () => {
        setTagsEditing(false);
        const next = tagsDraft
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        if (next.join('|') !== metadata.tags.join('|')) {
            void onSave({ tags: next });
        }
    };
    // Auto-commit tags when selection changes
    const isFirstKeyChange = useRef(true);
    useEffect(() => {
        if (isFirstKeyChange.current) {
            isFirstKeyChange.current = false;
            return;
        }
        if (tagsEditing) {
            setTagsEditing(false);
            const next = tagsDraftRef.current
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);
            if (next.join('|') !== metadata.tags.join('|')) {
                void onSave({ tags: next });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detail.key]);
    // Export the current resolved metadata as a downloadable JSON sidecar.
    const handleExport = () => {
        const payload = {
            specKey: detail.key,
            metadata: {
                title: metadata.title,
                summary: metadata.summary,
                owner: metadata.owner,
                theme: metadata.theme,
                tags: metadata.tags,
                targetRelease: metadata.targetRelease,
                approvers: metadata.approvers,
                implementationRef: metadata.implementationRef,
            },
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${detail.key}.spec-library.json`;
        a.click();
        URL.revokeObjectURL(url);
    };
    const handleImport = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(String(reader.result));
                if (parsed.metadata) {
                    void onSave(parsed.metadata);
                }
                else {
                    notify.error('No metadata found in the imported file.');
                }
            }
            catch {
                notify.error('Could not parse the imported file as JSON.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };
    return (_jsxs("section", { className: "metadata-panel", "aria-label": "Spec metadata", children: [_jsxs("header", { className: "metadata-panel__head", children: [_jsx("h3", { children: "Metadata" }), _jsxs("div", { className: "metadata-panel__io", children: [_jsxs("label", { className: "metadata-panel__import", children: ["Import", _jsx("input", { type: "file", accept: "application/json,.json", onChange: handleImport, className: "visually-hidden" })] }), _jsx("button", { type: "button", onClick: handleExport, children: "Export" })] })] }), _jsx(EditableField, { label: "Title", value: metadata.title, saving: saving, commitTrigger: detail.key, onCommit: (v) => void onSave({ title: v }) }), _jsx(EditableField, { label: "Summary", value: metadata.summary ?? '', placeholder: "No summary yet", multiline: true, saving: saving, commitTrigger: detail.key, onCommit: (v) => void onSave({ summary: v }) }), _jsx(EditableField, { label: "Owner", value: metadata.owner, placeholder: "Unassigned", saving: saving, commitTrigger: detail.key, onCommit: (v) => void onSave({ owner: v }) }), _jsx(EditableField, { label: "Theme", value: metadata.theme ?? '', placeholder: "No theme", saving: saving, commitTrigger: detail.key, onCommit: (v) => void onSave({ theme: v }) }), _jsxs("div", { className: "meta-field", children: [_jsxs("div", { className: "meta-field__head", children: [_jsx("span", { className: "meta-field__label", children: "Tags" }), !tagsEditing && (_jsx("button", { type: "button", className: "meta-field__edit", onClick: () => {
                                    setTagsDraft(metadata.tags.join(', '));
                                    setTagsEditing(true);
                                }, "aria-label": "Edit tags", children: "Edit" }))] }), tagsEditing ? (_jsxs("div", { className: "meta-field__editor", children: [_jsx("input", { type: "text", value: tagsDraft, autoFocus: true, onChange: (e) => setTagsDraft(e.target.value), "aria-label": "Tags, comma separated" }), _jsx("small", { children: "Separate tags with commas." }), _jsxs("div", { className: "meta-field__actions", children: [_jsx("button", { type: "button", onClick: commitTags, disabled: saving, children: "Save" }), _jsx("button", { type: "button", className: "meta-field__cancel", onClick: () => setTagsEditing(false), children: "Cancel" })] })] })) : metadata.tags.length > 0 ? (_jsx("div", { className: "meta-tags", children: metadata.tags.map((t) => (_jsx("span", { children: t }, t))) })) : (_jsx("p", { className: "meta-field__value meta-field__value--empty", children: "No tags" }))] }), _jsx(EditableField, { label: "Target release", value: metadata.targetRelease ?? '', placeholder: "Unscheduled", saving: saving, commitTrigger: detail.key, onCommit: (v) => void onSave({ targetRelease: v }) }), _jsxs("div", { className: "meta-field", children: [_jsx("div", { className: "meta-field__head", children: _jsx("span", { className: "meta-field__label", children: "Approvers" }) }), _jsx("p", { className: `meta-field__value${metadata.approvers.length > 0 ? '' : ' meta-field__value--empty'}`, children: metadata.approvers.length > 0 ? metadata.approvers.join(', ') : 'None' })] }), _jsx(EditableField, { label: "Implementation link", value: metadata.implementationRef ?? '', placeholder: "No link", saving: saving, commitTrigger: detail.key, onCommit: (v) => void onSave({ implementationRef: v }) }), _jsxs("div", { className: "meta-field", children: [_jsx("div", { className: "meta-field__head", children: _jsx("span", { className: "meta-field__label", children: "Created" }) }), _jsx("p", { className: "meta-field__value", children: detail.createdAt ? new Date(detail.createdAt).toLocaleDateString() : '—' })] }), detail.completedAt && (_jsxs("div", { className: "meta-field", children: [_jsx("div", { className: "meta-field__head", children: _jsx("span", { className: "meta-field__label", children: "Completed" }) }), _jsx("p", { className: "meta-field__value", children: new Date(detail.completedAt).toLocaleDateString() })] })), _jsxs("div", { className: "metadata-panel__relationships", children: [_jsx("h4", { children: "Suggested relationships" }), suggestions.length === 0 ? (_jsx("p", { className: "meta-field__value meta-field__value--empty", children: "No pending suggestions." })) : (_jsx("ul", { className: "suggestion-list", children: suggestions.map((s) => (_jsxs("li", { className: "suggestion", children: [_jsxs("div", { className: "suggestion__body", children: [_jsx("span", { className: "suggestion__type", children: s.type }), _jsx("strong", { className: "suggestion__target", children: s.targetSpecKey }), _jsx("span", { className: "suggestion__evidence", children: s.evidence }), _jsxs("span", { className: "suggestion__confidence", children: [Math.round(s.confidence * 100), "% confidence"] })] }), _jsxs("div", { className: "suggestion__actions", children: [_jsx("button", { type: "button", className: "suggestion__why", onClick: () => {
                                                chatLauncher.open({
                                                    specId: detail.key,
                                                    prompt: `Explain this suggested relationship:\n- Source: ${metadata.title} (${detail.key})\n- Target: ${s.targetSpecKey}\n- Type: ${s.type}\n- Confidence: ${Math.round(s.confidence * 100)}%\n- Evidence: ${s.evidence}\n\nShow me the relevant content from both specs that supports or contradicts this suggestion.`,
                                                });
                                            }, title: "Open Crew chat to explain this suggestion", children: "Why?" }), _jsx("button", { type: "button", className: "suggestion__accept", onClick: () => onAcceptSuggestion(s.id), children: "Accept" }), _jsx("button", { type: "button", className: "suggestion__reject", onClick: () => onRejectSuggestion(s.id), children: "Dismiss" })] })] }, s.id))) }))] })] }));
}
