import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSpecData } from '../hooks/useSpecData.js';
import { useUrlState } from '../hooks/useUrlState.js';
import { FilterBar, } from '../components/FilterBar.js';
import GraphCanvas from '../components/GraphCanvas.js';
import { Y_AXIS_OPTIONS } from '../components/GraphCanvas.js';
import { DetailPanel } from '../components/DetailPanel.js';
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_VISIBLE_NODES = 250;
const LOCAL_ALIASES_KEY = 'kiro-spec-library:aliases';
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Read user aliases from localStorage (never throws; not an auth boundary). */
function getLocalAliases() {
    try {
        const raw = localStorage.getItem(LOCAL_ALIASES_KEY);
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed.filter((v) => typeof v === 'string');
        }
        return [];
    }
    catch {
        return [];
    }
}
/** Cautiously normalize an unknown backend record into a GraphSpec. */
function normalizeSpec(record) {
    const r = record;
    if (!r || typeof r !== 'object') {
        return {
            key: crypto.randomUUID(),
            title: 'Unknown',
            type: 'unknown',
            stage: 'draft',
            owner: '',
            theme: '',
            progress: 0,
            relationships: [],
            suggestions: [],
        };
    }
    const str = (field, fallback = '') => {
        const v = r[field];
        return typeof v === 'string' ? v : fallback;
    };
    const num = (field, fallback = 0) => {
        const v = r[field];
        return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
    };
    const parseRelArray = (field) => {
        const arr = r[field];
        if (!Array.isArray(arr))
            return [];
        return arr
            .filter((item) => item !== null && typeof item === 'object')
            .map((item) => ({
            targetKey: typeof item['targetKey'] === 'string' ? item['targetKey'] : '',
            type: typeof item['type'] === 'string' ? item['type'] : 'related',
        }))
            .filter((rel) => rel.targetKey !== '');
    };
    const key = str('key') || str('id') || str('slug') || crypto.randomUUID();
    const title = str('title') || str('name') || 'Untitled';
    const rawType = str('type', 'unknown');
    const type = rawType === 'feature' || rawType === 'bugfix' || rawType === 'quick'
        ? rawType
        : 'unknown';
    return {
        key,
        title,
        type,
        stage: str('stage', 'draft'),
        owner: str('owner'),
        theme: str('theme'),
        progress: num('progress', 0),
        relationships: parseRelArray('relationships'),
        suggestions: parseRelArray('suggestions'),
    };
}
function normalizeSpecExtended(record) {
    const base = normalizeSpec(record);
    const r = record;
    const repository = r && typeof r === 'object'
        ? typeof r['repository'] === 'string'
            ? r['repository']
            : typeof r['repo'] === 'string'
                ? r['repo']
                : ''
        : '';
    const metadataComplete = r && typeof r === 'object' ? r['metadataComplete'] === true : false;
    return { ...base, repository, metadataComplete };
}
/** Derive FilterOptions from the current set. */
function deriveFilterOptions(specs) {
    const themes = new Set();
    const owners = new Set();
    const repositories = new Set();
    for (const s of specs) {
        if (s.theme)
            themes.add(s.theme);
        if (s.owner)
            owners.add(s.owner);
        if (s.repository)
            repositories.add(s.repository);
    }
    return {
        themes: [...themes].sort(),
        owners: [...owners].sort(),
        repositories: [...repositories].sort(),
    };
}
// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function RelationshipView() {
    const [urlState, setUrlState] = useUrlState();
    // Keyboard hint visibility: fades in on first focus, fades out after 4s
    const [hintVisible, setHintVisible] = useState(false);
    const hintShownRef = useRef(false);
    // Local filter state: combines URL filters with scope/metadata not in URL
    const [filters, setFilters] = useState(() => ({
        scope: 'team',
        theme: urlState.filters.theme,
        type: urlState.filters.type,
        stage: urlState.filters.stage,
        owner: urlState.filters.owner,
        repository: urlState.filters.repository,
        query: urlState.query,
    }));
    // Fetch data
    const { specs: rawSpecs, loading, error } = useSpecData({
        query: filters.query,
        filters: {
            type: filters.type,
            stage: filters.stage,
            owner: filters.owner,
            repository: filters.repository,
        },
        limit: 500,
    });
    // Normalize unknown records
    const allSpecs = useMemo(() => (rawSpecs ?? []).map(normalizeSpecExtended), [rawSpecs]);
    // Client-side filtering (scope + metadata completeness)
    const filteredSpecs = useMemo(() => {
        let result = allSpecs;
        // Scope: "mine" — filter to localStorage aliases (client-only, not auth)
        if (filters.scope === 'mine') {
            const aliases = getLocalAliases();
            if (aliases.length > 0) {
                const aliasSet = new Set(aliases.map((a) => a.toLowerCase()));
                result = result.filter((s) => s.owner !== '' && aliasSet.has(s.owner.toLowerCase()));
            }
        }
        // Theme (client-side complement when not sent to backend)
        if (filters.theme) {
            result = result.filter((s) => s.theme === filters.theme);
        }
        // Metadata completeness
        if (filters.metadataComplete !== undefined) {
            result = result.filter((s) => s.metadataComplete === filters.metadataComplete);
        }
        return result;
    }, [allSpecs, filters.scope, filters.theme, filters.metadataComplete]);
    // Sort and enforce 250-node cap
    const sortedSpecs = useMemo(() => [...filteredSpecs].sort((a, b) => a.title.localeCompare(b.title)), [filteredSpecs]);
    const isTruncated = sortedSpecs.length > MAX_VISIBLE_NODES;
    const visibleSpecs = useMemo(() => (isTruncated ? sortedSpecs.slice(0, MAX_VISIBLE_NODES) : sortedSpecs), [sortedSpecs, isTruncated]);
    // GraphSpec[] for the canvas (strip extended fields)
    const graphSpecs = useMemo(() => visibleSpecs.map(({ metadataComplete: _m, ...spec }) => spec), [visibleSpecs]);
    // Derive filter options from full (pre-truncation) set
    const filterOptions = useMemo(() => deriveFilterOptions(allSpecs), [allSpecs]);
    // --- Selection state (synced to URL) ---
    const [selectedKey, setSelectedKey] = useState(urlState.selected);
    const selectSpec = useCallback((key) => {
        setSelectedKey(key);
        setUrlState({ selected: key });
    }, [setUrlState]);
    const handleCanvasSelect = useCallback((key) => {
        selectSpec(key);
    }, [selectSpec]);
    // Selected spec detail
    const selectedSpec = useMemo(() => selectedKey ? visibleSpecs.find((s) => s.key === selectedKey) : undefined, [selectedKey, visibleSpecs]);
    // --- Roving keyboard focus ---
    const containerRef = useRef(null);
    const [focusIndex, setFocusIndex] = useState(-1);
    useEffect(() => {
        const el = containerRef.current;
        if (!el)
            return;
        const handleKeyDown = (e) => {
            if (visibleSpecs.length === 0)
                return;
            let nextIndex = focusIndex;
            switch (e.key) {
                case 'ArrowDown':
                case 'ArrowRight':
                    e.preventDefault();
                    nextIndex =
                        focusIndex < visibleSpecs.length - 1 ? focusIndex + 1 : 0;
                    break;
                case 'ArrowUp':
                case 'ArrowLeft':
                    e.preventDefault();
                    nextIndex =
                        focusIndex > 0 ? focusIndex - 1 : visibleSpecs.length - 1;
                    break;
                case 'Home':
                    e.preventDefault();
                    nextIndex = 0;
                    break;
                case 'End':
                    e.preventDefault();
                    nextIndex = visibleSpecs.length - 1;
                    break;
                default:
                    return;
            }
            setFocusIndex(nextIndex);
            const target = visibleSpecs[nextIndex];
            if (target) {
                selectSpec(target.key);
            }
        };
        el.addEventListener('keydown', handleKeyDown);
        return () => el.removeEventListener('keydown', handleKeyDown);
    }, [focusIndex, visibleSpecs, selectSpec]);
    // Sync URL selection changes back to local state
    useEffect(() => {
        if (urlState.selected !== selectedKey) {
            setSelectedKey(urlState.selected);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlState.selected]);
    // --- Filter change handler ---
    const handleFilterChange = useCallback((next) => {
        setFilters(next);
        setUrlState({
            query: next.query,
            filters: {
                type: next.type,
                stage: next.stage,
                owner: next.owner,
                repository: next.repository,
            },
        });
    }, [setUrlState]);
    // Status text for assistive tech
    const statusText = useMemo(() => {
        if (loading)
            return 'Loading specifications…';
        if (error)
            return `Error: ${error}`;
        if (visibleSpecs.length === 0)
            return 'No specifications to display.';
        const sel = selectedSpec ? ` Selected: ${selectedSpec.title}.` : '';
        return `Showing ${visibleSpecs.length} of ${filteredSpecs.length} specifications.${sel}`;
    }, [loading, error, visibleSpecs.length, filteredSpecs.length, selectedSpec]);
    // Show keyboard hint on first focus of the container
    const handleContainerFocus = useCallback(() => {
        if (!hintShownRef.current) {
            hintShownRef.current = true;
            setHintVisible(true);
            setTimeout(() => setHintVisible(false), 4000);
        }
    }, []);
    // --- Render ---
    if (error) {
        return (_jsxs("div", { className: "relationship-view", role: "alert", "aria-live": "assertive", children: [_jsxs("header", { className: "relationship-header", children: [_jsx("p", { className: "eyebrow", children: "Relationship observatory" }), _jsx("h1", { children: "Spec Library" })] }), _jsxs("div", { className: "graph-shell", children: [_jsxs("p", { children: ["Failed to load specifications: ", error] }), _jsx("p", { children: "Check your connection and try again." })] })] }));
    }
    return (_jsxs("div", { ref: containerRef, className: "relationship-view", tabIndex: 0, "aria-label": "Specification relationship graph view", role: "application", onFocus: handleContainerFocus, children: [_jsxs("header", { className: "relationship-header", children: [_jsx("p", { className: "eyebrow", children: "Relationship observatory" }), _jsx("h1", { children: "Spec Library" })] }), _jsx(FilterBar, { filters: filters, options: filterOptions, onChange: handleFilterChange, resultCount: visibleSpecs.length }), isTruncated && (_jsx("div", { role: "status", "aria-live": "polite", className: "truncation-prompt", children: _jsxs("p", { children: ["Showing ", MAX_VISIBLE_NODES, " of ", filteredSpecs.length, " specifications. Refine your filters to narrow the results."] }) })), _jsx("div", { className: "visually-hidden", "aria-live": "polite", "aria-atomic": "true", children: statusText }), loading ? (_jsx("div", { className: "graph-shell", "aria-busy": "true", "aria-label": "Loading specifications", children: _jsxs("div", { className: "skeleton-container", children: [_jsx("div", { className: "skeleton-node" }), _jsx("div", { className: "skeleton-node" }), _jsx("div", { className: "skeleton-node" }), _jsx("div", { className: "skeleton-node" }), _jsx("div", { className: "skeleton-node" })] }) })) : visibleSpecs.length === 0 ? (_jsx("div", { className: "graph-shell", children: _jsx("p", { children: "No specifications match the current view." }) })) : (_jsx(_Fragment, { children: _jsxs("div", { className: "graph-with-rail", children: [_jsxs("div", { className: "graph-column", children: [_jsx("div", { className: "graph-toolbar", children: _jsxs("label", { className: "y-axis-selector", children: [_jsx("span", { children: "Y-axis:" }), _jsx("select", { value: urlState.yAxis, onChange: (e) => setUrlState({ yAxis: e.target.value }), "aria-label": "Y-axis grouping", children: Y_AXIS_OPTIONS.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })] }) }), _jsx("div", { className: "graph-shell", children: _jsx(GraphCanvas, { specs: graphSpecs, selectedKey: selectedKey, onSelect: handleCanvasSelect, colorMode: urlState.themeMode, yAxisField: urlState.yAxis }) }), hintVisible && (_jsx("p", { className: "keyboard-hint", children: "\u2191\u2193 navigate \u00B7 Enter select \u00B7 Home/End jump" }))] }), selectedKey && (_jsx(DetailPanel, { specKey: selectedKey, variant: "rail", onClose: () => selectSpec(undefined) }))] }) }))] }));
}
