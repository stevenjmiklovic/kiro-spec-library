import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useEffect, useMemo, useRef, useState, } from 'react';
import { useArchiveData } from '../hooks/useSpecData.js';
import { useUrlState } from '../hooks/useUrlState.js';
import { ArchiveFilterBar, } from '../components/ArchiveFilterBar.js';
import { DetailPanel } from '../components/DetailPanel.js';
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const SHORT_MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const NARROW_BREAKPOINT = 1024;
// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------
function str(v, fallback = '') {
    return typeof v === 'string' ? v : fallback;
}
function retentionLabel(policy, metadataComplete) {
    if (!metadataComplete)
        return 'Needs metadata';
    const p = policy;
    const type = p && typeof p === 'object' ? str(p['type']) : '';
    switch (type) {
        case '3_months':
            return 'Review: 3 mo';
        case '6_months':
            return 'Review: 6 mo';
        case 'annually':
            return 'Review: annual';
        case 'none':
        default:
            return 'No review scheduled';
    }
}
/** Normalize an unknown backend snapshot row into an ArchiveSnapshot. */
function normalizeSnapshot(record) {
    const r = (record ?? {});
    // metadata_projection and provenance arrive as JSON strings (or objects).
    const parse = (val) => {
        if (val && typeof val === 'object')
            return val;
        if (typeof val === 'string') {
            try {
                const parsed = JSON.parse(val);
                return parsed && typeof parsed === 'object'
                    ? parsed
                    : {};
            }
            catch {
                return {};
            }
        }
        return {};
    };
    const metadata = parse(r['metadata_projection'] ?? r['metadata']);
    const provenance = parse(r['provenance']);
    const createdAt = str(r['created_at'] ?? r['createdAt']) || new Date(0).toISOString();
    const date = new Date(createdAt);
    const valid = !Number.isNaN(date.getTime());
    const monthLabel = valid
        ? `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`
        : 'Unknown';
    const dateLabel = valid
        ? `${SHORT_MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`
        : '—';
    const tags = Array.isArray(metadata['tags'])
        ? metadata['tags'].filter((t) => typeof t === 'string')
        : [];
    const metadataComplete = r['metadataComplete'] === true ||
        (str(metadata['title']) !== '' &&
            str(metadata['owner']) !== '' &&
            str(metadata['theme']) !== '' &&
            tags.length > 0);
    const legalHoldActive = r['legal_hold_active'] === 1 || r['legal_hold_active'] === true;
    return {
        id: str(r['id']) || str(r['spec_key']) || crypto.randomUUID(),
        specKey: str(r['spec_key'] ?? r['specKey']),
        title: str(metadata['title']) || str(r['spec_key']) || 'Untitled',
        type: str(metadata['type'], 'spec'),
        theme: str(metadata['theme'], '—'),
        owner: str(metadata['owner'], '—'),
        repository: str(provenance['repository'], '—'),
        tags,
        createdAt,
        monthLabel,
        dateLabel,
        retentionLabel: retentionLabel(r['retention_policy'] ?? metadata['retentionPolicy'], metadataComplete),
        legalHoldActive,
        legalHoldReason: str(r['legal_hold_reason']) || undefined,
        metadataComplete,
        contentDigest: str(r['content_digest'] ?? r['contentDigest']),
        provenance: {
            repository: str(provenance['repository'], '—'),
            relativePath: str(provenance['relativePath'], '—'),
            branch: str(provenance['branch'], 'main'),
            commitHash: str(provenance['commitHash'], '—'),
        },
    };
}
// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------
function applyFilters(snapshots, filters) {
    const query = (filters.query ?? '').trim().toLowerCase();
    return snapshots.filter((s) => {
        if (query.length >= 2) {
            const haystack = `${s.title} ${s.theme} ${s.owner} ${s.repository} ${s.tags.join(' ')}`.toLowerCase();
            if (!haystack.includes(query))
                return false;
        }
        if (filters.type && s.type !== filters.type)
            return false;
        if (filters.theme && s.theme !== filters.theme)
            return false;
        if (filters.repository && s.repository !== filters.repository)
            return false;
        if (filters.owner && s.owner !== filters.owner)
            return false;
        if (filters.legalHold === 'active' && s.legalHoldActive)
            return false;
        if (filters.legalHold === 'none' && !s.legalHoldActive)
            return false;
        if (filters.metadataComplete === true && !s.metadataComplete)
            return false;
        if (filters.metadataComplete === false && s.metadataComplete)
            return false;
        if (filters.fromDate && s.createdAt < filters.fromDate)
            return false;
        if (filters.toDate && s.createdAt > `${filters.toDate}T23:59:59Z`)
            return false;
        return true;
    });
}
/** Group snapshots by month label, newest month first, newest-first within. */
function groupByMonth(snapshots) {
    const groups = new Map();
    for (const s of snapshots) {
        const list = groups.get(s.monthLabel) ?? [];
        list.push(s);
        groups.set(s.monthLabel, list);
    }
    return [...groups.entries()]
        .map(([month, rows]) => ({
        month,
        rows: [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }))
        .sort((a, b) => {
        const da = a.rows[0]?.createdAt ?? '';
        const db = b.rows[0]?.createdAt ?? '';
        return db.localeCompare(da);
    });
}
// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ArchiveView() {
    const [urlState, setUrlState] = useUrlState();
    const { snapshots: rawSnapshots, nextCursor, loadMore, loading, error } = useArchiveData({ limit: 50 });
    const [filters, setFilters] = useState(() => ({
        query: urlState.query,
        type: urlState.filters.type,
        theme: urlState.filters.theme,
        repository: urlState.filters.repository,
        owner: urlState.filters.owner,
    }));
    const [selectedId, setSelectedId] = useState(urlState.selected);
    const [isNarrow, setIsNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < NARROW_BREAKPOINT);
    const [drawerOpen, setDrawerOpen] = useState(false);
    // Focus trap: ref to the trigger button and the drawer container
    const triggerRef = useRef(null);
    const drawerRef = useRef(null);
    // Track viewport width for responsive drawer vs inline detail.
    useEffect(() => {
        if (typeof window === 'undefined')
            return undefined;
        const onResize = () => setIsNarrow(window.innerWidth < NARROW_BREAKPOINT);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    // Escape-to-close for the archive drawer
    useEffect(() => {
        if (!drawerOpen)
            return undefined;
        const handleKey = (e) => {
            if (e.key === 'Escape')
                setDrawerOpen(false);
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [drawerOpen]);
    // Focus trap: move focus into drawer when opened, restore on close
    useEffect(() => {
        if (drawerOpen) {
            // Move focus into the drawer (the close button is a good initial target)
            const el = drawerRef.current;
            if (el) {
                const firstFocusable = el.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                firstFocusable?.focus();
            }
        }
        else {
            // Restore focus to the trigger button
            triggerRef.current?.focus();
        }
    }, [drawerOpen]);
    const allSnapshots = useMemo(() => (rawSnapshots ?? []).map(normalizeSnapshot), [rawSnapshots]);
    const filtered = useMemo(() => applyFilters(allSnapshots, filters), [allSnapshots, filters]);
    const groups = useMemo(() => groupByMonth(filtered), [filtered]);
    const filterOptions = useMemo(() => {
        const themes = new Set();
        const owners = new Set();
        const repositories = new Set();
        const types = new Set();
        for (const s of allSnapshots) {
            if (s.theme && s.theme !== '—')
                themes.add(s.theme);
            if (s.owner && s.owner !== '—')
                owners.add(s.owner);
            if (s.repository && s.repository !== '—')
                repositories.add(s.repository);
            if (s.type)
                types.add(s.type);
        }
        return {
            themes: [...themes].sort(),
            owners: [...owners].sort(),
            repositories: [...repositories].sort(),
            types: [...types].sort(),
        };
    }, [allSnapshots]);
    // Month index entries (short labels) derived from the visible groups.
    const monthIndex = useMemo(() => groups.map((g) => ({ label: g.month, short: g.month.split(' ')[0] })), [groups]);
    const selected = useMemo(() => filtered.find((s) => s.id === selectedId) ?? filtered[0], [filtered, selectedId]);
    // --- Selection ---
    const handleSelect = useCallback((id, triggerEl) => {
        setSelectedId(id);
        setUrlState({ selected: id });
        if (isNarrow) {
            if (triggerEl)
                triggerRef.current = triggerEl;
            setDrawerOpen(true);
        }
    }, [setUrlState, isNarrow]);
    // --- Filter changes ---
    const handleFilterChange = useCallback((next) => {
        setFilters(next);
        setUrlState({
            query: next.query,
            filters: {
                type: next.type,
                theme: next.theme,
                repository: next.repository,
                owner: next.owner,
            },
        });
    }, [setUrlState]);
    // --- Sticky month index: track visible group + scroll-to ---
    const scrollRef = useRef(null);
    const monthRefs = useRef(new Map());
    const [activeMonth, setActiveMonth] = useState();
    useEffect(() => {
        const root = scrollRef.current;
        if (!root || monthIndex.length === 0)
            return undefined;
        const observer = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((e) => e.isIntersecting)
                .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
            const first = visible[0]?.target.getAttribute('data-month');
            if (first)
                setActiveMonth(first);
        }, { root, threshold: 0.1, rootMargin: '0px 0px -60% 0px' });
        for (const el of monthRefs.current.values())
            observer.observe(el);
        return () => observer.disconnect();
    }, [monthIndex]);
    const scrollToMonth = useCallback((month) => {
        const el = monthRefs.current.get(month);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);
    // --- Infinite scroll: load next page near the bottom (no duplicate fetch) ---
    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el || loading || !nextCursor)
            return;
        const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 240;
        if (nearBottom)
            loadMore();
    }, [loading, nextCursor, loadMore]);
    // --- Error state ---
    if (error) {
        return (_jsxs("div", { className: "archive-view", role: "alert", children: [_jsx("header", { className: "archive-header", children: _jsxs("div", { children: [_jsx("h1", { children: "Spec Library" }), _jsx("p", { children: "Browse, retrieve, and curate completed Kiro Specs." })] }) }), _jsx("div", { className: "archive-empty", children: _jsxs("p", { children: ["Failed to load the archive: ", error] }) })] }));
    }
    const detail = selected ? _jsx(SnapshotDetail, { snapshot: selected }) : null;
    return (_jsxs("div", { className: `archive-view${isNarrow ? ' archive-view--narrow' : ''}`, children: [_jsxs("header", { className: "archive-header", children: [_jsxs("div", { children: [_jsx("h1", { children: "Spec Library" }), _jsx("p", { children: "Browse, retrieve, and curate completed Kiro Specs." })] }), _jsx("span", { "aria-live": "polite", children: loading
                            ? 'Loading…'
                            : `${filtered.length} archived spec${filtered.length === 1 ? '' : 's'}` })] }), _jsx(ArchiveFilterBar, { filters: filters, options: filterOptions, onChange: handleFilterChange, resultCount: filtered.length }), _jsxs("div", { className: "archive-body", children: [_jsxs("section", { className: "archive-table", "aria-label": "Completed specs", ref: scrollRef, onScroll: handleScroll, children: [_jsxs("div", { className: "archive-row archive-row--head", role: "row", children: [_jsx("span", { children: "Spec name" }), _jsx("span", { children: "Type" }), _jsx("span", { children: "Theme" }), _jsx("span", { children: "Repository" }), _jsx("span", { children: "Owner" }), _jsx("span", { children: "Completed" })] }), groups.map((group) => (_jsxs("div", { className: "archive-month", "data-month": group.month, ref: (el) => {
                                    if (el)
                                        monthRefs.current.set(group.month, el);
                                    else
                                        monthRefs.current.delete(group.month);
                                }, children: [_jsx("h2", { children: group.month }), group.rows.map((row) => (_jsxs("button", { type: "button", className: `archive-row${selected?.id === row.id ? ' is-selected' : ''}`, onClick: (e) => handleSelect(row.id, e.currentTarget), "aria-pressed": selected?.id === row.id, children: [_jsx("span", { children: _jsx("strong", { children: row.title }) }), _jsx("span", { children: row.type }), _jsx("span", { children: row.theme }), _jsx("span", { children: row.repository }), _jsx("span", { children: row.owner }), _jsx("span", { children: row.dateLabel })] }, row.id)))] }, group.month))), loading && (_jsxs("div", { className: "archive-loading", role: "status", "aria-live": "polite", "aria-label": "Loading more specs", children: [_jsx("div", { className: "skeleton-row" }), _jsx("div", { className: "skeleton-row" }), _jsx("div", { className: "skeleton-row" }), _jsx("div", { className: "skeleton-row" }), _jsx("div", { className: "skeleton-row" }), _jsx("div", { className: "skeleton-row" })] })), !loading && filtered.length === 0 && (_jsx("div", { className: "archive-empty", children: "No archived specs match your filters. Filters have been retained so you can adjust them." }))] }), monthIndex.length > 0 && (_jsx("nav", { className: "month-index", "aria-label": "Jump to month", children: monthIndex.map((m) => (_jsx("button", { type: "button", className: activeMonth === m.label ? 'active' : undefined, onClick: () => scrollToMonth(m.label), "aria-current": activeMonth === m.label ? 'true' : undefined, children: m.short }, m.label))) }))] }), !isNarrow && selected && (_jsxs("div", { className: "archive-detail-region", children: [detail, selected.specKey && (_jsx(DetailPanel, { specKey: selected.specKey, variant: "drawer" }))] })), isNarrow && drawerOpen && selected && (_jsx("div", { className: "archive-drawer-backdrop", role: "presentation", onMouseDown: () => setDrawerOpen(false), children: _jsxs("aside", { className: "archive-drawer", role: "dialog", "aria-modal": "true", "aria-label": `Details for ${selected.title}`, ref: drawerRef, onMouseDown: (e) => e.stopPropagation(), children: [_jsx("button", { type: "button", className: "archive-drawer__close", onClick: () => setDrawerOpen(false), "aria-label": "Close details", children: "\u2715" }), detail, selected.specKey && (_jsx(DetailPanel, { specKey: selected.specKey, variant: "drawer" }))] }) }))] }));
}
// ---------------------------------------------------------------------------
// Snapshot detail
// ---------------------------------------------------------------------------
function SnapshotDetail({ snapshot, }) {
    const completenessPct = snapshot.metadataComplete ? 100 : 50;
    return (_jsxs("section", { className: "archive-detail", "aria-label": `Details for ${snapshot.title}`, children: [_jsx("div", { className: "archive-detail__intro", children: _jsxs("div", { children: [_jsxs("div", { className: "archive-detail__title", children: [_jsx("h2", { children: snapshot.title }), _jsx("span", { children: "Completed" })] }), snapshot.tags.length > 0 && (_jsx("div", { className: "archive-tags", children: snapshot.tags.map((tag) => (_jsx("span", { children: tag }, tag))) }))] }) }), _jsxs("div", { className: "archive-columns", children: [_jsxs("section", { children: [_jsx("h3", { children: "Artifact completeness" }), _jsxs("div", { className: "archive-fact", children: [_jsx("span", { children: "Metadata" }), _jsx("strong", { children: snapshot.metadataComplete ? 'Complete' : 'Incomplete' }), _jsx("progress", { max: 100, value: completenessPct })] })] }), _jsxs("section", { children: [_jsx("h3", { children: "Source" }), _jsxs("div", { className: "archive-fact", children: [_jsx("span", { children: "Repository" }), _jsx("strong", { children: snapshot.provenance.repository })] }), _jsxs("div", { className: "archive-fact", children: [_jsx("span", { children: "Path" }), _jsx("strong", { children: snapshot.provenance.relativePath })] }), _jsxs("div", { className: "archive-fact", children: [_jsx("span", { children: "Branch" }), _jsx("strong", { children: snapshot.provenance.branch })] }), _jsxs("div", { className: "archive-fact", children: [_jsx("span", { children: "Commit" }), _jsx("strong", { children: snapshot.provenance.commitHash.slice(0, 12) || '—' })] })] }), _jsxs("section", { children: [_jsx("h3", { children: "Provenance" }), _jsxs("div", { className: "archive-fact", children: [_jsx("span", { children: "Owner" }), _jsx("strong", { children: snapshot.owner })] }), _jsxs("div", { className: "archive-fact", children: [_jsx("span", { children: "Archived on" }), _jsx("strong", { children: snapshot.dateLabel })] }), _jsxs("div", { className: "archive-fact", children: [_jsx("span", { children: "Spec key" }), _jsx("strong", { children: snapshot.specKey || '—' })] }), _jsxs("div", { className: "archive-fact", children: [_jsx("span", { children: "Content digest" }), _jsx("strong", { children: snapshot.contentDigest.slice(0, 12) || '—' })] })] }), _jsxs("section", { children: [_jsx("h3", { children: "Disposition" }), _jsxs("div", { className: "archive-fact", children: [_jsx("span", { children: "Status" }), _jsx("strong", { children: snapshot.legalHoldActive ? 'Superseded' : 'Active' })] }), snapshot.legalHoldActive && snapshot.legalHoldReason && (_jsxs("div", { className: "archive-fact", children: [_jsx("span", { children: "Successor" }), _jsx("strong", { children: snapshot.legalHoldReason })] }))] })] })] }));
}
