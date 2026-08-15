import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
function isNonDefault(f) {
    return Boolean(f.query ||
        f.type ||
        f.theme ||
        f.repository ||
        f.owner ||
        f.fromDate ||
        f.toDate ||
        f.metadataComplete !== undefined);
}
export function ArchiveFilterBar({ filters, options, onChange, }) {
    const set = (key, value) => {
        onChange({ ...filters, [key]: value });
    };
    const handleSearch = (e) => {
        set('query', e.target.value.slice(0, 200) || undefined);
    };
    const selectHandler = (key) => (e) => {
        set(key, (e.target.value || undefined));
    };
    return (_jsxs("div", { className: "archive-tools", role: "search", "aria-label": "Filter archived specs", children: [_jsxs("label", { className: "archive-search", children: [_jsx("span", { className: "visually-hidden", children: "Search archived specs" }), _jsx("input", { type: "search", maxLength: 200, value: filters.query ?? '', onChange: handleSearch, placeholder: "Search\u2026", "aria-label": "Search archived specs" })] }), _jsxs("div", { className: "archive-filter-group", children: [_jsxs("label", { children: [_jsx("span", { className: "visually-hidden", children: "Type" }), _jsxs("select", { value: filters.type ?? '', onChange: selectHandler('type'), "aria-label": "Filter by type", children: [_jsx("option", { value: "", children: "All types" }), options.types.map((t) => (_jsx("option", { value: t, children: t }, t)))] })] }), _jsxs("label", { children: [_jsx("span", { className: "visually-hidden", children: "Theme" }), _jsxs("select", { value: filters.theme ?? '', onChange: selectHandler('theme'), "aria-label": "Filter by theme", children: [_jsx("option", { value: "", children: "All themes" }), options.themes.map((t) => (_jsx("option", { value: t, children: t }, t)))] })] }), _jsxs("label", { children: [_jsx("span", { className: "visually-hidden", children: "Repository" }), _jsxs("select", { value: filters.repository ?? '', onChange: selectHandler('repository'), "aria-label": "Filter by repository", children: [_jsx("option", { value: "", children: "All repositories" }), options.repositories.map((r) => (_jsx("option", { value: r, children: r }, r)))] })] }), _jsxs("label", { children: [_jsx("span", { className: "visually-hidden", children: "Owner" }), _jsxs("select", { value: filters.owner ?? '', onChange: selectHandler('owner'), "aria-label": "Filter by owner", children: [_jsx("option", { value: "", children: "All owners" }), options.owners.map((o) => (_jsx("option", { value: o, children: o }, o)))] })] }), _jsxs("label", { children: [_jsx("span", { className: "visually-hidden", children: "Metadata completeness" }), _jsxs("select", { value: filters.metadataComplete === true
                                    ? 'true'
                                    : filters.metadataComplete === false
                                        ? 'false'
                                        : '', onChange: (e) => {
                                    const v = e.target.value;
                                    set('metadataComplete', v === 'true' ? true : v === 'false' ? false : undefined);
                                }, "aria-label": "Filter by metadata completeness", children: [_jsx("option", { value: "", children: "Any completeness" }), _jsx("option", { value: "true", children: "Metadata complete" }), _jsx("option", { value: "false", children: "Needs metadata" })] })] }), _jsxs("label", { className: "archive-date", children: [_jsx("span", { className: "visually-hidden", children: "From date" }), _jsx("input", { type: "date", value: filters.fromDate ?? '', onChange: (e) => set('fromDate', e.target.value || undefined), "aria-label": "Completed on or after" })] }), _jsxs("label", { className: "archive-date", children: [_jsx("span", { className: "visually-hidden", children: "To date" }), _jsx("input", { type: "date", value: filters.toDate ?? '', onChange: (e) => set('toDate', e.target.value || undefined), "aria-label": "Completed on or before" })] })] }), isNonDefault(filters) && (_jsx("button", { type: "button", className: "archive-clear", onClick: () => onChange({}), children: "Clear filters" })), isNonDefault(filters) && (_jsxs("div", { className: "filter-chips", role: "list", "aria-label": "Active filters", children: [filters.query && (_jsxs("span", { className: "filter-chip", role: "listitem", children: ["search: ", filters.query, _jsx("button", { type: "button", "aria-label": "Remove search filter", onClick: () => set('query', undefined), children: "\u2715" })] })), filters.type && (_jsxs("span", { className: "filter-chip", role: "listitem", children: ["type: ", filters.type, _jsx("button", { type: "button", "aria-label": `Remove type filter: ${filters.type}`, onClick: () => set('type', undefined), children: "\u2715" })] })), filters.theme && (_jsxs("span", { className: "filter-chip", role: "listitem", children: ["theme: ", filters.theme, _jsx("button", { type: "button", "aria-label": `Remove theme filter: ${filters.theme}`, onClick: () => set('theme', undefined), children: "\u2715" })] })), filters.repository && (_jsxs("span", { className: "filter-chip", role: "listitem", children: ["repository: ", filters.repository, _jsx("button", { type: "button", "aria-label": `Remove repository filter: ${filters.repository}`, onClick: () => set('repository', undefined), children: "\u2715" })] })), filters.owner && (_jsxs("span", { className: "filter-chip", role: "listitem", children: ["owner: ", filters.owner, _jsx("button", { type: "button", "aria-label": `Remove owner filter: ${filters.owner}`, onClick: () => set('owner', undefined), children: "\u2715" })] }))] }))] }));
}
