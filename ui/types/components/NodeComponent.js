import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Handle, Position } from '@xyflow/react';
import { useCallback } from 'react';
import { Sparkles, AlertTriangle, Zap, Search } from 'lucide-react';
// ---------------------------------------------------------------------------
// Type glyphs
// ---------------------------------------------------------------------------
const TYPE_GLYPHS = {
    feature: Sparkles,
    bugfix: AlertTriangle,
    quick: Zap,
    unknown: Search,
};
const TYPE_LABELS = {
    feature: 'Feature',
    bugfix: 'Bugfix',
    quick: 'Quick',
    unknown: 'Unknown',
};
// ---------------------------------------------------------------------------
// Node component
// ---------------------------------------------------------------------------
export function SpecNode({ data }) {
    const { id, title, type, stage, progress, owner, project, selected, superseded, reviewed, onSelect, } = data;
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect?.(id);
        }
    }, [onSelect, id]);
    const handleClick = useCallback(() => {
        onSelect?.(id);
    }, [onSelect, id]);
    const ariaLabel = `${title}, ${TYPE_LABELS[type]}, ${stage}, ${progress}%${project ? `, project ${project}` : ''}`;
    const isSelected = selected ?? false;
    const TypeGlyph = TYPE_GLYPHS[type];
    return (_jsxs("button", { type: "button", className: `spec-node spec-node--${type}${isSelected ? ' spec-node--selected' : ''}${superseded ? ' spec-node--superseded' : ''}`, "data-stage": stage, "data-type": type, "data-selected": isSelected || undefined, "aria-label": ariaLabel, "aria-pressed": isSelected, onClick: handleClick, onKeyDown: handleKeyDown, children: [_jsx(Handle, { type: "target", position: Position.Left }), _jsxs("span", { className: "spec-node__header", children: [_jsx("span", { className: "spec-node__glyph", "aria-hidden": "true", children: _jsx(TypeGlyph, { size: 14 }) }), _jsx("span", { className: "spec-node__type-label", children: TYPE_LABELS[type] }), reviewed && (_jsx("span", { className: "spec-node__reviewed", title: "Reviewed", "aria-label": "Reviewed", children: "\u2713" }))] }), _jsx("strong", { className: "spec-node__title", children: title }), project && (_jsx("span", { className: "spec-node__project", title: `Project: ${project}`, children: project })), _jsxs("span", { className: "spec-node__meta", children: [_jsx("span", { className: "spec-node__stage", children: stage }), ' · ', _jsxs("span", { className: "spec-node__progress", children: [progress, "%"] }), owner && (_jsxs(_Fragment, { children: [' · ', _jsx("span", { className: "spec-node__owner", children: owner })] }))] }), _jsx(Handle, { type: "source", position: Position.Right })] }));
}
/** Alias for consumers that import as `NodeComponent`. */
export { SpecNode as NodeComponent };
