import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
const TYPES = ["spec", "design", "adr", "runbook", "reference"];
const STAGES = ["draft", "review", "approved", "deprecated"];
const DEFAULT_FILTERS = { scope: "team" };
function isNonDefault(filters) {
    if (filters.scope !== "team")
        return true;
    if (filters.theme)
        return true;
    if (filters.type)
        return true;
    if (filters.stage)
        return true;
    if (filters.owner)
        return true;
    if (filters.repository)
        return true;
    if (filters.metadataComplete !== undefined)
        return true;
    if (filters.query)
        return true;
    return false;
}
export function FilterBar({ filters, options, onChange, resultCount }) {
    const handleSearchChange = (e) => {
        const value = e.target.value.slice(0, 200);
        onChange({ ...filters, query: value || undefined });
    };
    const handleScopeChange = (scope) => {
        onChange({ ...filters, scope });
    };
    const handleSelectChange = (field) => (e) => {
        const value = e.target.value || undefined;
        onChange({ ...filters, [field]: value });
    };
    const handleMetaCompleteChange = (e) => {
        const value = e.target.value;
        let metadataComplete;
        if (value === "true")
            metadataComplete = true;
        else if (value === "false")
            metadataComplete = false;
        else
            metadataComplete = undefined;
        onChange({ ...filters, metadataComplete });
    };
    const handleClear = () => {
        onChange({ ...DEFAULT_FILTERS });
    };
    const showClear = isNonDefault(filters);
    return (_jsxs("div", { className: "relationship-filter-bar", role: "search", "aria-label": "Filter specifications", children: [_jsxs("div", { children: [_jsxs("label", { children: [_jsx("span", { className: "visually-hidden", children: "Search specifications" }), _jsx("input", { type: "search", "aria-label": "Search specifications", maxLength: 200, value: filters.query ?? "", onChange: handleSearchChange, placeholder: "Search..." })] }), _jsx("span", { className: "filter-help", "aria-live": "polite", "aria-atomic": "true", children: filters.query && filters.query.length < 2
                            ? "Search activates at 2 characters"
                            : null })] }), _jsxs("div", { className: "scope-toggle", role: "group", "aria-label": "Scope", children: [_jsx("button", { type: "button", "aria-pressed": filters.scope === "team", onClick: () => handleScopeChange("team"), children: "Team" }), _jsx("button", { type: "button", "aria-pressed": filters.scope === "mine", onClick: () => handleScopeChange("mine"), title: "Show only specs you own \u2014 stored locally in your browser", children: "Mine" })] }), _jsxs("div", { children: [_jsxs("label", { children: [_jsx("span", { className: "visually-hidden", children: "Theme" }), _jsxs("select", { value: filters.theme ?? "", onChange: handleSelectChange("theme"), "aria-label": "Filter by theme", children: [_jsx("option", { value: "", children: "All themes" }), options.themes.map((t) => (_jsx("option", { value: t, children: t }, t)))] })] }), _jsxs("label", { children: [_jsx("span", { className: "visually-hidden", children: "Type" }), _jsxs("select", { value: filters.type ?? "", onChange: handleSelectChange("type"), "aria-label": "Filter by type", children: [_jsx("option", { value: "", children: "All types" }), TYPES.map((t) => (_jsx("option", { value: t, children: t }, t)))] })] }), _jsxs("label", { children: [_jsx("span", { className: "visually-hidden", children: "Stage" }), _jsxs("select", { value: filters.stage ?? "", onChange: handleSelectChange("stage"), "aria-label": "Filter by stage", children: [_jsx("option", { value: "", children: "All stages" }), STAGES.map((s) => (_jsx("option", { value: s, children: s }, s)))] })] }), _jsxs("label", { children: [_jsx("span", { className: "visually-hidden", children: "Owner" }), _jsxs("select", { value: filters.owner ?? "", onChange: handleSelectChange("owner"), "aria-label": "Filter by owner", children: [_jsx("option", { value: "", children: "All owners" }), options.owners.map((o) => (_jsx("option", { value: o, children: o }, o)))] })] }), _jsxs("label", { children: [_jsx("span", { className: "visually-hidden", children: "Repository" }), _jsxs("select", { value: filters.repository ?? "", onChange: handleSelectChange("repository"), "aria-label": "Filter by repository", children: [_jsx("option", { value: "", children: "All repositories" }), options.repositories.map((r) => (_jsx("option", { value: r, children: r }, r)))] })] }), _jsxs("label", { children: [_jsx("span", { className: "visually-hidden", children: "Metadata completeness" }), _jsxs("select", { value: filters.metadataComplete === true
                                    ? "true"
                                    : filters.metadataComplete === false
                                        ? "false"
                                        : "", onChange: handleMetaCompleteChange, "aria-label": "Filter by metadata completeness", children: [_jsx("option", { value: "", children: "Any completeness" }), _jsx("option", { value: "true", children: "Metadata complete" }), _jsx("option", { value: "false", children: "Metadata incomplete" })] })] })] }), showClear && (_jsx("button", { type: "button", onClick: handleClear, children: "Clear filters" })), isNonDefault(filters) && (_jsxs("div", { className: "filter-chips", role: "list", "aria-label": "Active filters", children: [filters.theme && (_jsxs("span", { className: "filter-chip", role: "listitem", children: ["theme: ", filters.theme, _jsx("button", { type: "button", "aria-label": `Remove theme filter: ${filters.theme}`, onClick: () => onChange({ ...filters, theme: undefined }), children: "\u2715" })] })), filters.type && (_jsxs("span", { className: "filter-chip", role: "listitem", children: ["type: ", filters.type, _jsx("button", { type: "button", "aria-label": `Remove type filter: ${filters.type}`, onClick: () => onChange({ ...filters, type: undefined }), children: "\u2715" })] })), filters.stage && (_jsxs("span", { className: "filter-chip", role: "listitem", children: ["stage: ", filters.stage, _jsx("button", { type: "button", "aria-label": `Remove stage filter: ${filters.stage}`, onClick: () => onChange({ ...filters, stage: undefined }), children: "\u2715" })] })), filters.owner && (_jsxs("span", { className: "filter-chip", role: "listitem", children: ["owner: ", filters.owner, _jsx("button", { type: "button", "aria-label": `Remove owner filter: ${filters.owner}`, onClick: () => onChange({ ...filters, owner: undefined }), children: "\u2715" })] })), filters.repository && (_jsxs("span", { className: "filter-chip", role: "listitem", children: ["repository: ", filters.repository, _jsx("button", { type: "button", "aria-label": `Remove repository filter: ${filters.repository}`, onClick: () => onChange({ ...filters, repository: undefined }), children: "\u2715" })] })), filters.query && (_jsxs("span", { className: "filter-chip", role: "listitem", children: ["search: ", filters.query, _jsx("button", { type: "button", "aria-label": "Remove search filter", onClick: () => onChange({ ...filters, query: undefined }), children: "\u2715" })] }))] })), resultCount === 0 && (_jsx("p", { role: "status", "aria-live": "polite", children: "No results match the current filters. Filters have been retained so you can adjust them." }))] }));
}
