import { useCallback, useMemo, useState, useEffect } from 'react';
// ---------------------------------------------------------------------------
// URL param names → state field mapping
// ---------------------------------------------------------------------------
const VIEW_PARAM = 'view';
const MODE_PARAM = 'mode';
const SELECTED_PARAM = 'selected';
const REVISION_PARAM = 'revision';
const QUERY_PARAM = 'q';
const Y_AXIS_PARAM = 'yAxis';
const FILTER_PARAMS = [
    'type',
    'stage',
    'theme',
    'owner',
    'repository',
];
// Alias: URL uses `repo` for brevity but state uses `repository`
const REPO_URL_PARAM = 'repo';
const THEME_STORAGE_KEY = 'kiro-spec-library:theme';
// ---------------------------------------------------------------------------
// Parse URL → UrlState
// ---------------------------------------------------------------------------
function parseUrl() {
    const params = new URLSearchParams(window.location.search);
    const viewRaw = params.get(VIEW_PARAM);
    const view = viewRaw === 'archive' ? 'archive' : 'relationship';
    // Theme: URL param takes priority, then localStorage, then default 'dark'
    const modeParam = params.get(MODE_PARAM);
    let themeMode;
    if (modeParam === 'light' || modeParam === 'dark') {
        themeMode = modeParam;
    }
    else {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        themeMode = stored === 'light' ? 'light' : 'dark';
    }
    const selected = params.get(SELECTED_PARAM) ?? undefined;
    const revision = params.get(REVISION_PARAM) ?? undefined;
    const query = params.get(QUERY_PARAM) ?? undefined;
    const yAxisRaw = params.get(Y_AXIS_PARAM);
    const yAxis = yAxisRaw === 'owner' || yAxisRaw === 'repository' || yAxisRaw === 'type' || yAxisRaw === 'theme'
        ? yAxisRaw
        : 'owner';
    const filters = {};
    for (const key of FILTER_PARAMS) {
        const urlKey = key === 'repository' ? REPO_URL_PARAM : key;
        const val = params.get(urlKey);
        if (val) {
            filters[key] = val;
        }
    }
    return { view, themeMode, yAxis, selected, revision, query, filters };
}
// ---------------------------------------------------------------------------
// Serialize UrlState → query string and push to URL
// ---------------------------------------------------------------------------
function serializeToUrl(state) {
    const params = new URLSearchParams();
    if (state.view !== 'relationship') {
        params.set(VIEW_PARAM, state.view);
    }
    if (state.themeMode === 'light') {
        params.set(MODE_PARAM, 'light');
    }
    if (state.yAxis && state.yAxis !== 'owner') {
        params.set(Y_AXIS_PARAM, state.yAxis);
    }
    if (state.selected)
        params.set(SELECTED_PARAM, state.selected);
    if (state.revision)
        params.set(REVISION_PARAM, state.revision);
    if (state.query)
        params.set(QUERY_PARAM, state.query);
    for (const key of FILTER_PARAMS) {
        const val = state.filters[key];
        if (val) {
            const urlKey = key === 'repository' ? REPO_URL_PARAM : key;
            params.set(urlKey, val);
        }
    }
    // Persist theme to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, state.themeMode);
    const qs = params.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', url);
}
const listeners = new Set();
let currentSnapshot = parseUrl();
function subscribe(listener) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
function getSnapshot() {
    return currentSnapshot;
}
function emitChange(next) {
    currentSnapshot = next;
    for (const listener of listeners) {
        listener();
    }
}
// Listen for back/forward navigation so the state stays in sync.
if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => {
        emitChange(parseUrl());
    });
}
// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
/**
 * Manages URL query-parameter state for the Spec Library.
 *
 * Reads/writes `view`, `selected`, `revision`, `q`, `type`, `stage`, `theme`,
 * `owner`, and `repo` query params. Updates use `replaceState` so the browser
 * history is not polluted with every keystroke.
 *
 * Returns a tuple of `[state, update]`. Partial updates are merged with the
 * current state — pass `undefined` to clear a field.
 */
export function useUrlState() {
    const [state, setState] = useState(getSnapshot);
    useEffect(() => {
        return subscribe(() => setState(getSnapshot()));
    }, []);
    const update = useCallback((patch) => {
        const prev = getSnapshot();
        const next = {
            view: patch.view ?? prev.view,
            themeMode: patch.themeMode ?? prev.themeMode,
            yAxis: patch.yAxis ?? prev.yAxis,
            selected: 'selected' in patch ? patch.selected : prev.selected,
            revision: 'revision' in patch ? patch.revision : prev.revision,
            query: 'query' in patch ? patch.query : prev.query,
            filters: patch.filters !== undefined
                ? { ...prev.filters, ...patch.filters }
                : prev.filters,
        };
        serializeToUrl(next);
        emitChange(next);
    }, []);
    return useMemo(() => [state, update], [state, update]);
}
