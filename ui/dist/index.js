var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: __accessProp.bind(mod, key),
        enumerable: true
      });
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// ../node_modules/.bun/use-sync-external-store@1.6.0+4bcfe187168658ad/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.production.js
import * as React from "react";
var require_use_sync_external_store_shim_production = __commonJS((exports) => {
  function is(x, y) {
    return x === y && (x !== 0 || 1 / x === 1 / y) || x !== x && y !== y;
  }
  var objectIs = typeof Object.is === "function" ? Object.is : is;
  var useState4 = React.useState;
  var useEffect4 = React.useEffect;
  var useLayoutEffect = React.useLayoutEffect;
  var useDebugValue = React.useDebugValue;
  function useSyncExternalStore$2(subscribe2, getSnapshot2) {
    var value = getSnapshot2(), _useState = useState4({ inst: { value, getSnapshot: getSnapshot2 } }), inst = _useState[0].inst, forceUpdate = _useState[1];
    useLayoutEffect(function() {
      inst.value = value;
      inst.getSnapshot = getSnapshot2;
      checkIfSnapshotChanged(inst) && forceUpdate({ inst });
    }, [subscribe2, value, getSnapshot2]);
    useEffect4(function() {
      checkIfSnapshotChanged(inst) && forceUpdate({ inst });
      return subscribe2(function() {
        checkIfSnapshotChanged(inst) && forceUpdate({ inst });
      });
    }, [subscribe2]);
    useDebugValue(value);
    return value;
  }
  function checkIfSnapshotChanged(inst) {
    var latestGetSnapshot = inst.getSnapshot;
    inst = inst.value;
    try {
      var nextValue = latestGetSnapshot();
      return !objectIs(inst, nextValue);
    } catch (error) {
      return true;
    }
  }
  function useSyncExternalStore$1(subscribe2, getSnapshot2) {
    return getSnapshot2();
  }
  var shim = typeof window === "undefined" || typeof window.document === "undefined" || typeof window.document.createElement === "undefined" ? useSyncExternalStore$1 : useSyncExternalStore$2;
  exports.useSyncExternalStore = React.useSyncExternalStore !== undefined ? React.useSyncExternalStore : shim;
});

// ../node_modules/.bun/use-sync-external-store@1.6.0+4bcfe187168658ad/node_modules/use-sync-external-store/shim/index.js
var require_shim = __commonJS((exports, module) => {
  if (true) {
    module.exports = require_use_sync_external_store_shim_production();
  }
});

// ../node_modules/.bun/use-sync-external-store@1.6.0+4bcfe187168658ad/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.production.js
import * as React2 from "react";
var require_with_selector_production = __commonJS((exports) => {
  var shim = require_shim();
  function is(x, y) {
    return x === y && (x !== 0 || 1 / x === 1 / y) || x !== x && y !== y;
  }
  var objectIs = typeof Object.is === "function" ? Object.is : is;
  var useSyncExternalStore = shim.useSyncExternalStore;
  var useRef2 = React2.useRef;
  var useEffect4 = React2.useEffect;
  var useMemo3 = React2.useMemo;
  var useDebugValue = React2.useDebugValue;
  exports.useSyncExternalStoreWithSelector = function(subscribe2, getSnapshot2, getServerSnapshot, selector, isEqual) {
    var instRef = useRef2(null);
    if (instRef.current === null) {
      var inst = { hasValue: false, value: null };
      instRef.current = inst;
    } else
      inst = instRef.current;
    instRef = useMemo3(function() {
      function memoizedSelector(nextSnapshot) {
        if (!hasMemo) {
          hasMemo = true;
          memoizedSnapshot = nextSnapshot;
          nextSnapshot = selector(nextSnapshot);
          if (isEqual !== undefined && inst.hasValue) {
            var currentSelection = inst.value;
            if (isEqual(currentSelection, nextSnapshot))
              return memoizedSelection = currentSelection;
          }
          return memoizedSelection = nextSnapshot;
        }
        currentSelection = memoizedSelection;
        if (objectIs(memoizedSnapshot, nextSnapshot))
          return currentSelection;
        var nextSelection = selector(nextSnapshot);
        if (isEqual !== undefined && isEqual(currentSelection, nextSelection))
          return memoizedSnapshot = nextSnapshot, currentSelection;
        memoizedSnapshot = nextSnapshot;
        return memoizedSelection = nextSelection;
      }
      var hasMemo = false, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = getServerSnapshot === undefined ? null : getServerSnapshot;
      return [
        function() {
          return memoizedSelector(getSnapshot2());
        },
        maybeGetServerSnapshot === null ? undefined : function() {
          return memoizedSelector(maybeGetServerSnapshot());
        }
      ];
    }, [getSnapshot2, getServerSnapshot, selector, isEqual]);
    var value = useSyncExternalStore(subscribe2, instRef[0], instRef[1]);
    useEffect4(function() {
      inst.hasValue = true;
      inst.value = value;
    }, [value]);
    useDebugValue(value);
    return value;
  };
});

// ../node_modules/.bun/use-sync-external-store@1.6.0+4bcfe187168658ad/node_modules/use-sync-external-store/shim/with-selector.js
var require_with_selector = __commonJS((exports, module) => {
  if (true) {
    module.exports = require_with_selector_production();
  }
});

// src/hooks/useCrewIntegration.tsx
import { createContext, useContext, useState, useEffect } from "react";
import { jsxDEV } from "react/jsx-dev-runtime";
var mockTheme = {
  mode: "light",
  colors: {
    primary: "#002D72",
    background: "#ffffff",
    surface: "#f5f5f5",
    text: "#1a1a1a",
    border: "#e0e0e0"
  }
};
var mockApi = {
  async fetch(path, init) {
    const baseUrl = `http://127.0.0.1:9150/api`;
    return globalThis.fetch(`${baseUrl}${path}`, init);
  }
};
var mockNotify = {
  success: (msg) => console.info(`[CrewIntegration/mock] ✓ ${msg}`),
  error: (msg) => console.error(`[CrewIntegration/mock] ✗ ${msg}`),
  info: (msg) => console.info(`[CrewIntegration/mock] ℹ ${msg}`)
};
var mockNavigate = (path) => {
  console.warn(`[CrewIntegration/mock] navigate → ${path}`);
};
var mockChatLauncher = {
  open: (ctx) => {
    console.warn(`[CrewIntegration/mock] chatLauncher.open`, ctx);
  }
};
var defaultIntegration = {
  theme: mockTheme,
  api: mockApi,
  notify: mockNotify,
  navigate: mockNavigate,
  chatLauncher: mockChatLauncher,
  ready: true,
  error: undefined
};
var CrewContext = createContext(defaultIntegration);
function resolveCrewSdk() {
  try {
    const crewSdk = globalThis.__CREW_SDK__;
    if (!crewSdk) {
      return { ...defaultIntegration, error: undefined };
    }
    const theme = crewSdk.useTheme?.() ?? mockTheme;
    const api = crewSdk.useApi?.() ?? mockApi;
    const notify = crewSdk.useNotify?.() ?? mockNotify;
    const navigate = crewSdk.useNavigate?.() ?? mockNavigate;
    const chatLauncher = crewSdk.useChatLauncher?.() ?? mockChatLauncher;
    return { theme, api, notify, navigate, chatLauncher, ready: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[CrewIntegration] SDK resolution failed:", message);
    return { ...defaultIntegration, ready: false, error: message };
  }
}
function CrewProvider({ children, overrides }) {
  const [integration, setIntegration] = useState(() => {
    const resolved = resolveCrewSdk();
    return overrides ? { ...resolved, ...overrides } : resolved;
  });
  useEffect(() => {
    const resolved = resolveCrewSdk();
    const merged = overrides ? { ...resolved, ...overrides } : resolved;
    setIntegration(merged);
  }, [overrides]);
  return /* @__PURE__ */ jsxDEV(CrewContext.Provider, {
    value: integration,
    children
  }, undefined, false, undefined, this);
}
function useCrew() {
  return useContext(CrewContext);
}
function useCrewApi() {
  return useContext(CrewContext).api;
}

// src/hooks/useUrlState.ts
import { useCallback, useMemo, useState as useState2, useEffect as useEffect2 } from "react";
var VIEW_PARAM = "view";
var MODE_PARAM = "mode";
var SELECTED_PARAM = "selected";
var REVISION_PARAM = "revision";
var QUERY_PARAM = "q";
var Y_AXIS_PARAM = "yAxis";
var FILTER_PARAMS = [
  "type",
  "stage",
  "theme",
  "owner",
  "repository"
];
var REPO_URL_PARAM = "repo";
var THEME_STORAGE_KEY = "kiro-spec-library:theme";
function parseUrl() {
  const params = new URLSearchParams(window.location.search);
  const viewRaw = params.get(VIEW_PARAM);
  const view = viewRaw === "archive" ? "archive" : "relationship";
  const modeParam = params.get(MODE_PARAM);
  let themeMode;
  if (modeParam === "light" || modeParam === "dark") {
    themeMode = modeParam;
  } else {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    themeMode = stored === "light" ? "light" : "dark";
  }
  const selected = params.get(SELECTED_PARAM) ?? undefined;
  const revision = params.get(REVISION_PARAM) ?? undefined;
  const query = params.get(QUERY_PARAM) ?? undefined;
  const yAxisRaw = params.get(Y_AXIS_PARAM);
  const yAxis = yAxisRaw === "owner" || yAxisRaw === "repository" || yAxisRaw === "type" || yAxisRaw === "theme" ? yAxisRaw : "owner";
  const filters = {};
  for (const key of FILTER_PARAMS) {
    const urlKey = key === "repository" ? REPO_URL_PARAM : key;
    const val = params.get(urlKey);
    if (val) {
      filters[key] = val;
    }
  }
  return { view, themeMode, yAxis, selected, revision, query, filters };
}
function serializeToUrl(state) {
  const params = new URLSearchParams;
  if (state.view !== "relationship") {
    params.set(VIEW_PARAM, state.view);
  }
  if (state.themeMode === "light") {
    params.set(MODE_PARAM, "light");
  }
  if (state.yAxis && state.yAxis !== "owner") {
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
      const urlKey = key === "repository" ? REPO_URL_PARAM : key;
      params.set(urlKey, val);
    }
  }
  localStorage.setItem(THEME_STORAGE_KEY, state.themeMode);
  const qs = params.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}
var listeners = new Set;
var currentSnapshot = parseUrl();
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
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    emitChange(parseUrl());
  });
}
function useUrlState() {
  const [state, setState] = useState2(getSnapshot);
  useEffect2(() => {
    return subscribe(() => setState(getSnapshot()));
  }, []);
  const update = useCallback((patch) => {
    const prev = getSnapshot();
    const next = {
      view: patch.view ?? prev.view,
      themeMode: patch.themeMode ?? prev.themeMode,
      yAxis: patch.yAxis ?? prev.yAxis,
      selected: "selected" in patch ? patch.selected : prev.selected,
      revision: "revision" in patch ? patch.revision : prev.revision,
      query: "query" in patch ? patch.query : prev.query,
      filters: patch.filters !== undefined ? { ...prev.filters, ...patch.filters } : prev.filters
    };
    serializeToUrl(next);
    emitChange(next);
  }, []);
  return useMemo(() => [state, update], [state, update]);
}

// src/views/RelationshipView.tsx
import { useCallback as useCallback7, useEffect as useEffect8, useMemo as useMemo6, useRef as useRef5, useState as useState7 } from "react";

// src/hooks/useSpecData.ts
import { useCallback as useCallback2, useEffect as useEffect3, useMemo as useMemo2, useRef, useState as useState3 } from "react";
var DEBOUNCE_MS = 500;
var MIN_QUERY_LENGTH = 2;
var DEFAULT_LIMIT = 50;
function buildSpecsQuery(options) {
  const params = new URLSearchParams;
  if (options.query && options.query.length >= MIN_QUERY_LENGTH) {
    params.set("q", options.query);
  }
  if (options.limit)
    params.set("limit", String(options.limit));
  if (options.offset)
    params.set("offset", String(options.offset));
  if (options.filters) {
    const entries = Object.entries(options.filters).sort(([a], [b]) => a.localeCompare(b));
    for (const [key, val] of entries) {
      if (val) {
        const apiKey = key === "repository" ? "repo" : key;
        params.set(apiKey, val);
      }
    }
  }
  const qs = params.toString();
  return qs ? `/specs?${qs}` : "/specs";
}
function useSpecData(options) {
  const api = useCrewApi();
  const [specs, setSpecs] = useState3([]);
  const [total, setTotal] = useState3(0);
  const [loading, setLoading] = useState3(true);
  const [error, setError] = useState3(null);
  const [debouncedQuery, setDebouncedQuery] = useState3(options.query);
  const timerRef = useRef(null);
  const fetchIdRef = useRef(0);
  useEffect3(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    const raw = options.query;
    if (!raw || raw.length < MIN_QUERY_LENGTH) {
      setDebouncedQuery(raw);
      return;
    }
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(raw);
      timerRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [options.query]);
  const filtersKey = JSON.stringify(options.filters ?? {});
  const path = useMemo2(() => buildSpecsQuery({
    query: debouncedQuery,
    filters: options.filters,
    limit: options.limit,
    offset: options.offset
  }), [debouncedQuery, filtersKey, options.limit, options.offset]);
  const fetchSpecs = useCallback2(async () => {
    const id = ++fetchIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await api.fetch(path);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.message ?? `Request failed: ${res.status}`;
        throw new Error(msg);
      }
      const data = await res.json();
      if (id === fetchIdRef.current) {
        setSpecs(data.specs);
        setTotal(data.total);
      }
    } catch (err) {
      if (id === fetchIdRef.current) {
        setError(err instanceof Error ? err.message : String(err));
        setSpecs([]);
        setTotal(0);
      }
    } finally {
      if (id === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [api, path]);
  useEffect3(() => {
    fetchSpecs();
  }, [fetchSpecs]);
  return { specs, total, loading, error, refetch: fetchSpecs };
}
function useArchiveData(options = {}) {
  const api = useCrewApi();
  const limit = options.limit ?? DEFAULT_LIMIT;
  const [snapshots, setSnapshots] = useState3([]);
  const [nextCursor, setNextCursor] = useState3(null);
  const [loading, setLoading] = useState3(true);
  const [error, setError] = useState3(null);
  const cursorRef = useRef(null);
  const initialFetchDone = useRef(false);
  const fetchPage = useCallback2(async (cursor, append) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams;
    params.set("limit", String(limit));
    if (cursor)
      params.set("cursor", cursor);
    try {
      const res = await api.fetch(`/archive?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.message ?? `Request failed: ${res.status}`;
        throw new Error(msg);
      }
      const data = await res.json();
      setSnapshots((prev) => append ? [...prev, ...data.snapshots] : data.snapshots);
      setNextCursor(data.nextCursor);
      cursorRef.current = data.nextCursor;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [api, limit]);
  useEffect3(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchPage(null, false);
    }
  }, [fetchPage]);
  const loadMore = useCallback2(() => {
    if (cursorRef.current && !loading) {
      fetchPage(cursorRef.current, true);
    }
  }, [fetchPage, loading]);
  return { snapshots, nextCursor, loadMore, loading, error };
}

// src/components/FilterBar.tsx
import { jsxDEV as jsxDEV2 } from "react/jsx-dev-runtime";
var TYPES = ["spec", "design", "adr", "runbook", "reference"];
var STAGES = ["draft", "review", "approved", "deprecated"];
var DEFAULT_FILTERS = { scope: "team" };
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
function FilterBar({ filters, options, onChange, resultCount }) {
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
  return /* @__PURE__ */ jsxDEV2("div", {
    className: "relationship-filter-bar",
    role: "search",
    "aria-label": "Filter specifications",
    children: [
      /* @__PURE__ */ jsxDEV2("div", {
        children: [
          /* @__PURE__ */ jsxDEV2("label", {
            children: [
              /* @__PURE__ */ jsxDEV2("span", {
                className: "visually-hidden",
                children: "Search specifications"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2("input", {
                type: "search",
                "aria-label": "Search specifications",
                maxLength: 200,
                value: filters.query ?? "",
                onChange: handleSearchChange,
                placeholder: "Search..."
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV2("span", {
            className: "filter-help",
            "aria-live": "polite",
            "aria-atomic": "true",
            children: filters.query && filters.query.length < 2 ? "Search activates at 2 characters" : null
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV2("div", {
        className: "scope-toggle",
        role: "group",
        "aria-label": "Scope",
        children: [
          /* @__PURE__ */ jsxDEV2("button", {
            type: "button",
            "aria-pressed": filters.scope === "team",
            onClick: () => handleScopeChange("team"),
            children: "Team"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV2("button", {
            type: "button",
            "aria-pressed": filters.scope === "mine",
            onClick: () => handleScopeChange("mine"),
            title: "Show only specs you own — stored locally in your browser",
            children: "Mine"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV2("div", {
        children: [
          /* @__PURE__ */ jsxDEV2("label", {
            children: [
              /* @__PURE__ */ jsxDEV2("span", {
                className: "visually-hidden",
                children: "Theme"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2("select", {
                value: filters.theme ?? "",
                onChange: handleSelectChange("theme"),
                "aria-label": "Filter by theme",
                children: [
                  /* @__PURE__ */ jsxDEV2("option", {
                    value: "",
                    children: "All themes"
                  }, undefined, false, undefined, this),
                  options.themes.map((t) => /* @__PURE__ */ jsxDEV2("option", {
                    value: t,
                    children: t
                  }, t, false, undefined, this))
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV2("label", {
            children: [
              /* @__PURE__ */ jsxDEV2("span", {
                className: "visually-hidden",
                children: "Type"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2("select", {
                value: filters.type ?? "",
                onChange: handleSelectChange("type"),
                "aria-label": "Filter by type",
                children: [
                  /* @__PURE__ */ jsxDEV2("option", {
                    value: "",
                    children: "All types"
                  }, undefined, false, undefined, this),
                  TYPES.map((t) => /* @__PURE__ */ jsxDEV2("option", {
                    value: t,
                    children: t
                  }, t, false, undefined, this))
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV2("label", {
            children: [
              /* @__PURE__ */ jsxDEV2("span", {
                className: "visually-hidden",
                children: "Stage"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2("select", {
                value: filters.stage ?? "",
                onChange: handleSelectChange("stage"),
                "aria-label": "Filter by stage",
                children: [
                  /* @__PURE__ */ jsxDEV2("option", {
                    value: "",
                    children: "All stages"
                  }, undefined, false, undefined, this),
                  STAGES.map((s) => /* @__PURE__ */ jsxDEV2("option", {
                    value: s,
                    children: s
                  }, s, false, undefined, this))
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV2("label", {
            children: [
              /* @__PURE__ */ jsxDEV2("span", {
                className: "visually-hidden",
                children: "Owner"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2("select", {
                value: filters.owner ?? "",
                onChange: handleSelectChange("owner"),
                "aria-label": "Filter by owner",
                children: [
                  /* @__PURE__ */ jsxDEV2("option", {
                    value: "",
                    children: "All owners"
                  }, undefined, false, undefined, this),
                  options.owners.map((o) => /* @__PURE__ */ jsxDEV2("option", {
                    value: o,
                    children: o
                  }, o, false, undefined, this))
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV2("label", {
            children: [
              /* @__PURE__ */ jsxDEV2("span", {
                className: "visually-hidden",
                children: "Repository"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2("select", {
                value: filters.repository ?? "",
                onChange: handleSelectChange("repository"),
                "aria-label": "Filter by repository",
                children: [
                  /* @__PURE__ */ jsxDEV2("option", {
                    value: "",
                    children: "All repositories"
                  }, undefined, false, undefined, this),
                  options.repositories.map((r) => /* @__PURE__ */ jsxDEV2("option", {
                    value: r,
                    children: r
                  }, r, false, undefined, this))
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV2("label", {
            children: [
              /* @__PURE__ */ jsxDEV2("span", {
                className: "visually-hidden",
                children: "Metadata completeness"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2("select", {
                value: filters.metadataComplete === true ? "true" : filters.metadataComplete === false ? "false" : "",
                onChange: handleMetaCompleteChange,
                "aria-label": "Filter by metadata completeness",
                children: [
                  /* @__PURE__ */ jsxDEV2("option", {
                    value: "",
                    children: "Any completeness"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV2("option", {
                    value: "true",
                    children: "Metadata complete"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV2("option", {
                    value: "false",
                    children: "Metadata incomplete"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      showClear && /* @__PURE__ */ jsxDEV2("button", {
        type: "button",
        onClick: handleClear,
        children: "Clear filters"
      }, undefined, false, undefined, this),
      isNonDefault(filters) && /* @__PURE__ */ jsxDEV2("div", {
        className: "filter-chips",
        role: "list",
        "aria-label": "Active filters",
        children: [
          filters.theme && /* @__PURE__ */ jsxDEV2("span", {
            className: "filter-chip",
            role: "listitem",
            children: [
              "theme: ",
              filters.theme,
              /* @__PURE__ */ jsxDEV2("button", {
                type: "button",
                "aria-label": `Remove theme filter: ${filters.theme}`,
                onClick: () => onChange({ ...filters, theme: undefined }),
                children: "✕"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          filters.type && /* @__PURE__ */ jsxDEV2("span", {
            className: "filter-chip",
            role: "listitem",
            children: [
              "type: ",
              filters.type,
              /* @__PURE__ */ jsxDEV2("button", {
                type: "button",
                "aria-label": `Remove type filter: ${filters.type}`,
                onClick: () => onChange({ ...filters, type: undefined }),
                children: "✕"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          filters.stage && /* @__PURE__ */ jsxDEV2("span", {
            className: "filter-chip",
            role: "listitem",
            children: [
              "stage: ",
              filters.stage,
              /* @__PURE__ */ jsxDEV2("button", {
                type: "button",
                "aria-label": `Remove stage filter: ${filters.stage}`,
                onClick: () => onChange({ ...filters, stage: undefined }),
                children: "✕"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          filters.owner && /* @__PURE__ */ jsxDEV2("span", {
            className: "filter-chip",
            role: "listitem",
            children: [
              "owner: ",
              filters.owner,
              /* @__PURE__ */ jsxDEV2("button", {
                type: "button",
                "aria-label": `Remove owner filter: ${filters.owner}`,
                onClick: () => onChange({ ...filters, owner: undefined }),
                children: "✕"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          filters.repository && /* @__PURE__ */ jsxDEV2("span", {
            className: "filter-chip",
            role: "listitem",
            children: [
              "repository: ",
              filters.repository,
              /* @__PURE__ */ jsxDEV2("button", {
                type: "button",
                "aria-label": `Remove repository filter: ${filters.repository}`,
                onClick: () => onChange({ ...filters, repository: undefined }),
                children: "✕"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          filters.query && /* @__PURE__ */ jsxDEV2("span", {
            className: "filter-chip",
            role: "listitem",
            children: [
              "search: ",
              filters.query,
              /* @__PURE__ */ jsxDEV2("button", {
                type: "button",
                "aria-label": "Remove search filter",
                onClick: () => onChange({ ...filters, query: undefined }),
                children: "✕"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      resultCount === 0 && /* @__PURE__ */ jsxDEV2("p", {
        role: "status",
        "aria-live": "polite",
        children: "No results match the current filters. Filters have been retained so you can adjust them."
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// ../node_modules/.bun/@xyflow+react@12.11.3+8468e999e7891f1b/node_modules/@xyflow/react/dist/esm/index.js
import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { createContext as createContext2, useContext as useContext2, useMemo as useMemo3, forwardRef, useEffect as useEffect4, useRef as useRef2, useState as useState4, useLayoutEffect, useCallback as useCallback3, memo } from "react";

// ../node_modules/.bun/classcat@5.0.5/node_modules/classcat/index.js
function cc(names) {
  if (typeof names === "string" || typeof names === "number")
    return "" + names;
  let out = "";
  if (Array.isArray(names)) {
    for (let i = 0, tmp;i < names.length; i++) {
      if ((tmp = cc(names[i])) !== "") {
        out += (out && " ") + tmp;
      }
    }
  } else {
    for (let k in names) {
      if (names[k])
        out += (out && " ") + k;
    }
  }
  return out;
}

// ../node_modules/.bun/d3-dispatch@3.0.1/node_modules/d3-dispatch/src/dispatch.js
var noop = { value: () => {} };
function dispatch() {
  for (var i = 0, n = arguments.length, _ = {}, t;i < n; ++i) {
    if (!(t = arguments[i] + "") || t in _ || /[\s.]/.test(t))
      throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}
function Dispatch(_) {
  this._ = _;
}
function parseTypenames(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0)
      name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t))
      throw new Error("unknown type: " + t);
    return { type: t, name };
  });
}
Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function(typename, callback) {
    var _ = this._, T = parseTypenames(typename + "", _), t, i = -1, n = T.length;
    if (arguments.length < 2) {
      while (++i < n)
        if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name)))
          return t;
      return;
    }
    if (callback != null && typeof callback !== "function")
      throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type)
        _[t] = set(_[t], typename.name, callback);
      else if (callback == null)
        for (t in _)
          _[t] = set(_[t], typename.name, null);
    }
    return this;
  },
  copy: function() {
    var copy = {}, _ = this._;
    for (var t in _)
      copy[t] = _[t].slice();
    return new Dispatch(copy);
  },
  call: function(type, that) {
    if ((n = arguments.length - 2) > 0)
      for (var args = new Array(n), i = 0, n, t;i < n; ++i)
        args[i] = arguments[i + 2];
    if (!this._.hasOwnProperty(type))
      throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length;i < n; ++i)
      t[i].value.apply(that, args);
  },
  apply: function(type, that, args) {
    if (!this._.hasOwnProperty(type))
      throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length;i < n; ++i)
      t[i].value.apply(that, args);
  }
};
function get(type, name) {
  for (var i = 0, n = type.length, c;i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}
function set(type, name, callback) {
  for (var i = 0, n = type.length;i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null)
    type.push({ name, value: callback });
  return type;
}
var dispatch_default = dispatch;
// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/matcher.js
function matcher_default(selector) {
  return function() {
    return this.matches(selector);
  };
}
function childMatcher(selector) {
  return function(node) {
    return node.matches(selector);
  };
}
// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/namespaces.js
var xhtml = "http://www.w3.org/1999/xhtml";
var namespaces_default = {
  svg: "http://www.w3.org/2000/svg",
  xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/namespace.js
function namespace_default(name) {
  var prefix = name += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns")
    name = name.slice(i + 1);
  return namespaces_default.hasOwnProperty(prefix) ? { space: namespaces_default[prefix], local: name } : name;
}
// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/sourceEvent.js
function sourceEvent_default(event) {
  let sourceEvent;
  while (sourceEvent = event.sourceEvent)
    event = sourceEvent;
  return event;
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/pointer.js
function pointer_default(event, node) {
  event = sourceEvent_default(event);
  if (node === undefined)
    node = event.currentTarget;
  if (node) {
    var svg = node.ownerSVGElement || node;
    if (svg.createSVGPoint) {
      var point = svg.createSVGPoint();
      point.x = event.clientX, point.y = event.clientY;
      point = point.matrixTransform(node.getScreenCTM().inverse());
      return [point.x, point.y];
    }
    if (node.getBoundingClientRect) {
      var rect = node.getBoundingClientRect();
      return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
    }
  }
  return [event.pageX, event.pageY];
}
// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selector.js
function none() {}
function selector_default(selector) {
  return selector == null ? none : function() {
    return this.querySelector(selector);
  };
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/select.js
function select_default(select) {
  if (typeof select !== "function")
    select = selector_default(select);
  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0;j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0;i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node)
          subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }
  return new Selection(subgroups, this._parents);
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/array.js
function array(x) {
  return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selectorAll.js
function empty() {
  return [];
}
function selectorAll_default(selector) {
  return selector == null ? empty : function() {
    return this.querySelectorAll(selector);
  };
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/selectAll.js
function arrayAll(select) {
  return function() {
    return array(select.apply(this, arguments));
  };
}
function selectAll_default(select) {
  if (typeof select === "function")
    select = arrayAll(select);
  else
    select = selectorAll_default(select);
  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0;j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0;i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }
  return new Selection(subgroups, parents);
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/selectChild.js
var find = Array.prototype.find;
function childFind(match) {
  return function() {
    return find.call(this.children, match);
  };
}
function childFirst() {
  return this.firstElementChild;
}
function selectChild_default(match) {
  return this.select(match == null ? childFirst : childFind(typeof match === "function" ? match : childMatcher(match)));
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/selectChildren.js
var filter = Array.prototype.filter;
function children() {
  return Array.from(this.children);
}
function childrenFilter(match) {
  return function() {
    return filter.call(this.children, match);
  };
}
function selectChildren_default(match) {
  return this.selectAll(match == null ? children : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/filter.js
function filter_default(match) {
  if (typeof match !== "function")
    match = matcher_default(match);
  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0;j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0;i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }
  return new Selection(subgroups, this._parents);
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/sparse.js
function sparse_default(update) {
  return new Array(update.length);
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/enter.js
function enter_default() {
  return new Selection(this._enter || this._groups.map(sparse_default), this._parents);
}
function EnterNode(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}
EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function(child) {
    return this._parent.insertBefore(child, this._next);
  },
  insertBefore: function(child, next) {
    return this._parent.insertBefore(child, next);
  },
  querySelector: function(selector) {
    return this._parent.querySelector(selector);
  },
  querySelectorAll: function(selector) {
    return this._parent.querySelectorAll(selector);
  }
};

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/constant.js
function constant_default(x) {
  return function() {
    return x;
  };
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/data.js
function bindIndex(parent, group, enter, update, exit, data) {
  var i = 0, node, groupLength = group.length, dataLength = data.length;
  for (;i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }
  for (;i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}
function bindKey(parent, group, enter, update, exit, data, key) {
  var i, node, nodeByKeyValue = new Map, groupLength = group.length, dataLength = data.length, keyValues = new Array(groupLength), keyValue;
  for (i = 0;i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
      if (nodeByKeyValue.has(keyValue)) {
        exit[i] = node;
      } else {
        nodeByKeyValue.set(keyValue, node);
      }
    }
  }
  for (i = 0;i < dataLength; ++i) {
    keyValue = key.call(parent, data[i], i, data) + "";
    if (node = nodeByKeyValue.get(keyValue)) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue.delete(keyValue);
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }
  for (i = 0;i < groupLength; ++i) {
    if ((node = group[i]) && nodeByKeyValue.get(keyValues[i]) === node) {
      exit[i] = node;
    }
  }
}
function datum(node) {
  return node.__data__;
}
function data_default(value, key) {
  if (!arguments.length)
    return Array.from(this, datum);
  var bind = key ? bindKey : bindIndex, parents = this._parents, groups = this._groups;
  if (typeof value !== "function")
    value = constant_default(value);
  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0;j < m; ++j) {
    var parent = parents[j], group = groups[j], groupLength = group.length, data = arraylike(value.call(parent, parent && parent.__data__, j, parents)), dataLength = data.length, enterGroup = enter[j] = new Array(dataLength), updateGroup = update[j] = new Array(dataLength), exitGroup = exit[j] = new Array(groupLength);
    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);
    for (var i0 = 0, i1 = 0, previous, next;i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1)
          i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength)
          ;
        previous._next = next || null;
      }
    }
  }
  update = new Selection(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
}
function arraylike(data) {
  return typeof data === "object" && "length" in data ? data : Array.from(data);
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/exit.js
function exit_default() {
  return new Selection(this._exit || this._groups.map(sparse_default), this._parents);
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/join.js
function join_default(onenter, onupdate, onexit) {
  var enter = this.enter(), update = this, exit = this.exit();
  if (typeof onenter === "function") {
    enter = onenter(enter);
    if (enter)
      enter = enter.selection();
  } else {
    enter = enter.append(onenter + "");
  }
  if (onupdate != null) {
    update = onupdate(update);
    if (update)
      update = update.selection();
  }
  if (onexit == null)
    exit.remove();
  else
    onexit(exit);
  return enter && update ? enter.merge(update).order() : update;
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/merge.js
function merge_default(context) {
  var selection = context.selection ? context.selection() : context;
  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0;j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0;i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }
  for (;j < m0; ++j) {
    merges[j] = groups0[j];
  }
  return new Selection(merges, this._parents);
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/order.js
function order_default() {
  for (var groups = this._groups, j = -1, m = groups.length;++j < m; ) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node;--i >= 0; ) {
      if (node = group[i]) {
        if (next && node.compareDocumentPosition(next) ^ 4)
          next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }
  return this;
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/sort.js
function sort_default(compare) {
  if (!compare)
    compare = ascending;
  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }
  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0;j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0;i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }
  return new Selection(sortgroups, this._parents).order();
}
function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/call.js
function call_default() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/nodes.js
function nodes_default() {
  return Array.from(this);
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/node.js
function node_default() {
  for (var groups = this._groups, j = 0, m = groups.length;j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length;i < n; ++i) {
      var node = group[i];
      if (node)
        return node;
    }
  }
  return null;
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/size.js
function size_default() {
  let size = 0;
  for (const node of this)
    ++size;
  return size;
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/empty.js
function empty_default() {
  return !this.node();
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/each.js
function each_default(callback) {
  for (var groups = this._groups, j = 0, m = groups.length;j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node;i < n; ++i) {
      if (node = group[i])
        callback.call(node, node.__data__, i, group);
    }
  }
  return this;
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/attr.js
function attrRemove(name) {
  return function() {
    this.removeAttribute(name);
  };
}
function attrRemoveNS(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}
function attrConstant(name, value) {
  return function() {
    this.setAttribute(name, value);
  };
}
function attrConstantNS(fullname, value) {
  return function() {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}
function attrFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null)
      this.removeAttribute(name);
    else
      this.setAttribute(name, v);
  };
}
function attrFunctionNS(fullname, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null)
      this.removeAttributeNS(fullname.space, fullname.local);
    else
      this.setAttributeNS(fullname.space, fullname.local, v);
  };
}
function attr_default(name, value) {
  var fullname = namespace_default(name);
  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
  }
  return this.each((value == null ? fullname.local ? attrRemoveNS : attrRemove : typeof value === "function" ? fullname.local ? attrFunctionNS : attrFunction : fullname.local ? attrConstantNS : attrConstant)(fullname, value));
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/window.js
function window_default(node) {
  return node.ownerDocument && node.ownerDocument.defaultView || node.document && node || node.defaultView;
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/style.js
function styleRemove(name) {
  return function() {
    this.style.removeProperty(name);
  };
}
function styleConstant(name, value, priority) {
  return function() {
    this.style.setProperty(name, value, priority);
  };
}
function styleFunction(name, value, priority) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null)
      this.style.removeProperty(name);
    else
      this.style.setProperty(name, v, priority);
  };
}
function style_default(name, value, priority) {
  return arguments.length > 1 ? this.each((value == null ? styleRemove : typeof value === "function" ? styleFunction : styleConstant)(name, value, priority == null ? "" : priority)) : styleValue(this.node(), name);
}
function styleValue(node, name) {
  return node.style.getPropertyValue(name) || window_default(node).getComputedStyle(node, null).getPropertyValue(name);
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/property.js
function propertyRemove(name) {
  return function() {
    delete this[name];
  };
}
function propertyConstant(name, value) {
  return function() {
    this[name] = value;
  };
}
function propertyFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null)
      delete this[name];
    else
      this[name] = v;
  };
}
function property_default(name, value) {
  return arguments.length > 1 ? this.each((value == null ? propertyRemove : typeof value === "function" ? propertyFunction : propertyConstant)(name, value)) : this.node()[name];
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/classed.js
function classArray(string) {
  return string.trim().split(/^|\s+/);
}
function classList(node) {
  return node.classList || new ClassList(node);
}
function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}
ClassList.prototype = {
  add: function(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function(name) {
    return this._names.indexOf(name) >= 0;
  }
};
function classedAdd(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n)
    list.add(names[i]);
}
function classedRemove(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n)
    list.remove(names[i]);
}
function classedTrue(names) {
  return function() {
    classedAdd(this, names);
  };
}
function classedFalse(names) {
  return function() {
    classedRemove(this, names);
  };
}
function classedFunction(names, value) {
  return function() {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}
function classed_default(name, value) {
  var names = classArray(name + "");
  if (arguments.length < 2) {
    var list = classList(this.node()), i = -1, n = names.length;
    while (++i < n)
      if (!list.contains(names[i]))
        return false;
    return true;
  }
  return this.each((typeof value === "function" ? classedFunction : value ? classedTrue : classedFalse)(names, value));
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/text.js
function textRemove() {
  this.textContent = "";
}
function textConstant(value) {
  return function() {
    this.textContent = value;
  };
}
function textFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}
function text_default(value) {
  return arguments.length ? this.each(value == null ? textRemove : (typeof value === "function" ? textFunction : textConstant)(value)) : this.node().textContent;
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/html.js
function htmlRemove() {
  this.innerHTML = "";
}
function htmlConstant(value) {
  return function() {
    this.innerHTML = value;
  };
}
function htmlFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}
function html_default(value) {
  return arguments.length ? this.each(value == null ? htmlRemove : (typeof value === "function" ? htmlFunction : htmlConstant)(value)) : this.node().innerHTML;
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/raise.js
function raise() {
  if (this.nextSibling)
    this.parentNode.appendChild(this);
}
function raise_default() {
  return this.each(raise);
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/lower.js
function lower() {
  if (this.previousSibling)
    this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function lower_default() {
  return this.each(lower);
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/creator.js
function creatorInherit(name) {
  return function() {
    var document2 = this.ownerDocument, uri = this.namespaceURI;
    return uri === xhtml && document2.documentElement.namespaceURI === xhtml ? document2.createElement(name) : document2.createElementNS(uri, name);
  };
}
function creatorFixed(fullname) {
  return function() {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}
function creator_default(name) {
  var fullname = namespace_default(name);
  return (fullname.local ? creatorFixed : creatorInherit)(fullname);
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/append.js
function append_default(name) {
  var create = typeof name === "function" ? name : creator_default(name);
  return this.select(function() {
    return this.appendChild(create.apply(this, arguments));
  });
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/insert.js
function constantNull() {
  return null;
}
function insert_default(name, before) {
  var create = typeof name === "function" ? name : creator_default(name), select = before == null ? constantNull : typeof before === "function" ? before : selector_default(before);
  return this.select(function() {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/remove.js
function remove() {
  var parent = this.parentNode;
  if (parent)
    parent.removeChild(this);
}
function remove_default() {
  return this.each(remove);
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/clone.js
function selection_cloneShallow() {
  var clone = this.cloneNode(false), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}
function selection_cloneDeep() {
  var clone = this.cloneNode(true), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}
function clone_default(deep) {
  return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/datum.js
function datum_default(value) {
  return arguments.length ? this.property("__data__", value) : this.node().__data__;
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/on.js
function contextListener(listener) {
  return function(event) {
    listener.call(this, event, this.__data__);
  };
}
function parseTypenames2(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0)
      name = t.slice(i + 1), t = t.slice(0, i);
    return { type: t, name };
  });
}
function onRemove(typename) {
  return function() {
    var on = this.__on;
    if (!on)
      return;
    for (var j = 0, i = -1, m = on.length, o;j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
      } else {
        on[++i] = o;
      }
    }
    if (++i)
      on.length = i;
    else
      delete this.__on;
  };
}
function onAdd(typename, value, options) {
  return function() {
    var on = this.__on, o, listener = contextListener(value);
    if (on)
      for (var j = 0, m = on.length;j < m; ++j) {
        if ((o = on[j]).type === typename.type && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.options);
          this.addEventListener(o.type, o.listener = listener, o.options = options);
          o.value = value;
          return;
        }
      }
    this.addEventListener(typename.type, listener, options);
    o = { type: typename.type, name: typename.name, value, listener, options };
    if (!on)
      this.__on = [o];
    else
      on.push(o);
  };
}
function on_default(typename, value, options) {
  var typenames = parseTypenames2(typename + ""), i, n = typenames.length, t;
  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on)
      for (var j = 0, m = on.length, o;j < m; ++j) {
        for (i = 0, o = on[j];i < n; ++i) {
          if ((t = typenames[i]).type === o.type && t.name === o.name) {
            return o.value;
          }
        }
      }
    return;
  }
  on = value ? onAdd : onRemove;
  for (i = 0;i < n; ++i)
    this.each(on(typenames[i], value, options));
  return this;
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/dispatch.js
function dispatchEvent(node, type, params) {
  var window2 = window_default(node), event = window2.CustomEvent;
  if (typeof event === "function") {
    event = new event(type, params);
  } else {
    event = window2.document.createEvent("Event");
    if (params)
      event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
    else
      event.initEvent(type, false, false);
  }
  node.dispatchEvent(event);
}
function dispatchConstant(type, params) {
  return function() {
    return dispatchEvent(this, type, params);
  };
}
function dispatchFunction(type, params) {
  return function() {
    return dispatchEvent(this, type, params.apply(this, arguments));
  };
}
function dispatch_default2(type, params) {
  return this.each((typeof params === "function" ? dispatchFunction : dispatchConstant)(type, params));
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/iterator.js
function* iterator_default() {
  for (var groups = this._groups, j = 0, m = groups.length;j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node;i < n; ++i) {
      if (node = group[i])
        yield node;
    }
  }
}

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/index.js
var root = [null];
function Selection(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}
function selection() {
  return new Selection([[document.documentElement]], root);
}
function selection_selection() {
  return this;
}
Selection.prototype = selection.prototype = {
  constructor: Selection,
  select: select_default,
  selectAll: selectAll_default,
  selectChild: selectChild_default,
  selectChildren: selectChildren_default,
  filter: filter_default,
  data: data_default,
  enter: enter_default,
  exit: exit_default,
  join: join_default,
  merge: merge_default,
  selection: selection_selection,
  order: order_default,
  sort: sort_default,
  call: call_default,
  nodes: nodes_default,
  node: node_default,
  size: size_default,
  empty: empty_default,
  each: each_default,
  attr: attr_default,
  style: style_default,
  property: property_default,
  classed: classed_default,
  text: text_default,
  html: html_default,
  raise: raise_default,
  lower: lower_default,
  append: append_default,
  insert: insert_default,
  remove: remove_default,
  clone: clone_default,
  datum: datum_default,
  on: on_default,
  dispatch: dispatch_default2,
  [Symbol.iterator]: iterator_default
};
var selection_default = selection;

// ../node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/select.js
function select_default2(selector) {
  return typeof selector === "string" ? new Selection([[document.querySelector(selector)]], [document.documentElement]) : new Selection([[selector]], root);
}
// ../node_modules/.bun/d3-drag@3.0.0/node_modules/d3-drag/src/noevent.js
var nonpassive = { passive: false };
var nonpassivecapture = { capture: true, passive: false };
function nopropagation(event) {
  event.stopImmediatePropagation();
}
function noevent_default(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
}

// ../node_modules/.bun/d3-drag@3.0.0/node_modules/d3-drag/src/nodrag.js
function nodrag_default(view) {
  var root2 = view.document.documentElement, selection2 = select_default2(view).on("dragstart.drag", noevent_default, nonpassivecapture);
  if ("onselectstart" in root2) {
    selection2.on("selectstart.drag", noevent_default, nonpassivecapture);
  } else {
    root2.__noselect = root2.style.MozUserSelect;
    root2.style.MozUserSelect = "none";
  }
}
function yesdrag(view, noclick) {
  var root2 = view.document.documentElement, selection2 = select_default2(view).on("dragstart.drag", null);
  if (noclick) {
    selection2.on("click.drag", noevent_default, nonpassivecapture);
    setTimeout(function() {
      selection2.on("click.drag", null);
    }, 0);
  }
  if ("onselectstart" in root2) {
    selection2.on("selectstart.drag", null);
  } else {
    root2.style.MozUserSelect = root2.__noselect;
    delete root2.__noselect;
  }
}

// ../node_modules/.bun/d3-drag@3.0.0/node_modules/d3-drag/src/constant.js
var constant_default2 = (x) => () => x;

// ../node_modules/.bun/d3-drag@3.0.0/node_modules/d3-drag/src/event.js
function DragEvent(type, {
  sourceEvent,
  subject,
  target,
  identifier,
  active,
  x,
  y,
  dx,
  dy,
  dispatch: dispatch2
}) {
  Object.defineProperties(this, {
    type: { value: type, enumerable: true, configurable: true },
    sourceEvent: { value: sourceEvent, enumerable: true, configurable: true },
    subject: { value: subject, enumerable: true, configurable: true },
    target: { value: target, enumerable: true, configurable: true },
    identifier: { value: identifier, enumerable: true, configurable: true },
    active: { value: active, enumerable: true, configurable: true },
    x: { value: x, enumerable: true, configurable: true },
    y: { value: y, enumerable: true, configurable: true },
    dx: { value: dx, enumerable: true, configurable: true },
    dy: { value: dy, enumerable: true, configurable: true },
    _: { value: dispatch2 }
  });
}
DragEvent.prototype.on = function() {
  var value = this._.on.apply(this._, arguments);
  return value === this._ ? this : value;
};

// ../node_modules/.bun/d3-drag@3.0.0/node_modules/d3-drag/src/drag.js
function defaultFilter(event) {
  return !event.ctrlKey && !event.button;
}
function defaultContainer() {
  return this.parentNode;
}
function defaultSubject(event, d) {
  return d == null ? { x: event.x, y: event.y } : d;
}
function defaultTouchable() {
  return navigator.maxTouchPoints || "ontouchstart" in this;
}
function drag_default() {
  var filter2 = defaultFilter, container = defaultContainer, subject = defaultSubject, touchable = defaultTouchable, gestures = {}, listeners2 = dispatch_default("start", "drag", "end"), active = 0, mousedownx, mousedowny, mousemoving, touchending, clickDistance2 = 0;
  function drag(selection2) {
    selection2.on("mousedown.drag", mousedowned).filter(touchable).on("touchstart.drag", touchstarted).on("touchmove.drag", touchmoved, nonpassive).on("touchend.drag touchcancel.drag", touchended).style("touch-action", "none").style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }
  function mousedowned(event, d) {
    if (touchending || !filter2.call(this, event, d))
      return;
    var gesture = beforestart(this, container.call(this, event, d), event, d, "mouse");
    if (!gesture)
      return;
    select_default2(event.view).on("mousemove.drag", mousemoved, nonpassivecapture).on("mouseup.drag", mouseupped, nonpassivecapture);
    nodrag_default(event.view);
    nopropagation(event);
    mousemoving = false;
    mousedownx = event.clientX;
    mousedowny = event.clientY;
    gesture("start", event);
  }
  function mousemoved(event) {
    noevent_default(event);
    if (!mousemoving) {
      var dx = event.clientX - mousedownx, dy = event.clientY - mousedowny;
      mousemoving = dx * dx + dy * dy > clickDistance2;
    }
    gestures.mouse("drag", event);
  }
  function mouseupped(event) {
    select_default2(event.view).on("mousemove.drag mouseup.drag", null);
    yesdrag(event.view, mousemoving);
    noevent_default(event);
    gestures.mouse("end", event);
  }
  function touchstarted(event, d) {
    if (!filter2.call(this, event, d))
      return;
    var touches = event.changedTouches, c = container.call(this, event, d), n = touches.length, i, gesture;
    for (i = 0;i < n; ++i) {
      if (gesture = beforestart(this, c, event, d, touches[i].identifier, touches[i])) {
        nopropagation(event);
        gesture("start", event, touches[i]);
      }
    }
  }
  function touchmoved(event) {
    var touches = event.changedTouches, n = touches.length, i, gesture;
    for (i = 0;i < n; ++i) {
      if (gesture = gestures[touches[i].identifier]) {
        noevent_default(event);
        gesture("drag", event, touches[i]);
      }
    }
  }
  function touchended(event) {
    var touches = event.changedTouches, n = touches.length, i, gesture;
    if (touchending)
      clearTimeout(touchending);
    touchending = setTimeout(function() {
      touchending = null;
    }, 500);
    for (i = 0;i < n; ++i) {
      if (gesture = gestures[touches[i].identifier]) {
        nopropagation(event);
        gesture("end", event, touches[i]);
      }
    }
  }
  function beforestart(that, container2, event, d, identifier, touch) {
    var dispatch2 = listeners2.copy(), p = pointer_default(touch || event, container2), dx, dy, s;
    if ((s = subject.call(that, new DragEvent("beforestart", {
      sourceEvent: event,
      target: drag,
      identifier,
      active,
      x: p[0],
      y: p[1],
      dx: 0,
      dy: 0,
      dispatch: dispatch2
    }), d)) == null)
      return;
    dx = s.x - p[0] || 0;
    dy = s.y - p[1] || 0;
    return function gesture(type, event2, touch2) {
      var p0 = p, n;
      switch (type) {
        case "start":
          gestures[identifier] = gesture, n = active++;
          break;
        case "end":
          delete gestures[identifier], --active;
        case "drag":
          p = pointer_default(touch2 || event2, container2), n = active;
          break;
      }
      dispatch2.call(type, that, new DragEvent(type, {
        sourceEvent: event2,
        subject: s,
        target: drag,
        identifier,
        active: n,
        x: p[0] + dx,
        y: p[1] + dy,
        dx: p[0] - p0[0],
        dy: p[1] - p0[1],
        dispatch: dispatch2
      }), d);
    };
  }
  drag.filter = function(_) {
    return arguments.length ? (filter2 = typeof _ === "function" ? _ : constant_default2(!!_), drag) : filter2;
  };
  drag.container = function(_) {
    return arguments.length ? (container = typeof _ === "function" ? _ : constant_default2(_), drag) : container;
  };
  drag.subject = function(_) {
    return arguments.length ? (subject = typeof _ === "function" ? _ : constant_default2(_), drag) : subject;
  };
  drag.touchable = function(_) {
    return arguments.length ? (touchable = typeof _ === "function" ? _ : constant_default2(!!_), drag) : touchable;
  };
  drag.on = function() {
    var value = listeners2.on.apply(listeners2, arguments);
    return value === listeners2 ? drag : value;
  };
  drag.clickDistance = function(_) {
    return arguments.length ? (clickDistance2 = (_ = +_) * _, drag) : Math.sqrt(clickDistance2);
  };
  return drag;
}
// ../node_modules/.bun/d3-color@3.1.0/node_modules/d3-color/src/define.js
function define_default(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}
function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition)
    prototype[key] = definition[key];
  return prototype;
}

// ../node_modules/.bun/d3-color@3.1.0/node_modules/d3-color/src/color.js
function Color() {}
var darker = 0.7;
var brighter = 1 / darker;
var reI = "\\s*([+-]?\\d+)\\s*";
var reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex = /^#([0-9a-f]{3,8})$/;
var reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`);
var reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`);
var reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`);
var reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`);
var reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`);
var reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);
var named = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074
};
define_default(Color, color, {
  copy(channels) {
    return Object.assign(new this.constructor, this, channels);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: color_formatHex,
  formatHex: color_formatHex,
  formatHex8: color_formatHex8,
  formatHsl: color_formatHsl,
  formatRgb: color_formatRgb,
  toString: color_formatRgb
});
function color_formatHex() {
  return this.rgb().formatHex();
}
function color_formatHex8() {
  return this.rgb().formatHex8();
}
function color_formatHsl() {
  return hslConvert(this).formatHsl();
}
function color_formatRgb() {
  return this.rgb().formatRgb();
}
function color(format) {
  var m, l;
  format = (format + "").trim().toLowerCase();
  return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) : l === 3 ? new Rgb(m >> 8 & 15 | m >> 4 & 240, m >> 4 & 15 | m & 240, (m & 15) << 4 | m & 15, 1) : l === 8 ? rgba(m >> 24 & 255, m >> 16 & 255, m >> 8 & 255, (m & 255) / 255) : l === 4 ? rgba(m >> 12 & 15 | m >> 8 & 240, m >> 8 & 15 | m >> 4 & 240, m >> 4 & 15 | m & 240, ((m & 15) << 4 | m & 15) / 255) : null) : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) : named.hasOwnProperty(format) ? rgbn(named[format]) : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
}
function rgbn(n) {
  return new Rgb(n >> 16 & 255, n >> 8 & 255, n & 255, 1);
}
function rgba(r, g, b, a) {
  if (a <= 0)
    r = g = b = NaN;
  return new Rgb(r, g, b, a);
}
function rgbConvert(o) {
  if (!(o instanceof Color))
    o = color(o);
  if (!o)
    return new Rgb;
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}
function rgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}
function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}
define_default(Rgb, rgb, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
  },
  displayable() {
    return -0.5 <= this.r && this.r < 255.5 && (-0.5 <= this.g && this.g < 255.5) && (-0.5 <= this.b && this.b < 255.5) && (0 <= this.opacity && this.opacity <= 1);
  },
  hex: rgb_formatHex,
  formatHex: rgb_formatHex,
  formatHex8: rgb_formatHex8,
  formatRgb: rgb_formatRgb,
  toString: rgb_formatRgb
}));
function rgb_formatHex() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
}
function rgb_formatHex8() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function rgb_formatRgb() {
  const a = clampa(this.opacity);
  return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
}
function clampa(opacity) {
  return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
}
function clampi(value) {
  return Math.max(0, Math.min(255, Math.round(value) || 0));
}
function hex(value) {
  value = clampi(value);
  return (value < 16 ? "0" : "") + value.toString(16);
}
function hsla(h, s, l, a) {
  if (a <= 0)
    h = s = l = NaN;
  else if (l <= 0 || l >= 1)
    h = s = NaN;
  else if (s <= 0)
    h = NaN;
  return new Hsl(h, s, l, a);
}
function hslConvert(o) {
  if (o instanceof Hsl)
    return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color))
    o = color(o);
  if (!o)
    return new Hsl;
  if (o instanceof Hsl)
    return o;
  o = o.rgb();
  var r = o.r / 255, g = o.g / 255, b = o.b / 255, min = Math.min(r, g, b), max = Math.max(r, g, b), h = NaN, s = max - min, l = (max + min) / 2;
  if (s) {
    if (r === max)
      h = (g - b) / s + (g < b) * 6;
    else if (g === max)
      h = (b - r) / s + 2;
    else
      h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}
function hsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}
function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}
define_default(Hsl, hsl, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb() {
    var h = this.h % 360 + (this.h < 0) * 360, s = isNaN(h) || isNaN(this.s) ? 0 : this.s, l = this.l, m2 = l + (l < 0.5 ? l : 1 - l) * s, m1 = 2 * l - m2;
    return new Rgb(hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2), hsl2rgb(h, m1, m2), hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2), this.opacity);
  },
  clamp() {
    return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && (0 <= this.l && this.l <= 1) && (0 <= this.opacity && this.opacity <= 1);
  },
  formatHsl() {
    const a = clampa(this.opacity);
    return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
  }
}));
function clamph(value) {
  value = (value || 0) % 360;
  return value < 0 ? value + 360 : value;
}
function clampt(value) {
  return Math.max(0, Math.min(1, value || 0));
}
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60 : h < 180 ? m2 : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60 : m1) * 255;
}
// ../node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/basis.js
function basis(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1, t3 = t2 * t1;
  return ((1 - 3 * t1 + 3 * t2 - t3) * v0 + (4 - 6 * t2 + 3 * t3) * v1 + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2 + t3 * v3) / 6;
}
function basis_default(values) {
  var n = values.length - 1;
  return function(t) {
    var i = t <= 0 ? t = 0 : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n), v1 = values[i], v2 = values[i + 1], v0 = i > 0 ? values[i - 1] : 2 * v1 - v2, v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
}

// ../node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/basisClosed.js
function basisClosed_default(values) {
  var n = values.length;
  return function(t) {
    var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n), v0 = values[(i + n - 1) % n], v1 = values[i % n], v2 = values[(i + 1) % n], v3 = values[(i + 2) % n];
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
}

// ../node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/constant.js
var constant_default3 = (x) => () => x;

// ../node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/color.js
function linear(a, d) {
  return function(t) {
    return a + t * d;
  };
}
function exponential(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
    return Math.pow(a + t * b, y);
  };
}
function gamma(y) {
  return (y = +y) === 1 ? nogamma : function(a, b) {
    return b - a ? exponential(a, b, y) : constant_default3(isNaN(a) ? b : a);
  };
}
function nogamma(a, b) {
  var d = b - a;
  return d ? linear(a, d) : constant_default3(isNaN(a) ? b : a);
}

// ../node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/rgb.js
var rgb_default = function rgbGamma(y) {
  var color2 = gamma(y);
  function rgb2(start, end) {
    var r = color2((start = rgb(start)).r, (end = rgb(end)).r), g = color2(start.g, end.g), b = color2(start.b, end.b), opacity = nogamma(start.opacity, end.opacity);
    return function(t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }
  rgb2.gamma = rgbGamma;
  return rgb2;
}(1);
function rgbSpline(spline) {
  return function(colors) {
    var n = colors.length, r = new Array(n), g = new Array(n), b = new Array(n), i, color2;
    for (i = 0;i < n; ++i) {
      color2 = rgb(colors[i]);
      r[i] = color2.r || 0;
      g[i] = color2.g || 0;
      b[i] = color2.b || 0;
    }
    r = spline(r);
    g = spline(g);
    b = spline(b);
    color2.opacity = 1;
    return function(t) {
      color2.r = r(t);
      color2.g = g(t);
      color2.b = b(t);
      return color2 + "";
    };
  };
}
var rgbBasis = rgbSpline(basis_default);
var rgbBasisClosed = rgbSpline(basisClosed_default);

// ../node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/numberArray.js
function numberArray_default(a, b) {
  if (!b)
    b = [];
  var n = a ? Math.min(b.length, a.length) : 0, c = b.slice(), i;
  return function(t) {
    for (i = 0;i < n; ++i)
      c[i] = a[i] * (1 - t) + b[i] * t;
    return c;
  };
}
function isNumberArray(x) {
  return ArrayBuffer.isView(x) && !(x instanceof DataView);
}

// ../node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/array.js
function genericArray(a, b) {
  var nb = b ? b.length : 0, na = a ? Math.min(nb, a.length) : 0, x = new Array(na), c = new Array(nb), i;
  for (i = 0;i < na; ++i)
    x[i] = value_default(a[i], b[i]);
  for (;i < nb; ++i)
    c[i] = b[i];
  return function(t) {
    for (i = 0;i < na; ++i)
      c[i] = x[i](t);
    return c;
  };
}

// ../node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/date.js
function date_default(a, b) {
  var d = new Date;
  return a = +a, b = +b, function(t) {
    return d.setTime(a * (1 - t) + b * t), d;
  };
}

// ../node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/number.js
function number_default(a, b) {
  return a = +a, b = +b, function(t) {
    return a * (1 - t) + b * t;
  };
}

// ../node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/object.js
function object_default(a, b) {
  var i = {}, c = {}, k;
  if (a === null || typeof a !== "object")
    a = {};
  if (b === null || typeof b !== "object")
    b = {};
  for (k in b) {
    if (k in a) {
      i[k] = value_default(a[k], b[k]);
    } else {
      c[k] = b[k];
    }
  }
  return function(t) {
    for (k in i)
      c[k] = i[k](t);
    return c;
  };
}

// ../node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/string.js
var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB = new RegExp(reA.source, "g");
function zero(b) {
  return function() {
    return b;
  };
}
function one(b) {
  return function(t) {
    return b(t) + "";
  };
}
function string_default(a, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0, am, bm, bs, i = -1, s = [], q = [];
  a = a + "", b = b + "";
  while ((am = reA.exec(a)) && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) {
      bs = b.slice(bi, bs);
      if (s[i])
        s[i] += bs;
      else
        s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) {
      if (s[i])
        s[i] += bm;
      else
        s[++i] = bm;
    } else {
      s[++i] = null;
      q.push({ i, x: number_default(am, bm) });
    }
    bi = reB.lastIndex;
  }
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i])
      s[i] += bs;
    else
      s[++i] = bs;
  }
  return s.length < 2 ? q[0] ? one(q[0].x) : zero(b) : (b = q.length, function(t) {
    for (var i2 = 0, o;i2 < b; ++i2)
      s[(o = q[i2]).i] = o.x(t);
    return s.join("");
  });
}

// ../node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/value.js
function value_default(a, b) {
  var t = typeof b, c;
  return b == null || t === "boolean" ? constant_default3(b) : (t === "number" ? number_default : t === "string" ? (c = color(b)) ? (b = c, rgb_default) : string_default : b instanceof color ? rgb_default : b instanceof Date ? date_default : isNumberArray(b) ? numberArray_default : Array.isArray(b) ? genericArray : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object_default : number_default)(a, b);
}
// ../node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/transform/decompose.js
var degrees = 180 / Math.PI;
var identity = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};
function decompose_default(a, b, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a * a + b * b))
    a /= scaleX, b /= scaleX;
  if (skewX = a * c + b * d)
    c -= a * skewX, d -= b * skewX;
  if (scaleY = Math.sqrt(c * c + d * d))
    c /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a * d < b * c)
    a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a) * degrees,
    skewX: Math.atan(skewX) * degrees,
    scaleX,
    scaleY
  };
}

// ../node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/transform/parse.js
var svgNode;
function parseCss(value) {
  const m = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
  return m.isIdentity ? identity : decompose_default(m.a, m.b, m.c, m.d, m.e, m.f);
}
function parseSvg(value) {
  if (value == null)
    return identity;
  if (!svgNode)
    svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode.setAttribute("transform", value);
  if (!(value = svgNode.transform.baseVal.consolidate()))
    return identity;
  value = value.matrix;
  return decompose_default(value.a, value.b, value.c, value.d, value.e, value.f);
}

// ../node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/transform/index.js
function interpolateTransform(parse, pxComma, pxParen, degParen) {
  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }
  function translate(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q.push({ i: i - 4, x: number_default(xa, xb) }, { i: i - 2, x: number_default(ya, yb) });
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }
  function rotate(a, b, s, q) {
    if (a !== b) {
      if (a - b > 180)
        b += 360;
      else if (b - a > 180)
        a += 360;
      q.push({ i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: number_default(a, b) });
    } else if (b) {
      s.push(pop(s) + "rotate(" + b + degParen);
    }
  }
  function skewX(a, b, s, q) {
    if (a !== b) {
      q.push({ i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: number_default(a, b) });
    } else if (b) {
      s.push(pop(s) + "skewX(" + b + degParen);
    }
  }
  function scale(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q.push({ i: i - 4, x: number_default(xa, xb) }, { i: i - 2, x: number_default(ya, yb) });
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }
  return function(a, b) {
    var s = [], q = [];
    a = parse(a), b = parse(b);
    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
    rotate(a.rotate, b.rotate, s, q);
    skewX(a.skewX, b.skewX, s, q);
    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
    a = b = null;
    return function(t) {
      var i = -1, n = q.length, o;
      while (++i < n)
        s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  };
}
var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");
// ../node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/zoom.js
var epsilon2 = 0.000000000001;
function cosh(x) {
  return ((x = Math.exp(x)) + 1 / x) / 2;
}
function sinh(x) {
  return ((x = Math.exp(x)) - 1 / x) / 2;
}
function tanh(x) {
  return ((x = Math.exp(2 * x)) - 1) / (x + 1);
}
var zoom_default = function zoomRho(rho, rho2, rho4) {
  function zoom(p0, p1) {
    var ux0 = p0[0], uy0 = p0[1], w0 = p0[2], ux1 = p1[0], uy1 = p1[1], w1 = p1[2], dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy, i, S;
    if (d2 < epsilon2) {
      S = Math.log(w1 / w0) / rho;
      i = function(t) {
        return [
          ux0 + t * dx,
          uy0 + t * dy,
          w0 * Math.exp(rho * t * S)
        ];
      };
    } else {
      var d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1), b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1), r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
      S = (r1 - r0) / rho;
      i = function(t) {
        var s = t * S, coshr0 = cosh(r0), u = w0 / (rho2 * d1) * (coshr0 * tanh(rho * s + r0) - sinh(r0));
        return [
          ux0 + u * dx,
          uy0 + u * dy,
          w0 * coshr0 / cosh(rho * s + r0)
        ];
      };
    }
    i.duration = S * 1000 * rho / Math.SQRT2;
    return i;
  }
  zoom.rho = function(_) {
    var _1 = Math.max(0.001, +_), _2 = _1 * _1, _4 = _2 * _2;
    return zoomRho(_1, _2, _4);
  };
  return zoom;
}(Math.SQRT2, 2, 4);
// ../node_modules/.bun/d3-timer@3.0.1/node_modules/d3-timer/src/timer.js
var frame = 0;
var timeout = 0;
var interval = 0;
var pokeDelay = 1000;
var taskHead;
var taskTail;
var clockLast = 0;
var clockNow = 0;
var clockSkew = 0;
var clock = typeof performance === "object" && performance.now ? performance : Date;
var setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) {
  setTimeout(f, 17);
};
function now() {
  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
}
function clearNow() {
  clockNow = 0;
}
function Timer() {
  this._call = this._time = this._next = null;
}
Timer.prototype = timer.prototype = {
  constructor: Timer,
  restart: function(callback, delay, time) {
    if (typeof callback !== "function")
      throw new TypeError("callback is not a function");
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail !== this) {
      if (taskTail)
        taskTail._next = this;
      else
        taskHead = this;
      taskTail = this;
    }
    this._call = callback;
    this._time = time;
    sleep();
  },
  stop: function() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep();
    }
  }
};
function timer(callback, delay, time) {
  var t = new Timer;
  t.restart(callback, delay, time);
  return t;
}
function timerFlush() {
  now();
  ++frame;
  var t = taskHead, e;
  while (t) {
    if ((e = clockNow - t._time) >= 0)
      t._call.call(undefined, e);
    t = t._next;
  }
  --frame;
}
function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew;
  frame = timeout = 0;
  try {
    timerFlush();
  } finally {
    frame = 0;
    nap();
    clockNow = 0;
  }
}
function poke() {
  var now2 = clock.now(), delay = now2 - clockLast;
  if (delay > pokeDelay)
    clockSkew -= delay, clockLast = now2;
}
function nap() {
  var t0, t1 = taskHead, t2, time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time)
        time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead = t2;
    }
  }
  taskTail = t0;
  sleep(time);
}
function sleep(time) {
  if (frame)
    return;
  if (timeout)
    timeout = clearTimeout(timeout);
  var delay = time - clockNow;
  if (delay > 24) {
    if (time < Infinity)
      timeout = setTimeout(wake, time - clock.now() - clockSkew);
    if (interval)
      interval = clearInterval(interval);
  } else {
    if (!interval)
      clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
    frame = 1, setFrame(wake);
  }
}
// ../node_modules/.bun/d3-timer@3.0.1/node_modules/d3-timer/src/timeout.js
function timeout_default(callback, delay, time) {
  var t = new Timer;
  delay = delay == null ? 0 : +delay;
  t.restart((elapsed) => {
    t.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t;
}
// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/schedule.js
var emptyOn = dispatch_default("start", "end", "cancel", "interrupt");
var emptyTween = [];
var CREATED = 0;
var SCHEDULED = 1;
var STARTING = 2;
var STARTED = 3;
var RUNNING = 4;
var ENDING = 5;
var ENDED = 6;
function schedule_default(node, name, id, index, group, timing) {
  var schedules = node.__transition;
  if (!schedules)
    node.__transition = {};
  else if (id in schedules)
    return;
  create(node, id, {
    name,
    index,
    group,
    on: emptyOn,
    tween: emptyTween,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED
  });
}
function init(node, id) {
  var schedule = get2(node, id);
  if (schedule.state > CREATED)
    throw new Error("too late; already scheduled");
  return schedule;
}
function set2(node, id) {
  var schedule = get2(node, id);
  if (schedule.state > STARTED)
    throw new Error("too late; already running");
  return schedule;
}
function get2(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id]))
    throw new Error("transition not found");
  return schedule;
}
function create(node, id, self) {
  var schedules = node.__transition, tween;
  schedules[id] = self;
  self.timer = timer(schedule, 0, self.time);
  function schedule(elapsed) {
    self.state = SCHEDULED;
    self.timer.restart(start, self.delay, self.time);
    if (self.delay <= elapsed)
      start(elapsed - self.delay);
  }
  function start(elapsed) {
    var i, j, n, o;
    if (self.state !== SCHEDULED)
      return stop();
    for (i in schedules) {
      o = schedules[i];
      if (o.name !== self.name)
        continue;
      if (o.state === STARTED)
        return timeout_default(start);
      if (o.state === RUNNING) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("interrupt", node, node.__data__, o.index, o.group);
        delete schedules[i];
      } else if (+i < id) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("cancel", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }
    }
    timeout_default(function() {
      if (self.state === STARTED) {
        self.state = RUNNING;
        self.timer.restart(tick, self.delay, self.time);
        tick(elapsed);
      }
    });
    self.state = STARTING;
    self.on.call("start", node, node.__data__, self.index, self.group);
    if (self.state !== STARTING)
      return;
    self.state = STARTED;
    tween = new Array(n = self.tween.length);
    for (i = 0, j = -1;i < n; ++i) {
      if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
        tween[++j] = o;
      }
    }
    tween.length = j + 1;
  }
  function tick(elapsed) {
    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1), i = -1, n = tween.length;
    while (++i < n) {
      tween[i].call(node, t);
    }
    if (self.state === ENDING) {
      self.on.call("end", node, node.__data__, self.index, self.group);
      stop();
    }
  }
  function stop() {
    self.state = ENDED;
    self.timer.stop();
    delete schedules[id];
    for (var i in schedules)
      return;
    delete node.__transition;
  }
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/interrupt.js
function interrupt_default(node, name) {
  var schedules = node.__transition, schedule, active, empty2 = true, i;
  if (!schedules)
    return;
  name = name == null ? null : name + "";
  for (i in schedules) {
    if ((schedule = schedules[i]).name !== name) {
      empty2 = false;
      continue;
    }
    active = schedule.state > STARTING && schedule.state < ENDING;
    schedule.state = ENDED;
    schedule.timer.stop();
    schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
    delete schedules[i];
  }
  if (empty2)
    delete node.__transition;
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/selection/interrupt.js
function interrupt_default2(name) {
  return this.each(function() {
    interrupt_default(this, name);
  });
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/tween.js
function tweenRemove(id, name) {
  var tween0, tween1;
  return function() {
    var schedule = set2(this, id), tween = schedule.tween;
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i = 0, n = tween1.length;i < n; ++i) {
        if (tween1[i].name === name) {
          tween1 = tween1.slice();
          tween1.splice(i, 1);
          break;
        }
      }
    }
    schedule.tween = tween1;
  };
}
function tweenFunction(id, name, value) {
  var tween0, tween1;
  if (typeof value !== "function")
    throw new Error;
  return function() {
    var schedule = set2(this, id), tween = schedule.tween;
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t = { name, value }, i = 0, n = tween1.length;i < n; ++i) {
        if (tween1[i].name === name) {
          tween1[i] = t;
          break;
        }
      }
      if (i === n)
        tween1.push(t);
    }
    schedule.tween = tween1;
  };
}
function tween_default(name, value) {
  var id = this._id;
  name += "";
  if (arguments.length < 2) {
    var tween = get2(this.node(), id).tween;
    for (var i = 0, n = tween.length, t;i < n; ++i) {
      if ((t = tween[i]).name === name) {
        return t.value;
      }
    }
    return null;
  }
  return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
}
function tweenValue(transition, name, value) {
  var id = transition._id;
  transition.each(function() {
    var schedule = set2(this, id);
    (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
  });
  return function(node) {
    return get2(node, id).value[name];
  };
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/interpolate.js
function interpolate_default(a, b) {
  var c;
  return (typeof b === "number" ? number_default : b instanceof color ? rgb_default : (c = color(b)) ? (b = c, rgb_default) : string_default)(a, b);
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/attr.js
function attrRemove2(name) {
  return function() {
    this.removeAttribute(name);
  };
}
function attrRemoveNS2(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}
function attrConstant2(name, interpolate, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = this.getAttribute(name);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
  };
}
function attrConstantNS2(fullname, interpolate, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = this.getAttributeNS(fullname.space, fullname.local);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
  };
}
function attrFunction2(name, interpolate, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null)
      return void this.removeAttribute(name);
    string0 = this.getAttribute(name);
    string1 = value1 + "";
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}
function attrFunctionNS2(fullname, interpolate, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null)
      return void this.removeAttributeNS(fullname.space, fullname.local);
    string0 = this.getAttributeNS(fullname.space, fullname.local);
    string1 = value1 + "";
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}
function attr_default2(name, value) {
  var fullname = namespace_default(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate_default;
  return this.attrTween(name, typeof value === "function" ? (fullname.local ? attrFunctionNS2 : attrFunction2)(fullname, i, tweenValue(this, "attr." + name, value)) : value == null ? (fullname.local ? attrRemoveNS2 : attrRemove2)(fullname) : (fullname.local ? attrConstantNS2 : attrConstant2)(fullname, i, value));
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/attrTween.js
function attrInterpolate(name, i) {
  return function(t) {
    this.setAttribute(name, i.call(this, t));
  };
}
function attrInterpolateNS(fullname, i) {
  return function(t) {
    this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
  };
}
function attrTweenNS(fullname, value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0)
      t0 = (i0 = i) && attrInterpolateNS(fullname, i);
    return t0;
  }
  tween._value = value;
  return tween;
}
function attrTween(name, value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0)
      t0 = (i0 = i) && attrInterpolate(name, i);
    return t0;
  }
  tween._value = value;
  return tween;
}
function attrTween_default(name, value) {
  var key = "attr." + name;
  if (arguments.length < 2)
    return (key = this.tween(key)) && key._value;
  if (value == null)
    return this.tween(key, null);
  if (typeof value !== "function")
    throw new Error;
  var fullname = namespace_default(name);
  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/delay.js
function delayFunction(id, value) {
  return function() {
    init(this, id).delay = +value.apply(this, arguments);
  };
}
function delayConstant(id, value) {
  return value = +value, function() {
    init(this, id).delay = value;
  };
}
function delay_default(value) {
  var id = this._id;
  return arguments.length ? this.each((typeof value === "function" ? delayFunction : delayConstant)(id, value)) : get2(this.node(), id).delay;
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/duration.js
function durationFunction(id, value) {
  return function() {
    set2(this, id).duration = +value.apply(this, arguments);
  };
}
function durationConstant(id, value) {
  return value = +value, function() {
    set2(this, id).duration = value;
  };
}
function duration_default(value) {
  var id = this._id;
  return arguments.length ? this.each((typeof value === "function" ? durationFunction : durationConstant)(id, value)) : get2(this.node(), id).duration;
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/ease.js
function easeConstant(id, value) {
  if (typeof value !== "function")
    throw new Error;
  return function() {
    set2(this, id).ease = value;
  };
}
function ease_default(value) {
  var id = this._id;
  return arguments.length ? this.each(easeConstant(id, value)) : get2(this.node(), id).ease;
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/easeVarying.js
function easeVarying(id, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (typeof v !== "function")
      throw new Error;
    set2(this, id).ease = v;
  };
}
function easeVarying_default(value) {
  if (typeof value !== "function")
    throw new Error;
  return this.each(easeVarying(this._id, value));
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/filter.js
function filter_default2(match) {
  if (typeof match !== "function")
    match = matcher_default(match);
  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0;j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0;i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }
  return new Transition(subgroups, this._parents, this._name, this._id);
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/merge.js
function merge_default2(transition) {
  if (transition._id !== this._id)
    throw new Error;
  for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0;j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0;i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }
  for (;j < m0; ++j) {
    merges[j] = groups0[j];
  }
  return new Transition(merges, this._parents, this._name, this._id);
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/on.js
function start(name) {
  return (name + "").trim().split(/^|\s+/).every(function(t) {
    var i = t.indexOf(".");
    if (i >= 0)
      t = t.slice(0, i);
    return !t || t === "start";
  });
}
function onFunction(id, name, listener) {
  var on0, on1, sit = start(name) ? init : set2;
  return function() {
    var schedule = sit(this, id), on = schedule.on;
    if (on !== on0)
      (on1 = (on0 = on).copy()).on(name, listener);
    schedule.on = on1;
  };
}
function on_default2(name, listener) {
  var id = this._id;
  return arguments.length < 2 ? get2(this.node(), id).on.on(name) : this.each(onFunction(id, name, listener));
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/remove.js
function removeFunction(id) {
  return function() {
    var parent = this.parentNode;
    for (var i in this.__transition)
      if (+i !== id)
        return;
    if (parent)
      parent.removeChild(this);
  };
}
function remove_default2() {
  return this.on("end.remove", removeFunction(this._id));
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/select.js
function select_default3(select) {
  var name = this._name, id = this._id;
  if (typeof select !== "function")
    select = selector_default(select);
  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0;j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0;i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node)
          subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
        schedule_default(subgroup[i], name, id, i, subgroup, get2(node, id));
      }
    }
  }
  return new Transition(subgroups, this._parents, name, id);
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/selectAll.js
function selectAll_default2(select) {
  var name = this._name, id = this._id;
  if (typeof select !== "function")
    select = selectorAll_default(select);
  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0;j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0;i < n; ++i) {
      if (node = group[i]) {
        for (var children2 = select.call(node, node.__data__, i, group), child, inherit = get2(node, id), k = 0, l = children2.length;k < l; ++k) {
          if (child = children2[k]) {
            schedule_default(child, name, id, k, children2, inherit);
          }
        }
        subgroups.push(children2);
        parents.push(node);
      }
    }
  }
  return new Transition(subgroups, parents, name, id);
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/selection.js
var Selection2 = selection_default.prototype.constructor;
function selection_default2() {
  return new Selection2(this._groups, this._parents);
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/style.js
function styleNull(name, interpolate) {
  var string00, string10, interpolate0;
  return function() {
    var string0 = styleValue(this, name), string1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : interpolate0 = interpolate(string00 = string0, string10 = string1);
  };
}
function styleRemove2(name) {
  return function() {
    this.style.removeProperty(name);
  };
}
function styleConstant2(name, interpolate, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = styleValue(this, name);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
  };
}
function styleFunction2(name, interpolate, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0 = styleValue(this, name), value1 = value(this), string1 = value1 + "";
    if (value1 == null)
      string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}
function styleMaybeRemove(id, name) {
  var on0, on1, listener0, key = "style." + name, event = "end." + key, remove2;
  return function() {
    var schedule = set2(this, id), on = schedule.on, listener = schedule.value[key] == null ? remove2 || (remove2 = styleRemove2(name)) : undefined;
    if (on !== on0 || listener0 !== listener)
      (on1 = (on0 = on).copy()).on(event, listener0 = listener);
    schedule.on = on1;
  };
}
function style_default2(name, value, priority) {
  var i = (name += "") === "transform" ? interpolateTransformCss : interpolate_default;
  return value == null ? this.styleTween(name, styleNull(name, i)).on("end.style." + name, styleRemove2(name)) : typeof value === "function" ? this.styleTween(name, styleFunction2(name, i, tweenValue(this, "style." + name, value))).each(styleMaybeRemove(this._id, name)) : this.styleTween(name, styleConstant2(name, i, value), priority).on("end.style." + name, null);
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/styleTween.js
function styleInterpolate(name, i, priority) {
  return function(t) {
    this.style.setProperty(name, i.call(this, t), priority);
  };
}
function styleTween(name, value, priority) {
  var t, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0)
      t = (i0 = i) && styleInterpolate(name, i, priority);
    return t;
  }
  tween._value = value;
  return tween;
}
function styleTween_default(name, value, priority) {
  var key = "style." + (name += "");
  if (arguments.length < 2)
    return (key = this.tween(key)) && key._value;
  if (value == null)
    return this.tween(key, null);
  if (typeof value !== "function")
    throw new Error;
  return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/text.js
function textConstant2(value) {
  return function() {
    this.textContent = value;
  };
}
function textFunction2(value) {
  return function() {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}
function text_default2(value) {
  return this.tween("text", typeof value === "function" ? textFunction2(tweenValue(this, "text", value)) : textConstant2(value == null ? "" : value + ""));
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/textTween.js
function textInterpolate(i) {
  return function(t) {
    this.textContent = i.call(this, t);
  };
}
function textTween(value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0)
      t0 = (i0 = i) && textInterpolate(i);
    return t0;
  }
  tween._value = value;
  return tween;
}
function textTween_default(value) {
  var key = "text";
  if (arguments.length < 1)
    return (key = this.tween(key)) && key._value;
  if (value == null)
    return this.tween(key, null);
  if (typeof value !== "function")
    throw new Error;
  return this.tween(key, textTween(value));
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/transition.js
function transition_default() {
  var name = this._name, id0 = this._id, id1 = newId();
  for (var groups = this._groups, m = groups.length, j = 0;j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0;i < n; ++i) {
      if (node = group[i]) {
        var inherit = get2(node, id0);
        schedule_default(node, name, id1, i, group, {
          time: inherit.time + inherit.delay + inherit.duration,
          delay: 0,
          duration: inherit.duration,
          ease: inherit.ease
        });
      }
    }
  }
  return new Transition(groups, this._parents, name, id1);
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/end.js
function end_default() {
  var on0, on1, that = this, id = that._id, size = that.size();
  return new Promise(function(resolve, reject) {
    var cancel = { value: reject }, end = { value: function() {
      if (--size === 0)
        resolve();
    } };
    that.each(function() {
      var schedule = set2(this, id), on = schedule.on;
      if (on !== on0) {
        on1 = (on0 = on).copy();
        on1._.cancel.push(cancel);
        on1._.interrupt.push(cancel);
        on1._.end.push(end);
      }
      schedule.on = on1;
    });
    if (size === 0)
      resolve();
  });
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/index.js
var id = 0;
function Transition(groups, parents, name, id2) {
  this._groups = groups;
  this._parents = parents;
  this._name = name;
  this._id = id2;
}
function transition(name) {
  return selection_default().transition(name);
}
function newId() {
  return ++id;
}
var selection_prototype = selection_default.prototype;
Transition.prototype = transition.prototype = {
  constructor: Transition,
  select: select_default3,
  selectAll: selectAll_default2,
  selectChild: selection_prototype.selectChild,
  selectChildren: selection_prototype.selectChildren,
  filter: filter_default2,
  merge: merge_default2,
  selection: selection_default2,
  transition: transition_default,
  call: selection_prototype.call,
  nodes: selection_prototype.nodes,
  node: selection_prototype.node,
  size: selection_prototype.size,
  empty: selection_prototype.empty,
  each: selection_prototype.each,
  on: on_default2,
  attr: attr_default2,
  attrTween: attrTween_default,
  style: style_default2,
  styleTween: styleTween_default,
  text: text_default2,
  textTween: textTween_default,
  remove: remove_default2,
  tween: tween_default,
  delay: delay_default,
  duration: duration_default,
  ease: ease_default,
  easeVarying: easeVarying_default,
  end: end_default,
  [Symbol.iterator]: selection_prototype[Symbol.iterator]
};
// ../node_modules/.bun/d3-ease@3.0.1/node_modules/d3-ease/src/cubic.js
function cubicInOut(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}
// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/selection/transition.js
var defaultTiming = {
  time: null,
  delay: 0,
  duration: 250,
  ease: cubicInOut
};
function inherit(node, id2) {
  var timing;
  while (!(timing = node.__transition) || !(timing = timing[id2])) {
    if (!(node = node.parentNode)) {
      throw new Error(`transition ${id2} not found`);
    }
  }
  return timing;
}
function transition_default2(name) {
  var id2, timing;
  if (name instanceof Transition) {
    id2 = name._id, name = name._name;
  } else {
    id2 = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
  }
  for (var groups = this._groups, m = groups.length, j = 0;j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0;i < n; ++i) {
      if (node = group[i]) {
        schedule_default(node, name, id2, i, group, timing || inherit(node, id2));
      }
    }
  }
  return new Transition(groups, this._parents, name, id2);
}

// ../node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/selection/index.js
selection_default.prototype.interrupt = interrupt_default2;
selection_default.prototype.transition = transition_default2;
// ../node_modules/.bun/d3-zoom@3.0.0/node_modules/d3-zoom/src/constant.js
var constant_default4 = (x) => () => x;

// ../node_modules/.bun/d3-zoom@3.0.0/node_modules/d3-zoom/src/event.js
function ZoomEvent(type, {
  sourceEvent,
  target,
  transform,
  dispatch: dispatch2
}) {
  Object.defineProperties(this, {
    type: { value: type, enumerable: true, configurable: true },
    sourceEvent: { value: sourceEvent, enumerable: true, configurable: true },
    target: { value: target, enumerable: true, configurable: true },
    transform: { value: transform, enumerable: true, configurable: true },
    _: { value: dispatch2 }
  });
}

// ../node_modules/.bun/d3-zoom@3.0.0/node_modules/d3-zoom/src/transform.js
function Transform(k, x, y) {
  this.k = k;
  this.x = x;
  this.y = y;
}
Transform.prototype = {
  constructor: Transform,
  scale: function(k) {
    return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
  },
  translate: function(x, y) {
    return x === 0 & y === 0 ? this : new Transform(this.k, this.x + this.k * x, this.y + this.k * y);
  },
  apply: function(point) {
    return [point[0] * this.k + this.x, point[1] * this.k + this.y];
  },
  applyX: function(x) {
    return x * this.k + this.x;
  },
  applyY: function(y) {
    return y * this.k + this.y;
  },
  invert: function(location) {
    return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
  },
  invertX: function(x) {
    return (x - this.x) / this.k;
  },
  invertY: function(y) {
    return (y - this.y) / this.k;
  },
  rescaleX: function(x) {
    return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
  },
  rescaleY: function(y) {
    return y.copy().domain(y.range().map(this.invertY, this).map(y.invert, y));
  },
  toString: function() {
    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
  }
};
var identity2 = new Transform(1, 0, 0);
transform.prototype = Transform.prototype;
function transform(node) {
  while (!node.__zoom)
    if (!(node = node.parentNode))
      return identity2;
  return node.__zoom;
}

// ../node_modules/.bun/d3-zoom@3.0.0/node_modules/d3-zoom/src/noevent.js
function nopropagation2(event) {
  event.stopImmediatePropagation();
}
function noevent_default2(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
}

// ../node_modules/.bun/d3-zoom@3.0.0/node_modules/d3-zoom/src/zoom.js
function defaultFilter2(event) {
  return (!event.ctrlKey || event.type === "wheel") && !event.button;
}
function defaultExtent() {
  var e = this;
  if (e instanceof SVGElement) {
    e = e.ownerSVGElement || e;
    if (e.hasAttribute("viewBox")) {
      e = e.viewBox.baseVal;
      return [[e.x, e.y], [e.x + e.width, e.y + e.height]];
    }
    return [[0, 0], [e.width.baseVal.value, e.height.baseVal.value]];
  }
  return [[0, 0], [e.clientWidth, e.clientHeight]];
}
function defaultTransform() {
  return this.__zoom || identity2;
}
function defaultWheelDelta(event) {
  return -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) * (event.ctrlKey ? 10 : 1);
}
function defaultTouchable2() {
  return navigator.maxTouchPoints || "ontouchstart" in this;
}
function defaultConstrain(transform2, extent, translateExtent) {
  var dx0 = transform2.invertX(extent[0][0]) - translateExtent[0][0], dx1 = transform2.invertX(extent[1][0]) - translateExtent[1][0], dy0 = transform2.invertY(extent[0][1]) - translateExtent[0][1], dy1 = transform2.invertY(extent[1][1]) - translateExtent[1][1];
  return transform2.translate(dx1 > dx0 ? (dx0 + dx1) / 2 : Math.min(0, dx0) || Math.max(0, dx1), dy1 > dy0 ? (dy0 + dy1) / 2 : Math.min(0, dy0) || Math.max(0, dy1));
}
function zoom_default2() {
  var filter2 = defaultFilter2, extent = defaultExtent, constrain = defaultConstrain, wheelDelta = defaultWheelDelta, touchable = defaultTouchable2, scaleExtent = [0, Infinity], translateExtent = [[-Infinity, -Infinity], [Infinity, Infinity]], duration = 250, interpolate = zoom_default, listeners2 = dispatch_default("start", "zoom", "end"), touchstarting, touchfirst, touchending, touchDelay = 500, wheelDelay = 150, clickDistance2 = 0, tapDistance = 10;
  function zoom(selection2) {
    selection2.property("__zoom", defaultTransform).on("wheel.zoom", wheeled, { passive: false }).on("mousedown.zoom", mousedowned).on("dblclick.zoom", dblclicked).filter(touchable).on("touchstart.zoom", touchstarted).on("touchmove.zoom", touchmoved).on("touchend.zoom touchcancel.zoom", touchended).style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }
  zoom.transform = function(collection, transform2, point, event) {
    var selection2 = collection.selection ? collection.selection() : collection;
    selection2.property("__zoom", defaultTransform);
    if (collection !== selection2) {
      schedule(collection, transform2, point, event);
    } else {
      selection2.interrupt().each(function() {
        gesture(this, arguments).event(event).start().zoom(null, typeof transform2 === "function" ? transform2.apply(this, arguments) : transform2).end();
      });
    }
  };
  zoom.scaleBy = function(selection2, k, p, event) {
    zoom.scaleTo(selection2, function() {
      var k0 = this.__zoom.k, k1 = typeof k === "function" ? k.apply(this, arguments) : k;
      return k0 * k1;
    }, p, event);
  };
  zoom.scaleTo = function(selection2, k, p, event) {
    zoom.transform(selection2, function() {
      var e = extent.apply(this, arguments), t0 = this.__zoom, p0 = p == null ? centroid(e) : typeof p === "function" ? p.apply(this, arguments) : p, p1 = t0.invert(p0), k1 = typeof k === "function" ? k.apply(this, arguments) : k;
      return constrain(translate(scale(t0, k1), p0, p1), e, translateExtent);
    }, p, event);
  };
  zoom.translateBy = function(selection2, x, y, event) {
    zoom.transform(selection2, function() {
      return constrain(this.__zoom.translate(typeof x === "function" ? x.apply(this, arguments) : x, typeof y === "function" ? y.apply(this, arguments) : y), extent.apply(this, arguments), translateExtent);
    }, null, event);
  };
  zoom.translateTo = function(selection2, x, y, p, event) {
    zoom.transform(selection2, function() {
      var e = extent.apply(this, arguments), t = this.__zoom, p0 = p == null ? centroid(e) : typeof p === "function" ? p.apply(this, arguments) : p;
      return constrain(identity2.translate(p0[0], p0[1]).scale(t.k).translate(typeof x === "function" ? -x.apply(this, arguments) : -x, typeof y === "function" ? -y.apply(this, arguments) : -y), e, translateExtent);
    }, p, event);
  };
  function scale(transform2, k) {
    k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], k));
    return k === transform2.k ? transform2 : new Transform(k, transform2.x, transform2.y);
  }
  function translate(transform2, p0, p1) {
    var x = p0[0] - p1[0] * transform2.k, y = p0[1] - p1[1] * transform2.k;
    return x === transform2.x && y === transform2.y ? transform2 : new Transform(transform2.k, x, y);
  }
  function centroid(extent2) {
    return [(+extent2[0][0] + +extent2[1][0]) / 2, (+extent2[0][1] + +extent2[1][1]) / 2];
  }
  function schedule(transition2, transform2, point, event) {
    transition2.on("start.zoom", function() {
      gesture(this, arguments).event(event).start();
    }).on("interrupt.zoom end.zoom", function() {
      gesture(this, arguments).event(event).end();
    }).tween("zoom", function() {
      var that = this, args = arguments, g = gesture(that, args).event(event), e = extent.apply(that, args), p = point == null ? centroid(e) : typeof point === "function" ? point.apply(that, args) : point, w = Math.max(e[1][0] - e[0][0], e[1][1] - e[0][1]), a = that.__zoom, b = typeof transform2 === "function" ? transform2.apply(that, args) : transform2, i = interpolate(a.invert(p).concat(w / a.k), b.invert(p).concat(w / b.k));
      return function(t) {
        if (t === 1)
          t = b;
        else {
          var l = i(t), k = w / l[2];
          t = new Transform(k, p[0] - l[0] * k, p[1] - l[1] * k);
        }
        g.zoom(null, t);
      };
    });
  }
  function gesture(that, args, clean) {
    return !clean && that.__zooming || new Gesture(that, args);
  }
  function Gesture(that, args) {
    this.that = that;
    this.args = args;
    this.active = 0;
    this.sourceEvent = null;
    this.extent = extent.apply(that, args);
    this.taps = 0;
  }
  Gesture.prototype = {
    event: function(event) {
      if (event)
        this.sourceEvent = event;
      return this;
    },
    start: function() {
      if (++this.active === 1) {
        this.that.__zooming = this;
        this.emit("start");
      }
      return this;
    },
    zoom: function(key, transform2) {
      if (this.mouse && key !== "mouse")
        this.mouse[1] = transform2.invert(this.mouse[0]);
      if (this.touch0 && key !== "touch")
        this.touch0[1] = transform2.invert(this.touch0[0]);
      if (this.touch1 && key !== "touch")
        this.touch1[1] = transform2.invert(this.touch1[0]);
      this.that.__zoom = transform2;
      this.emit("zoom");
      return this;
    },
    end: function() {
      if (--this.active === 0) {
        delete this.that.__zooming;
        this.emit("end");
      }
      return this;
    },
    emit: function(type) {
      var d = select_default2(this.that).datum();
      listeners2.call(type, this.that, new ZoomEvent(type, {
        sourceEvent: this.sourceEvent,
        target: zoom,
        type,
        transform: this.that.__zoom,
        dispatch: listeners2
      }), d);
    }
  };
  function wheeled(event, ...args) {
    if (!filter2.apply(this, arguments))
      return;
    var g = gesture(this, args).event(event), t = this.__zoom, k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], t.k * Math.pow(2, wheelDelta.apply(this, arguments)))), p = pointer_default(event);
    if (g.wheel) {
      if (g.mouse[0][0] !== p[0] || g.mouse[0][1] !== p[1]) {
        g.mouse[1] = t.invert(g.mouse[0] = p);
      }
      clearTimeout(g.wheel);
    } else if (t.k === k)
      return;
    else {
      g.mouse = [p, t.invert(p)];
      interrupt_default(this);
      g.start();
    }
    noevent_default2(event);
    g.wheel = setTimeout(wheelidled, wheelDelay);
    g.zoom("mouse", constrain(translate(scale(t, k), g.mouse[0], g.mouse[1]), g.extent, translateExtent));
    function wheelidled() {
      g.wheel = null;
      g.end();
    }
  }
  function mousedowned(event, ...args) {
    if (touchending || !filter2.apply(this, arguments))
      return;
    var currentTarget = event.currentTarget, g = gesture(this, args, true).event(event), v = select_default2(event.view).on("mousemove.zoom", mousemoved, true).on("mouseup.zoom", mouseupped, true), p = pointer_default(event, currentTarget), x0 = event.clientX, y0 = event.clientY;
    nodrag_default(event.view);
    nopropagation2(event);
    g.mouse = [p, this.__zoom.invert(p)];
    interrupt_default(this);
    g.start();
    function mousemoved(event2) {
      noevent_default2(event2);
      if (!g.moved) {
        var dx = event2.clientX - x0, dy = event2.clientY - y0;
        g.moved = dx * dx + dy * dy > clickDistance2;
      }
      g.event(event2).zoom("mouse", constrain(translate(g.that.__zoom, g.mouse[0] = pointer_default(event2, currentTarget), g.mouse[1]), g.extent, translateExtent));
    }
    function mouseupped(event2) {
      v.on("mousemove.zoom mouseup.zoom", null);
      yesdrag(event2.view, g.moved);
      noevent_default2(event2);
      g.event(event2).end();
    }
  }
  function dblclicked(event, ...args) {
    if (!filter2.apply(this, arguments))
      return;
    var t0 = this.__zoom, p0 = pointer_default(event.changedTouches ? event.changedTouches[0] : event, this), p1 = t0.invert(p0), k1 = t0.k * (event.shiftKey ? 0.5 : 2), t1 = constrain(translate(scale(t0, k1), p0, p1), extent.apply(this, args), translateExtent);
    noevent_default2(event);
    if (duration > 0)
      select_default2(this).transition().duration(duration).call(schedule, t1, p0, event);
    else
      select_default2(this).call(zoom.transform, t1, p0, event);
  }
  function touchstarted(event, ...args) {
    if (!filter2.apply(this, arguments))
      return;
    var touches = event.touches, n = touches.length, g = gesture(this, args, event.changedTouches.length === n).event(event), started, i, t, p;
    nopropagation2(event);
    for (i = 0;i < n; ++i) {
      t = touches[i], p = pointer_default(t, this);
      p = [p, this.__zoom.invert(p), t.identifier];
      if (!g.touch0)
        g.touch0 = p, started = true, g.taps = 1 + !!touchstarting;
      else if (!g.touch1 && g.touch0[2] !== p[2])
        g.touch1 = p, g.taps = 0;
    }
    if (touchstarting)
      touchstarting = clearTimeout(touchstarting);
    if (started) {
      if (g.taps < 2)
        touchfirst = p[0], touchstarting = setTimeout(function() {
          touchstarting = null;
        }, touchDelay);
      interrupt_default(this);
      g.start();
    }
  }
  function touchmoved(event, ...args) {
    if (!this.__zooming)
      return;
    var g = gesture(this, args).event(event), touches = event.changedTouches, n = touches.length, i, t, p, l;
    noevent_default2(event);
    for (i = 0;i < n; ++i) {
      t = touches[i], p = pointer_default(t, this);
      if (g.touch0 && g.touch0[2] === t.identifier)
        g.touch0[0] = p;
      else if (g.touch1 && g.touch1[2] === t.identifier)
        g.touch1[0] = p;
    }
    t = g.that.__zoom;
    if (g.touch1) {
      var p0 = g.touch0[0], l0 = g.touch0[1], p1 = g.touch1[0], l1 = g.touch1[1], dp = (dp = p1[0] - p0[0]) * dp + (dp = p1[1] - p0[1]) * dp, dl = (dl = l1[0] - l0[0]) * dl + (dl = l1[1] - l0[1]) * dl;
      t = scale(t, Math.sqrt(dp / dl));
      p = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
      l = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2];
    } else if (g.touch0)
      p = g.touch0[0], l = g.touch0[1];
    else
      return;
    g.zoom("touch", constrain(translate(t, p, l), g.extent, translateExtent));
  }
  function touchended(event, ...args) {
    if (!this.__zooming)
      return;
    var g = gesture(this, args).event(event), touches = event.changedTouches, n = touches.length, i, t;
    nopropagation2(event);
    if (touchending)
      clearTimeout(touchending);
    touchending = setTimeout(function() {
      touchending = null;
    }, touchDelay);
    for (i = 0;i < n; ++i) {
      t = touches[i];
      if (g.touch0 && g.touch0[2] === t.identifier)
        delete g.touch0;
      else if (g.touch1 && g.touch1[2] === t.identifier)
        delete g.touch1;
    }
    if (g.touch1 && !g.touch0)
      g.touch0 = g.touch1, delete g.touch1;
    if (g.touch0)
      g.touch0[1] = this.__zoom.invert(g.touch0[0]);
    else {
      g.end();
      if (g.taps === 2) {
        t = pointer_default(t, this);
        if (Math.hypot(touchfirst[0] - t[0], touchfirst[1] - t[1]) < tapDistance) {
          var p = select_default2(this).on("dblclick.zoom");
          if (p)
            p.apply(this, arguments);
        }
      }
    }
  }
  zoom.wheelDelta = function(_) {
    return arguments.length ? (wheelDelta = typeof _ === "function" ? _ : constant_default4(+_), zoom) : wheelDelta;
  };
  zoom.filter = function(_) {
    return arguments.length ? (filter2 = typeof _ === "function" ? _ : constant_default4(!!_), zoom) : filter2;
  };
  zoom.touchable = function(_) {
    return arguments.length ? (touchable = typeof _ === "function" ? _ : constant_default4(!!_), zoom) : touchable;
  };
  zoom.extent = function(_) {
    return arguments.length ? (extent = typeof _ === "function" ? _ : constant_default4([[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]]), zoom) : extent;
  };
  zoom.scaleExtent = function(_) {
    return arguments.length ? (scaleExtent[0] = +_[0], scaleExtent[1] = +_[1], zoom) : [scaleExtent[0], scaleExtent[1]];
  };
  zoom.translateExtent = function(_) {
    return arguments.length ? (translateExtent[0][0] = +_[0][0], translateExtent[1][0] = +_[1][0], translateExtent[0][1] = +_[0][1], translateExtent[1][1] = +_[1][1], zoom) : [[translateExtent[0][0], translateExtent[0][1]], [translateExtent[1][0], translateExtent[1][1]]];
  };
  zoom.constrain = function(_) {
    return arguments.length ? (constrain = _, zoom) : constrain;
  };
  zoom.duration = function(_) {
    return arguments.length ? (duration = +_, zoom) : duration;
  };
  zoom.interpolate = function(_) {
    return arguments.length ? (interpolate = _, zoom) : interpolate;
  };
  zoom.on = function() {
    var value = listeners2.on.apply(listeners2, arguments);
    return value === listeners2 ? zoom : value;
  };
  zoom.clickDistance = function(_) {
    return arguments.length ? (clickDistance2 = (_ = +_) * _, zoom) : Math.sqrt(clickDistance2);
  };
  zoom.tapDistance = function(_) {
    return arguments.length ? (tapDistance = +_, zoom) : tapDistance;
  };
  return zoom;
}
// ../node_modules/.bun/@xyflow+system@0.0.80/node_modules/@xyflow/system/dist/esm/index.js
var errorMessages = {
  error001: (lib = "react") => `Seems like you have not used ${lib === "svelte" ? "SvelteFlowProvider" : "ReactFlowProvider"} as an ancestor. Help: https://${lib}flow.dev/error#001`,
  error002: () => "It looks like you've created a new nodeTypes or edgeTypes object. If this wasn't on purpose please define the nodeTypes/edgeTypes outside of the component or memoize them.",
  error003: (nodeType) => `Node type "${nodeType}" not found. Using fallback type "default".`,
  error004: () => "The parent container needs a width and a height to render the graph.",
  error005: () => "Only child nodes can use a parent extent.",
  error006: () => "Can't create edge. An edge needs a source and a target.",
  error007: (id2) => `The old edge with id=${id2} does not exist.`,
  error009: (type) => `Marker type "${type}" doesn't exist.`,
  error008: (handleType, { id: id2, sourceHandle, targetHandle }) => `Couldn't create edge for ${handleType} handle id: "${handleType === "source" ? sourceHandle : targetHandle}", edge id: ${id2}.`,
  error010: () => "Handle: No node id found. Make sure to only use a Handle inside a custom Node.",
  error011: (edgeType) => `Edge type "${edgeType}" not found. Using fallback type "default".`,
  error012: (id2) => `Node with id "${id2}" does not exist, it may have been removed. This can happen when a node is deleted before the "onNodeClick" handler is called.`,
  error013: (lib = "react") => `It seems that you haven't loaded the styles. Please import '@xyflow/${lib}/dist/style.css' or base.css to make sure everything is working properly.`,
  error014: () => "useNodeConnections: No node ID found. Call useNodeConnections inside a custom Node or provide a node ID.",
  error015: () => "It seems that you are trying to drag a node that is not initialized. Please use onNodesChange as explained in the docs.",
  error016: (id2) => `Edge with id "${id2}" does not exist, it may have been removed. This can happen when an edge is deleted before the "onEdgeClick" handler is called.`
};
var infiniteExtent = [
  [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
  [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY]
];
var elementSelectionKeys = ["Enter", " ", "Escape"];
var defaultAriaLabelConfig = {
  "node.a11yDescription.default": "Press enter or space to select a node. Press delete to remove it and escape to cancel.",
  "node.a11yDescription.keyboardDisabled": "Press enter or space to select a node. You can then use the arrow keys to move the node around. Press delete to remove it and escape to cancel.",
  "node.a11yDescription.ariaLiveMessage": ({ direction, x, y }) => `Moved selected node ${direction}. New position, x: ${x}, y: ${y}`,
  "edge.a11yDescription.default": "Press enter or space to select an edge. You can then press delete to remove it or escape to cancel.",
  "controls.ariaLabel": "Control Panel",
  "controls.zoomIn.ariaLabel": "Zoom In",
  "controls.zoomOut.ariaLabel": "Zoom Out",
  "controls.fitView.ariaLabel": "Fit View",
  "controls.interactive.ariaLabel": "Toggle Interactivity",
  "minimap.ariaLabel": "Mini Map",
  "handle.ariaLabel": "Handle"
};
var ConnectionMode;
(function(ConnectionMode2) {
  ConnectionMode2["Strict"] = "strict";
  ConnectionMode2["Loose"] = "loose";
})(ConnectionMode || (ConnectionMode = {}));
var PanOnScrollMode;
(function(PanOnScrollMode2) {
  PanOnScrollMode2["Free"] = "free";
  PanOnScrollMode2["Vertical"] = "vertical";
  PanOnScrollMode2["Horizontal"] = "horizontal";
})(PanOnScrollMode || (PanOnScrollMode = {}));
var SelectionMode;
(function(SelectionMode2) {
  SelectionMode2["Partial"] = "partial";
  SelectionMode2["Full"] = "full";
})(SelectionMode || (SelectionMode = {}));
var initialConnection = {
  inProgress: false,
  isValid: null,
  from: null,
  fromHandle: null,
  fromPosition: null,
  fromNode: null,
  to: null,
  toHandle: null,
  toPosition: null,
  toNode: null,
  pointer: null
};
var ConnectionLineType;
(function(ConnectionLineType2) {
  ConnectionLineType2["Bezier"] = "default";
  ConnectionLineType2["Straight"] = "straight";
  ConnectionLineType2["Step"] = "step";
  ConnectionLineType2["SmoothStep"] = "smoothstep";
  ConnectionLineType2["SimpleBezier"] = "simplebezier";
})(ConnectionLineType || (ConnectionLineType = {}));
var MarkerType;
(function(MarkerType2) {
  MarkerType2["Arrow"] = "arrow";
  MarkerType2["ArrowClosed"] = "arrowclosed";
})(MarkerType || (MarkerType = {}));
var Position;
(function(Position2) {
  Position2["Left"] = "left";
  Position2["Top"] = "top";
  Position2["Right"] = "right";
  Position2["Bottom"] = "bottom";
})(Position || (Position = {}));
var oppositePosition = {
  [Position.Left]: Position.Right,
  [Position.Right]: Position.Left,
  [Position.Top]: Position.Bottom,
  [Position.Bottom]: Position.Top
};
function getConnectionStatus(isValid) {
  return isValid === null ? null : isValid ? "valid" : "invalid";
}
var isEdgeBase = (element) => !!element && typeof element === "object" && ("id" in element) && ("source" in element) && ("target" in element);
var isNodeBase = (element) => !!element && typeof element === "object" && ("id" in element) && ("position" in element) && !("source" in element) && !("target" in element);
var isInternalNodeBase = (element) => !!element && typeof element === "object" && ("id" in element) && ("internals" in element) && !("source" in element) && !("target" in element);
var getNodePositionWithOrigin = (node, nodeOrigin = [0, 0]) => {
  const { width, height } = getNodeDimensions(node);
  const origin = node.origin ?? nodeOrigin;
  const offsetX = width * origin[0];
  const offsetY = height * origin[1];
  return {
    x: node.position.x - offsetX,
    y: node.position.y - offsetY
  };
};
var getNodesBounds = (nodes, params = { nodeOrigin: [0, 0] }) => {
  if (false) {}
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  let hasNode = false;
  const box = nodes.reduce((currBox, nodeOrId) => {
    const isId = typeof nodeOrId === "string";
    let currentNode = !params.nodeLookup && !isId ? nodeOrId : undefined;
    if (params.nodeLookup) {
      currentNode = isId ? params.nodeLookup.get(nodeOrId) : !isInternalNodeBase(nodeOrId) ? params.nodeLookup.get(nodeOrId.id) : nodeOrId;
    }
    if (!currentNode) {
      return currBox;
    }
    hasNode = true;
    return getBoundsOfBoxes(currBox, nodeToBox(currentNode, params.nodeOrigin));
  }, { x: Infinity, y: Infinity, x2: -Infinity, y2: -Infinity });
  return hasNode ? boxToRect(box) : { x: 0, y: 0, width: 0, height: 0 };
};
var getInternalNodesBounds = (nodeLookup, params = {}) => {
  let box = { x: Infinity, y: Infinity, x2: -Infinity, y2: -Infinity };
  let hasVisibleNodes = false;
  nodeLookup.forEach((node) => {
    if (params.filter === undefined || params.filter(node)) {
      box = getBoundsOfBoxes(box, nodeToBox(node));
      hasVisibleNodes = true;
    }
  });
  return hasVisibleNodes ? boxToRect(box) : { x: 0, y: 0, width: 0, height: 0 };
};
var getNodesInside = (nodes, rect, [tx, ty, tScale] = [0, 0, 1], partially = false, excludeNonSelectableNodes = false) => {
  const paneX = (rect.x - tx) / tScale;
  const paneY = (rect.y - ty) / tScale;
  const paneWidth = rect.width / tScale;
  const paneHeight = rect.height / tScale;
  const visibleNodes = [];
  for (const node of nodes.values()) {
    const { measured, selectable = true, hidden = false } = node;
    if (excludeNonSelectableNodes && !selectable || hidden) {
      continue;
    }
    const width = measured.width ?? node.width ?? node.initialWidth ?? 0;
    const height = measured.height ?? node.height ?? node.initialHeight ?? 0;
    const { x, y } = node.internals.positionAbsolute;
    const overlappingArea = getRectsOverlappingArea(paneX, paneY, paneWidth, paneHeight, x, y, width, height);
    const area = width * height;
    const partiallyVisible = partially && overlappingArea > 0;
    const forceInitialRender = !node.internals.handleBounds;
    const isVisible = forceInitialRender || partiallyVisible || overlappingArea >= area;
    if (isVisible || node.dragging) {
      visibleNodes.push(node);
    }
  }
  return visibleNodes;
};
var getConnectedEdges = (nodes, edges) => {
  const nodeIds = new Set;
  nodes.forEach((node) => {
    nodeIds.add(node.id);
  });
  return edges.filter((edge) => nodeIds.has(edge.source) || nodeIds.has(edge.target));
};
function getFitViewNodes(nodeLookup, options) {
  const fitViewNodes = new Map;
  const optionNodeIds = options?.nodes ? new Set(options.nodes.map((node) => node.id)) : null;
  nodeLookup.forEach((n) => {
    let isVisible;
    if (options?.includeHiddenNodes) {
      const { width, height } = getNodeDimensions(n);
      isVisible = width > 0 && height > 0;
    } else {
      isVisible = Boolean(n.measured.width && n.measured.height && !n.hidden);
    }
    if (isVisible && (!optionNodeIds || optionNodeIds.has(n.id))) {
      fitViewNodes.set(n.id, n);
    }
  });
  return fitViewNodes;
}
async function fitViewport({ nodes, width, height, panZoom, minZoom, maxZoom }, options) {
  if (nodes.size === 0) {
    return true;
  }
  const nodesToFit = getFitViewNodes(nodes, options);
  const bounds = getInternalNodesBounds(nodesToFit);
  const viewport = getViewportForBounds(bounds, width, height, options?.minZoom ?? minZoom, options?.maxZoom ?? maxZoom, options?.padding ?? 0.1);
  await panZoom.setViewport(viewport, {
    duration: options?.duration,
    ease: options?.ease,
    interpolate: options?.interpolate
  });
  return true;
}
function calculateNodePosition({ nodeId, nextPosition, nodeLookup, nodeOrigin = [0, 0], nodeExtent, onError }) {
  const node = nodeLookup.get(nodeId);
  const parentNode = node.parentId ? nodeLookup.get(node.parentId) : undefined;
  const { x: parentX, y: parentY } = parentNode ? parentNode.internals.positionAbsolute : { x: 0, y: 0 };
  const origin = node.origin ?? nodeOrigin;
  let extent = node.extent || nodeExtent;
  if (node.extent === "parent" && !node.expandParent) {
    if (!parentNode) {
      onError?.("005", errorMessages["error005"]());
    } else {
      const { width: parentWidth, height: parentHeight } = getNodeDimensions(parentNode);
      if (parentWidth && parentHeight) {
        extent = [
          [parentX, parentY],
          [parentX + parentWidth, parentY + parentHeight]
        ];
      }
    }
  } else if (parentNode && isCoordinateExtent(node.extent)) {
    extent = [
      [node.extent[0][0] + parentX, node.extent[0][1] + parentY],
      [node.extent[1][0] + parentX, node.extent[1][1] + parentY]
    ];
  }
  const positionAbsolute = isCoordinateExtent(extent) ? clampPosition(nextPosition, extent, node.measured) : nextPosition;
  if (node.measured.width === undefined || node.measured.height === undefined) {
    onError?.("015", errorMessages["error015"]());
  }
  return {
    position: {
      x: positionAbsolute.x - parentX + (node.measured.width ?? 0) * origin[0],
      y: positionAbsolute.y - parentY + (node.measured.height ?? 0) * origin[1]
    },
    positionAbsolute
  };
}
async function getElementsToRemove({ nodesToRemove = [], edgesToRemove = [], nodes, edges, onBeforeDelete }) {
  const nodeIds = new Set(nodesToRemove.map((node) => node.id));
  const matchingNodes = [];
  for (const node of nodes) {
    if (node.deletable === false) {
      continue;
    }
    const isIncluded = nodeIds.has(node.id);
    const parentHit = !isIncluded && node.parentId && matchingNodes.find((n) => n.id === node.parentId);
    if (isIncluded || parentHit) {
      matchingNodes.push(node);
    }
  }
  const edgeIds = new Set(edgesToRemove.map((edge) => edge.id));
  const deletableEdges = edges.filter((edge) => edge.deletable !== false);
  const connectedEdges = getConnectedEdges(matchingNodes, deletableEdges);
  const matchingEdges = connectedEdges;
  for (const edge of deletableEdges) {
    const isIncluded = edgeIds.has(edge.id);
    if (isIncluded && !matchingEdges.find((e) => e.id === edge.id)) {
      matchingEdges.push(edge);
    }
  }
  if (!onBeforeDelete) {
    return {
      edges: matchingEdges,
      nodes: matchingNodes
    };
  }
  const onBeforeDeleteResult = await onBeforeDelete({
    nodes: matchingNodes,
    edges: matchingEdges
  });
  if (typeof onBeforeDeleteResult === "boolean") {
    return onBeforeDeleteResult ? { edges: matchingEdges, nodes: matchingNodes } : { edges: [], nodes: [] };
  }
  return onBeforeDeleteResult;
}
var clamp = (val, min = 0, max = 1) => Math.min(Math.max(val, min), max);
var clampPosition = (position = { x: 0, y: 0 }, extent, dimensions) => ({
  x: clamp(position.x, extent[0][0], extent[1][0] - (dimensions?.width ?? 0)),
  y: clamp(position.y, extent[0][1], extent[1][1] - (dimensions?.height ?? 0))
});
function clampPositionToParent(childPosition, childDimensions, parent) {
  const { width: parentWidth, height: parentHeight } = getNodeDimensions(parent);
  const { x: parentX, y: parentY } = parent.internals.positionAbsolute;
  return clampPosition(childPosition, [
    [parentX, parentY],
    [parentX + parentWidth, parentY + parentHeight]
  ], childDimensions);
}
var calcAutoPanVelocity = (value, min, max) => {
  if (value < min) {
    return clamp(Math.abs(value - min), 1, min) / min;
  } else if (value > max) {
    return -clamp(Math.abs(value - max), 1, min) / min;
  }
  return 0;
};
var calcAutoPan = (pos, bounds, speed = 15, distance = 40) => {
  const xMovement = calcAutoPanVelocity(pos.x, distance, bounds.width - distance) * speed;
  const yMovement = calcAutoPanVelocity(pos.y, distance, bounds.height - distance) * speed;
  return [xMovement, yMovement];
};
var getBoundsOfBoxes = (box1, box2) => ({
  x: Math.min(box1.x, box2.x),
  y: Math.min(box1.y, box2.y),
  x2: Math.max(box1.x2, box2.x2),
  y2: Math.max(box1.y2, box2.y2)
});
var rectToBox = ({ x, y, width, height }) => ({
  x,
  y,
  x2: x + width,
  y2: y + height
});
var boxToRect = ({ x, y, x2, y2 }) => ({
  x,
  y,
  width: x2 - x,
  height: y2 - y
});
var nodeToRect = (node, nodeOrigin = [0, 0]) => {
  const { x, y } = isInternalNodeBase(node) ? node.internals.positionAbsolute : getNodePositionWithOrigin(node, nodeOrigin);
  return {
    x,
    y,
    width: node.measured?.width ?? node.width ?? node.initialWidth ?? 0,
    height: node.measured?.height ?? node.height ?? node.initialHeight ?? 0
  };
};
var nodeToBox = (node, nodeOrigin = [0, 0]) => {
  const { x, y } = isInternalNodeBase(node) ? node.internals.positionAbsolute : getNodePositionWithOrigin(node, nodeOrigin);
  return {
    x,
    y,
    x2: x + (node.measured?.width ?? node.width ?? node.initialWidth ?? 0),
    y2: y + (node.measured?.height ?? node.height ?? node.initialHeight ?? 0)
  };
};
var getBoundsOfRects = (rect1, rect2) => boxToRect(getBoundsOfBoxes(rectToBox(rect1), rectToBox(rect2)));
var getRectsOverlappingArea = (aX, aY, aWidth, aHeight, bX, bY, bWidth, bHeight) => {
  const xOverlap = Math.max(0, Math.min(aX + aWidth, bX + bWidth) - Math.max(aX, bX));
  const yOverlap = Math.max(0, Math.min(aY + aHeight, bY + bHeight) - Math.max(aY, bY));
  return Math.ceil(xOverlap * yOverlap);
};
var getOverlappingArea = (rectA, rectB) => getRectsOverlappingArea(rectA.x, rectA.y, rectA.width, rectA.height, rectB.x, rectB.y, rectB.width, rectB.height);
var isRectObject = (obj) => isNumeric(obj.width) && isNumeric(obj.height) && isNumeric(obj.x) && isNumeric(obj.y);
var isNumeric = (n) => !isNaN(n) && isFinite(n);
var createDevWarn = (lib, helpUrl) => (id2, message) => {
  if (false) {}
};
var snapPosition = (position, snapGrid = [1, 1]) => {
  return {
    x: snapGrid[0] * Math.round(position.x / snapGrid[0]),
    y: snapGrid[1] * Math.round(position.y / snapGrid[1])
  };
};
var pointToRendererPoint = ({ x, y }, [tx, ty, tScale], snapToGrid = false, snapGrid = [1, 1]) => {
  const position = {
    x: (x - tx) / tScale,
    y: (y - ty) / tScale
  };
  return snapToGrid ? snapPosition(position, snapGrid) : position;
};
var rendererPointToPoint = ({ x, y }, [tx, ty, tScale]) => {
  return {
    x: x * tScale + tx,
    y: y * tScale + ty
  };
};
function parsePadding(padding, viewport) {
  if (typeof padding === "number") {
    return Math.floor((viewport - viewport / (1 + padding)) * 0.5);
  }
  if (typeof padding === "string" && padding.endsWith("px")) {
    const paddingValue = parseFloat(padding);
    if (!Number.isNaN(paddingValue)) {
      return Math.floor(paddingValue);
    }
  }
  if (typeof padding === "string" && padding.endsWith("%")) {
    const paddingValue = parseFloat(padding);
    if (!Number.isNaN(paddingValue)) {
      return Math.floor(viewport * paddingValue * 0.01);
    }
  }
  console.error(`The padding value "${padding}" is invalid. Please provide a number or a string with a valid unit (px or %).`);
  return 0;
}
function parsePaddings(padding, width, height) {
  if (typeof padding === "string" || typeof padding === "number") {
    const paddingY = parsePadding(padding, height);
    const paddingX = parsePadding(padding, width);
    return {
      top: paddingY,
      right: paddingX,
      bottom: paddingY,
      left: paddingX,
      x: paddingX * 2,
      y: paddingY * 2
    };
  }
  if (typeof padding === "object") {
    const top = parsePadding(padding.top ?? padding.y ?? 0, height);
    const bottom = parsePadding(padding.bottom ?? padding.y ?? 0, height);
    const left = parsePadding(padding.left ?? padding.x ?? 0, width);
    const right = parsePadding(padding.right ?? padding.x ?? 0, width);
    return { top, right, bottom, left, x: left + right, y: top + bottom };
  }
  return { top: 0, right: 0, bottom: 0, left: 0, x: 0, y: 0 };
}
function calculateAppliedPaddings(bounds, x, y, zoom, width, height) {
  const { x: left, y: top } = rendererPointToPoint(bounds, [x, y, zoom]);
  const { x: boundRight, y: boundBottom } = rendererPointToPoint({ x: bounds.x + bounds.width, y: bounds.y + bounds.height }, [x, y, zoom]);
  const right = width - boundRight;
  const bottom = height - boundBottom;
  return {
    left: Math.floor(left),
    top: Math.floor(top),
    right: Math.floor(right),
    bottom: Math.floor(bottom)
  };
}
var getViewportForBounds = (bounds, width, height, minZoom, maxZoom, padding) => {
  const p = parsePaddings(padding, width, height);
  const xZoom = (width - p.x) / bounds.width;
  const yZoom = (height - p.y) / bounds.height;
  const zoom = Math.min(xZoom, yZoom);
  const clampedZoom = clamp(zoom, minZoom, maxZoom);
  const boundsCenterX = bounds.x + bounds.width / 2;
  const boundsCenterY = bounds.y + bounds.height / 2;
  const x = width / 2 - boundsCenterX * clampedZoom;
  const y = height / 2 - boundsCenterY * clampedZoom;
  const newPadding = calculateAppliedPaddings(bounds, x, y, clampedZoom, width, height);
  const offset = {
    left: Math.min(newPadding.left - p.left, 0),
    top: Math.min(newPadding.top - p.top, 0),
    right: Math.min(newPadding.right - p.right, 0),
    bottom: Math.min(newPadding.bottom - p.bottom, 0)
  };
  return {
    x: x - offset.left + offset.right,
    y: y - offset.top + offset.bottom,
    zoom: clampedZoom
  };
};
var isMacOs = () => typeof navigator !== "undefined" && navigator?.userAgent?.indexOf("Mac") >= 0;
function isCoordinateExtent(extent) {
  return extent !== undefined && extent !== null && extent !== "parent";
}
function getNodeDimensions(node) {
  return {
    width: node.measured?.width ?? node.width ?? node.initialWidth ?? 0,
    height: node.measured?.height ?? node.height ?? node.initialHeight ?? 0
  };
}
function nodeHasDimensions(node) {
  return (node.measured?.width ?? node.width ?? node.initialWidth) !== undefined && (node.measured?.height ?? node.height ?? node.initialHeight) !== undefined;
}
function evaluateAbsolutePosition(position, dimensions = { width: 0, height: 0 }, parentId, nodeLookup, nodeOrigin) {
  const positionAbsolute = { ...position };
  const parent = nodeLookup.get(parentId);
  if (parent) {
    const origin = parent.origin || nodeOrigin;
    positionAbsolute.x += parent.internals.positionAbsolute.x - (dimensions.width ?? 0) * origin[0];
    positionAbsolute.y += parent.internals.positionAbsolute.y - (dimensions.height ?? 0) * origin[1];
  }
  return positionAbsolute;
}
function areSetsEqual(a, b) {
  if (a.size !== b.size) {
    return false;
  }
  for (const item of a) {
    if (!b.has(item)) {
      return false;
    }
  }
  return true;
}
function withResolvers() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
function mergeAriaLabelConfig(partial) {
  return { ...defaultAriaLabelConfig, ...partial || {} };
}
function getPointerPosition(event, { snapGrid = [0, 0], snapToGrid = false, transform: transform2, containerBounds }) {
  const { x, y } = getEventPosition(event);
  const pointerPos = pointToRendererPoint({ x: x - (containerBounds?.left ?? 0), y: y - (containerBounds?.top ?? 0) }, transform2);
  const { x: xSnapped, y: ySnapped } = snapToGrid ? snapPosition(pointerPos, snapGrid) : pointerPos;
  return {
    xSnapped,
    ySnapped,
    ...pointerPos
  };
}
var getDimensions = (node) => ({
  width: node.offsetWidth,
  height: node.offsetHeight
});
var getHostForElement = (element) => element?.getRootNode?.() || window?.document;
var inputTags = ["INPUT", "SELECT", "TEXTAREA"];
function isInputDOMNode(event) {
  const target = event.composedPath?.()?.[0] || event.target;
  if (target?.nodeType !== 1)
    return false;
  const isInput = inputTags.includes(target.nodeName) || target.hasAttribute("contenteditable");
  return isInput || !!target.closest(".nokey");
}
var isMouseEvent = (event) => ("clientX" in event);
var getEventPosition = (event, bounds) => {
  const isMouse = isMouseEvent(event);
  const evtX = isMouse ? event.clientX : event.touches?.[0].clientX;
  const evtY = isMouse ? event.clientY : event.touches?.[0].clientY;
  return {
    x: evtX - (bounds?.left ?? 0),
    y: evtY - (bounds?.top ?? 0)
  };
};
var getHandleBounds = (type, nodeElement, nodeBounds, zoom, nodeId) => {
  const handles = nodeElement.querySelectorAll(`.${type}`);
  if (!handles || !handles.length) {
    return null;
  }
  return Array.from(handles).map((handle) => {
    const handleBounds = handle.getBoundingClientRect();
    return {
      id: handle.getAttribute("data-handleid"),
      type,
      nodeId,
      position: handle.getAttribute("data-handlepos"),
      x: (handleBounds.left - nodeBounds.left) / zoom,
      y: (handleBounds.top - nodeBounds.top) / zoom,
      ...getDimensions(handle)
    };
  });
};
function getBezierEdgeCenter({ sourceX, sourceY, targetX, targetY, sourceControlX, sourceControlY, targetControlX, targetControlY }) {
  const centerX = sourceX * 0.125 + sourceControlX * 0.375 + targetControlX * 0.375 + targetX * 0.125;
  const centerY = sourceY * 0.125 + sourceControlY * 0.375 + targetControlY * 0.375 + targetY * 0.125;
  const offsetX = Math.abs(centerX - sourceX);
  const offsetY = Math.abs(centerY - sourceY);
  return [centerX, centerY, offsetX, offsetY];
}
function calculateControlOffset(distance, curvature) {
  if (distance >= 0) {
    return 0.5 * distance;
  }
  return curvature * 25 * Math.sqrt(-distance);
}
function getControlWithCurvature({ pos, x1, y1, x2, y2, c }) {
  switch (pos) {
    case Position.Left:
      return [x1 - calculateControlOffset(x1 - x2, c), y1];
    case Position.Right:
      return [x1 + calculateControlOffset(x2 - x1, c), y1];
    case Position.Top:
      return [x1, y1 - calculateControlOffset(y1 - y2, c)];
    case Position.Bottom:
      return [x1, y1 + calculateControlOffset(y2 - y1, c)];
  }
}
function getBezierPath({ sourceX, sourceY, sourcePosition = Position.Bottom, targetX, targetY, targetPosition = Position.Top, curvature = 0.25 }) {
  const [sourceControlX, sourceControlY] = getControlWithCurvature({
    pos: sourcePosition,
    x1: sourceX,
    y1: sourceY,
    x2: targetX,
    y2: targetY,
    c: curvature
  });
  const [targetControlX, targetControlY] = getControlWithCurvature({
    pos: targetPosition,
    x1: targetX,
    y1: targetY,
    x2: sourceX,
    y2: sourceY,
    c: curvature
  });
  const [labelX, labelY, offsetX, offsetY] = getBezierEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourceControlX,
    sourceControlY,
    targetControlX,
    targetControlY
  });
  return [
    `M${sourceX},${sourceY} C${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetX},${targetY}`,
    labelX,
    labelY,
    offsetX,
    offsetY
  ];
}
function getEdgeCenter({ sourceX, sourceY, targetX, targetY }) {
  const xOffset = Math.abs(targetX - sourceX) / 2;
  const centerX = targetX < sourceX ? targetX + xOffset : targetX - xOffset;
  const yOffset = Math.abs(targetY - sourceY) / 2;
  const centerY = targetY < sourceY ? targetY + yOffset : targetY - yOffset;
  return [centerX, centerY, xOffset, yOffset];
}
function getElevatedEdgeZIndex({ sourceNode, targetNode, selected = false, zIndex = 0, elevateOnSelect = false, zIndexMode = "basic" }) {
  if (zIndexMode === "manual") {
    return zIndex;
  }
  const edgeZ = elevateOnSelect && selected ? zIndex + 1000 : zIndex;
  const nodeZ = Math.max(sourceNode.parentId || elevateOnSelect && sourceNode.selected ? sourceNode.internals.z : 0, targetNode.parentId || elevateOnSelect && targetNode.selected ? targetNode.internals.z : 0);
  return edgeZ + nodeZ;
}
function isEdgeVisible({ sourceNode, targetNode, width, height, transform: transform2 }) {
  const edgeBox = getBoundsOfBoxes(nodeToBox(sourceNode), nodeToBox(targetNode));
  if (edgeBox.x === edgeBox.x2) {
    edgeBox.x2 += 1;
  }
  if (edgeBox.y === edgeBox.y2) {
    edgeBox.y2 += 1;
  }
  const viewRect = {
    x: -transform2[0] / transform2[2],
    y: -transform2[1] / transform2[2],
    width: width / transform2[2],
    height: height / transform2[2]
  };
  return getOverlappingArea(viewRect, boxToRect(edgeBox)) > 0;
}
var getEdgeId = ({ source, sourceHandle, target, targetHandle }) => `xy-edge__${source}${sourceHandle || ""}-${target}${targetHandle || ""}`;
var connectionExists = (edge, edges) => {
  return edges.some((el) => el.source === edge.source && el.target === edge.target && (el.sourceHandle === edge.sourceHandle || !el.sourceHandle && !edge.sourceHandle) && (el.targetHandle === edge.targetHandle || !el.targetHandle && !edge.targetHandle));
};
var addEdge = (edgeParams, edges, options = {}) => {
  if (!edgeParams.source || !edgeParams.target) {
    options.onError?.("006", errorMessages["error006"]());
    return edges;
  }
  const edgeIdGenerator = options.getEdgeId || getEdgeId;
  let edge;
  if (isEdgeBase(edgeParams)) {
    edge = { ...edgeParams };
  } else {
    edge = {
      ...edgeParams,
      id: edgeIdGenerator(edgeParams)
    };
  }
  if (connectionExists(edge, edges)) {
    return edges;
  }
  if (edge.sourceHandle === null) {
    delete edge.sourceHandle;
  }
  if (edge.targetHandle === null) {
    delete edge.targetHandle;
  }
  return edges.concat(edge);
};
function getStraightPath({ sourceX, sourceY, targetX, targetY }) {
  const [labelX, labelY, offsetX, offsetY] = getEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY
  });
  return [`M ${sourceX},${sourceY}L ${targetX},${targetY}`, labelX, labelY, offsetX, offsetY];
}
var handleDirections = {
  [Position.Left]: { x: -1, y: 0 },
  [Position.Right]: { x: 1, y: 0 },
  [Position.Top]: { x: 0, y: -1 },
  [Position.Bottom]: { x: 0, y: 1 }
};
var getDirection = ({ source, sourcePosition = Position.Bottom, target }) => {
  if (sourcePosition === Position.Left || sourcePosition === Position.Right) {
    return source.x < target.x ? { x: 1, y: 0 } : { x: -1, y: 0 };
  }
  return source.y < target.y ? { x: 0, y: 1 } : { x: 0, y: -1 };
};
var distance = (a, b) => Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
function getPoints({ source, sourcePosition = Position.Bottom, target, targetPosition = Position.Top, center, offset, stepPosition }) {
  const sourceDir = handleDirections[sourcePosition];
  const targetDir = handleDirections[targetPosition];
  const sourceGapped = { x: source.x + sourceDir.x * offset, y: source.y + sourceDir.y * offset };
  const targetGapped = { x: target.x + targetDir.x * offset, y: target.y + targetDir.y * offset };
  const dir = getDirection({
    source: sourceGapped,
    sourcePosition,
    target: targetGapped
  });
  const dirAccessor = dir.x !== 0 ? "x" : "y";
  const currDir = dir[dirAccessor];
  let points = [];
  let centerX, centerY;
  const sourceGapOffset = { x: 0, y: 0 };
  const targetGapOffset = { x: 0, y: 0 };
  const [, , defaultOffsetX, defaultOffsetY] = getEdgeCenter({
    sourceX: source.x,
    sourceY: source.y,
    targetX: target.x,
    targetY: target.y
  });
  if (sourceDir[dirAccessor] * targetDir[dirAccessor] === -1) {
    if (dirAccessor === "x") {
      centerX = center.x ?? sourceGapped.x + (targetGapped.x - sourceGapped.x) * stepPosition;
      centerY = center.y ?? (sourceGapped.y + targetGapped.y) / 2;
    } else {
      centerX = center.x ?? (sourceGapped.x + targetGapped.x) / 2;
      centerY = center.y ?? sourceGapped.y + (targetGapped.y - sourceGapped.y) * stepPosition;
    }
    const verticalSplit = [
      { x: centerX, y: sourceGapped.y },
      { x: centerX, y: targetGapped.y }
    ];
    const horizontalSplit = [
      { x: sourceGapped.x, y: centerY },
      { x: targetGapped.x, y: centerY }
    ];
    if (sourceDir[dirAccessor] === currDir) {
      points = dirAccessor === "x" ? verticalSplit : horizontalSplit;
    } else {
      points = dirAccessor === "x" ? horizontalSplit : verticalSplit;
    }
  } else {
    const sourceTarget = [{ x: sourceGapped.x, y: targetGapped.y }];
    const targetSource = [{ x: targetGapped.x, y: sourceGapped.y }];
    if (dirAccessor === "x") {
      points = sourceDir.x === currDir ? targetSource : sourceTarget;
    } else {
      points = sourceDir.y === currDir ? sourceTarget : targetSource;
    }
    if (sourcePosition === targetPosition) {
      const diff = Math.abs(source[dirAccessor] - target[dirAccessor]);
      if (diff <= offset) {
        const gapOffset = Math.min(offset - 1, offset - diff);
        if (sourceDir[dirAccessor] === currDir) {
          sourceGapOffset[dirAccessor] = (sourceGapped[dirAccessor] > source[dirAccessor] ? -1 : 1) * gapOffset;
        } else {
          targetGapOffset[dirAccessor] = (targetGapped[dirAccessor] > target[dirAccessor] ? -1 : 1) * gapOffset;
        }
      }
    }
    if (sourcePosition !== targetPosition) {
      const dirAccessorOpposite = dirAccessor === "x" ? "y" : "x";
      const isSameDir = sourceDir[dirAccessor] === targetDir[dirAccessorOpposite];
      const sourceGtTargetOppo = sourceGapped[dirAccessorOpposite] > targetGapped[dirAccessorOpposite];
      const sourceLtTargetOppo = sourceGapped[dirAccessorOpposite] < targetGapped[dirAccessorOpposite];
      const flipSourceTarget = sourceDir[dirAccessor] === 1 && (!isSameDir && sourceGtTargetOppo || isSameDir && sourceLtTargetOppo) || sourceDir[dirAccessor] !== 1 && (!isSameDir && sourceLtTargetOppo || isSameDir && sourceGtTargetOppo);
      if (flipSourceTarget) {
        points = dirAccessor === "x" ? sourceTarget : targetSource;
      }
    }
    const sourceGapPoint = { x: sourceGapped.x + sourceGapOffset.x, y: sourceGapped.y + sourceGapOffset.y };
    const targetGapPoint = { x: targetGapped.x + targetGapOffset.x, y: targetGapped.y + targetGapOffset.y };
    const maxXDistance = Math.max(Math.abs(sourceGapPoint.x - points[0].x), Math.abs(targetGapPoint.x - points[0].x));
    const maxYDistance = Math.max(Math.abs(sourceGapPoint.y - points[0].y), Math.abs(targetGapPoint.y - points[0].y));
    if (maxXDistance >= maxYDistance) {
      centerX = (sourceGapPoint.x + targetGapPoint.x) / 2;
      centerY = points[0].y;
    } else {
      centerX = points[0].x;
      centerY = (sourceGapPoint.y + targetGapPoint.y) / 2;
    }
  }
  const gappedSource = { x: sourceGapped.x + sourceGapOffset.x, y: sourceGapped.y + sourceGapOffset.y };
  const gappedTarget = { x: targetGapped.x + targetGapOffset.x, y: targetGapped.y + targetGapOffset.y };
  const pathPoints = [
    source,
    ...gappedSource.x !== points[0].x || gappedSource.y !== points[0].y ? [gappedSource] : [],
    ...points,
    ...gappedTarget.x !== points[points.length - 1].x || gappedTarget.y !== points[points.length - 1].y ? [gappedTarget] : [],
    target
  ];
  return [pathPoints, centerX, centerY, defaultOffsetX, defaultOffsetY];
}
function getBend(a, b, c, size) {
  const bendSize = Math.min(distance(a, b) / 2, distance(b, c) / 2, size);
  const { x, y } = b;
  if (a.x === x && x === c.x || a.y === y && y === c.y) {
    return `L${x} ${y}`;
  }
  if (a.y === y) {
    const xDir2 = a.x < c.x ? -1 : 1;
    const yDir2 = a.y < c.y ? 1 : -1;
    return `L ${x + bendSize * xDir2},${y}Q ${x},${y} ${x},${y + bendSize * yDir2}`;
  }
  const xDir = a.x < c.x ? 1 : -1;
  const yDir = a.y < c.y ? -1 : 1;
  return `L ${x},${y + bendSize * yDir}Q ${x},${y} ${x + bendSize * xDir},${y}`;
}
function getSmoothStepPath({ sourceX, sourceY, sourcePosition = Position.Bottom, targetX, targetY, targetPosition = Position.Top, borderRadius = 5, centerX, centerY, offset = 20, stepPosition = 0.5 }) {
  const [points, labelX, labelY, offsetX, offsetY] = getPoints({
    source: { x: sourceX, y: sourceY },
    sourcePosition,
    target: { x: targetX, y: targetY },
    targetPosition,
    center: { x: centerX, y: centerY },
    offset,
    stepPosition
  });
  let path = `M${points[0].x} ${points[0].y}`;
  for (let i = 1;i < points.length - 1; i++) {
    path += getBend(points[i - 1], points[i], points[i + 1], borderRadius);
  }
  path += `L${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return [path, labelX, labelY, offsetX, offsetY];
}
function isNodeInitialized(node) {
  return node && !!(node.internals.handleBounds || node.handles?.length) && !!(node.measured.width || node.width || node.initialWidth);
}
function getEdgePosition(params) {
  const { sourceNode, targetNode } = params;
  if (!isNodeInitialized(sourceNode) || !isNodeInitialized(targetNode)) {
    return null;
  }
  const sourceHandleBounds = sourceNode.internals.handleBounds || toHandleBounds(sourceNode.handles);
  const targetHandleBounds = targetNode.internals.handleBounds || toHandleBounds(targetNode.handles);
  const sourceHandle = getHandle$1(sourceHandleBounds?.source ?? [], params.sourceHandle);
  const targetHandle = getHandle$1(params.connectionMode === ConnectionMode.Strict ? targetHandleBounds?.target ?? [] : (targetHandleBounds?.target ?? []).concat(targetHandleBounds?.source ?? []), params.targetHandle);
  if (!sourceHandle || !targetHandle) {
    params.onError?.("008", errorMessages["error008"](!sourceHandle ? "source" : "target", {
      id: params.id,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle
    }));
    return null;
  }
  const sourcePosition = sourceHandle?.position || Position.Bottom;
  const targetPosition = targetHandle?.position || Position.Top;
  const source = getHandlePosition(sourceNode, sourceHandle, sourcePosition);
  const target = getHandlePosition(targetNode, targetHandle, targetPosition);
  return {
    sourceX: source.x,
    sourceY: source.y,
    targetX: target.x,
    targetY: target.y,
    sourcePosition,
    targetPosition
  };
}
function toHandleBounds(handles) {
  if (!handles) {
    return null;
  }
  const source = [];
  const target = [];
  for (const handle of handles) {
    handle.width = handle.width ?? 1;
    handle.height = handle.height ?? 1;
    if (handle.type === "source") {
      source.push(handle);
    } else if (handle.type === "target") {
      target.push(handle);
    }
  }
  return {
    source,
    target
  };
}
function getHandlePosition(node, handle, fallbackPosition = Position.Left, center = false) {
  const x = (handle?.x ?? 0) + node.internals.positionAbsolute.x;
  const y = (handle?.y ?? 0) + node.internals.positionAbsolute.y;
  const { width, height } = handle ?? getNodeDimensions(node);
  if (center) {
    return { x: x + width / 2, y: y + height / 2 };
  }
  const position = handle?.position ?? fallbackPosition;
  switch (position) {
    case Position.Top:
      return { x: x + width / 2, y };
    case Position.Right:
      return { x: x + width, y: y + height / 2 };
    case Position.Bottom:
      return { x: x + width / 2, y: y + height };
    case Position.Left:
      return { x, y: y + height / 2 };
  }
}
function getHandle$1(bounds, handleId) {
  if (!bounds) {
    return null;
  }
  return (!handleId ? bounds[0] : bounds.find((d) => d.id === handleId)) || null;
}
function getMarkerId(marker, id2) {
  if (!marker) {
    return "";
  }
  if (typeof marker === "string") {
    return marker;
  }
  const idPrefix = id2 ? `${id2}__` : "";
  return `${idPrefix}${Object.keys(marker).sort().map((key) => `${key}=${marker[key]}`).join("&")}`;
}
function createMarkerIds(edges, { id: id2, defaultColor, defaultMarkerStart, defaultMarkerEnd }) {
  const ids = new Set;
  return edges.reduce((markers, edge) => {
    [edge.markerStart || defaultMarkerStart, edge.markerEnd || defaultMarkerEnd].forEach((marker) => {
      if (marker && typeof marker === "object") {
        const markerId = getMarkerId(marker, id2);
        if (!ids.has(markerId)) {
          markers.push({ id: markerId, color: marker.color || defaultColor, ...marker });
          ids.add(markerId);
        }
      }
    });
    return markers;
  }, []).sort((a, b) => a.id.localeCompare(b.id));
}
var SELECTED_NODE_Z = 1000;
var ROOT_PARENT_Z_INCREMENT = 10;
var defaultOptions = {
  nodeOrigin: [0, 0],
  nodeExtent: infiniteExtent,
  elevateNodesOnSelect: true,
  zIndexMode: "basic",
  defaults: {}
};
var adoptUserNodesDefaultOptions = {
  ...defaultOptions,
  checkEquality: true
};
function mergeObjects(base, incoming) {
  const result = { ...base };
  for (const key in incoming) {
    if (incoming[key] !== undefined) {
      result[key] = incoming[key];
    }
  }
  return result;
}
function updateAbsolutePositions(nodeLookup, parentLookup, options) {
  const _options = mergeObjects(defaultOptions, options);
  for (const node of nodeLookup.values()) {
    if (node.parentId) {
      updateChildNode(node, nodeLookup, parentLookup, _options);
    } else {
      const positionWithOrigin = getNodePositionWithOrigin(node, _options.nodeOrigin);
      const extent = isCoordinateExtent(node.extent) ? node.extent : _options.nodeExtent;
      const clampedPosition = clampPosition(positionWithOrigin, extent, getNodeDimensions(node));
      node.internals.positionAbsolute = clampedPosition;
    }
  }
}
function parseHandles(userNode, internalNode) {
  if (!userNode.handles) {
    return !userNode.measured ? undefined : internalNode?.internals.handleBounds;
  }
  const source = [];
  const target = [];
  for (const handle of userNode.handles) {
    const handleBounds = {
      id: handle.id,
      width: handle.width ?? 1,
      height: handle.height ?? 1,
      nodeId: userNode.id,
      x: handle.x,
      y: handle.y,
      position: handle.position,
      type: handle.type
    };
    if (handle.type === "source") {
      source.push(handleBounds);
    } else if (handle.type === "target") {
      target.push(handleBounds);
    }
  }
  return {
    source,
    target
  };
}
function isManualZIndexMode(zIndexMode) {
  return zIndexMode === "manual";
}
function adoptUserNodes(nodes, nodeLookup, parentLookup, options = {}) {
  const _options = mergeObjects(adoptUserNodesDefaultOptions, options);
  const rootParentIndex = { i: 0 };
  const tmpLookup = new Map(nodeLookup);
  const selectedNodeZ = _options?.elevateNodesOnSelect && !isManualZIndexMode(_options.zIndexMode) ? SELECTED_NODE_Z : 0;
  let nodesInitialized = nodes.length > 0;
  let hasSelectedNodes = false;
  nodeLookup.clear();
  parentLookup.clear();
  for (const userNode of nodes) {
    let internalNode = tmpLookup.get(userNode.id);
    if (_options.checkEquality && userNode === internalNode?.internals.userNode) {
      nodeLookup.set(userNode.id, internalNode);
    } else {
      const positionWithOrigin = getNodePositionWithOrigin(userNode, _options.nodeOrigin);
      const extent = isCoordinateExtent(userNode.extent) ? userNode.extent : _options.nodeExtent;
      const clampedPosition = clampPosition(positionWithOrigin, extent, getNodeDimensions(userNode));
      internalNode = {
        ..._options.defaults,
        ...userNode,
        measured: {
          width: userNode.measured?.width,
          height: userNode.measured?.height
        },
        internals: {
          positionAbsolute: clampedPosition,
          handleBounds: parseHandles(userNode, internalNode),
          z: calculateZ(userNode, selectedNodeZ, _options.zIndexMode),
          userNode
        }
      };
      nodeLookup.set(userNode.id, internalNode);
    }
    if ((internalNode.measured === undefined || internalNode.measured.width === undefined || internalNode.measured.height === undefined) && !internalNode.hidden) {
      nodesInitialized = false;
    }
    if (userNode.parentId) {
      updateChildNode(internalNode, nodeLookup, parentLookup, options, rootParentIndex);
    }
    hasSelectedNodes ||= userNode.selected ?? false;
  }
  return { nodesInitialized, hasSelectedNodes };
}
function updateParentLookup(node, parentLookup) {
  if (!node.parentId) {
    return;
  }
  const childNodes = parentLookup.get(node.parentId);
  if (childNodes) {
    childNodes.set(node.id, node);
  } else {
    parentLookup.set(node.parentId, new Map([[node.id, node]]));
  }
}
function updateChildNode(node, nodeLookup, parentLookup, options, rootParentIndex) {
  const { elevateNodesOnSelect, nodeOrigin, nodeExtent, zIndexMode } = mergeObjects(defaultOptions, options);
  const parentId = node.parentId;
  const parentNode = nodeLookup.get(parentId);
  if (!parentNode) {
    console.warn(`Parent node ${parentId} not found. Please make sure that parent nodes are in front of their child nodes in the nodes array.`);
    return;
  }
  updateParentLookup(node, parentLookup);
  if (rootParentIndex && !parentNode.parentId && parentNode.internals.rootParentIndex === undefined && zIndexMode === "auto") {
    parentNode.internals.rootParentIndex = ++rootParentIndex.i;
    parentNode.internals.z = parentNode.internals.z + rootParentIndex.i * ROOT_PARENT_Z_INCREMENT;
  }
  if (rootParentIndex && parentNode.internals.rootParentIndex !== undefined) {
    rootParentIndex.i = parentNode.internals.rootParentIndex;
  }
  const selectedNodeZ = elevateNodesOnSelect && !isManualZIndexMode(zIndexMode) ? SELECTED_NODE_Z : 0;
  const { x, y, z } = calculateChildXYZ(node, parentNode, nodeOrigin, nodeExtent, selectedNodeZ, zIndexMode);
  const { positionAbsolute } = node.internals;
  const positionChanged = x !== positionAbsolute.x || y !== positionAbsolute.y;
  if (positionChanged || z !== node.internals.z) {
    nodeLookup.set(node.id, {
      ...node,
      internals: {
        ...node.internals,
        positionAbsolute: positionChanged ? { x, y } : positionAbsolute,
        z
      }
    });
  }
}
function calculateZ(node, selectedNodeZ, zIndexMode) {
  const zIndex = isNumeric(node.zIndex) ? node.zIndex : 0;
  if (isManualZIndexMode(zIndexMode)) {
    return zIndex;
  }
  return zIndex + (node.selected ? selectedNodeZ : 0);
}
function calculateChildXYZ(childNode, parentNode, nodeOrigin, nodeExtent, selectedNodeZ, zIndexMode) {
  const { x: parentX, y: parentY } = parentNode.internals.positionAbsolute;
  const childDimensions = getNodeDimensions(childNode);
  const positionWithOrigin = getNodePositionWithOrigin(childNode, nodeOrigin);
  const clampedPosition = isCoordinateExtent(childNode.extent) ? clampPosition(positionWithOrigin, childNode.extent, childDimensions) : positionWithOrigin;
  let absolutePosition = clampPosition({ x: parentX + clampedPosition.x, y: parentY + clampedPosition.y }, nodeExtent, childDimensions);
  if (childNode.extent === "parent") {
    absolutePosition = clampPositionToParent(absolutePosition, childDimensions, parentNode);
  }
  const childZ = calculateZ(childNode, selectedNodeZ, zIndexMode);
  const parentZ = parentNode.internals.z ?? 0;
  return {
    x: absolutePosition.x,
    y: absolutePosition.y,
    z: parentZ >= childZ ? parentZ + 1 : childZ
  };
}
function handleExpandParent(children2, nodeLookup, parentLookup, nodeOrigin = [0, 0]) {
  const changes = [];
  const parentExpansions = new Map;
  for (const child of children2) {
    const parent = nodeLookup.get(child.parentId);
    if (!parent) {
      continue;
    }
    const parentRect = parentExpansions.get(child.parentId)?.expandedRect ?? nodeToRect(parent);
    const expandedRect = getBoundsOfRects(parentRect, child.rect);
    parentExpansions.set(child.parentId, { expandedRect, parent });
  }
  if (parentExpansions.size > 0) {
    parentExpansions.forEach(({ expandedRect, parent }, parentId) => {
      const positionAbsolute = parent.internals.positionAbsolute;
      const dimensions = getNodeDimensions(parent);
      const origin = parent.origin ?? nodeOrigin;
      const xChange = expandedRect.x < positionAbsolute.x ? Math.round(Math.abs(positionAbsolute.x - expandedRect.x)) : 0;
      const yChange = expandedRect.y < positionAbsolute.y ? Math.round(Math.abs(positionAbsolute.y - expandedRect.y)) : 0;
      const newWidth = Math.max(dimensions.width, Math.round(expandedRect.width));
      const newHeight = Math.max(dimensions.height, Math.round(expandedRect.height));
      const widthChange = (newWidth - dimensions.width) * origin[0];
      const heightChange = (newHeight - dimensions.height) * origin[1];
      if (xChange > 0 || yChange > 0 || widthChange || heightChange) {
        changes.push({
          id: parentId,
          type: "position",
          position: {
            x: parent.position.x - xChange + widthChange,
            y: parent.position.y - yChange + heightChange
          }
        });
        parentLookup.get(parentId)?.forEach((childNode) => {
          if (!children2.some((child) => child.id === childNode.id)) {
            changes.push({
              id: childNode.id,
              type: "position",
              position: {
                x: childNode.position.x + xChange,
                y: childNode.position.y + yChange
              }
            });
          }
        });
      }
      if (dimensions.width < expandedRect.width || dimensions.height < expandedRect.height || xChange || yChange) {
        changes.push({
          id: parentId,
          type: "dimensions",
          setAttributes: true,
          dimensions: {
            width: newWidth + (xChange ? origin[0] * xChange - widthChange : 0),
            height: newHeight + (yChange ? origin[1] * yChange - heightChange : 0)
          }
        });
      }
    });
  }
  return changes;
}
function updateNodeInternals(updates, nodeLookup, parentLookup, domNode, nodeOrigin, nodeExtent, zIndexMode) {
  const viewportNode = domNode?.querySelector(".xyflow__viewport");
  let updatedInternals = false;
  if (!viewportNode) {
    return { changes: [], updatedInternals };
  }
  const changes = [];
  const style = window.getComputedStyle(viewportNode);
  const { m22: zoom } = new window.DOMMatrixReadOnly(style.transform);
  const parentExpandChildren = [];
  for (const update of updates.values()) {
    const node = nodeLookup.get(update.id);
    if (!node) {
      continue;
    }
    if (node.hidden) {
      nodeLookup.set(node.id, {
        ...node,
        internals: {
          ...node.internals,
          handleBounds: undefined
        }
      });
      updatedInternals = true;
      continue;
    }
    const dimensions = getDimensions(update.nodeElement);
    const dimensionChanged = node.measured.width !== dimensions.width || node.measured.height !== dimensions.height;
    const doUpdate = !!(dimensions.width && dimensions.height && (dimensionChanged || !node.internals.handleBounds || update.force));
    if (doUpdate) {
      const nodeBounds = update.nodeElement.getBoundingClientRect();
      const extent = isCoordinateExtent(node.extent) ? node.extent : nodeExtent;
      let { positionAbsolute } = node.internals;
      if (node.parentId && node.extent === "parent") {
        const parentNode = nodeLookup.get(node.parentId);
        if (parentNode) {
          positionAbsolute = clampPositionToParent(positionAbsolute, dimensions, parentNode);
        }
      } else if (extent) {
        positionAbsolute = clampPosition(positionAbsolute, extent, dimensions);
      }
      const newNode = {
        ...node,
        measured: dimensions,
        internals: {
          ...node.internals,
          positionAbsolute,
          handleBounds: {
            source: getHandleBounds("source", update.nodeElement, nodeBounds, zoom, node.id),
            target: getHandleBounds("target", update.nodeElement, nodeBounds, zoom, node.id)
          }
        }
      };
      nodeLookup.set(node.id, newNode);
      if (node.parentId) {
        updateChildNode(newNode, nodeLookup, parentLookup, { nodeOrigin, zIndexMode });
      }
      updatedInternals = true;
      if (dimensionChanged) {
        changes.push({
          id: node.id,
          type: "dimensions",
          dimensions
        });
        if (node.expandParent && node.parentId) {
          parentExpandChildren.push({
            id: node.id,
            parentId: node.parentId,
            rect: nodeToRect(newNode, nodeOrigin)
          });
        }
      }
    }
  }
  if (parentExpandChildren.length > 0) {
    const parentExpandChanges = handleExpandParent(parentExpandChildren, nodeLookup, parentLookup, nodeOrigin);
    changes.push(...parentExpandChanges);
  }
  return { changes, updatedInternals };
}
async function panBy({ delta, panZoom, transform: transform2, translateExtent, width, height }) {
  if (!panZoom || !delta.x && !delta.y) {
    return false;
  }
  const nextViewport = await panZoom.setViewportConstrained({
    x: transform2[0] + delta.x,
    y: transform2[1] + delta.y,
    zoom: transform2[2]
  }, [
    [0, 0],
    [width, height]
  ], translateExtent);
  const transformChanged = !!nextViewport && (nextViewport.x !== transform2[0] || nextViewport.y !== transform2[1] || nextViewport.k !== transform2[2]);
  return transformChanged;
}
function addConnectionToLookup(type, connection, connectionKey, connectionLookup, nodeId, handleId) {
  let key = nodeId;
  const nodeMap = connectionLookup.get(key) || new Map;
  connectionLookup.set(key, nodeMap.set(connectionKey, connection));
  key = `${nodeId}-${type}`;
  const typeMap = connectionLookup.get(key) || new Map;
  connectionLookup.set(key, typeMap.set(connectionKey, connection));
  if (handleId) {
    key = `${nodeId}-${type}-${handleId}`;
    const handleMap = connectionLookup.get(key) || new Map;
    connectionLookup.set(key, handleMap.set(connectionKey, connection));
  }
}
function updateConnectionLookup(connectionLookup, edgeLookup, edges) {
  connectionLookup.clear();
  edgeLookup.clear();
  for (const edge of edges) {
    const { source: sourceNode, target: targetNode, sourceHandle = null, targetHandle = null } = edge;
    const connection = { edgeId: edge.id, source: sourceNode, target: targetNode, sourceHandle, targetHandle };
    const sourceKey = `${sourceNode}-${sourceHandle}--${targetNode}-${targetHandle}`;
    const targetKey = `${targetNode}-${targetHandle}--${sourceNode}-${sourceHandle}`;
    addConnectionToLookup("source", connection, targetKey, connectionLookup, sourceNode, sourceHandle);
    addConnectionToLookup("target", connection, sourceKey, connectionLookup, targetNode, targetHandle);
    edgeLookup.set(edge.id, edge);
  }
}
function isParentSelected(node, nodeLookup) {
  if (!node.parentId) {
    return false;
  }
  const parentNode = nodeLookup.get(node.parentId);
  if (!parentNode) {
    return false;
  }
  if (parentNode.selected) {
    return true;
  }
  return isParentSelected(parentNode, nodeLookup);
}
function hasSelector(target, selector, domNode) {
  let current = target;
  do {
    if (current?.matches?.(selector))
      return true;
    if (current === domNode)
      return false;
    current = current?.parentElement;
  } while (current);
  return false;
}
function getDragItems(nodeLookup, nodesDraggable, mousePos, nodeId) {
  const dragItems = new Map;
  for (const [id2, node] of nodeLookup) {
    if ((node.selected || node.id === nodeId) && (!node.parentId || !isParentSelected(node, nodeLookup)) && (node.draggable || nodesDraggable && typeof node.draggable === "undefined")) {
      const internalNode = nodeLookup.get(id2);
      if (internalNode) {
        dragItems.set(id2, {
          id: id2,
          position: internalNode.position || { x: 0, y: 0 },
          distance: {
            x: mousePos.x - internalNode.internals.positionAbsolute.x,
            y: mousePos.y - internalNode.internals.positionAbsolute.y
          },
          extent: internalNode.extent,
          parentId: internalNode.parentId,
          origin: internalNode.origin,
          expandParent: internalNode.expandParent,
          internals: {
            positionAbsolute: internalNode.internals.positionAbsolute || { x: 0, y: 0 }
          },
          measured: {
            width: internalNode.measured.width ?? 0,
            height: internalNode.measured.height ?? 0
          }
        });
      }
    }
  }
  return dragItems;
}
function getEventHandlerParams({ nodeId, dragItems, nodeLookup, dragging = true }) {
  const nodesFromDragItems = [];
  for (const [id2, dragItem] of dragItems) {
    const node2 = nodeLookup.get(id2)?.internals.userNode;
    if (node2) {
      nodesFromDragItems.push({
        ...node2,
        position: dragItem.position,
        dragging
      });
    }
  }
  if (!nodeId) {
    return [nodesFromDragItems[0], nodesFromDragItems];
  }
  const node = nodeLookup.get(nodeId)?.internals.userNode;
  return [
    !node ? nodesFromDragItems[0] : {
      ...node,
      position: dragItems.get(nodeId)?.position || node.position,
      dragging
    },
    nodesFromDragItems
  ];
}
function calculateSnapOffset({ dragItems, snapGrid, x, y }) {
  const refDragItem = dragItems.values().next().value;
  if (!refDragItem) {
    return null;
  }
  const refPos = {
    x: x - refDragItem.distance.x,
    y: y - refDragItem.distance.y
  };
  const refPosSnapped = snapPosition(refPos, snapGrid);
  return {
    x: refPosSnapped.x - refPos.x,
    y: refPosSnapped.y - refPos.y
  };
}
function XYDrag({ onNodeMouseDown, getStoreItems, onDragStart, onDrag, onDragStop }) {
  let lastPos = { x: null, y: null };
  let autoPanId = 0;
  let dragItems = new Map;
  let autoPanStarted = false;
  let mousePosition = { x: 0, y: 0 };
  let containerBounds = null;
  let dragStarted = false;
  let d3Selection = null;
  let abortDrag = false;
  let nodePositionsChanged = false;
  let dragEvent = null;
  function update({ noDragClassName, handleSelector, domNode, isSelectable, nodeId, nodeClickDistance = 0 }) {
    d3Selection = select_default2(domNode);
    function updateNodes({ x, y }) {
      const { nodeLookup, nodeExtent, snapGrid, snapToGrid, nodeOrigin, onNodeDrag, onSelectionDrag, onError, updateNodePositions } = getStoreItems();
      lastPos = { x, y };
      let hasChange = false;
      const isMultiDrag = dragItems.size > 1;
      const nodesBox = isMultiDrag && nodeExtent ? rectToBox(getInternalNodesBounds(dragItems)) : null;
      const multiDragSnapOffset = isMultiDrag && snapToGrid ? calculateSnapOffset({
        dragItems,
        snapGrid,
        x,
        y
      }) : null;
      for (const [id2, dragItem] of dragItems) {
        if (!nodeLookup.has(id2)) {
          continue;
        }
        let nextPosition = { x: x - dragItem.distance.x, y: y - dragItem.distance.y };
        if (snapToGrid) {
          nextPosition = multiDragSnapOffset ? {
            x: Math.round(nextPosition.x + multiDragSnapOffset.x),
            y: Math.round(nextPosition.y + multiDragSnapOffset.y)
          } : snapPosition(nextPosition, snapGrid);
        }
        let adjustedNodeExtent = null;
        if (isMultiDrag && nodeExtent && !dragItem.extent && nodesBox) {
          const { positionAbsolute: positionAbsolute2 } = dragItem.internals;
          const x1 = positionAbsolute2.x - nodesBox.x + nodeExtent[0][0];
          const x2 = positionAbsolute2.x + dragItem.measured.width - nodesBox.x2 + nodeExtent[1][0];
          const y1 = positionAbsolute2.y - nodesBox.y + nodeExtent[0][1];
          const y2 = positionAbsolute2.y + dragItem.measured.height - nodesBox.y2 + nodeExtent[1][1];
          adjustedNodeExtent = [
            [x1, y1],
            [x2, y2]
          ];
        }
        const { position, positionAbsolute } = calculateNodePosition({
          nodeId: id2,
          nextPosition,
          nodeLookup,
          nodeExtent: adjustedNodeExtent ? adjustedNodeExtent : nodeExtent,
          nodeOrigin,
          onError
        });
        hasChange = hasChange || dragItem.position.x !== position.x || dragItem.position.y !== position.y;
        dragItem.position = position;
        dragItem.internals.positionAbsolute = positionAbsolute;
      }
      nodePositionsChanged = nodePositionsChanged || hasChange;
      if (!hasChange) {
        return;
      }
      updateNodePositions(dragItems, true);
      if (dragEvent && (onDrag || onNodeDrag || !nodeId && onSelectionDrag)) {
        const [currentNode, currentNodes] = getEventHandlerParams({
          nodeId,
          dragItems,
          nodeLookup
        });
        onDrag?.(dragEvent, dragItems, currentNode, currentNodes);
        onNodeDrag?.(dragEvent, currentNode, currentNodes);
        if (!nodeId) {
          onSelectionDrag?.(dragEvent, currentNodes);
        }
      }
    }
    async function autoPan() {
      if (!containerBounds) {
        return;
      }
      const { transform: transform2, panBy: panBy2, autoPanSpeed, autoPanOnNodeDrag } = getStoreItems();
      if (!autoPanOnNodeDrag) {
        autoPanStarted = false;
        cancelAnimationFrame(autoPanId);
        return;
      }
      const [xMovement, yMovement] = calcAutoPan(mousePosition, containerBounds, autoPanSpeed);
      if (xMovement !== 0 || yMovement !== 0) {
        lastPos.x = (lastPos.x ?? 0) - xMovement / transform2[2];
        lastPos.y = (lastPos.y ?? 0) - yMovement / transform2[2];
        if (await panBy2({ x: xMovement, y: yMovement })) {
          updateNodes(lastPos);
        }
      }
      autoPanId = requestAnimationFrame(autoPan);
    }
    function startDrag(event) {
      const { nodeLookup, multiSelectionActive, nodesDraggable, transform: transform2, snapGrid, snapToGrid, selectNodesOnDrag, onNodeDragStart, onSelectionDragStart, unselectNodesAndEdges } = getStoreItems();
      dragStarted = true;
      if ((!selectNodesOnDrag || !isSelectable) && !multiSelectionActive && nodeId) {
        if (!nodeLookup.get(nodeId)?.selected) {
          unselectNodesAndEdges();
        }
      }
      if (isSelectable && selectNodesOnDrag && nodeId) {
        onNodeMouseDown?.(nodeId);
      }
      const pointerPos = getPointerPosition(event.sourceEvent, { transform: transform2, snapGrid, snapToGrid, containerBounds });
      lastPos = pointerPos;
      dragItems = getDragItems(nodeLookup, nodesDraggable, pointerPos, nodeId);
      if (dragItems.size > 0 && (onDragStart || onNodeDragStart || !nodeId && onSelectionDragStart)) {
        const [currentNode, currentNodes] = getEventHandlerParams({
          nodeId,
          dragItems,
          nodeLookup
        });
        onDragStart?.(event.sourceEvent, dragItems, currentNode, currentNodes);
        onNodeDragStart?.(event.sourceEvent, currentNode, currentNodes);
        if (!nodeId) {
          onSelectionDragStart?.(event.sourceEvent, currentNodes);
        }
      }
    }
    const d3DragInstance = drag_default().clickDistance(nodeClickDistance).on("start", (event) => {
      const { domNode: domNode2, nodeDragThreshold, transform: transform2, snapGrid, snapToGrid } = getStoreItems();
      containerBounds = domNode2?.getBoundingClientRect() || null;
      abortDrag = false;
      nodePositionsChanged = false;
      dragEvent = event.sourceEvent;
      if (nodeDragThreshold === 0) {
        startDrag(event);
      }
      const pointerPos = getPointerPosition(event.sourceEvent, { transform: transform2, snapGrid, snapToGrid, containerBounds });
      lastPos = pointerPos;
      mousePosition = getEventPosition(event.sourceEvent, containerBounds);
    }).on("drag", (event) => {
      const { autoPanOnNodeDrag, transform: transform2, snapGrid, snapToGrid, nodeDragThreshold, nodeLookup } = getStoreItems();
      const pointerPos = getPointerPosition(event.sourceEvent, { transform: transform2, snapGrid, snapToGrid, containerBounds });
      dragEvent = event.sourceEvent;
      if (event.sourceEvent.type === "touchmove" && event.sourceEvent.touches.length > 1 || nodeId && !nodeLookup.has(nodeId)) {
        abortDrag = true;
      }
      if (abortDrag) {
        return;
      }
      if (!autoPanStarted && autoPanOnNodeDrag && dragStarted) {
        autoPanStarted = true;
        autoPan();
      }
      if (!dragStarted) {
        const currentMousePosition = getEventPosition(event.sourceEvent, containerBounds);
        const x = currentMousePosition.x - mousePosition.x;
        const y = currentMousePosition.y - mousePosition.y;
        const distance2 = Math.sqrt(x * x + y * y);
        if (distance2 > nodeDragThreshold) {
          startDrag(event);
        }
      }
      if ((lastPos.x !== pointerPos.xSnapped || lastPos.y !== pointerPos.ySnapped) && dragItems && dragStarted) {
        mousePosition = getEventPosition(event.sourceEvent, containerBounds);
        updateNodes(pointerPos);
      }
    }).on("end", (event) => {
      if (!dragStarted || abortDrag) {
        if (abortDrag && dragItems.size > 0) {
          getStoreItems().updateNodePositions(dragItems, false);
        }
        return;
      }
      autoPanStarted = false;
      dragStarted = false;
      cancelAnimationFrame(autoPanId);
      if (dragItems.size > 0) {
        const { nodeLookup, updateNodePositions, onNodeDragStop, onSelectionDragStop } = getStoreItems();
        if (nodePositionsChanged) {
          updateNodePositions(dragItems, false);
          nodePositionsChanged = false;
        }
        if (onDragStop || onNodeDragStop || !nodeId && onSelectionDragStop) {
          const [currentNode, currentNodes] = getEventHandlerParams({
            nodeId,
            dragItems,
            nodeLookup,
            dragging: false
          });
          onDragStop?.(event.sourceEvent, dragItems, currentNode, currentNodes);
          onNodeDragStop?.(event.sourceEvent, currentNode, currentNodes);
          if (!nodeId) {
            onSelectionDragStop?.(event.sourceEvent, currentNodes);
          }
        }
      }
    }).filter((event) => {
      const target = event.target;
      const isDraggable = !event.button && (!noDragClassName || !hasSelector(target, `.${noDragClassName}`, domNode)) && (!handleSelector || hasSelector(target, handleSelector, domNode));
      return isDraggable;
    });
    d3Selection.call(d3DragInstance);
  }
  function destroy() {
    d3Selection?.on(".drag", null);
  }
  return {
    update,
    destroy
  };
}
function getNodesWithinDistance(position, nodeLookup, distance2) {
  const nodes = [];
  const rect = {
    x: position.x - distance2,
    y: position.y - distance2,
    width: distance2 * 2,
    height: distance2 * 2
  };
  for (const node of nodeLookup.values()) {
    if (getOverlappingArea(rect, nodeToRect(node)) > 0) {
      nodes.push(node);
    }
  }
  return nodes;
}
var ADDITIONAL_DISTANCE = 250;
function getClosestHandle(position, connectionRadius, nodeLookup, fromHandle) {
  let closestHandles = [];
  let minDistance = Infinity;
  const closeNodes = getNodesWithinDistance(position, nodeLookup, connectionRadius + ADDITIONAL_DISTANCE);
  for (const node of closeNodes) {
    const allHandles = [...node.internals.handleBounds?.source ?? [], ...node.internals.handleBounds?.target ?? []];
    for (const handle of allHandles) {
      if (fromHandle.nodeId === handle.nodeId && fromHandle.type === handle.type && fromHandle.id === handle.id) {
        continue;
      }
      const { x, y } = getHandlePosition(node, handle, handle.position, true);
      const distance2 = Math.sqrt(Math.pow(x - position.x, 2) + Math.pow(y - position.y, 2));
      if (distance2 > connectionRadius) {
        continue;
      }
      if (distance2 < minDistance) {
        closestHandles = [{ ...handle, x, y }];
        minDistance = distance2;
      } else if (distance2 === minDistance) {
        closestHandles.push({ ...handle, x, y });
      }
    }
  }
  if (!closestHandles.length) {
    return null;
  }
  if (closestHandles.length > 1) {
    const oppositeHandleType = fromHandle.type === "source" ? "target" : "source";
    return closestHandles.find((handle) => handle.type === oppositeHandleType) ?? closestHandles[0];
  }
  return closestHandles[0];
}
function getHandle(nodeId, handleType, handleId, nodeLookup, connectionMode, withAbsolutePosition = false) {
  const node = nodeLookup.get(nodeId);
  if (!node) {
    return null;
  }
  const handles = connectionMode === "strict" ? node.internals.handleBounds?.[handleType] : [...node.internals.handleBounds?.source ?? [], ...node.internals.handleBounds?.target ?? []];
  const handle = (handleId ? handles?.find((h) => h.id === handleId) : handles?.[0]) ?? null;
  return handle && withAbsolutePosition ? { ...handle, ...getHandlePosition(node, handle, handle.position, true) } : handle;
}
function getHandleType(edgeUpdaterType, handleDomNode) {
  if (edgeUpdaterType) {
    return edgeUpdaterType;
  } else if (handleDomNode?.classList.contains("target")) {
    return "target";
  } else if (handleDomNode?.classList.contains("source")) {
    return "source";
  }
  return null;
}
function isConnectionValid(isInsideConnectionRadius, isHandleValid) {
  let isValid = null;
  if (isHandleValid) {
    isValid = true;
  } else if (isInsideConnectionRadius && !isHandleValid) {
    isValid = false;
  }
  return isValid;
}
var alwaysValid = () => true;
function onPointerDown(event, { connectionMode, connectionRadius, handleId, nodeId, edgeUpdaterType, isTarget, domNode, nodeLookup, lib, autoPanOnConnect, flowId, panBy: panBy2, cancelConnection, onConnectStart, onConnect, onConnectEnd, isValidConnection = alwaysValid, onReconnectEnd, updateConnection, getTransform, getFromHandle, autoPanSpeed, dragThreshold = 1, handleDomNode }) {
  const doc = getHostForElement(event.target);
  let autoPanId = 0;
  let closestHandle;
  const { x, y } = getEventPosition(event);
  const handleType = getHandleType(edgeUpdaterType, handleDomNode);
  const containerBounds = domNode?.getBoundingClientRect();
  let connectionStarted = false;
  if (!containerBounds || !handleType) {
    return;
  }
  const fromHandleInternal = getHandle(nodeId, handleType, handleId, nodeLookup, connectionMode);
  if (!fromHandleInternal) {
    return;
  }
  let position = getEventPosition(event, containerBounds);
  let autoPanStarted = false;
  let connection = null;
  let isValid = false;
  let resultHandleDomNode = null;
  function autoPan() {
    if (!autoPanOnConnect || !containerBounds) {
      return;
    }
    const [x2, y2] = calcAutoPan(position, containerBounds, autoPanSpeed);
    panBy2({ x: x2, y: y2 });
    autoPanId = requestAnimationFrame(autoPan);
  }
  const fromHandle = {
    ...fromHandleInternal,
    nodeId,
    type: handleType,
    position: fromHandleInternal.position
  };
  const fromInternalNode = nodeLookup.get(nodeId);
  const from = getHandlePosition(fromInternalNode, fromHandle, Position.Left, true);
  let previousConnection = {
    inProgress: true,
    isValid: null,
    from,
    fromHandle,
    fromPosition: fromHandle.position,
    fromNode: fromInternalNode,
    to: position,
    toHandle: null,
    toPosition: oppositePosition[fromHandle.position],
    toNode: null,
    pointer: position
  };
  function startConnection() {
    connectionStarted = true;
    updateConnection(previousConnection);
    onConnectStart?.(event, { nodeId, handleId, handleType });
  }
  if (dragThreshold === 0) {
    startConnection();
  }
  function onPointerMove(event2) {
    if (!connectionStarted) {
      const { x: evtX, y: evtY } = getEventPosition(event2);
      const dx = evtX - x;
      const dy = evtY - y;
      const nextConnectionStarted = dx * dx + dy * dy > dragThreshold * dragThreshold;
      if (!nextConnectionStarted) {
        return;
      }
      startConnection();
    }
    if (!getFromHandle() || !fromHandle) {
      onPointerUp(event2);
      return;
    }
    const transform2 = getTransform();
    position = getEventPosition(event2, containerBounds);
    closestHandle = getClosestHandle(pointToRendererPoint(position, transform2, false, [1, 1]), connectionRadius, nodeLookup, fromHandle);
    if (!autoPanStarted) {
      autoPan();
      autoPanStarted = true;
    }
    const result = isValidHandle(event2, {
      handle: closestHandle,
      connectionMode,
      fromNodeId: nodeId,
      fromHandleId: handleId,
      fromType: isTarget ? "target" : "source",
      isValidConnection,
      doc,
      lib,
      flowId,
      nodeLookup
    });
    resultHandleDomNode = result.handleDomNode;
    connection = result.connection;
    isValid = isConnectionValid(!!closestHandle, result.isValid);
    const fromInternalNode2 = nodeLookup.get(nodeId);
    const from2 = fromInternalNode2 ? getHandlePosition(fromInternalNode2, fromHandle, Position.Left, true) : previousConnection.from;
    const newConnection = {
      ...previousConnection,
      from: from2,
      isValid,
      to: result.toHandle && isValid ? rendererPointToPoint({ x: result.toHandle.x, y: result.toHandle.y }, transform2) : position,
      toHandle: result.toHandle,
      toPosition: isValid && result.toHandle ? result.toHandle.position : oppositePosition[fromHandle.position],
      toNode: result.toHandle ? nodeLookup.get(result.toHandle.nodeId) : null,
      pointer: position
    };
    updateConnection(newConnection);
    previousConnection = newConnection;
  }
  function onPointerUp(event2) {
    if ("touches" in event2 && event2.touches.length > 0) {
      return;
    }
    if (connectionStarted) {
      if ((closestHandle || resultHandleDomNode) && connection && isValid) {
        onConnect?.(connection);
      }
      const { inProgress, ...connectionState } = previousConnection;
      const finalConnectionState = {
        ...connectionState,
        toPosition: previousConnection.toHandle ? previousConnection.toPosition : null
      };
      onConnectEnd?.(event2, finalConnectionState);
      if (edgeUpdaterType) {
        onReconnectEnd?.(event2, finalConnectionState);
      }
    }
    cancelConnection();
    cancelAnimationFrame(autoPanId);
    autoPanStarted = false;
    isValid = false;
    connection = null;
    resultHandleDomNode = null;
    doc.removeEventListener("mousemove", onPointerMove);
    doc.removeEventListener("mouseup", onPointerUp);
    doc.removeEventListener("touchmove", onPointerMove);
    doc.removeEventListener("touchend", onPointerUp);
  }
  doc.addEventListener("mousemove", onPointerMove);
  doc.addEventListener("mouseup", onPointerUp);
  doc.addEventListener("touchmove", onPointerMove);
  doc.addEventListener("touchend", onPointerUp);
}
function isValidHandle(event, { handle, connectionMode, fromNodeId, fromHandleId, fromType, doc, lib, flowId, isValidConnection = alwaysValid, nodeLookup }) {
  const isTarget = fromType === "target";
  const handleDomNode = handle ? doc.querySelector(`.${lib}-flow__handle[data-id="${flowId}-${handle?.nodeId}-${handle?.id}-${handle?.type}"]`) : null;
  const { x, y } = getEventPosition(event);
  const handleBelow = doc.elementFromPoint(x, y);
  const handleToCheck = handleBelow?.classList.contains(`${lib}-flow__handle`) ? handleBelow : handleDomNode;
  const result = {
    handleDomNode: handleToCheck,
    isValid: false,
    connection: null,
    toHandle: null
  };
  if (handleToCheck) {
    const handleType = getHandleType(undefined, handleToCheck);
    const handleNodeId = handleToCheck.getAttribute("data-nodeid");
    const handleId = handleToCheck.getAttribute("data-handleid");
    const connectable = handleToCheck.classList.contains("connectable");
    const connectableEnd = handleToCheck.classList.contains("connectableend");
    if (!handleNodeId || !handleType) {
      return result;
    }
    const connection = {
      source: isTarget ? handleNodeId : fromNodeId,
      sourceHandle: isTarget ? handleId : fromHandleId,
      target: isTarget ? fromNodeId : handleNodeId,
      targetHandle: isTarget ? fromHandleId : handleId
    };
    result.connection = connection;
    const isConnectable = connectable && connectableEnd;
    const isValid = isConnectable && (connectionMode === ConnectionMode.Strict ? isTarget && handleType === "source" || !isTarget && handleType === "target" : handleNodeId !== fromNodeId || handleId !== fromHandleId);
    result.isValid = isValid && isValidConnection(connection);
    result.toHandle = getHandle(handleNodeId, handleType, handleId, nodeLookup, connectionMode, true);
  }
  return result;
}
var XYHandle = {
  onPointerDown,
  isValid: isValidHandle
};
function XYMinimap({ domNode, panZoom, getTransform, getViewScale }) {
  const selection2 = select_default2(domNode);
  function update({ translateExtent, width, height, zoomStep = 1, pannable = true, zoomable = true, inversePan = false }) {
    const zoomHandler = (event) => {
      if (event.sourceEvent.type !== "wheel" || !panZoom) {
        return;
      }
      const transform2 = getTransform();
      const factor = event.sourceEvent.ctrlKey && isMacOs() ? 10 : 1;
      const pinchDelta = -event.sourceEvent.deltaY * (event.sourceEvent.deltaMode === 1 ? 0.05 : event.sourceEvent.deltaMode ? 1 : 0.002) * zoomStep;
      const nextZoom = transform2[2] * Math.pow(2, pinchDelta * factor);
      panZoom.scaleTo(nextZoom);
    };
    let panStart = [0, 0];
    const panStartHandler = (event) => {
      if (event.sourceEvent.type === "mousedown" || event.sourceEvent.type === "touchstart") {
        panStart = [
          event.sourceEvent.clientX ?? event.sourceEvent.touches[0].clientX,
          event.sourceEvent.clientY ?? event.sourceEvent.touches[0].clientY
        ];
      }
    };
    const panHandler = (event) => {
      const transform2 = getTransform();
      if (event.sourceEvent.type !== "mousemove" && event.sourceEvent.type !== "touchmove" || !panZoom) {
        return;
      }
      const panCurrent = [
        event.sourceEvent.clientX ?? event.sourceEvent.touches[0].clientX,
        event.sourceEvent.clientY ?? event.sourceEvent.touches[0].clientY
      ];
      const panDelta = [panCurrent[0] - panStart[0], panCurrent[1] - panStart[1]];
      panStart = panCurrent;
      const moveScale = getViewScale() * Math.max(transform2[2], Math.log(transform2[2])) * (inversePan ? -1 : 1);
      const position = {
        x: transform2[0] - panDelta[0] * moveScale,
        y: transform2[1] - panDelta[1] * moveScale
      };
      const extent = [
        [0, 0],
        [width, height]
      ];
      panZoom.setViewportConstrained({
        x: position.x,
        y: position.y,
        zoom: transform2[2]
      }, extent, translateExtent);
    };
    const zoomAndPanHandler = zoom_default2().on("start", panStartHandler).on("zoom", pannable ? panHandler : null).on("zoom.wheel", zoomable ? zoomHandler : null);
    selection2.call(zoomAndPanHandler, {});
  }
  function destroy() {
    selection2.on("zoom", null);
  }
  return {
    update,
    destroy,
    pointer: pointer_default
  };
}
var transformToViewport = (transform2) => ({
  x: transform2.x,
  y: transform2.y,
  zoom: transform2.k
});
var viewportToTransform = ({ x, y, zoom }) => identity2.translate(x, y).scale(zoom);
var isWrappedWithClass = (event, className) => event.target.closest(`.${className}`);
var isRightClickPan = (panOnDrag, usedButton) => usedButton === 2 && Array.isArray(panOnDrag) && panOnDrag.includes(2);
var defaultEase = (t) => ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
var getD3Transition = (selection2, duration = 0, ease = defaultEase, onEnd = () => {}) => {
  const hasDuration = typeof duration === "number" && duration > 0;
  if (!hasDuration) {
    onEnd();
  }
  return hasDuration ? selection2.transition().duration(duration).ease(ease).on("end", onEnd) : selection2;
};
var wheelDelta = (event) => {
  const factor = event.ctrlKey && isMacOs() ? 10 : 1;
  return -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) * factor;
};
function createPanOnScrollHandler({ zoomPanValues, noWheelClassName, d3Selection, d3Zoom, panOnScrollMode, panOnScrollSpeed, zoomOnPinch, onPanZoomStart, onPanZoom, onPanZoomEnd }) {
  return (event) => {
    if (isWrappedWithClass(event, noWheelClassName)) {
      if (event.ctrlKey) {
        event.preventDefault();
      }
      return false;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    const currentZoom = d3Selection.property("__zoom").k || 1;
    if (event.ctrlKey && zoomOnPinch) {
      const point = pointer_default(event);
      const pinchDelta = wheelDelta(event);
      const zoom = currentZoom * Math.pow(2, pinchDelta);
      d3Zoom.scaleTo(d3Selection, zoom, point, event);
      return;
    }
    const deltaNormalize = event.deltaMode === 1 ? 20 : 1;
    let deltaX = panOnScrollMode === PanOnScrollMode.Vertical ? 0 : event.deltaX * deltaNormalize;
    let deltaY = panOnScrollMode === PanOnScrollMode.Horizontal ? 0 : event.deltaY * deltaNormalize;
    if (!isMacOs() && event.shiftKey && panOnScrollMode !== PanOnScrollMode.Vertical) {
      deltaX = event.deltaY * deltaNormalize;
      deltaY = 0;
    }
    d3Zoom.translateBy(d3Selection, -(deltaX / currentZoom) * panOnScrollSpeed, -(deltaY / currentZoom) * panOnScrollSpeed, { internal: true });
    const nextViewport = transformToViewport(d3Selection.property("__zoom"));
    clearTimeout(zoomPanValues.panScrollTimeout);
    if (!zoomPanValues.isPanScrolling) {
      zoomPanValues.isPanScrolling = true;
      onPanZoomStart?.(event, nextViewport);
    } else {
      onPanZoom?.(event, nextViewport);
    }
    zoomPanValues.panScrollTimeout = setTimeout(() => {
      onPanZoomEnd?.(event, nextViewport);
      zoomPanValues.isPanScrolling = false;
    }, 150);
  };
}
function createZoomOnScrollHandler({ noWheelClassName, preventScrolling, d3ZoomHandler }) {
  return function(event, d) {
    const isWheel = event.type === "wheel";
    const preventZoom = !preventScrolling && isWheel && !event.ctrlKey;
    const hasNoWheelClass = isWrappedWithClass(event, noWheelClassName);
    if (event.ctrlKey && isWheel && hasNoWheelClass) {
      event.preventDefault();
    }
    if (preventZoom || hasNoWheelClass) {
      return null;
    }
    event.preventDefault();
    d3ZoomHandler.call(this, event, d);
  };
}
function createPanZoomStartHandler({ zoomPanValues, onDraggingChange, onPanZoomStart }) {
  return (event) => {
    if (event.sourceEvent?.internal) {
      return;
    }
    const viewport = transformToViewport(event.transform);
    zoomPanValues.mouseButton = event.sourceEvent?.button || 0;
    zoomPanValues.isZoomingOrPanning = true;
    zoomPanValues.prevViewport = viewport;
    if (event.sourceEvent?.type === "mousedown") {
      onDraggingChange(true);
    }
    if (onPanZoomStart) {
      onPanZoomStart?.(event.sourceEvent, viewport);
    }
  };
}
function createPanZoomHandler({ zoomPanValues, panOnDrag, onPaneContextMenu, onTransformChange, onPanZoom }) {
  return (event) => {
    zoomPanValues.usedRightMouseButton = !!(onPaneContextMenu && isRightClickPan(panOnDrag, zoomPanValues.mouseButton ?? 0));
    if (!event.sourceEvent?.sync) {
      onTransformChange([event.transform.x, event.transform.y, event.transform.k]);
    }
    if (onPanZoom && !event.sourceEvent?.internal) {
      onPanZoom?.(event.sourceEvent, transformToViewport(event.transform));
    }
  };
}
function createPanZoomEndHandler({ zoomPanValues, panOnDrag, panOnScroll, onDraggingChange, onPanZoomEnd, onPaneContextMenu }) {
  return (event) => {
    if (event.sourceEvent?.internal) {
      return;
    }
    zoomPanValues.isZoomingOrPanning = false;
    if (onPaneContextMenu && isRightClickPan(panOnDrag, zoomPanValues.mouseButton ?? 0) && !zoomPanValues.usedRightMouseButton && event.sourceEvent) {
      onPaneContextMenu(event.sourceEvent);
    }
    zoomPanValues.usedRightMouseButton = false;
    onDraggingChange(false);
    if (onPanZoomEnd) {
      const viewport = transformToViewport(event.transform);
      zoomPanValues.prevViewport = viewport;
      clearTimeout(zoomPanValues.timerId);
      zoomPanValues.timerId = setTimeout(() => {
        onPanZoomEnd?.(event.sourceEvent, viewport);
      }, panOnScroll ? 150 : 0);
    }
  };
}
function createFilter({ panActivationKeyPressed, zoomActivationKeyPressed, zoomOnScroll, zoomOnPinch, panOnDrag, panOnScroll, zoomOnDoubleClick, userSelectionActive, noWheelClassName, noPanClassName, lib, connectionInProgress }) {
  return (event) => {
    const zoomScroll = zoomActivationKeyPressed || zoomOnScroll;
    const pinchZoom = zoomOnPinch && event.ctrlKey;
    const isWheelEvent = event.type === "wheel";
    if (event.button === 1 && event.type === "mousedown" && (isWrappedWithClass(event, `${lib}-flow__node`) || isWrappedWithClass(event, `${lib}-flow__edge`) || isWrappedWithClass(event, `${lib}-flow__selection`) || isWrappedWithClass(event, `${lib}-flow__nodesselection`))) {
      return true;
    }
    if (!panOnDrag && !zoomScroll && !panOnScroll && !zoomOnDoubleClick && !zoomOnPinch) {
      return false;
    }
    if (userSelectionActive) {
      return false;
    }
    if (connectionInProgress && !isWheelEvent) {
      return false;
    }
    if (isWrappedWithClass(event, noWheelClassName) && isWheelEvent) {
      return false;
    }
    if (isWrappedWithClass(event, noPanClassName) && (!isWheelEvent || panOnScroll && isWheelEvent && !zoomActivationKeyPressed)) {
      return false;
    }
    if (!zoomOnPinch && event.ctrlKey && isWheelEvent) {
      return false;
    }
    if (!zoomOnPinch && event.type === "touchstart" && event.touches?.length > 1) {
      event.preventDefault();
      return false;
    }
    if (!zoomScroll && !panOnScroll && !pinchZoom && isWheelEvent) {
      return false;
    }
    if (!panOnDrag && (event.type === "mousedown" || event.type === "touchstart")) {
      return false;
    }
    if (Array.isArray(panOnDrag) && !panOnDrag.includes(event.button) && event.type === "mousedown") {
      return false;
    }
    const buttonAllowed = Array.isArray(panOnDrag) && panOnDrag.includes(event.button) || !event.button || event.button <= 1;
    return (!event.ctrlKey || isWheelEvent || panActivationKeyPressed) && buttonAllowed;
  };
}
function XYPanZoom({ domNode, minZoom, maxZoom, translateExtent, viewport, onPanZoom, onPanZoomStart, onPanZoomEnd, onDraggingChange }) {
  const zoomPanValues = {
    isZoomingOrPanning: false,
    usedRightMouseButton: false,
    prevViewport: {},
    mouseButton: 0,
    timerId: undefined,
    panScrollTimeout: undefined,
    isPanScrolling: false
  };
  const bbox = domNode.getBoundingClientRect();
  let cachedExtent = [
    [0, 0],
    [bbox.width, bbox.height]
  ];
  const extentResizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver((entries) => {
    const entry = entries[0];
    if (entry) {
      cachedExtent = [
        [0, 0],
        [entry.contentRect.width, entry.contentRect.height]
      ];
    }
  }) : null;
  extentResizeObserver?.observe(domNode);
  const d3ZoomInstance = zoom_default2().extent(() => cachedExtent).scaleExtent([minZoom, maxZoom]).translateExtent(translateExtent);
  const d3Selection = select_default2(domNode).call(d3ZoomInstance);
  setViewportConstrained({
    x: viewport.x,
    y: viewport.y,
    zoom: clamp(viewport.zoom, minZoom, maxZoom)
  }, [
    [0, 0],
    [bbox.width, bbox.height]
  ], translateExtent);
  const d3ZoomHandler = d3Selection.on("wheel.zoom");
  const d3DblClickZoomHandler = d3Selection.on("dblclick.zoom");
  d3ZoomInstance.wheelDelta(wheelDelta);
  async function setTransform(transform2, options) {
    if (d3Selection) {
      return new Promise((resolve) => {
        d3ZoomInstance?.interpolate(options?.interpolate === "linear" ? value_default : zoom_default).transform(getD3Transition(d3Selection, options?.duration, options?.ease, () => resolve(true)), transform2);
      });
    }
    return false;
  }
  function update({ noWheelClassName, noPanClassName, onPaneContextMenu, userSelectionActive, panOnScroll, panOnDrag, panOnScrollMode, panOnScrollSpeed, preventScrolling, zoomOnPinch, zoomOnScroll, zoomOnDoubleClick, panActivationKeyPressed = false, zoomActivationKeyPressed, lib, onTransformChange, connectionInProgress, paneClickDistance, selectionOnDrag }) {
    if (userSelectionActive && !zoomPanValues.isZoomingOrPanning) {
      destroy();
    }
    const isPanOnScroll = panOnScroll && !zoomActivationKeyPressed && !userSelectionActive;
    d3ZoomInstance.clickDistance(selectionOnDrag ? Infinity : !isNumeric(paneClickDistance) || paneClickDistance < 0 ? 0 : paneClickDistance);
    const wheelHandler = isPanOnScroll ? createPanOnScrollHandler({
      zoomPanValues,
      noWheelClassName,
      d3Selection,
      d3Zoom: d3ZoomInstance,
      panOnScrollMode,
      panOnScrollSpeed,
      zoomOnPinch,
      onPanZoomStart,
      onPanZoom,
      onPanZoomEnd
    }) : createZoomOnScrollHandler({
      noWheelClassName,
      preventScrolling,
      d3ZoomHandler
    });
    d3Selection.on("wheel.zoom", wheelHandler, { passive: false });
    const startHandler = createPanZoomStartHandler({
      zoomPanValues,
      onDraggingChange,
      onPanZoomStart
    });
    d3ZoomInstance.on("start", startHandler);
    const panZoomHandler = createPanZoomHandler({
      zoomPanValues,
      panOnDrag,
      onPaneContextMenu: !!onPaneContextMenu,
      onPanZoom,
      onTransformChange
    });
    d3ZoomInstance.on("zoom", panZoomHandler);
    const panZoomEndHandler = createPanZoomEndHandler({
      zoomPanValues,
      panOnDrag,
      panOnScroll,
      onPaneContextMenu,
      onPanZoomEnd,
      onDraggingChange
    });
    d3ZoomInstance.on("end", panZoomEndHandler);
    const filter2 = createFilter({
      panActivationKeyPressed,
      zoomActivationKeyPressed,
      panOnDrag,
      zoomOnScroll,
      panOnScroll,
      zoomOnDoubleClick,
      zoomOnPinch,
      userSelectionActive,
      noPanClassName,
      noWheelClassName,
      lib,
      connectionInProgress
    });
    d3ZoomInstance.filter(filter2);
    if (zoomOnDoubleClick) {
      d3Selection.on("dblclick.zoom", d3DblClickZoomHandler);
    } else {
      d3Selection.on("dblclick.zoom", null);
    }
  }
  function destroy() {
    d3ZoomInstance.on("zoom", null);
  }
  async function setViewportConstrained(viewport2, extent, translateExtent2) {
    const nextTransform = viewportToTransform(viewport2);
    const contrainedTransform = d3ZoomInstance?.constrain()(nextTransform, extent, translateExtent2);
    if (contrainedTransform) {
      await setTransform(contrainedTransform);
    }
    return contrainedTransform;
  }
  async function setViewport(viewport2, options) {
    const nextTransform = viewportToTransform(viewport2);
    await setTransform(nextTransform, options);
    return nextTransform;
  }
  function syncViewport(viewport2) {
    if (d3Selection) {
      const nextTransform = viewportToTransform(viewport2);
      const currentTransform = d3Selection.property("__zoom");
      if (currentTransform.k !== viewport2.zoom || currentTransform.x !== viewport2.x || currentTransform.y !== viewport2.y) {
        d3ZoomInstance?.transform(d3Selection, nextTransform, null, { sync: true });
      }
    }
  }
  function getViewport() {
    const transform2 = d3Selection ? transform(d3Selection.node()) : { x: 0, y: 0, k: 1 };
    return { x: transform2.x, y: transform2.y, zoom: transform2.k };
  }
  async function scaleTo(zoom, options) {
    if (d3Selection) {
      return new Promise((resolve) => {
        d3ZoomInstance?.interpolate(options?.interpolate === "linear" ? value_default : zoom_default).scaleTo(getD3Transition(d3Selection, options?.duration, options?.ease, () => resolve(true)), zoom);
      });
    }
    return false;
  }
  async function scaleBy(factor, options) {
    if (d3Selection) {
      return new Promise((resolve) => {
        d3ZoomInstance?.interpolate(options?.interpolate === "linear" ? value_default : zoom_default).scaleBy(getD3Transition(d3Selection, options?.duration, options?.ease, () => resolve(true)), factor);
      });
    }
    return false;
  }
  function setScaleExtent(scaleExtent) {
    d3ZoomInstance?.scaleExtent(scaleExtent);
  }
  function setTranslateExtent(translateExtent2) {
    d3ZoomInstance?.translateExtent(translateExtent2);
  }
  function setClickDistance(distance2) {
    const validDistance = !isNumeric(distance2) || distance2 < 0 ? 0 : distance2;
    d3ZoomInstance?.clickDistance(validDistance);
  }
  return {
    update,
    destroy,
    setViewport,
    setViewportConstrained,
    getViewport,
    scaleTo,
    scaleBy,
    setScaleExtent,
    setTranslateExtent,
    syncViewport,
    setClickDistance
  };
}
var ResizeControlVariant;
(function(ResizeControlVariant2) {
  ResizeControlVariant2["Line"] = "line";
  ResizeControlVariant2["Handle"] = "handle";
})(ResizeControlVariant || (ResizeControlVariant = {}));
function getResizeDirection({ width, prevWidth, height, prevHeight, affectsX, affectsY }) {
  const deltaWidth = width - prevWidth;
  const deltaHeight = height - prevHeight;
  const direction = [deltaWidth > 0 ? 1 : deltaWidth < 0 ? -1 : 0, deltaHeight > 0 ? 1 : deltaHeight < 0 ? -1 : 0];
  if (deltaWidth && affectsX) {
    direction[0] = direction[0] * -1;
  }
  if (deltaHeight && affectsY) {
    direction[1] = direction[1] * -1;
  }
  return direction;
}
function getControlDirection(controlPosition) {
  const isHorizontal = controlPosition.includes("right") || controlPosition.includes("left");
  const isVertical = controlPosition.includes("bottom") || controlPosition.includes("top");
  const affectsX = controlPosition.includes("left");
  const affectsY = controlPosition.includes("top");
  return {
    isHorizontal,
    isVertical,
    affectsX,
    affectsY
  };
}
function getLowerExtentClamp(lowerExtent, lowerBound) {
  return Math.max(0, lowerBound - lowerExtent);
}
function getUpperExtentClamp(upperExtent, upperBound) {
  return Math.max(0, upperExtent - upperBound);
}
function getSizeClamp(size, minSize, maxSize) {
  return Math.max(0, minSize - size, size - maxSize);
}
function xor(a, b) {
  return a ? !b : b;
}
function getDimensionsAfterResize(startValues, controlDirection, pointerPosition, boundaries, keepAspectRatio, nodeOrigin, extent, childExtent) {
  let { affectsX, affectsY } = controlDirection;
  const { isHorizontal, isVertical } = controlDirection;
  const isDiagonal = isHorizontal && isVertical;
  const { xSnapped, ySnapped } = pointerPosition;
  const { minWidth, maxWidth, minHeight, maxHeight } = boundaries;
  const { x: startX, y: startY, width: startWidth, height: startHeight, aspectRatio } = startValues;
  let distX = Math.floor(isHorizontal ? xSnapped - startValues.pointerX : 0);
  let distY = Math.floor(isVertical ? ySnapped - startValues.pointerY : 0);
  const newWidth = startWidth + (affectsX ? -distX : distX);
  const newHeight = startHeight + (affectsY ? -distY : distY);
  const originOffsetX = -nodeOrigin[0] * startWidth;
  const originOffsetY = -nodeOrigin[1] * startHeight;
  let clampX = getSizeClamp(newWidth, minWidth, maxWidth);
  let clampY = getSizeClamp(newHeight, minHeight, maxHeight);
  if (extent) {
    let xExtentClamp = 0;
    let yExtentClamp = 0;
    if (affectsX && distX < 0) {
      xExtentClamp = getLowerExtentClamp(startX + distX + originOffsetX, extent[0][0]);
    } else if (!affectsX && distX > 0) {
      xExtentClamp = getUpperExtentClamp(startX + newWidth + originOffsetX, extent[1][0]);
    }
    if (affectsY && distY < 0) {
      yExtentClamp = getLowerExtentClamp(startY + distY + originOffsetY, extent[0][1]);
    } else if (!affectsY && distY > 0) {
      yExtentClamp = getUpperExtentClamp(startY + newHeight + originOffsetY, extent[1][1]);
    }
    clampX = Math.max(clampX, xExtentClamp);
    clampY = Math.max(clampY, yExtentClamp);
  }
  if (childExtent) {
    let xExtentClamp = 0;
    let yExtentClamp = 0;
    if (affectsX && distX > 0) {
      xExtentClamp = getUpperExtentClamp(startX + distX, childExtent[0][0]);
    } else if (!affectsX && distX < 0) {
      xExtentClamp = getLowerExtentClamp(startX + newWidth, childExtent[1][0]);
    }
    if (affectsY && distY > 0) {
      yExtentClamp = getUpperExtentClamp(startY + distY, childExtent[0][1]);
    } else if (!affectsY && distY < 0) {
      yExtentClamp = getLowerExtentClamp(startY + newHeight, childExtent[1][1]);
    }
    clampX = Math.max(clampX, xExtentClamp);
    clampY = Math.max(clampY, yExtentClamp);
  }
  if (keepAspectRatio) {
    if (isHorizontal) {
      const aspectHeightClamp = getSizeClamp(newWidth / aspectRatio, minHeight, maxHeight) * aspectRatio;
      clampX = Math.max(clampX, aspectHeightClamp);
      if (extent) {
        let aspectExtentClamp = 0;
        if (!affectsX && !affectsY || affectsX && !affectsY && isDiagonal) {
          aspectExtentClamp = getUpperExtentClamp(startY + originOffsetY + newWidth / aspectRatio, extent[1][1]) * aspectRatio;
        } else {
          aspectExtentClamp = getLowerExtentClamp(startY + originOffsetY + (affectsX ? distX : -distX) / aspectRatio, extent[0][1]) * aspectRatio;
        }
        clampX = Math.max(clampX, aspectExtentClamp);
      }
      if (childExtent) {
        let aspectExtentClamp = 0;
        if (!affectsX && !affectsY || affectsX && !affectsY && isDiagonal) {
          aspectExtentClamp = getLowerExtentClamp(startY + newWidth / aspectRatio, childExtent[1][1]) * aspectRatio;
        } else {
          aspectExtentClamp = getUpperExtentClamp(startY + (affectsX ? distX : -distX) / aspectRatio, childExtent[0][1]) * aspectRatio;
        }
        clampX = Math.max(clampX, aspectExtentClamp);
      }
    }
    if (isVertical) {
      const aspectWidthClamp = getSizeClamp(newHeight * aspectRatio, minWidth, maxWidth) / aspectRatio;
      clampY = Math.max(clampY, aspectWidthClamp);
      if (extent) {
        let aspectExtentClamp = 0;
        if (!affectsX && !affectsY || affectsY && !affectsX && isDiagonal) {
          aspectExtentClamp = getUpperExtentClamp(startX + newHeight * aspectRatio + originOffsetX, extent[1][0]) / aspectRatio;
        } else {
          aspectExtentClamp = getLowerExtentClamp(startX + (affectsY ? distY : -distY) * aspectRatio + originOffsetX, extent[0][0]) / aspectRatio;
        }
        clampY = Math.max(clampY, aspectExtentClamp);
      }
      if (childExtent) {
        let aspectExtentClamp = 0;
        if (!affectsX && !affectsY || affectsY && !affectsX && isDiagonal) {
          aspectExtentClamp = getLowerExtentClamp(startX + newHeight * aspectRatio, childExtent[1][0]) / aspectRatio;
        } else {
          aspectExtentClamp = getUpperExtentClamp(startX + (affectsY ? distY : -distY) * aspectRatio, childExtent[0][0]) / aspectRatio;
        }
        clampY = Math.max(clampY, aspectExtentClamp);
      }
    }
  }
  distY = distY + (distY < 0 ? clampY : -clampY);
  distX = distX + (distX < 0 ? clampX : -clampX);
  if (keepAspectRatio) {
    if (isDiagonal) {
      if (newWidth > newHeight * aspectRatio) {
        distY = (xor(affectsX, affectsY) ? -distX : distX) / aspectRatio;
      } else {
        distX = (xor(affectsX, affectsY) ? -distY : distY) * aspectRatio;
      }
    } else {
      if (isHorizontal) {
        distY = distX / aspectRatio;
        affectsY = affectsX;
      } else {
        distX = distY * aspectRatio;
        affectsX = affectsY;
      }
    }
  }
  const x = affectsX ? startX + distX : startX;
  const y = affectsY ? startY + distY : startY;
  return {
    width: startWidth + (affectsX ? -distX : distX),
    height: startHeight + (affectsY ? -distY : distY),
    x: nodeOrigin[0] * distX * (!affectsX ? 1 : -1) + x,
    y: nodeOrigin[1] * distY * (!affectsY ? 1 : -1) + y
  };
}
var initPrevValues = { width: 0, height: 0, x: 0, y: 0 };
var initStartValues = {
  ...initPrevValues,
  pointerX: 0,
  pointerY: 0,
  aspectRatio: 1
};
function nodeToChildExtent(child, parent, nodeOrigin) {
  const x = parent.position.x + child.position.x;
  const y = parent.position.y + child.position.y;
  const width = child.measured.width ?? 0;
  const height = child.measured.height ?? 0;
  const originOffsetX = nodeOrigin[0] * width;
  const originOffsetY = nodeOrigin[1] * height;
  return [
    [x - originOffsetX, y - originOffsetY],
    [x + width - originOffsetX, y + height - originOffsetY]
  ];
}
function XYResizer({ domNode, nodeId, getStoreItems, onChange, onEnd }) {
  const selection2 = select_default2(domNode);
  let params = {
    controlDirection: getControlDirection("bottom-right"),
    boundaries: {
      minWidth: 0,
      minHeight: 0,
      maxWidth: Number.MAX_VALUE,
      maxHeight: Number.MAX_VALUE
    },
    resizeDirection: undefined,
    keepAspectRatio: false
  };
  function update({ controlPosition, boundaries, keepAspectRatio, resizeDirection, onResizeStart, onResize, onResizeEnd, shouldResize }) {
    let prevValues = { ...initPrevValues };
    let startValues = { ...initStartValues };
    params = {
      boundaries,
      resizeDirection,
      keepAspectRatio,
      controlDirection: getControlDirection(controlPosition)
    };
    let node = undefined;
    let containerBounds = null;
    let childNodes = [];
    let parentNode = undefined;
    let nodeExtent = undefined;
    let childExtent = undefined;
    let resizeDetected = false;
    const dragHandler = drag_default().on("start", (event) => {
      const { nodeLookup, transform: transform2, snapGrid, snapToGrid, nodeOrigin, paneDomNode } = getStoreItems();
      node = nodeLookup.get(nodeId);
      if (!node) {
        return;
      }
      containerBounds = paneDomNode?.getBoundingClientRect() ?? null;
      const { xSnapped, ySnapped } = getPointerPosition(event.sourceEvent, {
        transform: transform2,
        snapGrid,
        snapToGrid,
        containerBounds
      });
      prevValues = {
        width: node.measured.width ?? 0,
        height: node.measured.height ?? 0,
        x: node.position.x ?? 0,
        y: node.position.y ?? 0
      };
      startValues = {
        ...prevValues,
        pointerX: xSnapped,
        pointerY: ySnapped,
        aspectRatio: prevValues.width / prevValues.height
      };
      parentNode = undefined;
      nodeExtent = isCoordinateExtent(node.extent) ? node.extent : undefined;
      if (node.parentId && (node.extent === "parent" || node.expandParent)) {
        parentNode = nodeLookup.get(node.parentId);
      }
      if (parentNode && node.extent === "parent") {
        nodeExtent = [
          [0, 0],
          [parentNode.measured.width, parentNode.measured.height]
        ];
      }
      childNodes = [];
      childExtent = undefined;
      for (const [childId, child] of nodeLookup) {
        if (child.parentId === nodeId) {
          childNodes.push({
            id: childId,
            position: { ...child.position },
            extent: child.extent
          });
          if (child.extent === "parent" || child.expandParent) {
            const extent = nodeToChildExtent(child, node, child.origin ?? nodeOrigin);
            if (childExtent) {
              childExtent = [
                [Math.min(extent[0][0], childExtent[0][0]), Math.min(extent[0][1], childExtent[0][1])],
                [Math.max(extent[1][0], childExtent[1][0]), Math.max(extent[1][1], childExtent[1][1])]
              ];
            } else {
              childExtent = extent;
            }
          }
        }
      }
      onResizeStart?.(event, { ...prevValues });
    }).on("drag", (event) => {
      const { transform: transform2, snapGrid, snapToGrid, nodeOrigin: storeNodeOrigin } = getStoreItems();
      const pointerPosition = getPointerPosition(event.sourceEvent, {
        transform: transform2,
        snapGrid,
        snapToGrid,
        containerBounds
      });
      const childChanges = [];
      if (!node) {
        return;
      }
      const { x: prevX, y: prevY, width: prevWidth, height: prevHeight } = prevValues;
      const change = {};
      const nodeOrigin = node.origin ?? storeNodeOrigin;
      const { width, height, x, y } = getDimensionsAfterResize(startValues, params.controlDirection, pointerPosition, params.boundaries, params.keepAspectRatio, nodeOrigin, nodeExtent, childExtent);
      const isWidthChange = width !== prevWidth;
      const isHeightChange = height !== prevHeight;
      const isXPosChange = x !== prevX && isWidthChange;
      const isYPosChange = y !== prevY && isHeightChange;
      if (!isXPosChange && !isYPosChange && !isWidthChange && !isHeightChange) {
        return;
      }
      if (isXPosChange || isYPosChange || nodeOrigin[0] === 1 || nodeOrigin[1] === 1) {
        change.x = isXPosChange ? x : prevValues.x;
        change.y = isYPosChange ? y : prevValues.y;
        prevValues.x = change.x;
        prevValues.y = change.y;
        if (childNodes.length > 0) {
          const xChange = x - prevX;
          const yChange = y - prevY;
          for (const childNode of childNodes) {
            childNode.position = {
              x: childNode.position.x - xChange + nodeOrigin[0] * (width - prevWidth),
              y: childNode.position.y - yChange + nodeOrigin[1] * (height - prevHeight)
            };
            childChanges.push(childNode);
          }
        }
      }
      if (isWidthChange || isHeightChange) {
        change.width = isWidthChange && (!params.resizeDirection || params.resizeDirection === "horizontal") ? width : prevValues.width;
        change.height = isHeightChange && (!params.resizeDirection || params.resizeDirection === "vertical") ? height : prevValues.height;
        prevValues.width = change.width;
        prevValues.height = change.height;
      }
      if (parentNode && node.expandParent) {
        const xLimit = nodeOrigin[0] * (change.width ?? 0);
        if (change.x && change.x < xLimit) {
          prevValues.x = xLimit;
          startValues.x = startValues.x - (change.x - xLimit);
        }
        const yLimit = nodeOrigin[1] * (change.height ?? 0);
        if (change.y && change.y < yLimit) {
          prevValues.y = yLimit;
          startValues.y = startValues.y - (change.y - yLimit);
        }
      }
      const direction = getResizeDirection({
        width: prevValues.width,
        prevWidth,
        height: prevValues.height,
        prevHeight,
        affectsX: params.controlDirection.affectsX,
        affectsY: params.controlDirection.affectsY
      });
      const nextValues = { ...prevValues, direction };
      const callResize = shouldResize?.(event, nextValues);
      if (callResize === false) {
        return;
      }
      resizeDetected = true;
      onResize?.(event, nextValues);
      onChange(change, childChanges);
    }).on("end", (event) => {
      if (!resizeDetected) {
        return;
      }
      onResizeEnd?.(event, { ...prevValues });
      onEnd?.({ ...prevValues });
      resizeDetected = false;
    });
    selection2.call(dragHandler);
  }
  function destroy() {
    selection2.on(".drag", null);
  }
  return {
    update,
    destroy
  };
}
// ../node_modules/.bun/zustand@4.5.7+938b92ffa7d9e6d6/node_modules/zustand/esm/traditional.mjs
var import_with_selector = __toESM(require_with_selector(), 1);
import ReactExports from "react";

// ../node_modules/.bun/zustand@4.5.7+938b92ffa7d9e6d6/node_modules/zustand/esm/vanilla.mjs
var createStoreImpl = (createState) => {
  let state;
  const listeners2 = /* @__PURE__ */ new Set;
  const setState = (partial, replace) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      const previousState = state;
      state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
      listeners2.forEach((listener) => listener(state, previousState));
    }
  };
  const getState = () => state;
  const getInitialState = () => initialState;
  const subscribe2 = (listener) => {
    listeners2.add(listener);
    return () => listeners2.delete(listener);
  };
  const destroy = () => {
    if ((import.meta.env ? import.meta.env.MODE : undefined) !== "production") {
      console.warn("[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected.");
    }
    listeners2.clear();
  };
  const api = { setState, getState, getInitialState, subscribe: subscribe2, destroy };
  const initialState = state = createState(setState, getState, api);
  return api;
};
var createStore = (createState) => createState ? createStoreImpl(createState) : createStoreImpl;

// ../node_modules/.bun/zustand@4.5.7+938b92ffa7d9e6d6/node_modules/zustand/esm/traditional.mjs
var { useDebugValue } = ReactExports;
var { useSyncExternalStoreWithSelector } = import_with_selector.default;
var identity3 = (arg) => arg;
function useStoreWithEqualityFn(api, selector = identity3, equalityFn) {
  const slice = useSyncExternalStoreWithSelector(api.subscribe, api.getState, api.getServerState || api.getInitialState, selector, equalityFn);
  useDebugValue(slice);
  return slice;
}
var createWithEqualityFnImpl = (createState, defaultEqualityFn) => {
  const api = createStore(createState);
  const useBoundStoreWithEqualityFn = (selector, equalityFn = defaultEqualityFn) => useStoreWithEqualityFn(api, selector, equalityFn);
  Object.assign(useBoundStoreWithEqualityFn, api);
  return useBoundStoreWithEqualityFn;
};
var createWithEqualityFn = (createState, defaultEqualityFn) => createState ? createWithEqualityFnImpl(createState, defaultEqualityFn) : createWithEqualityFnImpl;

// ../node_modules/.bun/zustand@4.5.7+938b92ffa7d9e6d6/node_modules/zustand/esm/shallow.mjs
function shallow$1(objA, objB) {
  if (Object.is(objA, objB)) {
    return true;
  }
  if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
    return false;
  }
  if (objA instanceof Map && objB instanceof Map) {
    if (objA.size !== objB.size)
      return false;
    for (const [key, value] of objA) {
      if (!Object.is(value, objB.get(key))) {
        return false;
      }
    }
    return true;
  }
  if (objA instanceof Set && objB instanceof Set) {
    if (objA.size !== objB.size)
      return false;
    for (const value of objA) {
      if (!objB.has(value)) {
        return false;
      }
    }
    return true;
  }
  const keysA = Object.keys(objA);
  if (keysA.length !== Object.keys(objB).length) {
    return false;
  }
  for (const keyA of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, keyA) || !Object.is(objA[keyA], objB[keyA])) {
      return false;
    }
  }
  return true;
}

// ../node_modules/.bun/@xyflow+react@12.11.3+8468e999e7891f1b/node_modules/@xyflow/react/dist/esm/index.js
import { createPortal } from "react-dom";
"use client";
var StoreContext = createContext2(null);
var Provider$1 = StoreContext.Provider;
var zustandErrorMessage = errorMessages["error001"]("react");
function useStore(selector, equalityFn) {
  const store = useContext2(StoreContext);
  if (store === null) {
    throw new Error(zustandErrorMessage);
  }
  return useStoreWithEqualityFn(store, selector, equalityFn);
}
function useStoreApi() {
  const store = useContext2(StoreContext);
  if (store === null) {
    throw new Error(zustandErrorMessage);
  }
  return useMemo3(() => ({
    getState: store.getState,
    setState: store.setState,
    subscribe: store.subscribe
  }), [store]);
}
var style = { display: "none" };
var ariaLiveStyle = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  border: 0,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0px, 0px, 0px, 0px)",
  clipPath: "inset(100%)"
};
var ARIA_NODE_DESC_KEY = "react-flow__node-desc";
var ARIA_EDGE_DESC_KEY = "react-flow__edge-desc";
var ARIA_LIVE_MESSAGE = "react-flow__aria-live";
var ariaLiveSelector = (s) => s.ariaLiveMessage;
var ariaLabelConfigSelector = (s) => s.ariaLabelConfig;
function AriaLiveMessage({ rfId }) {
  const ariaLiveMessage = useStore(ariaLiveSelector);
  return jsx("div", { id: `${ARIA_LIVE_MESSAGE}-${rfId}`, "aria-live": "assertive", "aria-atomic": "true", style: ariaLiveStyle, children: ariaLiveMessage });
}
function A11yDescriptions({ rfId, disableKeyboardA11y }) {
  const ariaLabelConfig = useStore(ariaLabelConfigSelector);
  return jsxs(Fragment, { children: [jsx("div", { id: `${ARIA_NODE_DESC_KEY}-${rfId}`, style, children: disableKeyboardA11y ? ariaLabelConfig["node.a11yDescription.default"] : ariaLabelConfig["node.a11yDescription.keyboardDisabled"] }), jsx("div", { id: `${ARIA_EDGE_DESC_KEY}-${rfId}`, style, children: ariaLabelConfig["edge.a11yDescription.default"] }), !disableKeyboardA11y && jsx(AriaLiveMessage, { rfId })] });
}
var Panel = forwardRef(({ position = "top-left", children: children2, className, style: style2, ...rest }, ref) => {
  const positionClasses = `${position}`.split("-");
  return jsx("div", { className: cc(["react-flow__panel", className, ...positionClasses]), style: style2, ref, ...rest, children: children2 });
});
Panel.displayName = "Panel";
var link = `https://reactflow.dev${"?utm_source=attribution"}`;
function Attribution({ proOptions, position = "bottom-right" }) {
  if (proOptions?.hideAttribution) {
    return null;
  }
  return jsx(Panel, { position, className: "react-flow__attribution", "data-message": `Please only hide this attribution when you are subscribed to React Flow Pro: ${link}`, children: jsx("a", { href: link, target: "_blank", rel: "noopener noreferrer", "aria-label": "React Flow attribution", children: "React Flow" }) });
}
var selector$l = (s) => {
  const selectedNodes = [];
  const selectedEdges = [];
  for (const [, node] of s.nodeLookup) {
    if (node.selected) {
      selectedNodes.push(node.internals.userNode);
    }
  }
  for (const [, edge] of s.edgeLookup) {
    if (edge.selected) {
      selectedEdges.push(edge);
    }
  }
  return { selectedNodes, selectedEdges };
};
var selectId = (obj) => obj.id;
function areEqual$1(a, b) {
  return shallow$1(a.selectedNodes.map(selectId), b.selectedNodes.map(selectId)) && shallow$1(a.selectedEdges.map(selectId), b.selectedEdges.map(selectId));
}
function SelectionListenerInner({ onSelectionChange }) {
  const store = useStoreApi();
  const { selectedNodes, selectedEdges } = useStore(selector$l, areEqual$1);
  useEffect4(() => {
    const params = { nodes: selectedNodes, edges: selectedEdges };
    onSelectionChange?.(params);
    store.getState().onSelectionChangeHandlers.forEach((fn) => fn(params));
  }, [selectedNodes, selectedEdges, onSelectionChange]);
  return null;
}
var changeSelector = (s) => !!s.onSelectionChangeHandlers;
function SelectionListener({ onSelectionChange }) {
  const storeHasSelectionChangeHandlers = useStore(changeSelector);
  if (onSelectionChange || storeHasSelectionChangeHandlers) {
    return jsx(SelectionListenerInner, { onSelectionChange });
  }
  return null;
}
var defaultNodeOrigin = [0, 0];
var defaultViewport = { x: 0, y: 0, zoom: 1 };
var reactFlowFieldsToTrack = [
  "nodes",
  "edges",
  "defaultNodes",
  "defaultEdges",
  "onConnect",
  "onConnectStart",
  "onConnectEnd",
  "onClickConnectStart",
  "onClickConnectEnd",
  "nodesDraggable",
  "autoPanOnNodeFocus",
  "nodesConnectable",
  "nodesFocusable",
  "edgesFocusable",
  "edgesReconnectable",
  "elevateNodesOnSelect",
  "elevateEdgesOnSelect",
  "minZoom",
  "maxZoom",
  "nodeExtent",
  "onNodesChange",
  "onEdgesChange",
  "elementsSelectable",
  "connectionMode",
  "snapGrid",
  "snapToGrid",
  "translateExtent",
  "connectOnClick",
  "defaultEdgeOptions",
  "fitView",
  "fitViewOptions",
  "onNodesDelete",
  "onEdgesDelete",
  "onDelete",
  "onNodeDrag",
  "onNodeDragStart",
  "onNodeDragStop",
  "onSelectionDrag",
  "onSelectionDragStart",
  "onSelectionDragStop",
  "onMoveStart",
  "onMove",
  "onMoveEnd",
  "noPanClassName",
  "nodeOrigin",
  "autoPanOnConnect",
  "autoPanOnNodeDrag",
  "onError",
  "connectionRadius",
  "isValidConnection",
  "selectNodesOnDrag",
  "nodeDragThreshold",
  "connectionDragThreshold",
  "onBeforeDelete",
  "debug",
  "autoPanSpeed",
  "ariaLabelConfig",
  "zIndexMode"
];
var fieldsToTrack = [...reactFlowFieldsToTrack, "rfId"];
var selector$k = (s) => ({
  setNodes: s.setNodes,
  setEdges: s.setEdges,
  setMinZoom: s.setMinZoom,
  setMaxZoom: s.setMaxZoom,
  setTranslateExtent: s.setTranslateExtent,
  setNodeExtent: s.setNodeExtent,
  reset: s.reset,
  setDefaultNodesAndEdges: s.setDefaultNodesAndEdges
});
var initPrevValues2 = {
  translateExtent: infiniteExtent,
  nodeOrigin: defaultNodeOrigin,
  minZoom: 0.5,
  maxZoom: 2,
  elementsSelectable: true,
  noPanClassName: "nopan",
  rfId: "1"
};
function StoreUpdater(props) {
  const { setNodes, setEdges, setMinZoom, setMaxZoom, setTranslateExtent, setNodeExtent, reset, setDefaultNodesAndEdges } = useStore(selector$k, shallow$1);
  const store = useStoreApi();
  useEffect4(() => {
    setDefaultNodesAndEdges(props.defaultNodes, props.defaultEdges);
    return () => {
      previousFields.current = initPrevValues2;
      reset();
    };
  }, []);
  const previousFields = useRef2(initPrevValues2);
  useEffect4(() => {
    for (const fieldName of fieldsToTrack) {
      const fieldValue = props[fieldName];
      const previousFieldValue = previousFields.current[fieldName];
      if (fieldValue === previousFieldValue)
        continue;
      if (typeof props[fieldName] === "undefined")
        continue;
      if (fieldName === "nodes")
        setNodes(fieldValue);
      else if (fieldName === "edges")
        setEdges(fieldValue);
      else if (fieldName === "minZoom")
        setMinZoom(fieldValue);
      else if (fieldName === "maxZoom")
        setMaxZoom(fieldValue);
      else if (fieldName === "translateExtent")
        setTranslateExtent(fieldValue);
      else if (fieldName === "nodeExtent")
        setNodeExtent(fieldValue);
      else if (fieldName === "ariaLabelConfig")
        store.setState({ ariaLabelConfig: mergeAriaLabelConfig(fieldValue) });
      else if (fieldName === "fitView")
        store.setState({ fitViewQueued: fieldValue });
      else if (fieldName === "fitViewOptions")
        store.setState({ fitViewOptions: fieldValue });
      else
        store.setState({ [fieldName]: fieldValue });
    }
    previousFields.current = props;
  }, fieldsToTrack.map((fieldName) => props[fieldName]));
  return null;
}
function getMediaQuery() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return null;
  }
  return window.matchMedia("(prefers-color-scheme: dark)");
}
function useColorModeClass(colorMode) {
  const [colorModeClass, setColorModeClass] = useState4(colorMode === "system" ? null : colorMode);
  useEffect4(() => {
    if (colorMode !== "system") {
      setColorModeClass(colorMode);
      return;
    }
    const mediaQuery = getMediaQuery();
    const updateColorModeClass = () => setColorModeClass(mediaQuery?.matches ? "dark" : "light");
    updateColorModeClass();
    mediaQuery?.addEventListener("change", updateColorModeClass);
    return () => {
      mediaQuery?.removeEventListener("change", updateColorModeClass);
    };
  }, [colorMode]);
  return colorModeClass !== null ? colorModeClass : getMediaQuery()?.matches ? "dark" : "light";
}
var defaultDoc = typeof document !== "undefined" ? document : null;
function useKeyPress(keyCode = null, options = { target: defaultDoc, actInsideInputWithModifier: true }) {
  const [keyPressed, setKeyPressed] = useState4(false);
  const modifierPressed = useRef2(false);
  const pressedKeys = useRef2(new Set([]));
  const [keyCodes, keysToWatch] = useMemo3(() => {
    if (keyCode !== null) {
      const keyCodeArr = Array.isArray(keyCode) ? keyCode : [keyCode];
      const keys = keyCodeArr.filter((kc) => typeof kc === "string").map((kc) => kc.replace(/\+/g, `
`).replace(`

`, `
+`).split(`
`));
      const keysFlat = keys.reduce((res, item) => res.concat(...item), []);
      return [keys, keysFlat];
    }
    return [[], []];
  }, [keyCode]);
  useEffect4(() => {
    const target = options?.target ?? defaultDoc;
    const actInsideInputWithModifier = options?.actInsideInputWithModifier ?? true;
    if (keyCode !== null) {
      const downHandler = (event) => {
        modifierPressed.current = event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;
        const preventAction = (!modifierPressed.current || modifierPressed.current && !actInsideInputWithModifier) && isInputDOMNode(event);
        if (preventAction) {
          return false;
        }
        const keyOrCode = useKeyOrCode(event.code, keysToWatch);
        pressedKeys.current.add(event[keyOrCode]);
        if (isMatchingKey(keyCodes, pressedKeys.current, false)) {
          const target2 = event.composedPath?.()?.[0] || event.target;
          const isInteractiveElement = target2?.nodeName === "BUTTON" || target2?.nodeName === "A";
          if (options.preventDefault !== false && (modifierPressed.current || !isInteractiveElement)) {
            event.preventDefault();
          }
          setKeyPressed(true);
        }
      };
      const upHandler = (event) => {
        const keyOrCode = useKeyOrCode(event.code, keysToWatch);
        if (isMatchingKey(keyCodes, pressedKeys.current, true)) {
          setKeyPressed(false);
          pressedKeys.current.clear();
        } else {
          pressedKeys.current.delete(event[keyOrCode]);
        }
        if (event.key === "Meta") {
          pressedKeys.current.clear();
        }
        modifierPressed.current = false;
      };
      const resetHandler = () => {
        pressedKeys.current.clear();
        setKeyPressed(false);
      };
      target?.addEventListener("keydown", downHandler);
      target?.addEventListener("keyup", upHandler);
      window.addEventListener("blur", resetHandler);
      window.addEventListener("contextmenu", resetHandler);
      return () => {
        target?.removeEventListener("keydown", downHandler);
        target?.removeEventListener("keyup", upHandler);
        window.removeEventListener("blur", resetHandler);
        window.removeEventListener("contextmenu", resetHandler);
      };
    }
  }, [keyCode, setKeyPressed]);
  return keyPressed;
}
function isMatchingKey(keyCodes, pressedKeys, isUp) {
  return keyCodes.filter((keys) => isUp || keys.length === pressedKeys.size).some((keys) => keys.every((k) => pressedKeys.has(k)));
}
function useKeyOrCode(eventCode, keysToWatch) {
  return keysToWatch.includes(eventCode) ? "code" : "key";
}
var useViewportHelper = () => {
  const store = useStoreApi();
  return useMemo3(() => {
    return {
      zoomIn: async (options) => {
        const { panZoom } = store.getState();
        return panZoom ? panZoom.scaleBy(1.2, options) : false;
      },
      zoomOut: async (options) => {
        const { panZoom } = store.getState();
        return panZoom ? panZoom.scaleBy(1 / 1.2, options) : false;
      },
      zoomTo: async (zoomLevel, options) => {
        const { panZoom } = store.getState();
        return panZoom ? panZoom.scaleTo(zoomLevel, options) : false;
      },
      getZoom: () => store.getState().transform[2],
      setViewport: async (viewport, options) => {
        const { transform: [tX, tY, tZoom], panZoom } = store.getState();
        if (!panZoom) {
          return false;
        }
        await panZoom.setViewport({
          x: viewport.x ?? tX,
          y: viewport.y ?? tY,
          zoom: viewport.zoom ?? tZoom
        }, options);
        return true;
      },
      getViewport: () => {
        const [x, y, zoom] = store.getState().transform;
        return { x, y, zoom };
      },
      setCenter: async (x, y, options) => {
        return store.getState().setCenter(x, y, options);
      },
      fitBounds: async (bounds, options) => {
        const { width, height, minZoom, maxZoom, panZoom } = store.getState();
        const viewport = getViewportForBounds(bounds, width, height, minZoom, maxZoom, options?.padding ?? 0.1);
        if (!panZoom) {
          return false;
        }
        await panZoom.setViewport(viewport, {
          duration: options?.duration,
          ease: options?.ease,
          interpolate: options?.interpolate
        });
        return true;
      },
      screenToFlowPosition: (clientPosition, options = {}) => {
        const { transform: transform2, snapGrid, snapToGrid, domNode } = store.getState();
        if (!domNode) {
          return clientPosition;
        }
        const { x: domX, y: domY } = domNode.getBoundingClientRect();
        const correctedPosition = {
          x: clientPosition.x - domX,
          y: clientPosition.y - domY
        };
        const _snapGrid = options.snapGrid ?? snapGrid;
        const _snapToGrid = options.snapToGrid ?? snapToGrid;
        return pointToRendererPoint(correctedPosition, transform2, _snapToGrid, _snapGrid);
      },
      flowToScreenPosition: (flowPosition) => {
        const { transform: transform2, domNode } = store.getState();
        if (!domNode) {
          return flowPosition;
        }
        const { x: domX, y: domY } = domNode.getBoundingClientRect();
        const rendererPosition = rendererPointToPoint(flowPosition, transform2);
        return {
          x: rendererPosition.x + domX,
          y: rendererPosition.y + domY
        };
      }
    };
  }, []);
};
function applyChanges(changes, elements) {
  const updatedElements = [];
  const changesMap = new Map;
  const addItemChanges = [];
  for (const change of changes) {
    if (change.type === "add") {
      addItemChanges.push(change);
      continue;
    } else if (change.type === "remove" || change.type === "replace") {
      changesMap.set(change.id, [change]);
    } else {
      const elementChanges = changesMap.get(change.id);
      if (elementChanges) {
        elementChanges.push(change);
      } else {
        changesMap.set(change.id, [change]);
      }
    }
  }
  for (const element of elements) {
    const changes2 = changesMap.get(element.id);
    if (!changes2) {
      updatedElements.push(element);
      continue;
    }
    if (changes2[0].type === "remove") {
      continue;
    }
    if (changes2[0].type === "replace") {
      updatedElements.push({ ...changes2[0].item });
      continue;
    }
    const updatedElement = { ...element };
    for (const change of changes2) {
      applyChange(change, updatedElement);
    }
    updatedElements.push(updatedElement);
  }
  if (addItemChanges.length) {
    addItemChanges.forEach((change) => {
      if (change.index !== undefined) {
        updatedElements.splice(change.index, 0, { ...change.item });
      } else {
        updatedElements.push({ ...change.item });
      }
    });
  }
  return updatedElements;
}
function applyChange(change, element) {
  switch (change.type) {
    case "select": {
      element.selected = change.selected;
      break;
    }
    case "position": {
      if (typeof change.position !== "undefined") {
        element.position = change.position;
      }
      if (typeof change.dragging !== "undefined") {
        element.dragging = change.dragging;
      }
      break;
    }
    case "dimensions": {
      if (typeof change.dimensions !== "undefined") {
        element.measured = {
          ...change.dimensions
        };
        if (change.setAttributes) {
          if (change.setAttributes === true || change.setAttributes === "width") {
            element.width = change.dimensions.width;
          }
          if (change.setAttributes === true || change.setAttributes === "height") {
            element.height = change.dimensions.height;
          }
        }
      }
      if (typeof change.resizing === "boolean") {
        element.resizing = change.resizing;
      }
      break;
    }
  }
}
function applyNodeChanges(changes, nodes) {
  return applyChanges(changes, nodes);
}
function applyEdgeChanges(changes, edges) {
  return applyChanges(changes, edges);
}
function createSelectionChange(id2, selected) {
  return {
    id: id2,
    type: "select",
    selected
  };
}
function getSelectionChanges(items, selectedIds = new Set, mutateItem = false) {
  const changes = [];
  for (const [id2, item] of items) {
    const willBeSelected = selectedIds.has(id2);
    if (!(item.selected === undefined && !willBeSelected) && item.selected !== willBeSelected) {
      if (mutateItem) {
        item.selected = willBeSelected;
      }
      changes.push(createSelectionChange(item.id, willBeSelected));
    }
  }
  return changes;
}
function getElementsDiffChanges({ items = [], lookup }) {
  const changes = [];
  const itemsLookup = new Map(items.map((item) => [item.id, item]));
  for (const [index, item] of items.entries()) {
    const lookupItem = lookup.get(item.id);
    const storeItem = lookupItem?.internals?.userNode ?? lookupItem;
    if (storeItem !== undefined && storeItem !== item) {
      changes.push({ id: item.id, item, type: "replace" });
    }
    if (storeItem === undefined) {
      changes.push({ item, type: "add", index });
    }
  }
  for (const [id2] of lookup) {
    const nextNode = itemsLookup.get(id2);
    if (nextNode === undefined) {
      changes.push({ id: id2, type: "remove" });
    }
  }
  return changes;
}
function elementToRemoveChange(item) {
  return {
    id: item.id,
    type: "remove"
  };
}
var defaultOnError = createDevWarn("React Flow", "https://reactflow.dev/");
function addEdge2(edgeParams, edges, options = {}) {
  return addEdge(edgeParams, edges, {
    ...options,
    onError: options.onError ?? defaultOnError
  });
}
var isNode = (element) => isNodeBase(element);
var isEdge = (element) => isEdgeBase(element);
function fixedForwardRef(render) {
  return forwardRef(render);
}
var useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect4;
function useQueue(runQueue) {
  const [serial, setSerial] = useState4(BigInt(0));
  const [queue] = useState4(() => createQueue(() => setSerial((n) => n + BigInt(1))));
  useIsomorphicLayoutEffect(() => {
    const queueItems = queue.get();
    if (queueItems.length) {
      runQueue(queueItems);
      queue.reset();
    }
  }, [serial]);
  return queue;
}
function createQueue(cb) {
  let queue = [];
  return {
    get: () => queue,
    reset: () => {
      queue = [];
    },
    push: (item) => {
      queue.push(item);
      cb();
    }
  };
}
var BatchContext = createContext2(null);
function BatchProvider({ children: children2 }) {
  const store = useStoreApi();
  const nodeQueueHandler = useCallback3((queueItems) => {
    const { nodes = [], setNodes, hasDefaultNodes, onNodesChange, nodeLookup, fitViewQueued, onNodesChangeMiddlewareMap } = store.getState();
    let next = nodes;
    for (const payload of queueItems) {
      next = typeof payload === "function" ? payload(next) : payload;
    }
    let changes = getElementsDiffChanges({
      items: next,
      lookup: nodeLookup
    });
    for (const middleware of onNodesChangeMiddlewareMap.values()) {
      changes = middleware(changes);
    }
    if (hasDefaultNodes) {
      setNodes(next);
    }
    if (changes.length > 0) {
      onNodesChange?.(changes);
    } else if (fitViewQueued) {
      window.requestAnimationFrame(() => {
        const { fitViewQueued: fitViewQueued2, nodes: nodes2, setNodes: setNodes2 } = store.getState();
        if (fitViewQueued2) {
          setNodes2(nodes2);
        }
      });
    }
  }, []);
  const nodeQueue = useQueue(nodeQueueHandler);
  const edgeQueueHandler = useCallback3((queueItems) => {
    const { edges = [], setEdges, hasDefaultEdges, onEdgesChange, edgeLookup } = store.getState();
    let next = edges;
    for (const payload of queueItems) {
      next = typeof payload === "function" ? payload(next) : payload;
    }
    if (hasDefaultEdges) {
      setEdges(next);
    } else if (onEdgesChange) {
      onEdgesChange(getElementsDiffChanges({
        items: next,
        lookup: edgeLookup
      }));
    }
  }, []);
  const edgeQueue = useQueue(edgeQueueHandler);
  const value = useMemo3(() => ({ nodeQueue, edgeQueue }), []);
  return jsx(BatchContext.Provider, { value, children: children2 });
}
function useBatchContext() {
  const batchContext = useContext2(BatchContext);
  if (!batchContext) {
    throw new Error("useBatchContext must be used within a BatchProvider");
  }
  return batchContext;
}
var selector$j = (s) => !!s.panZoom;
function useReactFlow() {
  const viewportHelper = useViewportHelper();
  const store = useStoreApi();
  const batchContext = useBatchContext();
  const viewportInitialized = useStore(selector$j);
  const generalHelper = useMemo3(() => {
    const getInternalNode = (id2) => store.getState().nodeLookup.get(id2);
    const setNodes = (payload) => {
      batchContext.nodeQueue.push(payload);
    };
    const setEdges = (payload) => {
      batchContext.edgeQueue.push(payload);
    };
    const getNodeRect = (node) => {
      const { nodeLookup, nodeOrigin } = store.getState();
      const nodeToUse = isNode(node) ? node : nodeLookup.get(node.id);
      const position = nodeToUse.parentId ? evaluateAbsolutePosition(nodeToUse.position, nodeToUse.measured, nodeToUse.parentId, nodeLookup, nodeOrigin) : nodeToUse.position;
      const nodeWithPosition = {
        ...nodeToUse,
        position,
        width: nodeToUse.measured?.width ?? nodeToUse.width,
        height: nodeToUse.measured?.height ?? nodeToUse.height
      };
      return nodeToRect(nodeWithPosition);
    };
    const updateNode = (id2, nodeUpdate, options = { replace: false }) => {
      setNodes((prevNodes) => prevNodes.map((node) => {
        if (node.id === id2) {
          const nextNode = typeof nodeUpdate === "function" ? nodeUpdate(node) : nodeUpdate;
          return options.replace && isNode(nextNode) ? nextNode : { ...node, ...nextNode };
        }
        return node;
      }));
    };
    const updateEdge = (id2, edgeUpdate, options = { replace: false }) => {
      setEdges((prevEdges) => prevEdges.map((edge) => {
        if (edge.id === id2) {
          const nextEdge = typeof edgeUpdate === "function" ? edgeUpdate(edge) : edgeUpdate;
          return options.replace && isEdge(nextEdge) ? nextEdge : { ...edge, ...nextEdge };
        }
        return edge;
      }));
    };
    return {
      getNodes: () => store.getState().nodes.map((n) => ({ ...n })),
      getNode: (id2) => getInternalNode(id2)?.internals.userNode,
      getInternalNode,
      getEdges: () => {
        const { edges = [] } = store.getState();
        return edges.map((e) => ({ ...e }));
      },
      getEdge: (id2) => store.getState().edgeLookup.get(id2),
      setNodes,
      setEdges,
      addNodes: (payload) => {
        const newNodes = Array.isArray(payload) ? payload : [payload];
        batchContext.nodeQueue.push((nodes) => [...nodes, ...newNodes]);
      },
      addEdges: (payload) => {
        const newEdges = Array.isArray(payload) ? payload : [payload];
        batchContext.edgeQueue.push((edges) => [...edges, ...newEdges]);
      },
      toObject: () => {
        const { nodes = [], edges = [], transform: transform2 } = store.getState();
        const [x, y, zoom] = transform2;
        return {
          nodes: nodes.map((n) => ({ ...n })),
          edges: edges.map((e) => ({ ...e })),
          viewport: {
            x,
            y,
            zoom
          }
        };
      },
      deleteElements: async ({ nodes: nodesToRemove = [], edges: edgesToRemove = [] }) => {
        const { nodes, edges, onNodesDelete, onEdgesDelete, triggerNodeChanges, triggerEdgeChanges, onDelete, onBeforeDelete } = store.getState();
        const { nodes: matchingNodes, edges: matchingEdges } = await getElementsToRemove({
          nodesToRemove,
          edgesToRemove,
          nodes,
          edges,
          onBeforeDelete
        });
        const hasMatchingEdges = matchingEdges.length > 0;
        const hasMatchingNodes = matchingNodes.length > 0;
        if (hasMatchingEdges) {
          const edgeChanges = matchingEdges.map(elementToRemoveChange);
          onEdgesDelete?.(matchingEdges);
          triggerEdgeChanges(edgeChanges);
        }
        if (hasMatchingNodes) {
          const nodeChanges = matchingNodes.map(elementToRemoveChange);
          onNodesDelete?.(matchingNodes);
          triggerNodeChanges(nodeChanges);
        }
        if (hasMatchingNodes || hasMatchingEdges) {
          onDelete?.({ nodes: matchingNodes, edges: matchingEdges });
        }
        return { deletedNodes: matchingNodes, deletedEdges: matchingEdges };
      },
      getIntersectingNodes: (nodeOrRect, partially = true, nodes) => {
        const isRect = isRectObject(nodeOrRect);
        const nodeRect = isRect ? nodeOrRect : getNodeRect(nodeOrRect);
        const hasNodesOption = nodes !== undefined;
        if (!nodeRect) {
          return [];
        }
        return (nodes || store.getState().nodes).filter((n) => {
          const internalNode = store.getState().nodeLookup.get(n.id);
          if (internalNode && !isRect && (n.id === nodeOrRect.id || !internalNode.internals.positionAbsolute)) {
            return false;
          }
          const currNodeRect = nodeToRect(hasNodesOption ? n : internalNode);
          const overlappingArea = getOverlappingArea(currNodeRect, nodeRect);
          const partiallyVisible = partially && overlappingArea > 0;
          return partiallyVisible || overlappingArea >= currNodeRect.width * currNodeRect.height || overlappingArea >= nodeRect.width * nodeRect.height;
        });
      },
      isNodeIntersecting: (nodeOrRect, area, partially = true) => {
        const isRect = isRectObject(nodeOrRect);
        const nodeRect = isRect ? nodeOrRect : getNodeRect(nodeOrRect);
        if (!nodeRect) {
          return false;
        }
        const overlappingArea = getOverlappingArea(nodeRect, area);
        const partiallyVisible = partially && overlappingArea > 0;
        return partiallyVisible || overlappingArea >= area.width * area.height || overlappingArea >= nodeRect.width * nodeRect.height;
      },
      updateNode,
      updateNodeData: (id2, dataUpdate, options = { replace: false }) => {
        updateNode(id2, (node) => {
          const nextData = typeof dataUpdate === "function" ? dataUpdate(node) : dataUpdate;
          return options.replace ? { ...node, data: nextData } : { ...node, data: { ...node.data, ...nextData } };
        }, options);
      },
      updateEdge,
      updateEdgeData: (id2, dataUpdate, options = { replace: false }) => {
        updateEdge(id2, (edge) => {
          const nextData = typeof dataUpdate === "function" ? dataUpdate(edge) : dataUpdate;
          return options.replace ? { ...edge, data: nextData } : { ...edge, data: { ...edge.data, ...nextData } };
        }, options);
      },
      getNodesBounds: (nodes) => {
        const { nodeLookup, nodeOrigin } = store.getState();
        return getNodesBounds(nodes, { nodeLookup, nodeOrigin });
      },
      getHandleConnections: ({ type, id: id2, nodeId }) => Array.from(store.getState().connectionLookup.get(`${nodeId}-${type}${id2 ? `-${id2}` : ""}`)?.values() ?? []),
      getNodeConnections: ({ type, handleId, nodeId }) => Array.from(store.getState().connectionLookup.get(`${nodeId}${type ? handleId ? `-${type}-${handleId}` : `-${type}` : ""}`)?.values() ?? []),
      fitView: async (options) => {
        const fitViewResolver = store.getState().fitViewResolver ?? withResolvers();
        store.setState({ fitViewQueued: true, fitViewOptions: options, fitViewResolver });
        batchContext.nodeQueue.push((nodes) => [...nodes]);
        return fitViewResolver.promise;
      }
    };
  }, []);
  return useMemo3(() => {
    return {
      ...generalHelper,
      ...viewportHelper,
      viewportInitialized
    };
  }, [viewportInitialized]);
}
var selected = (item) => item.selected;
var win$1 = typeof window !== "undefined" ? window : undefined;
function useGlobalKeyHandler({ deleteKeyCode, multiSelectionKeyCode }) {
  const store = useStoreApi();
  const { deleteElements } = useReactFlow();
  const deleteKeyPressed = useKeyPress(deleteKeyCode, { actInsideInputWithModifier: false });
  const multiSelectionKeyPressed = useKeyPress(multiSelectionKeyCode, { target: win$1 });
  useEffect4(() => {
    if (deleteKeyPressed) {
      const { edges, nodes } = store.getState();
      deleteElements({ nodes: nodes.filter(selected), edges: edges.filter(selected) });
      store.setState({ nodesSelectionActive: false });
    }
  }, [deleteKeyPressed]);
  useEffect4(() => {
    store.setState({ multiSelectionActive: multiSelectionKeyPressed });
  }, [multiSelectionKeyPressed]);
}
function useResizeHandler(domNode) {
  const store = useStoreApi();
  useEffect4(() => {
    const updateDimensions = () => {
      if (!domNode.current || !(domNode.current.checkVisibility?.() ?? true)) {
        return false;
      }
      const size = getDimensions(domNode.current);
      if (size.height === 0 || size.width === 0) {
        store.getState().onError?.("004", errorMessages["error004"]());
      }
      store.setState({ width: size.width || 500, height: size.height || 500 });
    };
    if (domNode.current) {
      updateDimensions();
      window.addEventListener("resize", updateDimensions);
      const resizeObserver = new ResizeObserver(() => updateDimensions());
      resizeObserver.observe(domNode.current);
      return () => {
        window.removeEventListener("resize", updateDimensions);
        if (resizeObserver && domNode.current) {
          resizeObserver.unobserve(domNode.current);
        }
      };
    }
  }, []);
}
var containerStyle = {
  position: "absolute",
  width: "100%",
  height: "100%",
  top: 0,
  left: 0
};
var selector$i = (s) => ({
  userSelectionActive: s.userSelectionActive,
  lib: s.lib,
  connectionInProgress: s.connection.inProgress
});
function ZoomPane({ onPaneContextMenu, zoomOnScroll = true, zoomOnPinch = true, panOnScroll = false, panActivationKeyPressed, panOnScrollSpeed = 0.5, panOnScrollMode = PanOnScrollMode.Free, zoomOnDoubleClick = true, panOnDrag = true, defaultViewport: defaultViewport2, translateExtent, minZoom, maxZoom, zoomActivationKeyCode, preventScrolling = true, children: children2, noWheelClassName, noPanClassName, onViewportChange, isControlledViewport, paneClickDistance, selectionOnDrag }) {
  const store = useStoreApi();
  const zoomPane = useRef2(null);
  const { userSelectionActive, lib, connectionInProgress } = useStore(selector$i, shallow$1);
  const zoomActivationKeyPressed = useKeyPress(zoomActivationKeyCode);
  const panZoom = useRef2();
  useResizeHandler(zoomPane);
  const onTransformChange = useCallback3((transform2) => {
    onViewportChange?.({ x: transform2[0], y: transform2[1], zoom: transform2[2] });
    if (!isControlledViewport) {
      store.setState({ transform: transform2 });
    }
  }, [onViewportChange, isControlledViewport]);
  useEffect4(() => {
    if (zoomPane.current) {
      panZoom.current = XYPanZoom({
        domNode: zoomPane.current,
        minZoom,
        maxZoom,
        translateExtent,
        viewport: defaultViewport2,
        onDraggingChange: (paneDragging) => store.setState((prevState) => prevState.paneDragging === paneDragging ? prevState : { paneDragging }),
        onPanZoomStart: (event, vp) => {
          const { onViewportChangeStart, onMoveStart } = store.getState();
          onMoveStart?.(event, vp);
          onViewportChangeStart?.(vp);
        },
        onPanZoom: (event, vp) => {
          const { onViewportChange: onViewportChange2, onMove } = store.getState();
          onMove?.(event, vp);
          onViewportChange2?.(vp);
        },
        onPanZoomEnd: (event, vp) => {
          const { onViewportChangeEnd, onMoveEnd } = store.getState();
          onMoveEnd?.(event, vp);
          onViewportChangeEnd?.(vp);
        }
      });
      const { x, y, zoom } = panZoom.current.getViewport();
      store.setState({
        panZoom: panZoom.current,
        transform: [x, y, zoom],
        domNode: zoomPane.current.closest(".react-flow")
      });
      return () => {
        panZoom.current?.destroy();
      };
    }
  }, []);
  useEffect4(() => {
    panZoom.current?.update({
      onPaneContextMenu,
      zoomOnScroll,
      zoomOnPinch,
      panOnScroll,
      panActivationKeyPressed,
      panOnScrollSpeed,
      panOnScrollMode,
      zoomOnDoubleClick,
      panOnDrag,
      zoomActivationKeyPressed,
      preventScrolling,
      noPanClassName,
      userSelectionActive,
      noWheelClassName,
      lib,
      onTransformChange,
      connectionInProgress,
      selectionOnDrag,
      paneClickDistance
    });
  }, [
    onPaneContextMenu,
    zoomOnScroll,
    zoomOnPinch,
    panOnScroll,
    panActivationKeyPressed,
    panOnScrollSpeed,
    panOnScrollMode,
    zoomOnDoubleClick,
    panOnDrag,
    zoomActivationKeyPressed,
    preventScrolling,
    noPanClassName,
    userSelectionActive,
    noWheelClassName,
    lib,
    onTransformChange,
    connectionInProgress,
    selectionOnDrag,
    paneClickDistance
  ]);
  return jsx("div", { className: "react-flow__renderer", ref: zoomPane, style: containerStyle, children: children2 });
}
var selector$h = (s) => ({
  userSelectionActive: s.userSelectionActive,
  userSelectionRect: s.userSelectionRect
});
function UserSelection() {
  const { userSelectionActive, userSelectionRect } = useStore(selector$h, shallow$1);
  const isActive = userSelectionActive && userSelectionRect;
  if (!isActive) {
    return null;
  }
  return jsx("div", { className: "react-flow__selection react-flow__container", style: {
    width: userSelectionRect.width,
    height: userSelectionRect.height,
    transform: `translate(${userSelectionRect.x}px, ${userSelectionRect.y}px)`
  } });
}
var wrapHandler = (handler, containerRef) => {
  return (event) => {
    if (event.target !== containerRef.current) {
      return;
    }
    handler?.(event);
  };
};
var selector$g = (s) => ({
  userSelectionActive: s.userSelectionActive,
  elementsSelectable: s.elementsSelectable,
  dragging: s.paneDragging,
  panBy: s.panBy,
  autoPanSpeed: s.autoPanSpeed
});
function Pane({ isSelecting, selectionKeyPressed, selectionMode = SelectionMode.Full, panOnDrag, autoPanOnSelection, paneClickDistance, selectionOnDrag, onSelectionStart, onSelectionEnd, onPaneClick, onPaneContextMenu, onPaneScroll, onPaneMouseEnter, onPaneMouseMove, onPaneMouseLeave, children: children2 }) {
  const autoPanId = useRef2(0);
  const store = useStoreApi();
  const { userSelectionActive, elementsSelectable, dragging, panBy: panBy2, autoPanSpeed } = useStore(selector$g, shallow$1);
  const isSelectionEnabled = elementsSelectable && (isSelecting || userSelectionActive);
  const container = useRef2(null);
  const containerBounds = useRef2();
  const selectedNodeIds = useRef2(new Set);
  const selectedEdgeIds = useRef2(new Set);
  const connectionEndedOnPane = useRef2(false);
  const selectionInProgress = useRef2(false);
  const position = useRef2({ x: 0, y: 0 });
  const autoPanStarted = useRef2(false);
  const onClick = (event) => {
    if (selectionInProgress.current || connectionEndedOnPane.current || store.getState().connection.inProgress) {
      selectionInProgress.current = false;
      connectionEndedOnPane.current = false;
      return;
    }
    onPaneClick?.(event);
    store.getState().resetSelectedElements();
    store.setState({ nodesSelectionActive: false });
  };
  const onContextMenu = (event) => {
    if (Array.isArray(panOnDrag) && panOnDrag?.includes(2)) {
      event.preventDefault();
      return;
    }
    onPaneContextMenu?.(event);
  };
  const onWheel = onPaneScroll ? (event) => onPaneScroll(event) : undefined;
  const onClickCapture = (event) => {
    if (selectionInProgress.current) {
      event.stopPropagation();
      selectionInProgress.current = false;
    }
  };
  const onPointerDownCapture = (event) => {
    if (event.pointerType === "touch" && panOnDrag !== false && !selectionKeyPressed) {
      return;
    }
    const { domNode, transform: transform2 } = store.getState();
    containerBounds.current = domNode?.getBoundingClientRect();
    if (!containerBounds.current)
      return;
    const eventTargetIsContainer = event.target === container.current;
    const isNoKeyEvent = !eventTargetIsContainer && !!event.target.closest(".nokey");
    const isSelectionActive = selectionOnDrag && eventTargetIsContainer || selectionKeyPressed;
    if (isNoKeyEvent || !isSelecting || !isSelectionActive || event.button !== 0 || !event.isPrimary) {
      return;
    }
    event.target?.setPointerCapture?.(event.pointerId);
    selectionInProgress.current = false;
    const { x, y } = getEventPosition(event.nativeEvent, containerBounds.current);
    const userSelectionStartPosition = pointToRendererPoint({ x, y }, transform2);
    store.setState({
      userSelectionRect: {
        width: 0,
        height: 0,
        startX: userSelectionStartPosition.x,
        startY: userSelectionStartPosition.y,
        x,
        y
      }
    });
    if (!eventTargetIsContainer) {
      event.stopPropagation();
      event.preventDefault();
    }
  };
  function commitUserSelectionRect(mouseX, mouseY) {
    const { userSelectionRect } = store.getState();
    if (!userSelectionRect) {
      return;
    }
    const { transform: transform2, nodeLookup, edgeLookup, connectionLookup, triggerNodeChanges, triggerEdgeChanges, defaultEdgeOptions } = store.getState();
    const userStartPosition = { x: userSelectionRect.startX, y: userSelectionRect.startY };
    const { x: screenStartX, y: screenStartY } = rendererPointToPoint(userStartPosition, transform2);
    const nextUserSelectRect = {
      startX: userStartPosition.x,
      startY: userStartPosition.y,
      x: mouseX < screenStartX ? mouseX : screenStartX,
      y: mouseY < screenStartY ? mouseY : screenStartY,
      width: Math.abs(mouseX - screenStartX),
      height: Math.abs(mouseY - screenStartY)
    };
    const prevSelectedNodeIds = selectedNodeIds.current;
    const prevSelectedEdgeIds = selectedEdgeIds.current;
    selectedNodeIds.current = new Set(getNodesInside(nodeLookup, nextUserSelectRect, transform2, selectionMode === SelectionMode.Partial, true).map((node) => node.id));
    selectedEdgeIds.current = new Set;
    const edgesSelectable = defaultEdgeOptions?.selectable ?? true;
    for (const nodeId of selectedNodeIds.current) {
      const connections = connectionLookup.get(nodeId);
      if (!connections)
        continue;
      for (const { edgeId } of connections.values()) {
        const edge = edgeLookup.get(edgeId);
        if (edge && (edge.selectable ?? edgesSelectable)) {
          selectedEdgeIds.current.add(edgeId);
        }
      }
    }
    if (!areSetsEqual(prevSelectedNodeIds, selectedNodeIds.current)) {
      const changes = getSelectionChanges(nodeLookup, selectedNodeIds.current, true);
      triggerNodeChanges(changes);
    }
    if (!areSetsEqual(prevSelectedEdgeIds, selectedEdgeIds.current)) {
      const changes = getSelectionChanges(edgeLookup, selectedEdgeIds.current);
      triggerEdgeChanges(changes);
    }
    store.setState({
      userSelectionRect: nextUserSelectRect,
      userSelectionActive: true,
      nodesSelectionActive: false
    });
  }
  function autoPan() {
    if (!autoPanOnSelection || !containerBounds.current) {
      return;
    }
    const [x, y] = calcAutoPan(position.current, containerBounds.current, autoPanSpeed);
    panBy2({ x, y }).then((panned) => {
      if (!selectionInProgress.current || !panned) {
        autoPanId.current = requestAnimationFrame(autoPan);
        return;
      }
      const { x: mx, y: my } = position.current;
      commitUserSelectionRect(mx, my);
      autoPanId.current = requestAnimationFrame(autoPan);
    });
  }
  const cleanupAutoPan = () => {
    cancelAnimationFrame(autoPanId.current);
    autoPanId.current = 0;
    autoPanStarted.current = false;
  };
  useEffect4(() => {
    return () => cleanupAutoPan();
  }, []);
  const onPointerMove = (event) => {
    const { userSelectionRect, transform: transform2, resetSelectedElements } = store.getState();
    if (!containerBounds.current || !userSelectionRect) {
      return;
    }
    const { x: mouseX, y: mouseY } = getEventPosition(event.nativeEvent, containerBounds.current);
    position.current = { x: mouseX, y: mouseY };
    const screenStart = rendererPointToPoint({ x: userSelectionRect.startX, y: userSelectionRect.startY }, transform2);
    if (!selectionInProgress.current) {
      const requiredDistance = selectionKeyPressed ? 0 : paneClickDistance;
      const distance2 = Math.hypot(mouseX - screenStart.x, mouseY - screenStart.y);
      if (distance2 <= requiredDistance) {
        return;
      }
      resetSelectedElements();
      onSelectionStart?.(event);
    }
    selectionInProgress.current = true;
    if (!autoPanStarted.current) {
      autoPan();
      autoPanStarted.current = true;
    }
    commitUserSelectionRect(mouseX, mouseY);
  };
  const onPointerUp = (event) => {
    if (!isSelectionEnabled) {
      if (event.target === container.current && store.getState().connection.inProgress) {
        connectionEndedOnPane.current = true;
      }
      return;
    }
    if (event.button !== 0) {
      return;
    }
    event.target?.releasePointerCapture?.(event.pointerId);
    if (!userSelectionActive && event.target === container.current && store.getState().userSelectionRect) {
      onClick?.(event);
    }
    store.setState({
      userSelectionActive: false,
      userSelectionRect: null
    });
    if (selectionInProgress.current) {
      onSelectionEnd?.(event);
      store.setState({
        nodesSelectionActive: selectedNodeIds.current.size > 0
      });
    }
    cleanupAutoPan();
  };
  const onPointerCancel = (event) => {
    event.target?.releasePointerCapture?.(event.pointerId);
    cleanupAutoPan();
  };
  const draggable = panOnDrag === true || Array.isArray(panOnDrag) && panOnDrag.includes(0);
  return jsxs("div", { className: cc(["react-flow__pane", { draggable, dragging, selection: isSelecting }]), onClick: isSelectionEnabled ? undefined : wrapHandler(onClick, container), onContextMenu: wrapHandler(onContextMenu, container), onWheel: wrapHandler(onWheel, container), onPointerEnter: isSelectionEnabled ? undefined : onPaneMouseEnter, onPointerMove: isSelectionEnabled ? onPointerMove : onPaneMouseMove, onPointerUp, onPointerCancel: isSelectionEnabled ? onPointerCancel : undefined, onPointerDownCapture: isSelectionEnabled ? onPointerDownCapture : undefined, onClickCapture: isSelectionEnabled ? onClickCapture : undefined, onPointerLeave: onPaneMouseLeave, ref: container, style: containerStyle, children: [children2, jsx(UserSelection, {})] });
}
function handleNodeClick({ id: id2, store, unselect = false, nodeRef }) {
  const { addSelectedNodes, unselectNodesAndEdges, multiSelectionActive, nodeLookup, onError } = store.getState();
  const node = nodeLookup.get(id2);
  if (!node) {
    onError?.("012", errorMessages["error012"](id2));
    return;
  }
  store.setState({ nodesSelectionActive: false });
  if (!node.selected) {
    addSelectedNodes([id2]);
  } else if (unselect || node.selected && multiSelectionActive) {
    unselectNodesAndEdges({ nodes: [node], edges: [] });
    requestAnimationFrame(() => nodeRef?.current?.blur());
  }
}
function useDrag({ nodeRef, disabled = false, noDragClassName, handleSelector, nodeId, isSelectable, nodeClickDistance }) {
  const store = useStoreApi();
  const [dragging, setDragging] = useState4(false);
  const xyDrag = useRef2();
  useEffect4(() => {
    if (disabled) {
      return;
    }
    xyDrag.current = XYDrag({
      getStoreItems: () => store.getState(),
      onNodeMouseDown: (id2) => {
        handleNodeClick({
          id: id2,
          store,
          nodeRef
        });
      },
      onDragStart: () => {
        setDragging(true);
      },
      onDragStop: () => {
        setDragging(false);
      }
    });
    return () => {
      xyDrag.current?.destroy();
      xyDrag.current = undefined;
    };
  }, [disabled, store, nodeRef]);
  useEffect4(() => {
    if (disabled || !nodeRef.current || !xyDrag.current) {
      return;
    }
    xyDrag.current.update({
      noDragClassName,
      handleSelector,
      domNode: nodeRef.current,
      isSelectable,
      nodeId,
      nodeClickDistance
    });
  }, [noDragClassName, handleSelector, disabled, isSelectable, nodeRef, nodeId, nodeClickDistance]);
  return dragging;
}
var selectedAndDraggable = (nodesDraggable) => (n) => n.selected && (n.draggable || nodesDraggable && typeof n.draggable === "undefined");
function useMoveSelectedNodes() {
  const store = useStoreApi();
  const moveSelectedNodes = useCallback3((params) => {
    const { nodeExtent, snapToGrid, snapGrid, nodesDraggable, onError, updateNodePositions, nodeLookup, nodeOrigin } = store.getState();
    const nodeUpdates = new Map;
    const isSelected = selectedAndDraggable(nodesDraggable);
    const xVelo = snapToGrid ? snapGrid[0] : 5;
    const yVelo = snapToGrid ? snapGrid[1] : 5;
    const xDiff = params.direction.x * xVelo * params.factor;
    const yDiff = params.direction.y * yVelo * params.factor;
    for (const [, node] of nodeLookup) {
      if (!isSelected(node)) {
        continue;
      }
      let nextPosition = {
        x: node.internals.positionAbsolute.x + xDiff,
        y: node.internals.positionAbsolute.y + yDiff
      };
      if (snapToGrid) {
        nextPosition = snapPosition(nextPosition, snapGrid);
      }
      const { position, positionAbsolute } = calculateNodePosition({
        nodeId: node.id,
        nextPosition,
        nodeLookup,
        nodeExtent,
        nodeOrigin,
        onError
      });
      node.position = position;
      node.internals.positionAbsolute = positionAbsolute;
      nodeUpdates.set(node.id, node);
    }
    updateNodePositions(nodeUpdates);
  }, []);
  return moveSelectedNodes;
}
var NodeIdContext = createContext2(null);
var Provider = NodeIdContext.Provider;
NodeIdContext.Consumer;
var useNodeId = () => {
  const nodeId = useContext2(NodeIdContext);
  return nodeId;
};
var selector$f = (s) => ({
  connectOnClick: s.connectOnClick,
  noPanClassName: s.noPanClassName,
  rfId: s.rfId
});
var HandleConfigContext = createContext2(null);
function HandleConfigProvider({ children: children2 }) {
  const config = useStore(selector$f, shallow$1);
  return jsx(HandleConfigContext.Provider, { value: config, children: children2 });
}
function useHandleConfig() {
  const config = useContext2(HandleConfigContext);
  if (!config) {
    throw new Error("useHandleConfig must be used within a HandleConfigProvider");
  }
  return config;
}
var idleConnectingState = {
  connectingFrom: false,
  connectingTo: false,
  clickConnecting: false,
  isPossibleEndHandle: true,
  connectionInProcess: false,
  clickConnectionInProcess: false,
  valid: false
};
var connectingSelector = (nodeId, handleId, type) => (state) => {
  const { connectionClickStartHandle: clickHandle, connectionMode, connection } = state;
  const { fromHandle, toHandle, isValid } = connection;
  if (!fromHandle && !clickHandle) {
    return idleConnectingState;
  }
  const connectingTo = toHandle?.nodeId === nodeId && toHandle?.id === handleId && toHandle?.type === type;
  return {
    connectingFrom: fromHandle?.nodeId === nodeId && fromHandle?.id === handleId && fromHandle?.type === type,
    connectingTo,
    clickConnecting: clickHandle?.nodeId === nodeId && clickHandle?.id === handleId && clickHandle?.type === type,
    isPossibleEndHandle: connectionMode === ConnectionMode.Strict ? fromHandle?.type !== type : nodeId !== fromHandle?.nodeId || handleId !== fromHandle?.id,
    connectionInProcess: !!fromHandle,
    clickConnectionInProcess: !!clickHandle,
    valid: connectingTo && isValid
  };
};
function HandleComponent({ type = "source", position = Position.Top, isValidConnection, isConnectable = true, isConnectableStart = true, isConnectableEnd = true, id: id2, onConnect, children: children2, className, onMouseDown, onTouchStart, ...rest }, ref) {
  const handleId = id2 || null;
  const isTarget = type === "target";
  const store = useStoreApi();
  const nodeId = useNodeId();
  const { connectOnClick, noPanClassName, rfId } = useHandleConfig();
  const { connectingFrom, connectingTo, clickConnecting, isPossibleEndHandle, connectionInProcess, clickConnectionInProcess, valid } = useStore(connectingSelector(nodeId, handleId, type), shallow$1);
  if (!nodeId) {
    store.getState().onError?.("010", errorMessages["error010"]());
  }
  const onConnectExtended = (params) => {
    const { defaultEdgeOptions, onConnect: onConnectAction, hasDefaultEdges } = store.getState();
    const edgeParams = {
      ...defaultEdgeOptions,
      ...params
    };
    if (hasDefaultEdges) {
      const { edges, setEdges, onError } = store.getState();
      setEdges(addEdge2(edgeParams, edges, { onError }));
    }
    onConnectAction?.(edgeParams);
    onConnect?.(edgeParams);
  };
  const onPointerDown2 = (event) => {
    if (!nodeId) {
      return;
    }
    const isMouseTriggered = isMouseEvent(event.nativeEvent);
    if (isConnectableStart && (isMouseTriggered && event.button === 0 || !isMouseTriggered)) {
      const currentStore = store.getState();
      XYHandle.onPointerDown(event.nativeEvent, {
        handleDomNode: event.currentTarget,
        autoPanOnConnect: currentStore.autoPanOnConnect,
        connectionMode: currentStore.connectionMode,
        connectionRadius: currentStore.connectionRadius,
        domNode: currentStore.domNode,
        nodeLookup: currentStore.nodeLookup,
        lib: currentStore.lib,
        isTarget,
        handleId,
        nodeId,
        flowId: currentStore.rfId,
        panBy: currentStore.panBy,
        cancelConnection: currentStore.cancelConnection,
        onConnectStart: currentStore.onConnectStart,
        onConnectEnd: (...args) => store.getState().onConnectEnd?.(...args),
        updateConnection: currentStore.updateConnection,
        onConnect: onConnectExtended,
        isValidConnection: isValidConnection || ((...args) => store.getState().isValidConnection?.(...args) ?? true),
        getTransform: () => store.getState().transform,
        getFromHandle: () => store.getState().connection.fromHandle,
        autoPanSpeed: currentStore.autoPanSpeed,
        dragThreshold: currentStore.connectionDragThreshold
      });
    }
    if (isMouseTriggered) {
      onMouseDown?.(event);
    } else {
      onTouchStart?.(event);
    }
  };
  const onClick = (event) => {
    const { onClickConnectStart, onClickConnectEnd, connectionClickStartHandle, connectionMode, isValidConnection: isValidConnectionStore, lib, rfId: flowId, nodeLookup, connection: connectionState } = store.getState();
    if (!nodeId || !connectionClickStartHandle && !isConnectableStart) {
      return;
    }
    if (!connectionClickStartHandle) {
      onClickConnectStart?.(event.nativeEvent, { nodeId, handleId, handleType: type });
      store.setState({ connectionClickStartHandle: { nodeId, type, id: handleId } });
      return;
    }
    const doc = getHostForElement(event.target);
    const isValidConnectionHandler = isValidConnection || isValidConnectionStore;
    const { connection, isValid } = XYHandle.isValid(event.nativeEvent, {
      handle: {
        nodeId,
        id: handleId,
        type
      },
      connectionMode,
      fromNodeId: connectionClickStartHandle.nodeId,
      fromHandleId: connectionClickStartHandle.id || null,
      fromType: connectionClickStartHandle.type,
      isValidConnection: isValidConnectionHandler,
      flowId,
      doc,
      lib,
      nodeLookup
    });
    if (isValid && connection) {
      onConnectExtended(connection);
    }
    const connectionClone = structuredClone(connectionState);
    delete connectionClone.inProgress;
    connectionClone.toPosition = connectionClone.toHandle ? connectionClone.toHandle.position : null;
    onClickConnectEnd?.(event, connectionClone);
    store.setState({ connectionClickStartHandle: null });
  };
  return jsx("div", { "data-handleid": handleId, "data-nodeid": nodeId, "data-handlepos": position, "data-id": `${rfId}-${nodeId}-${handleId}-${type}`, className: cc([
    "react-flow__handle",
    `react-flow__handle-${position}`,
    "nodrag",
    noPanClassName,
    className,
    {
      source: !isTarget,
      target: isTarget,
      connectable: isConnectable,
      connectablestart: isConnectableStart,
      connectableend: isConnectableEnd,
      clickconnecting: clickConnecting,
      connectingfrom: connectingFrom,
      connectingto: connectingTo,
      valid,
      connectionindicator: isConnectable && (!connectionInProcess || isPossibleEndHandle) && (connectionInProcess || clickConnectionInProcess ? isConnectableEnd : isConnectableStart)
    }
  ]), onMouseDown: onPointerDown2, onTouchStart: onPointerDown2, onClick: connectOnClick ? onClick : undefined, ref, ...rest, children: children2 });
}
var Handle = memo(fixedForwardRef(HandleComponent));
function InputNode({ data, isConnectable, sourcePosition = Position.Bottom }) {
  return jsxs(Fragment, { children: [data?.label, jsx(Handle, { type: "source", position: sourcePosition, isConnectable })] });
}
function DefaultNode({ data, isConnectable, targetPosition = Position.Top, sourcePosition = Position.Bottom }) {
  return jsxs(Fragment, { children: [jsx(Handle, { type: "target", position: targetPosition, isConnectable }), data?.label, jsx(Handle, { type: "source", position: sourcePosition, isConnectable })] });
}
function GroupNode() {
  return null;
}
function OutputNode({ data, isConnectable, targetPosition = Position.Top }) {
  return jsxs(Fragment, { children: [jsx(Handle, { type: "target", position: targetPosition, isConnectable }), data?.label] });
}
var arrowKeyDiffs = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }
};
var builtinNodeTypes = {
  input: InputNode,
  default: DefaultNode,
  output: OutputNode,
  group: GroupNode
};
function getNodeInlineStyleDimensions(node) {
  if (node.internals.handleBounds === undefined) {
    return {
      width: node.width ?? node.initialWidth ?? node.style?.width,
      height: node.height ?? node.initialHeight ?? node.style?.height
    };
  }
  return {
    width: node.width ?? node.style?.width,
    height: node.height ?? node.style?.height
  };
}
var selector$e = (s) => {
  const { width, height, x, y } = getInternalNodesBounds(s.nodeLookup, {
    filter: (node) => !!node.selected
  });
  return {
    width: isNumeric(width) ? width : null,
    height: isNumeric(height) ? height : null,
    userSelectionActive: s.userSelectionActive,
    transformString: `translate(${s.transform[0]}px,${s.transform[1]}px) scale(${s.transform[2]}) translate(${x}px,${y}px)`
  };
};
function NodesSelection({ onSelectionContextMenu, noPanClassName, disableKeyboardA11y }) {
  const store = useStoreApi();
  const { width, height, transformString, userSelectionActive } = useStore(selector$e, shallow$1);
  const moveSelectedNodes = useMoveSelectedNodes();
  const nodeRef = useRef2(null);
  useEffect4(() => {
    if (!disableKeyboardA11y) {
      nodeRef.current?.focus({
        preventScroll: true
      });
    }
  }, [disableKeyboardA11y]);
  const shouldRender = !userSelectionActive && width !== null && height !== null;
  useDrag({
    nodeRef,
    disabled: !shouldRender
  });
  if (!shouldRender) {
    return null;
  }
  const onContextMenu = onSelectionContextMenu ? (event) => {
    const selectedNodes = store.getState().nodes.filter((n) => n.selected);
    onSelectionContextMenu(event, selectedNodes);
  } : undefined;
  const onKeyDown = (event) => {
    if (Object.prototype.hasOwnProperty.call(arrowKeyDiffs, event.key)) {
      event.preventDefault();
      moveSelectedNodes({
        direction: arrowKeyDiffs[event.key],
        factor: event.shiftKey ? 4 : 1
      });
    }
  };
  return jsx("div", { className: cc(["react-flow__nodesselection", "react-flow__container", noPanClassName]), style: {
    transform: transformString
  }, children: jsx("div", { ref: nodeRef, className: "react-flow__nodesselection-rect", onContextMenu, tabIndex: disableKeyboardA11y ? undefined : -1, onKeyDown: disableKeyboardA11y ? undefined : onKeyDown, style: {
    width,
    height
  } }) });
}
var win = typeof window !== "undefined" ? window : undefined;
var selector$d = (s) => {
  return { nodesSelectionActive: s.nodesSelectionActive, userSelectionActive: s.userSelectionActive };
};
function FlowRendererComponent({ children: children2, onPaneClick, onPaneMouseEnter, onPaneMouseMove, onPaneMouseLeave, onPaneContextMenu, onPaneScroll, paneClickDistance, deleteKeyCode, selectionKeyCode, selectionOnDrag, selectionMode, onSelectionStart, onSelectionEnd, multiSelectionKeyCode, panActivationKeyCode, zoomActivationKeyCode, elementsSelectable, zoomOnScroll, zoomOnPinch, panOnScroll: _panOnScroll, panOnScrollSpeed, panOnScrollMode, zoomOnDoubleClick, panOnDrag: _panOnDrag, autoPanOnSelection, defaultViewport: defaultViewport2, translateExtent, minZoom, maxZoom, preventScrolling, onSelectionContextMenu, noWheelClassName, noPanClassName, disableKeyboardA11y, onViewportChange, isControlledViewport }) {
  const { nodesSelectionActive, userSelectionActive } = useStore(selector$d, shallow$1);
  const selectionKeyPressed = useKeyPress(selectionKeyCode, { target: win });
  const panActivationKeyPressed = useKeyPress(panActivationKeyCode, { target: win });
  const panOnDrag = panActivationKeyPressed || _panOnDrag;
  const panOnScroll = panActivationKeyPressed || _panOnScroll;
  const _selectionOnDrag = selectionOnDrag && panOnDrag !== true;
  const isSelecting = selectionKeyPressed || userSelectionActive || _selectionOnDrag;
  useGlobalKeyHandler({ deleteKeyCode, multiSelectionKeyCode });
  return jsx(ZoomPane, { onPaneContextMenu, elementsSelectable, zoomOnScroll, zoomOnPinch, panOnScroll, panActivationKeyPressed, panOnScrollSpeed, panOnScrollMode, zoomOnDoubleClick, panOnDrag: !selectionKeyPressed && panOnDrag, defaultViewport: defaultViewport2, translateExtent, minZoom, maxZoom, zoomActivationKeyCode, preventScrolling, noWheelClassName, noPanClassName, onViewportChange, isControlledViewport, paneClickDistance, selectionOnDrag: _selectionOnDrag, children: jsxs(Pane, { onSelectionStart, onSelectionEnd, onPaneClick, onPaneMouseEnter, onPaneMouseMove, onPaneMouseLeave, onPaneContextMenu, onPaneScroll, panOnDrag, autoPanOnSelection, isSelecting: !!isSelecting, selectionMode, selectionKeyPressed, paneClickDistance, selectionOnDrag: _selectionOnDrag, children: [children2, nodesSelectionActive && jsx(NodesSelection, { onSelectionContextMenu, noPanClassName, disableKeyboardA11y })] }) });
}
FlowRendererComponent.displayName = "FlowRenderer";
var FlowRenderer = memo(FlowRendererComponent);
var selector$c = (onlyRenderVisible) => (s) => {
  return onlyRenderVisible ? getNodesInside(s.nodeLookup, { x: 0, y: 0, width: s.width, height: s.height }, s.transform, true).map((node) => node.id) : Array.from(s.nodeLookup.keys());
};
function useVisibleNodeIds(onlyRenderVisible) {
  const nodeIds = useStore(useCallback3(selector$c(onlyRenderVisible), [onlyRenderVisible]), shallow$1);
  return nodeIds;
}
var selector$b = (s) => s.updateNodeInternals;
function useResizeObserver() {
  const updateNodeInternals2 = useStore(selector$b);
  const [resizeObserver] = useState4(() => {
    if (typeof ResizeObserver === "undefined") {
      return null;
    }
    return new ResizeObserver((entries) => {
      const updates = new Map;
      entries.forEach((entry) => {
        const id2 = entry.target.getAttribute("data-id");
        updates.set(id2, {
          id: id2,
          nodeElement: entry.target,
          force: true
        });
      });
      updateNodeInternals2(updates);
    });
  });
  useEffect4(() => {
    return () => {
      resizeObserver?.disconnect();
    };
  }, [resizeObserver]);
  return resizeObserver;
}
function useNodeObserver({ node, nodeType, hasDimensions, resizeObserver }) {
  const store = useStoreApi();
  const nodeRef = useRef2(null);
  const observedNode = useRef2(null);
  const prevSourcePosition = useRef2(node.sourcePosition);
  const prevTargetPosition = useRef2(node.targetPosition);
  const prevType = useRef2(nodeType);
  const isInitialized = hasDimensions && !!node.internals.handleBounds;
  useEffect4(() => {
    if (nodeRef.current && !node.hidden && (!isInitialized || observedNode.current !== nodeRef.current)) {
      if (observedNode.current) {
        resizeObserver?.unobserve(observedNode.current);
      }
      resizeObserver?.observe(nodeRef.current);
      observedNode.current = nodeRef.current;
    }
  }, [isInitialized, node.hidden]);
  useEffect4(() => {
    return () => {
      if (observedNode.current) {
        resizeObserver?.unobserve(observedNode.current);
        observedNode.current = null;
      }
    };
  }, []);
  useEffect4(() => {
    if (nodeRef.current) {
      const typeChanged = prevType.current !== nodeType;
      const sourcePosChanged = prevSourcePosition.current !== node.sourcePosition;
      const targetPosChanged = prevTargetPosition.current !== node.targetPosition;
      if (typeChanged || sourcePosChanged || targetPosChanged) {
        prevType.current = nodeType;
        prevSourcePosition.current = node.sourcePosition;
        prevTargetPosition.current = node.targetPosition;
        store.getState().updateNodeInternals(new Map([[node.id, { id: node.id, nodeElement: nodeRef.current, force: true }]]));
      }
    }
  }, [node.id, nodeType, node.sourcePosition, node.targetPosition]);
  return nodeRef;
}
function NodeWrapper({ id: id2, onClick, onMouseEnter, onMouseMove, onMouseLeave, onContextMenu, onDoubleClick, nodesDraggable, elementsSelectable, nodesConnectable, nodesFocusable, resizeObserver, noDragClassName, noPanClassName, disableKeyboardA11y, rfId, nodeTypes, nodeClickDistance, onError }) {
  const { node, internals, isParent } = useStore((s) => {
    const node2 = s.nodeLookup.get(id2);
    const isParent2 = s.parentLookup.has(id2);
    return {
      node: node2,
      internals: node2.internals,
      isParent: isParent2
    };
  }, shallow$1);
  let nodeType = node.type || "default";
  let NodeComponent = nodeTypes?.[nodeType] || builtinNodeTypes[nodeType];
  if (NodeComponent === undefined) {
    onError?.("003", errorMessages["error003"](nodeType));
    nodeType = "default";
    NodeComponent = nodeTypes?.["default"] || builtinNodeTypes.default;
  }
  const isDraggable = !!(node.draggable || nodesDraggable && typeof node.draggable === "undefined");
  const isSelectable = !!(node.selectable || elementsSelectable && typeof node.selectable === "undefined");
  const isConnectable = !!(node.connectable || nodesConnectable && typeof node.connectable === "undefined");
  const isFocusable = !!(node.focusable || nodesFocusable && typeof node.focusable === "undefined");
  const store = useStoreApi();
  const hasDimensions = nodeHasDimensions(node);
  const nodeRef = useNodeObserver({ node, nodeType, hasDimensions, resizeObserver });
  const dragging = useDrag({
    nodeRef,
    disabled: node.hidden || !isDraggable,
    noDragClassName,
    handleSelector: node.dragHandle,
    nodeId: id2,
    isSelectable,
    nodeClickDistance
  });
  const moveSelectedNodes = useMoveSelectedNodes();
  if (node.hidden) {
    return null;
  }
  const nodeDimensions = getNodeDimensions(node);
  const inlineDimensions = getNodeInlineStyleDimensions(node);
  const hasPointerEvents = isSelectable || isDraggable || onClick || onMouseEnter || onMouseMove || onMouseLeave;
  const onMouseEnterHandler = onMouseEnter ? (event) => onMouseEnter(event, { ...internals.userNode }) : undefined;
  const onMouseMoveHandler = onMouseMove ? (event) => onMouseMove(event, { ...internals.userNode }) : undefined;
  const onMouseLeaveHandler = onMouseLeave ? (event) => onMouseLeave(event, { ...internals.userNode }) : undefined;
  const onContextMenuHandler = onContextMenu ? (event) => onContextMenu(event, { ...internals.userNode }) : undefined;
  const onDoubleClickHandler = onDoubleClick ? (event) => onDoubleClick(event, { ...internals.userNode }) : undefined;
  const onSelectNodeHandler = (event) => {
    const { selectNodesOnDrag, nodeDragThreshold } = store.getState();
    if (isSelectable && (!selectNodesOnDrag || !isDraggable || nodeDragThreshold > 0)) {
      handleNodeClick({
        id: id2,
        store,
        nodeRef
      });
    }
    if (onClick) {
      onClick(event, { ...internals.userNode });
    }
  };
  const onKeyDown = (event) => {
    if (isInputDOMNode(event.nativeEvent) || disableKeyboardA11y) {
      return;
    }
    if (elementSelectionKeys.includes(event.key) && isSelectable) {
      const unselect = event.key === "Escape";
      handleNodeClick({
        id: id2,
        store,
        unselect,
        nodeRef
      });
    } else if (isDraggable && node.selected && Object.prototype.hasOwnProperty.call(arrowKeyDiffs, event.key)) {
      event.preventDefault();
      const { ariaLabelConfig } = store.getState();
      store.setState({
        ariaLiveMessage: ariaLabelConfig["node.a11yDescription.ariaLiveMessage"]({
          direction: event.key.replace("Arrow", "").toLowerCase(),
          x: ~~internals.positionAbsolute.x,
          y: ~~internals.positionAbsolute.y
        })
      });
      moveSelectedNodes({
        direction: arrowKeyDiffs[event.key],
        factor: event.shiftKey ? 4 : 1
      });
    }
  };
  const onFocus = () => {
    if (disableKeyboardA11y || !nodeRef.current?.matches(":focus-visible")) {
      return;
    }
    const { transform: transform2, width, height, autoPanOnNodeFocus, setCenter } = store.getState();
    if (!autoPanOnNodeFocus) {
      return;
    }
    const withinViewport = getNodesInside(new Map([[id2, node]]), { x: 0, y: 0, width, height }, transform2, true).length > 0;
    if (!withinViewport) {
      setCenter(node.position.x + nodeDimensions.width / 2, node.position.y + nodeDimensions.height / 2, {
        zoom: transform2[2]
      });
    }
  };
  return jsx("div", { className: cc([
    "react-flow__node",
    `react-flow__node-${nodeType}`,
    {
      [noPanClassName]: isDraggable
    },
    node.className,
    {
      selected: node.selected,
      selectable: isSelectable,
      parent: isParent,
      draggable: isDraggable,
      dragging
    }
  ]), ref: nodeRef, style: {
    zIndex: internals.z,
    transform: `translate(${internals.positionAbsolute.x}px,${internals.positionAbsolute.y}px)`,
    pointerEvents: hasPointerEvents ? "all" : "none",
    visibility: hasDimensions ? "visible" : "hidden",
    ...node.style,
    ...inlineDimensions
  }, "data-id": id2, "data-testid": `rf__node-${id2}`, onMouseEnter: onMouseEnterHandler, onMouseMove: onMouseMoveHandler, onMouseLeave: onMouseLeaveHandler, onContextMenu: onContextMenuHandler, onClick: onSelectNodeHandler, onDoubleClick: onDoubleClickHandler, onKeyDown: isFocusable ? onKeyDown : undefined, tabIndex: isFocusable ? 0 : undefined, onFocus: isFocusable ? onFocus : undefined, role: node.ariaRole ?? (isFocusable ? "group" : undefined), "aria-roledescription": "node", "aria-describedby": disableKeyboardA11y ? undefined : `${ARIA_NODE_DESC_KEY}-${rfId}`, "aria-label": node.ariaLabel, ...node.domAttributes, children: jsx(Provider, { value: id2, children: jsx(NodeComponent, { id: id2, data: node.data, type: nodeType, positionAbsoluteX: internals.positionAbsolute.x, positionAbsoluteY: internals.positionAbsolute.y, selected: node.selected ?? false, selectable: isSelectable, draggable: isDraggable, deletable: node.deletable ?? true, isConnectable, sourcePosition: node.sourcePosition, targetPosition: node.targetPosition, dragging, dragHandle: node.dragHandle, zIndex: internals.z, parentId: node.parentId, ...nodeDimensions }) }) });
}
var NodeWrapper$1 = memo(NodeWrapper);
var selector$a = (s) => ({
  nodesConnectable: s.nodesConnectable,
  nodesFocusable: s.nodesFocusable,
  elementsSelectable: s.elementsSelectable,
  onError: s.onError
});
function NodeRendererComponent(props) {
  const { nodesConnectable, nodesFocusable, elementsSelectable, onError } = useStore(selector$a, shallow$1);
  const nodeIds = useVisibleNodeIds(props.onlyRenderVisibleElements);
  const resizeObserver = useResizeObserver();
  return jsx("div", { className: "react-flow__nodes", style: containerStyle, children: nodeIds.map((nodeId) => {
    return jsx(NodeWrapper$1, { id: nodeId, nodeTypes: props.nodeTypes, nodeExtent: props.nodeExtent, onClick: props.onNodeClick, onMouseEnter: props.onNodeMouseEnter, onMouseMove: props.onNodeMouseMove, onMouseLeave: props.onNodeMouseLeave, onContextMenu: props.onNodeContextMenu, onDoubleClick: props.onNodeDoubleClick, noDragClassName: props.noDragClassName, noPanClassName: props.noPanClassName, rfId: props.rfId, disableKeyboardA11y: props.disableKeyboardA11y, resizeObserver, nodesDraggable: props.nodesDraggable ?? true, nodesConnectable, nodesFocusable, elementsSelectable, nodeClickDistance: props.nodeClickDistance, onError }, nodeId);
  }) });
}
NodeRendererComponent.displayName = "NodeRenderer";
var NodeRenderer = memo(NodeRendererComponent);
function useVisibleEdgeIds(onlyRenderVisible) {
  const edgeIds = useStore(useCallback3((s) => {
    if (!onlyRenderVisible) {
      return s.edges.map((edge) => edge.id);
    }
    const visibleEdgeIds = [];
    if (s.width && s.height) {
      for (const edge of s.edges) {
        const sourceNode = s.nodeLookup.get(edge.source);
        const targetNode = s.nodeLookup.get(edge.target);
        if (sourceNode && targetNode && isEdgeVisible({
          sourceNode,
          targetNode,
          width: s.width,
          height: s.height,
          transform: s.transform
        })) {
          visibleEdgeIds.push(edge.id);
        }
      }
    }
    return visibleEdgeIds;
  }, [onlyRenderVisible]), shallow$1);
  return edgeIds;
}
var ArrowSymbol = ({ color: color2 = "none", strokeWidth = 1 }) => {
  const style2 = {
    strokeWidth,
    ...color2 && { stroke: color2 }
  };
  return jsx("polyline", { className: "arrow", style: style2, strokeLinecap: "round", fill: "none", strokeLinejoin: "round", points: "-5,-4 0,0 -5,4" });
};
var ArrowClosedSymbol = ({ color: color2 = "none", strokeWidth = 1 }) => {
  const style2 = {
    strokeWidth,
    ...color2 && { stroke: color2, fill: color2 }
  };
  return jsx("polyline", { className: "arrowclosed", style: style2, strokeLinecap: "round", strokeLinejoin: "round", points: "-5,-4 0,0 -5,4 -5,-4" });
};
var MarkerSymbols = {
  [MarkerType.Arrow]: ArrowSymbol,
  [MarkerType.ArrowClosed]: ArrowClosedSymbol
};
function useMarkerSymbol(type) {
  const store = useStoreApi();
  const symbol = useMemo3(() => {
    const symbolExists = Object.prototype.hasOwnProperty.call(MarkerSymbols, type);
    if (!symbolExists) {
      store.getState().onError?.("009", errorMessages["error009"](type));
      return null;
    }
    return MarkerSymbols[type];
  }, [type]);
  return symbol;
}
var Marker = ({ id: id2, type, color: color2, width = 12.5, height = 12.5, markerUnits = "strokeWidth", strokeWidth, orient = "auto-start-reverse" }) => {
  const Symbol2 = useMarkerSymbol(type);
  if (!Symbol2) {
    return null;
  }
  return jsx("marker", { className: "react-flow__arrowhead", id: id2, markerWidth: `${width}`, markerHeight: `${height}`, viewBox: "-10 -10 20 20", markerUnits, orient, refX: "0", refY: "0", children: jsx(Symbol2, { color: color2, strokeWidth }) });
};
var MarkerDefinitions = ({ defaultColor, rfId }) => {
  const edges = useStore((s) => s.edges);
  const defaultEdgeOptions = useStore((s) => s.defaultEdgeOptions);
  const markers = useMemo3(() => {
    const markers2 = createMarkerIds(edges, {
      id: rfId,
      defaultColor,
      defaultMarkerStart: defaultEdgeOptions?.markerStart,
      defaultMarkerEnd: defaultEdgeOptions?.markerEnd
    });
    return markers2;
  }, [edges, defaultEdgeOptions, rfId, defaultColor]);
  if (!markers.length) {
    return null;
  }
  return jsx("svg", { className: "react-flow__marker", "aria-hidden": "true", children: jsx("defs", { children: markers.map((marker) => jsx(Marker, { id: marker.id, type: marker.type, color: marker.color, width: marker.width, height: marker.height, markerUnits: marker.markerUnits, strokeWidth: marker.strokeWidth, orient: marker.orient }, marker.id)) }) });
};
MarkerDefinitions.displayName = "MarkerDefinitions";
var MarkerDefinitions$1 = memo(MarkerDefinitions);
function EdgeTextComponent({ x, y, label, labelStyle, labelShowBg = true, labelBgStyle, labelBgPadding = [2, 4], labelBgBorderRadius = 2, children: children2, className, ...rest }) {
  const [edgeTextBbox, setEdgeTextBbox] = useState4({ x: 1, y: 0, width: 0, height: 0 });
  const edgeTextClasses = cc(["react-flow__edge-textwrapper", className]);
  const edgeTextRef = useRef2(null);
  useEffect4(() => {
    if (edgeTextRef.current) {
      const textBbox = edgeTextRef.current.getBBox();
      setEdgeTextBbox({
        x: textBbox.x,
        y: textBbox.y,
        width: textBbox.width,
        height: textBbox.height
      });
    }
  }, [label]);
  if (!label) {
    return null;
  }
  return jsxs("g", { transform: `translate(${x - edgeTextBbox.width / 2} ${y - edgeTextBbox.height / 2})`, className: edgeTextClasses, visibility: edgeTextBbox.width ? "visible" : "hidden", ...rest, children: [labelShowBg && jsx("rect", { width: edgeTextBbox.width + 2 * labelBgPadding[0], x: -labelBgPadding[0], y: -labelBgPadding[1], height: edgeTextBbox.height + 2 * labelBgPadding[1], className: "react-flow__edge-textbg", style: labelBgStyle, rx: labelBgBorderRadius, ry: labelBgBorderRadius }), jsx("text", { className: "react-flow__edge-text", y: edgeTextBbox.height / 2, dy: "0.3em", ref: edgeTextRef, style: labelStyle, children: label }), children2] });
}
EdgeTextComponent.displayName = "EdgeText";
var EdgeText = memo(EdgeTextComponent);
function BaseEdge({ path, labelX, labelY, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, interactionWidth = 20, ...props }) {
  return jsxs(Fragment, { children: [jsx("path", { ...props, d: path, fill: "none", className: cc(["react-flow__edge-path", props.className]) }), interactionWidth ? jsx("path", { d: path, fill: "none", strokeOpacity: 0, strokeWidth: interactionWidth, className: "react-flow__edge-interaction" }) : null, label && isNumeric(labelX) && isNumeric(labelY) ? jsx(EdgeText, { x: labelX, y: labelY, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius }) : null] });
}
function getControl({ pos, x1, y1, x2, y2 }) {
  if (pos === Position.Left || pos === Position.Right) {
    return [0.5 * (x1 + x2), y1];
  }
  return [x1, 0.5 * (y1 + y2)];
}
function getSimpleBezierPath({ sourceX, sourceY, sourcePosition = Position.Bottom, targetX, targetY, targetPosition = Position.Top }) {
  const [sourceControlX, sourceControlY] = getControl({
    pos: sourcePosition,
    x1: sourceX,
    y1: sourceY,
    x2: targetX,
    y2: targetY
  });
  const [targetControlX, targetControlY] = getControl({
    pos: targetPosition,
    x1: targetX,
    y1: targetY,
    x2: sourceX,
    y2: sourceY
  });
  const [labelX, labelY, offsetX, offsetY] = getBezierEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourceControlX,
    sourceControlY,
    targetControlX,
    targetControlY
  });
  return [
    `M${sourceX},${sourceY} C${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetX},${targetY}`,
    labelX,
    labelY,
    offsetX,
    offsetY
  ];
}
function createSimpleBezierEdge(params) {
  return memo(({ id: id2, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, style: style2, markerEnd, markerStart, interactionWidth }) => {
    const [path, labelX, labelY] = getSimpleBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition
    });
    const _id = params.isInternal ? undefined : id2;
    return jsx(BaseEdge, { id: _id, path, labelX, labelY, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, style: style2, markerEnd, markerStart, interactionWidth });
  });
}
var SimpleBezierEdge = createSimpleBezierEdge({ isInternal: false });
var SimpleBezierEdgeInternal = createSimpleBezierEdge({ isInternal: true });
SimpleBezierEdge.displayName = "SimpleBezierEdge";
SimpleBezierEdgeInternal.displayName = "SimpleBezierEdgeInternal";
function createSmoothStepEdge(params) {
  return memo(({ id: id2, sourceX, sourceY, targetX, targetY, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, style: style2, sourcePosition = Position.Bottom, targetPosition = Position.Top, markerEnd, markerStart, pathOptions, interactionWidth }) => {
    const [path, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: pathOptions?.borderRadius,
      offset: pathOptions?.offset,
      stepPosition: pathOptions?.stepPosition
    });
    const _id = params.isInternal ? undefined : id2;
    return jsx(BaseEdge, { id: _id, path, labelX, labelY, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, style: style2, markerEnd, markerStart, interactionWidth });
  });
}
var SmoothStepEdge = createSmoothStepEdge({ isInternal: false });
var SmoothStepEdgeInternal = createSmoothStepEdge({ isInternal: true });
SmoothStepEdge.displayName = "SmoothStepEdge";
SmoothStepEdgeInternal.displayName = "SmoothStepEdgeInternal";
function createStepEdge(params) {
  return memo(({ id: id2, ...props }) => {
    const _id = params.isInternal ? undefined : id2;
    return jsx(SmoothStepEdge, { ...props, id: _id, pathOptions: useMemo3(() => ({ borderRadius: 0, offset: props.pathOptions?.offset }), [props.pathOptions?.offset]) });
  });
}
var StepEdge = createStepEdge({ isInternal: false });
var StepEdgeInternal = createStepEdge({ isInternal: true });
StepEdge.displayName = "StepEdge";
StepEdgeInternal.displayName = "StepEdgeInternal";
function createStraightEdge(params) {
  return memo(({ id: id2, sourceX, sourceY, targetX, targetY, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, style: style2, markerEnd, markerStart, interactionWidth }) => {
    const [path, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
    const _id = params.isInternal ? undefined : id2;
    return jsx(BaseEdge, { id: _id, path, labelX, labelY, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, style: style2, markerEnd, markerStart, interactionWidth });
  });
}
var StraightEdge = createStraightEdge({ isInternal: false });
var StraightEdgeInternal = createStraightEdge({ isInternal: true });
StraightEdge.displayName = "StraightEdge";
StraightEdgeInternal.displayName = "StraightEdgeInternal";
function createBezierEdge(params) {
  return memo(({ id: id2, sourceX, sourceY, targetX, targetY, sourcePosition = Position.Bottom, targetPosition = Position.Top, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, style: style2, markerEnd, markerStart, pathOptions, interactionWidth }) => {
    const [path, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature: pathOptions?.curvature
    });
    const _id = params.isInternal ? undefined : id2;
    return jsx(BaseEdge, { id: _id, path, labelX, labelY, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, style: style2, markerEnd, markerStart, interactionWidth });
  });
}
var BezierEdge = createBezierEdge({ isInternal: false });
var BezierEdgeInternal = createBezierEdge({ isInternal: true });
BezierEdge.displayName = "BezierEdge";
BezierEdgeInternal.displayName = "BezierEdgeInternal";
var builtinEdgeTypes = {
  default: BezierEdgeInternal,
  straight: StraightEdgeInternal,
  step: StepEdgeInternal,
  smoothstep: SmoothStepEdgeInternal,
  simplebezier: SimpleBezierEdgeInternal
};
var nullPosition = {
  sourceX: null,
  sourceY: null,
  targetX: null,
  targetY: null,
  sourcePosition: null,
  targetPosition: null,
  zIndex: undefined
};
var shiftX = (x, shift, position) => {
  if (position === Position.Left)
    return x - shift;
  if (position === Position.Right)
    return x + shift;
  return x;
};
var shiftY = (y, shift, position) => {
  if (position === Position.Top)
    return y - shift;
  if (position === Position.Bottom)
    return y + shift;
  return y;
};
var EdgeUpdaterClassName = "react-flow__edgeupdater";
function EdgeAnchor({ position, centerX, centerY, radius = 10, onMouseDown, onMouseEnter, onMouseOut, type }) {
  return jsx("circle", { onMouseDown, onMouseEnter, onMouseOut, className: cc([EdgeUpdaterClassName, `${EdgeUpdaterClassName}-${type}`]), cx: shiftX(centerX, radius, position), cy: shiftY(centerY, radius, position), r: radius, stroke: "transparent", fill: "transparent" });
}
function EdgeUpdateAnchors({ isReconnectable, reconnectRadius, edge, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, onReconnect, onReconnectStart, onReconnectEnd, setReconnecting, setUpdateHover }) {
  const store = useStoreApi();
  const handleEdgeUpdater = (event, oppositeHandle) => {
    if (event.button !== 0) {
      return;
    }
    const { autoPanOnConnect, domNode, connectionMode, connectionRadius, lib, onConnectStart, cancelConnection, nodeLookup, rfId: flowId, panBy: panBy2, updateConnection } = store.getState();
    const isTarget = oppositeHandle.type === "target";
    const _onReconnectEnd = (evt, connectionState) => {
      setReconnecting(false);
      onReconnectEnd?.(evt, edge, oppositeHandle.type, connectionState);
    };
    const onConnectEdge = (connection) => onReconnect?.(edge, connection);
    const _onConnectStart = (_event, params) => {
      setReconnecting(true);
      onReconnectStart?.(event, edge, oppositeHandle.type);
      onConnectStart?.(_event, params);
    };
    XYHandle.onPointerDown(event.nativeEvent, {
      autoPanOnConnect,
      connectionMode,
      connectionRadius,
      domNode,
      handleId: oppositeHandle.id,
      nodeId: oppositeHandle.nodeId,
      nodeLookup,
      isTarget,
      edgeUpdaterType: oppositeHandle.type,
      lib,
      flowId,
      cancelConnection,
      panBy: panBy2,
      isValidConnection: (...args) => store.getState().isValidConnection?.(...args) ?? true,
      onConnect: onConnectEdge,
      onConnectStart: _onConnectStart,
      onConnectEnd: (...args) => store.getState().onConnectEnd?.(...args),
      onReconnectEnd: _onReconnectEnd,
      updateConnection,
      getTransform: () => store.getState().transform,
      getFromHandle: () => store.getState().connection.fromHandle,
      dragThreshold: store.getState().connectionDragThreshold,
      handleDomNode: event.currentTarget
    });
  };
  const onReconnectSourceMouseDown = (event) => handleEdgeUpdater(event, { nodeId: edge.target, id: edge.targetHandle ?? null, type: "target" });
  const onReconnectTargetMouseDown = (event) => handleEdgeUpdater(event, { nodeId: edge.source, id: edge.sourceHandle ?? null, type: "source" });
  const onReconnectMouseEnter = () => setUpdateHover(true);
  const onReconnectMouseOut = () => setUpdateHover(false);
  return jsxs(Fragment, { children: [(isReconnectable === true || isReconnectable === "source") && jsx(EdgeAnchor, { position: sourcePosition, centerX: sourceX, centerY: sourceY, radius: reconnectRadius, onMouseDown: onReconnectSourceMouseDown, onMouseEnter: onReconnectMouseEnter, onMouseOut: onReconnectMouseOut, type: "source" }), (isReconnectable === true || isReconnectable === "target") && jsx(EdgeAnchor, { position: targetPosition, centerX: targetX, centerY: targetY, radius: reconnectRadius, onMouseDown: onReconnectTargetMouseDown, onMouseEnter: onReconnectMouseEnter, onMouseOut: onReconnectMouseOut, type: "target" })] });
}
function EdgeWrapper({ id: id2, edgesFocusable, edgesReconnectable, elementsSelectable, onClick, onDoubleClick, onContextMenu, onMouseEnter, onMouseMove, onMouseLeave, reconnectRadius, onReconnect, onReconnectStart, onReconnectEnd, rfId, edgeTypes, noPanClassName, onError, disableKeyboardA11y }) {
  let edge = useStore((s) => s.edgeLookup.get(id2));
  const defaultEdgeOptions = useStore((s) => s.defaultEdgeOptions);
  edge = defaultEdgeOptions ? { ...defaultEdgeOptions, ...edge } : edge;
  let edgeType = edge.type || "default";
  let EdgeComponent = edgeTypes?.[edgeType] || builtinEdgeTypes[edgeType];
  if (EdgeComponent === undefined) {
    onError?.("011", errorMessages["error011"](edgeType));
    edgeType = "default";
    EdgeComponent = edgeTypes?.["default"] || builtinEdgeTypes.default;
  }
  const isFocusable = !!(edge.focusable || edgesFocusable && typeof edge.focusable === "undefined");
  const isReconnectable = typeof onReconnect !== "undefined" && (edge.reconnectable || edgesReconnectable && typeof edge.reconnectable === "undefined");
  const isSelectable = !!(edge.selectable || elementsSelectable && typeof edge.selectable === "undefined");
  const edgeRef = useRef2(null);
  const [updateHover, setUpdateHover] = useState4(false);
  const [reconnecting, setReconnecting] = useState4(false);
  const store = useStoreApi();
  const { zIndex = edge.zIndex, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = useStore(useCallback3((store2) => {
    const sourceNode = store2.nodeLookup.get(edge.source);
    const targetNode = store2.nodeLookup.get(edge.target);
    if (!sourceNode || !targetNode) {
      return nullPosition;
    }
    const edgePosition = getEdgePosition({
      id: id2,
      sourceNode,
      targetNode,
      sourceHandle: edge.sourceHandle || null,
      targetHandle: edge.targetHandle || null,
      connectionMode: store2.connectionMode,
      onError
    });
    const zIndex2 = getElevatedEdgeZIndex({
      selected: edge.selected,
      zIndex: edge.zIndex,
      sourceNode,
      targetNode,
      elevateOnSelect: store2.elevateEdgesOnSelect,
      zIndexMode: store2.zIndexMode
    });
    return {
      ...edgePosition || nullPosition,
      zIndex: zIndex2
    };
  }, [edge.source, edge.target, edge.sourceHandle, edge.targetHandle, edge.selected, edge.zIndex, onError]), shallow$1);
  const markerStartUrl = useMemo3(() => edge.markerStart ? `url('#${getMarkerId(edge.markerStart, rfId)}')` : undefined, [edge.markerStart, rfId]);
  const markerEndUrl = useMemo3(() => edge.markerEnd ? `url('#${getMarkerId(edge.markerEnd, rfId)}')` : undefined, [edge.markerEnd, rfId]);
  if (edge.hidden || sourceX === null || sourceY === null || targetX === null || targetY === null) {
    return null;
  }
  const onEdgeClick = (event) => {
    const { addSelectedEdges, unselectNodesAndEdges, multiSelectionActive } = store.getState();
    if (isSelectable) {
      store.setState({ nodesSelectionActive: false });
      if (edge.selected && multiSelectionActive) {
        unselectNodesAndEdges({ nodes: [], edges: [edge] });
        edgeRef.current?.blur();
      } else {
        addSelectedEdges([id2]);
      }
    }
    if (onClick) {
      onClick(event, edge);
    }
  };
  const onEdgeDoubleClick = onDoubleClick ? (event) => {
    onDoubleClick(event, { ...edge });
  } : undefined;
  const onEdgeContextMenu = onContextMenu ? (event) => {
    onContextMenu(event, { ...edge });
  } : undefined;
  const onEdgeMouseEnter = onMouseEnter ? (event) => {
    onMouseEnter(event, { ...edge });
  } : undefined;
  const onEdgeMouseMove = onMouseMove ? (event) => {
    onMouseMove(event, { ...edge });
  } : undefined;
  const onEdgeMouseLeave = onMouseLeave ? (event) => {
    onMouseLeave(event, { ...edge });
  } : undefined;
  const onKeyDown = (event) => {
    if (!disableKeyboardA11y && elementSelectionKeys.includes(event.key) && isSelectable) {
      const { unselectNodesAndEdges, addSelectedEdges } = store.getState();
      const unselect = event.key === "Escape";
      if (unselect) {
        edgeRef.current?.blur();
        unselectNodesAndEdges({ edges: [edge] });
      } else {
        addSelectedEdges([id2]);
      }
    }
  };
  return jsx("svg", { style: { zIndex }, children: jsxs("g", { className: cc([
    "react-flow__edge",
    `react-flow__edge-${edgeType}`,
    edge.className,
    noPanClassName,
    {
      selected: edge.selected,
      animated: edge.animated,
      inactive: !isSelectable && !onClick,
      updating: updateHover,
      selectable: isSelectable
    }
  ]), onClick: onEdgeClick, onDoubleClick: onEdgeDoubleClick, onContextMenu: onEdgeContextMenu, onMouseEnter: onEdgeMouseEnter, onMouseMove: onEdgeMouseMove, onMouseLeave: onEdgeMouseLeave, onKeyDown: isFocusable ? onKeyDown : undefined, tabIndex: isFocusable ? 0 : undefined, role: edge.ariaRole ?? (isFocusable ? "group" : "img"), "aria-roledescription": "edge", "data-id": id2, "data-testid": `rf__edge-${id2}`, "aria-label": edge.ariaLabel === null ? undefined : edge.ariaLabel || `Edge from ${edge.source} to ${edge.target}`, "aria-describedby": isFocusable ? `${ARIA_EDGE_DESC_KEY}-${rfId}` : undefined, ref: edgeRef, ...edge.domAttributes, children: [!reconnecting && jsx(EdgeComponent, { id: id2, source: edge.source, target: edge.target, type: edge.type, selected: edge.selected, animated: edge.animated, selectable: isSelectable, deletable: edge.deletable ?? true, label: edge.label, labelStyle: edge.labelStyle, labelShowBg: edge.labelShowBg, labelBgStyle: edge.labelBgStyle, labelBgPadding: edge.labelBgPadding, labelBgBorderRadius: edge.labelBgBorderRadius, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data: edge.data, style: edge.style, sourceHandleId: edge.sourceHandle, targetHandleId: edge.targetHandle, markerStart: markerStartUrl, markerEnd: markerEndUrl, pathOptions: "pathOptions" in edge ? edge.pathOptions : undefined, interactionWidth: edge.interactionWidth }), isReconnectable && jsx(EdgeUpdateAnchors, { edge, isReconnectable, reconnectRadius, onReconnect, onReconnectStart, onReconnectEnd, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, setUpdateHover, setReconnecting })] }) });
}
var EdgeWrapper$1 = memo(EdgeWrapper);
var selector$9 = (s) => ({
  edgesFocusable: s.edgesFocusable,
  edgesReconnectable: s.edgesReconnectable,
  elementsSelectable: s.elementsSelectable,
  connectionMode: s.connectionMode,
  onError: s.onError
});
function EdgeRendererComponent({ defaultMarkerColor, onlyRenderVisibleElements, rfId, edgeTypes, noPanClassName, onReconnect, onEdgeContextMenu, onEdgeMouseEnter, onEdgeMouseMove, onEdgeMouseLeave, onEdgeClick, reconnectRadius, onEdgeDoubleClick, onReconnectStart, onReconnectEnd, disableKeyboardA11y }) {
  const { edgesFocusable, edgesReconnectable, elementsSelectable, onError } = useStore(selector$9, shallow$1);
  const edgeIds = useVisibleEdgeIds(onlyRenderVisibleElements);
  return jsxs("div", { className: "react-flow__edges", children: [jsx(MarkerDefinitions$1, { defaultColor: defaultMarkerColor, rfId }), edgeIds.map((id2) => {
    return jsx(EdgeWrapper$1, { id: id2, edgesFocusable, edgesReconnectable, elementsSelectable, noPanClassName, onReconnect, onContextMenu: onEdgeContextMenu, onMouseEnter: onEdgeMouseEnter, onMouseMove: onEdgeMouseMove, onMouseLeave: onEdgeMouseLeave, onClick: onEdgeClick, reconnectRadius, onDoubleClick: onEdgeDoubleClick, onReconnectStart, onReconnectEnd, rfId, onError, edgeTypes, disableKeyboardA11y }, id2);
  })] });
}
EdgeRendererComponent.displayName = "EdgeRenderer";
var EdgeRenderer = memo(EdgeRendererComponent);
var toTransformString = (transform2) => `translate(${transform2[0]}px,${transform2[1]}px) scale(${transform2[2]})`;
function Viewport({ children: children2 }) {
  const store = useStoreApi();
  const viewportRef = useRef2(null);
  const [initialTransform] = useState4(() => store.getState().transform);
  useIsomorphicLayoutEffect(() => {
    let prevTransform = null;
    const applyTransform = () => {
      const transform2 = store.getState().transform;
      if (prevTransform && transform2[0] === prevTransform[0] && transform2[1] === prevTransform[1] && transform2[2] === prevTransform[2]) {
        return;
      }
      prevTransform = transform2;
      if (viewportRef.current) {
        viewportRef.current.style.transform = toTransformString(transform2);
      }
    };
    applyTransform();
    return store.subscribe(applyTransform);
  }, [store]);
  return jsx("div", { ref: viewportRef, className: "react-flow__viewport xyflow__viewport react-flow__container", style: { transform: toTransformString(initialTransform) }, children: children2 });
}
function useOnInitHandler(onInit) {
  const rfInstance = useReactFlow();
  const isInitialized = useRef2(false);
  useEffect4(() => {
    if (!isInitialized.current && rfInstance.viewportInitialized && onInit) {
      setTimeout(() => onInit(rfInstance), 1);
      isInitialized.current = true;
    }
  }, [onInit, rfInstance.viewportInitialized]);
}
var selector$8 = (state) => state.panZoom?.syncViewport;
function useViewportSync(viewport) {
  const syncViewport = useStore(selector$8);
  const store = useStoreApi();
  useEffect4(() => {
    if (viewport) {
      syncViewport?.(viewport);
      store.setState({ transform: [viewport.x, viewport.y, viewport.zoom] });
    }
  }, [viewport, syncViewport]);
  return null;
}
function storeSelector$1(s) {
  return s.connection.inProgress ? { ...s.connection, to: pointToRendererPoint(s.connection.to, s.transform) } : { ...s.connection };
}
function getSelector(connectionSelector) {
  if (connectionSelector) {
    const combinedSelector = (s) => {
      const connection = storeSelector$1(s);
      return connectionSelector(connection);
    };
    return combinedSelector;
  }
  return storeSelector$1;
}
function useConnection(connectionSelector) {
  const combinedSelector = getSelector(connectionSelector);
  return useStore(combinedSelector, shallow$1);
}
var selector$7 = (s) => ({
  nodesConnectable: s.nodesConnectable,
  isValid: s.connection.isValid,
  inProgress: s.connection.inProgress,
  width: s.width,
  height: s.height
});
function ConnectionLineWrapper({ containerStyle: containerStyle2, style: style2, type, component }) {
  const { nodesConnectable, width, height, isValid, inProgress } = useStore(selector$7, shallow$1);
  const renderConnection = !!(width && nodesConnectable && inProgress);
  if (!renderConnection) {
    return null;
  }
  return jsx("svg", { style: containerStyle2, width, height, className: "react-flow__connectionline react-flow__container", children: jsx("g", { className: cc(["react-flow__connection", getConnectionStatus(isValid)]), children: jsx(ConnectionLine, { style: style2, type, CustomComponent: component, isValid }) }) });
}
var ConnectionLine = ({ style: style2, type = ConnectionLineType.Bezier, CustomComponent, isValid }) => {
  const { inProgress, from, fromNode, fromHandle, fromPosition, to, toNode, toHandle, toPosition, pointer } = useConnection();
  if (!inProgress) {
    return;
  }
  if (CustomComponent) {
    return jsx(CustomComponent, { connectionLineType: type, connectionLineStyle: style2, fromNode, fromHandle, fromX: from.x, fromY: from.y, toX: to.x, toY: to.y, fromPosition, toPosition, connectionStatus: getConnectionStatus(isValid), toNode, toHandle, pointer });
  }
  let path = "";
  const pathParams = {
    sourceX: from.x,
    sourceY: from.y,
    sourcePosition: fromPosition,
    targetX: to.x,
    targetY: to.y,
    targetPosition: toPosition
  };
  switch (type) {
    case ConnectionLineType.Bezier:
      [path] = getBezierPath(pathParams);
      break;
    case ConnectionLineType.SimpleBezier:
      [path] = getSimpleBezierPath(pathParams);
      break;
    case ConnectionLineType.Step:
      [path] = getSmoothStepPath({
        ...pathParams,
        borderRadius: 0
      });
      break;
    case ConnectionLineType.SmoothStep:
      [path] = getSmoothStepPath(pathParams);
      break;
    default:
      [path] = getStraightPath(pathParams);
  }
  return jsx("path", { d: path, fill: "none", className: "react-flow__connection-path", style: style2 });
};
ConnectionLine.displayName = "ConnectionLine";
var emptyTypes = {};
function useNodeOrEdgeTypesWarning(nodeOrEdgeTypes = emptyTypes) {
  const typesRef = useRef2(nodeOrEdgeTypes);
  const store = useStoreApi();
  useEffect4(() => {
    if (false) {}
  }, [nodeOrEdgeTypes]);
}
function useStylesLoadedWarning() {
  const store = useStoreApi();
  const checked = useRef2(false);
  useEffect4(() => {
    if (false) {}
  }, []);
}
function GraphViewComponent({ nodeTypes, edgeTypes, onInit, onNodeClick, onEdgeClick, onNodeDoubleClick, onEdgeDoubleClick, onNodeMouseEnter, onNodeMouseMove, onNodeMouseLeave, onNodeContextMenu, onSelectionContextMenu, onSelectionStart, onSelectionEnd, connectionLineType, connectionLineStyle, connectionLineComponent, connectionLineContainerStyle, selectionKeyCode, selectionOnDrag, selectionMode, multiSelectionKeyCode, panActivationKeyCode, zoomActivationKeyCode, deleteKeyCode, onlyRenderVisibleElements, elementsSelectable, defaultViewport: defaultViewport2, translateExtent, minZoom, maxZoom, preventScrolling, defaultMarkerColor, zoomOnScroll, zoomOnPinch, panOnScroll, panOnScrollSpeed, panOnScrollMode, zoomOnDoubleClick, panOnDrag, autoPanOnSelection, onPaneClick, onPaneMouseEnter, onPaneMouseMove, onPaneMouseLeave, onPaneScroll, onPaneContextMenu, paneClickDistance, nodeClickDistance, onEdgeContextMenu, onEdgeMouseEnter, onEdgeMouseMove, onEdgeMouseLeave, reconnectRadius, onReconnect, onReconnectStart, onReconnectEnd, noDragClassName, noWheelClassName, noPanClassName, disableKeyboardA11y, nodeExtent, rfId, viewport, onViewportChange, nodesDraggable }) {
  useNodeOrEdgeTypesWarning(nodeTypes);
  useNodeOrEdgeTypesWarning(edgeTypes);
  useStylesLoadedWarning();
  useOnInitHandler(onInit);
  useViewportSync(viewport);
  return jsx(FlowRenderer, { onPaneClick, onPaneMouseEnter, onPaneMouseMove, onPaneMouseLeave, onPaneContextMenu, onPaneScroll, paneClickDistance, deleteKeyCode, selectionKeyCode, selectionOnDrag, selectionMode, onSelectionStart, onSelectionEnd, multiSelectionKeyCode, panActivationKeyCode, zoomActivationKeyCode, elementsSelectable, zoomOnScroll, zoomOnPinch, zoomOnDoubleClick, panOnScroll, panOnScrollSpeed, panOnScrollMode, panOnDrag, autoPanOnSelection, defaultViewport: defaultViewport2, translateExtent, minZoom, maxZoom, onSelectionContextMenu, preventScrolling, noDragClassName, noWheelClassName, noPanClassName, disableKeyboardA11y, onViewportChange, isControlledViewport: !!viewport, children: jsxs(Viewport, { children: [jsx(EdgeRenderer, { edgeTypes, onEdgeClick, onEdgeDoubleClick, onReconnect, onReconnectStart, onReconnectEnd, onlyRenderVisibleElements, onEdgeContextMenu, onEdgeMouseEnter, onEdgeMouseMove, onEdgeMouseLeave, reconnectRadius, defaultMarkerColor, noPanClassName, disableKeyboardA11y, rfId }), jsx(ConnectionLineWrapper, { style: connectionLineStyle, type: connectionLineType, component: connectionLineComponent, containerStyle: connectionLineContainerStyle }), jsx("div", { className: "react-flow__edgelabel-renderer" }), jsx(NodeRenderer, { nodeTypes, onNodeClick, onNodeDoubleClick, onNodeMouseEnter, onNodeMouseMove, onNodeMouseLeave, onNodeContextMenu, nodeClickDistance, onlyRenderVisibleElements, noPanClassName, noDragClassName, disableKeyboardA11y, nodeExtent, rfId, nodesDraggable }), jsx("div", { className: "react-flow__viewport-portal" })] }) });
}
GraphViewComponent.displayName = "GraphView";
var GraphView = memo(GraphViewComponent);
var devWarn = createDevWarn("React Flow", "https://reactflow.dev/");
var getInitialState = ({ nodes, edges, defaultNodes, defaultEdges, width, height, fitView, fitViewOptions, minZoom = 0.5, maxZoom = 2, nodeOrigin, nodeExtent, zIndexMode = "basic" } = {}) => {
  const nodeLookup = new Map;
  const parentLookup = new Map;
  const connectionLookup = new Map;
  const edgeLookup = new Map;
  const storeEdges = defaultEdges ?? edges ?? [];
  const storeNodes = defaultNodes ?? nodes ?? [];
  const storeNodeOrigin = nodeOrigin ?? [0, 0];
  const storeNodeExtent = nodeExtent ?? infiniteExtent;
  updateConnectionLookup(connectionLookup, edgeLookup, storeEdges);
  const { nodesInitialized } = adoptUserNodes(storeNodes, nodeLookup, parentLookup, {
    nodeOrigin: storeNodeOrigin,
    nodeExtent: storeNodeExtent,
    zIndexMode
  });
  let transform2 = [0, 0, 1];
  if (fitView && width && height) {
    const bounds = getInternalNodesBounds(nodeLookup, {
      filter: (node) => !!((node.width || node.initialWidth) && (node.height || node.initialHeight))
    });
    const { x, y, zoom } = getViewportForBounds(bounds, width, height, minZoom, maxZoom, fitViewOptions?.padding ?? 0.1);
    transform2 = [x, y, zoom];
  }
  return {
    rfId: "1",
    width: width ?? 0,
    height: height ?? 0,
    transform: transform2,
    nodes: storeNodes,
    nodesInitialized,
    nodeLookup,
    parentLookup,
    edges: storeEdges,
    edgeLookup,
    connectionLookup,
    onNodesChange: null,
    onEdgesChange: null,
    hasDefaultNodes: defaultNodes !== undefined,
    hasDefaultEdges: defaultEdges !== undefined,
    panZoom: null,
    minZoom,
    maxZoom,
    translateExtent: infiniteExtent,
    nodeExtent: storeNodeExtent,
    nodesSelectionActive: false,
    userSelectionActive: false,
    userSelectionRect: null,
    connectionMode: ConnectionMode.Strict,
    domNode: null,
    paneDragging: false,
    noPanClassName: "nopan",
    nodeOrigin: storeNodeOrigin,
    nodeDragThreshold: 1,
    connectionDragThreshold: 1,
    snapGrid: [15, 15],
    snapToGrid: false,
    nodesDraggable: true,
    nodesConnectable: true,
    nodesFocusable: true,
    edgesFocusable: true,
    edgesReconnectable: true,
    elementsSelectable: true,
    elevateNodesOnSelect: true,
    elevateEdgesOnSelect: true,
    selectNodesOnDrag: true,
    multiSelectionActive: false,
    fitViewQueued: fitView ?? false,
    fitViewOptions,
    fitViewResolver: null,
    connection: { ...initialConnection },
    connectionClickStartHandle: null,
    connectOnClick: true,
    ariaLiveMessage: "",
    autoPanOnConnect: true,
    autoPanOnNodeDrag: true,
    autoPanOnNodeFocus: true,
    autoPanSpeed: 15,
    connectionRadius: 20,
    onError: devWarn,
    isValidConnection: undefined,
    onSelectionChangeHandlers: [],
    lib: "react",
    debug: false,
    ariaLabelConfig: defaultAriaLabelConfig,
    zIndexMode,
    onNodesChangeMiddlewareMap: new Map,
    onEdgesChangeMiddlewareMap: new Map
  };
};
var createStore2 = ({ nodes, edges, defaultNodes, defaultEdges, width, height, fitView, fitViewOptions, minZoom, maxZoom, nodeOrigin, nodeExtent, zIndexMode }) => createWithEqualityFn((set3, get3) => {
  async function resolveFitView() {
    const { nodeLookup, panZoom, fitViewOptions: fitViewOptions2, fitViewResolver, width: width2, height: height2, minZoom: minZoom2, maxZoom: maxZoom2 } = get3();
    if (!panZoom) {
      return;
    }
    await fitViewport({
      nodes: nodeLookup,
      width: width2,
      height: height2,
      panZoom,
      minZoom: minZoom2,
      maxZoom: maxZoom2
    }, fitViewOptions2);
    fitViewResolver?.resolve(true);
    set3({ fitViewResolver: null });
  }
  return {
    ...getInitialState({
      nodes,
      edges,
      width,
      height,
      fitView,
      fitViewOptions,
      minZoom,
      maxZoom,
      nodeOrigin,
      nodeExtent,
      defaultNodes,
      defaultEdges,
      zIndexMode
    }),
    setNodes: (nodes2) => {
      const { nodeLookup, parentLookup, nodeOrigin: nodeOrigin2, nodeExtent: nodeExtent2, elevateNodesOnSelect, fitViewQueued, zIndexMode: zIndexMode2, nodesSelectionActive } = get3();
      const { nodesInitialized, hasSelectedNodes } = adoptUserNodes(nodes2, nodeLookup, parentLookup, {
        nodeOrigin: nodeOrigin2,
        nodeExtent: nodeExtent2,
        elevateNodesOnSelect,
        checkEquality: true,
        zIndexMode: zIndexMode2
      });
      const nextNodesSelectionActive = nodesSelectionActive && hasSelectedNodes;
      if (fitViewQueued && nodesInitialized) {
        resolveFitView();
        set3({
          nodes: nodes2,
          nodesInitialized,
          fitViewQueued: false,
          fitViewOptions: undefined,
          nodesSelectionActive: nextNodesSelectionActive
        });
      } else {
        set3({ nodes: nodes2, nodesInitialized, nodesSelectionActive: nextNodesSelectionActive });
      }
    },
    setEdges: (edges2) => {
      const { connectionLookup, edgeLookup } = get3();
      updateConnectionLookup(connectionLookup, edgeLookup, edges2);
      set3({ edges: edges2 });
    },
    setDefaultNodesAndEdges: (nodes2, edges2) => {
      if (nodes2) {
        const { setNodes } = get3();
        setNodes(nodes2);
        set3({ hasDefaultNodes: true });
      }
      if (edges2) {
        const { setEdges } = get3();
        setEdges(edges2);
        set3({ hasDefaultEdges: true });
      }
    },
    updateNodeInternals: (updates) => {
      const { triggerNodeChanges, nodeLookup, parentLookup, domNode, nodeOrigin: nodeOrigin2, nodeExtent: nodeExtent2, debug, fitViewQueued, zIndexMode: zIndexMode2 } = get3();
      const { changes, updatedInternals } = updateNodeInternals(updates, nodeLookup, parentLookup, domNode, nodeOrigin2, nodeExtent2, zIndexMode2);
      if (!updatedInternals) {
        return;
      }
      updateAbsolutePositions(nodeLookup, parentLookup, { nodeOrigin: nodeOrigin2, nodeExtent: nodeExtent2, zIndexMode: zIndexMode2 });
      if (fitViewQueued) {
        resolveFitView();
        set3({ fitViewQueued: false, fitViewOptions: undefined });
      } else {
        set3({});
      }
      if (changes?.length > 0) {
        if (debug) {
          console.log("React Flow: trigger node changes", changes);
        }
        triggerNodeChanges?.(changes);
      }
    },
    updateNodePositions: (nodeDragItems, dragging = false) => {
      const parentExpandChildren = [];
      let changes = [];
      const { nodeLookup, triggerNodeChanges, connection, updateConnection, onNodesChangeMiddlewareMap } = get3();
      for (const [id2, dragItem] of nodeDragItems) {
        const node = nodeLookup.get(id2);
        const expandParent = !!(node?.expandParent && node?.parentId && dragItem?.position);
        const change = {
          id: id2,
          type: "position",
          position: expandParent ? {
            x: Math.max(0, dragItem.position.x),
            y: Math.max(0, dragItem.position.y)
          } : dragItem.position,
          dragging
        };
        if (node && connection.inProgress && connection.fromNode.id === node.id) {
          const updatedFrom = getHandlePosition(node, connection.fromHandle, Position.Left, true);
          updateConnection({ ...connection, from: updatedFrom });
        }
        if (expandParent && node.parentId) {
          parentExpandChildren.push({
            id: id2,
            parentId: node.parentId,
            rect: {
              ...dragItem.internals.positionAbsolute,
              width: dragItem.measured.width ?? 0,
              height: dragItem.measured.height ?? 0
            }
          });
        }
        changes.push(change);
      }
      if (parentExpandChildren.length > 0) {
        const { parentLookup, nodeOrigin: nodeOrigin2 } = get3();
        const parentExpandChanges = handleExpandParent(parentExpandChildren, nodeLookup, parentLookup, nodeOrigin2);
        changes.push(...parentExpandChanges);
      }
      for (const middleware of onNodesChangeMiddlewareMap.values()) {
        changes = middleware(changes);
      }
      triggerNodeChanges(changes);
    },
    triggerNodeChanges: (changes) => {
      const { onNodesChange, setNodes, nodes: nodes2, hasDefaultNodes, debug } = get3();
      if (changes?.length) {
        if (hasDefaultNodes) {
          const updatedNodes = applyNodeChanges(changes, nodes2);
          setNodes(updatedNodes);
        }
        if (debug) {
          console.log("React Flow: trigger node changes", changes);
        }
        onNodesChange?.(changes);
      }
    },
    triggerEdgeChanges: (changes) => {
      const { onEdgesChange, setEdges, edges: edges2, hasDefaultEdges, debug } = get3();
      if (changes?.length) {
        if (hasDefaultEdges) {
          const updatedEdges = applyEdgeChanges(changes, edges2);
          setEdges(updatedEdges);
        }
        if (debug) {
          console.log("React Flow: trigger edge changes", changes);
        }
        onEdgesChange?.(changes);
      }
    },
    addSelectedNodes: (selectedNodeIds) => {
      const { multiSelectionActive, edgeLookup, nodeLookup, triggerNodeChanges, triggerEdgeChanges } = get3();
      if (multiSelectionActive) {
        const nodeChanges = selectedNodeIds.map((nodeId) => createSelectionChange(nodeId, true));
        triggerNodeChanges(nodeChanges);
        return;
      }
      triggerNodeChanges(getSelectionChanges(nodeLookup, new Set([...selectedNodeIds]), true));
      triggerEdgeChanges(getSelectionChanges(edgeLookup));
    },
    addSelectedEdges: (selectedEdgeIds) => {
      const { multiSelectionActive, edgeLookup, nodeLookup, triggerNodeChanges, triggerEdgeChanges } = get3();
      if (multiSelectionActive) {
        const changedEdges = selectedEdgeIds.map((edgeId) => createSelectionChange(edgeId, true));
        triggerEdgeChanges(changedEdges);
        return;
      }
      triggerEdgeChanges(getSelectionChanges(edgeLookup, new Set([...selectedEdgeIds])));
      triggerNodeChanges(getSelectionChanges(nodeLookup, new Set, true));
    },
    unselectNodesAndEdges: ({ nodes: nodes2, edges: edges2 } = {}) => {
      const { edges: storeEdges, nodes: storeNodes, nodeLookup, triggerNodeChanges, triggerEdgeChanges } = get3();
      const nodesToUnselect = nodes2 ? nodes2 : storeNodes;
      const edgesToUnselect = edges2 ? edges2 : storeEdges;
      const nodeChanges = [];
      for (const node of nodesToUnselect) {
        if (!node.selected) {
          continue;
        }
        const internalNode = nodeLookup.get(node.id);
        if (internalNode) {
          internalNode.selected = false;
        }
        nodeChanges.push(createSelectionChange(node.id, false));
      }
      const edgeChanges = [];
      for (const edge of edgesToUnselect) {
        if (!edge.selected) {
          continue;
        }
        edgeChanges.push(createSelectionChange(edge.id, false));
      }
      triggerNodeChanges(nodeChanges);
      triggerEdgeChanges(edgeChanges);
    },
    setMinZoom: (minZoom2) => {
      const { panZoom, maxZoom: maxZoom2 } = get3();
      panZoom?.setScaleExtent([minZoom2, maxZoom2]);
      set3({ minZoom: minZoom2 });
    },
    setMaxZoom: (maxZoom2) => {
      const { panZoom, minZoom: minZoom2 } = get3();
      panZoom?.setScaleExtent([minZoom2, maxZoom2]);
      set3({ maxZoom: maxZoom2 });
    },
    setTranslateExtent: (translateExtent) => {
      get3().panZoom?.setTranslateExtent(translateExtent);
      set3({ translateExtent });
    },
    resetSelectedElements: () => {
      const { edges: edges2, nodes: nodes2, triggerNodeChanges, triggerEdgeChanges, elementsSelectable } = get3();
      if (!elementsSelectable) {
        return;
      }
      const nodeChanges = nodes2.reduce((res, node) => node.selected ? [...res, createSelectionChange(node.id, false)] : res, []);
      const edgeChanges = edges2.reduce((res, edge) => edge.selected ? [...res, createSelectionChange(edge.id, false)] : res, []);
      triggerNodeChanges(nodeChanges);
      triggerEdgeChanges(edgeChanges);
    },
    setNodeExtent: (nextNodeExtent) => {
      const { nodes: nodes2, nodeLookup, parentLookup, nodeOrigin: nodeOrigin2, elevateNodesOnSelect, nodeExtent: nodeExtent2, zIndexMode: zIndexMode2 } = get3();
      if (nextNodeExtent[0][0] === nodeExtent2[0][0] && nextNodeExtent[0][1] === nodeExtent2[0][1] && nextNodeExtent[1][0] === nodeExtent2[1][0] && nextNodeExtent[1][1] === nodeExtent2[1][1]) {
        return;
      }
      adoptUserNodes(nodes2, nodeLookup, parentLookup, {
        nodeOrigin: nodeOrigin2,
        nodeExtent: nextNodeExtent,
        elevateNodesOnSelect,
        checkEquality: false,
        zIndexMode: zIndexMode2
      });
      set3({ nodeExtent: nextNodeExtent });
    },
    panBy: (delta) => {
      const { transform: transform2, width: width2, height: height2, panZoom, translateExtent } = get3();
      return panBy({ delta, panZoom, transform: transform2, translateExtent, width: width2, height: height2 });
    },
    setCenter: async (x, y, options) => {
      const { width: width2, height: height2, maxZoom: maxZoom2, panZoom } = get3();
      if (!panZoom) {
        return false;
      }
      const nextZoom = typeof options?.zoom !== "undefined" ? options.zoom : maxZoom2;
      await panZoom.setViewport({
        x: width2 / 2 - x * nextZoom,
        y: height2 / 2 - y * nextZoom,
        zoom: nextZoom
      }, { duration: options?.duration, ease: options?.ease, interpolate: options?.interpolate });
      return true;
    },
    cancelConnection: () => {
      set3({
        connection: { ...initialConnection }
      });
    },
    updateConnection: (connection) => {
      set3({ connection });
    },
    reset: () => set3({ ...getInitialState() })
  };
}, Object.is);
function ReactFlowProvider({ initialNodes: nodes, initialEdges: edges, defaultNodes, defaultEdges, initialWidth: width, initialHeight: height, initialMinZoom: minZoom, initialMaxZoom: maxZoom, initialFitViewOptions: fitViewOptions, fitView, nodeOrigin, nodeExtent, zIndexMode, children: children2 }) {
  const [store] = useState4(() => createStore2({
    nodes,
    edges,
    defaultNodes,
    defaultEdges,
    width,
    height,
    fitView,
    minZoom,
    maxZoom,
    fitViewOptions,
    nodeOrigin,
    nodeExtent,
    zIndexMode
  }));
  return jsx(Provider$1, { value: store, children: jsx(BatchProvider, { children: jsx(HandleConfigProvider, { children: children2 }) }) });
}
function Wrapper({ children: children2, nodes, edges, defaultNodes, defaultEdges, width, height, fitView, fitViewOptions, minZoom, maxZoom, nodeOrigin, nodeExtent, zIndexMode }) {
  const isWrapped = useContext2(StoreContext);
  if (isWrapped) {
    return jsx(Fragment, { children: children2 });
  }
  return jsx(ReactFlowProvider, { initialNodes: nodes, initialEdges: edges, defaultNodes, defaultEdges, initialWidth: width, initialHeight: height, fitView, initialFitViewOptions: fitViewOptions, initialMinZoom: minZoom, initialMaxZoom: maxZoom, nodeOrigin, nodeExtent, zIndexMode, children: children2 });
}
var wrapperStyle = {
  width: "100%",
  height: "100%",
  overflow: "hidden",
  position: "relative",
  zIndex: 0
};
function ReactFlow({ nodes, edges, defaultNodes, defaultEdges, className, nodeTypes, edgeTypes, onNodeClick, onEdgeClick, onInit, onMove, onMoveStart, onMoveEnd, onConnect, onConnectStart, onConnectEnd, onClickConnectStart, onClickConnectEnd, onNodeMouseEnter, onNodeMouseMove, onNodeMouseLeave, onNodeContextMenu, onNodeDoubleClick, onNodeDragStart, onNodeDrag, onNodeDragStop, onNodesDelete, onEdgesDelete, onDelete, onSelectionChange, onSelectionDragStart, onSelectionDrag, onSelectionDragStop, onSelectionContextMenu, onSelectionStart, onSelectionEnd, onBeforeDelete, connectionMode, connectionLineType = ConnectionLineType.Bezier, connectionLineStyle, connectionLineComponent, connectionLineContainerStyle, deleteKeyCode = "Backspace", selectionKeyCode = "Shift", selectionOnDrag = false, selectionMode = SelectionMode.Full, panActivationKeyCode = "Space", multiSelectionKeyCode = isMacOs() ? "Meta" : "Control", zoomActivationKeyCode = isMacOs() ? "Meta" : "Control", snapToGrid, snapGrid, onlyRenderVisibleElements = false, selectNodesOnDrag, nodesDraggable, autoPanOnNodeFocus, nodesConnectable, nodesFocusable, nodeOrigin = defaultNodeOrigin, edgesFocusable, edgesReconnectable, elementsSelectable = true, defaultViewport: defaultViewport$1 = defaultViewport, minZoom = 0.5, maxZoom = 2, translateExtent = infiniteExtent, preventScrolling = true, nodeExtent, defaultMarkerColor = "#b1b1b7", zoomOnScroll = true, zoomOnPinch = true, panOnScroll = false, panOnScrollSpeed = 0.5, panOnScrollMode = PanOnScrollMode.Free, zoomOnDoubleClick = true, panOnDrag = true, onPaneClick, onPaneMouseEnter, onPaneMouseMove, onPaneMouseLeave, onPaneScroll, onPaneContextMenu, paneClickDistance = 1, nodeClickDistance = 0, children: children2, onReconnect, onReconnectStart, onReconnectEnd, onEdgeContextMenu, onEdgeDoubleClick, onEdgeMouseEnter, onEdgeMouseMove, onEdgeMouseLeave, reconnectRadius = 10, onNodesChange, onEdgesChange, noDragClassName = "nodrag", noWheelClassName = "nowheel", noPanClassName = "nopan", fitView, fitViewOptions, connectOnClick, attributionPosition, proOptions, defaultEdgeOptions, elevateNodesOnSelect = true, elevateEdgesOnSelect = false, disableKeyboardA11y = false, autoPanOnConnect, autoPanOnNodeDrag, autoPanOnSelection = true, autoPanSpeed, connectionRadius, isValidConnection, onError, style: style2, id: id2, nodeDragThreshold, connectionDragThreshold, viewport, onViewportChange, width, height, colorMode = "light", debug, onScroll, ariaLabelConfig, zIndexMode = "basic", ...rest }, ref) {
  const rfId = id2 || "1";
  const colorModeClassName = useColorModeClass(colorMode);
  const wrapperOnScroll = useCallback3((e) => {
    e.currentTarget.scrollTo({ top: 0, left: 0, behavior: "instant" });
    onScroll?.(e);
  }, [onScroll]);
  return jsx("div", { "data-testid": "rf__wrapper", ...rest, onScroll: wrapperOnScroll, style: { ...style2, ...wrapperStyle }, ref, className: cc(["react-flow", className, colorModeClassName]), id: id2, role: "application", children: jsxs(Wrapper, { nodes, edges, width, height, fitView, fitViewOptions, minZoom, maxZoom, nodeOrigin, nodeExtent, zIndexMode, children: [jsx(StoreUpdater, { nodes, edges, defaultNodes, defaultEdges, onConnect, onConnectStart, onConnectEnd, onClickConnectStart, onClickConnectEnd, nodesDraggable, autoPanOnNodeFocus, nodesConnectable, nodesFocusable, edgesFocusable, edgesReconnectable, elementsSelectable, elevateNodesOnSelect, elevateEdgesOnSelect, minZoom, maxZoom, nodeExtent, onNodesChange, onEdgesChange, snapToGrid, snapGrid, connectionMode, translateExtent, connectOnClick, defaultEdgeOptions, fitView, fitViewOptions, onNodesDelete, onEdgesDelete, onDelete, onNodeDragStart, onNodeDrag, onNodeDragStop, onSelectionDrag, onSelectionDragStart, onSelectionDragStop, onMove, onMoveStart, onMoveEnd, noPanClassName, nodeOrigin, rfId, autoPanOnConnect, autoPanOnNodeDrag, autoPanSpeed, onError, connectionRadius, isValidConnection, selectNodesOnDrag, nodeDragThreshold, connectionDragThreshold, onBeforeDelete, debug, ariaLabelConfig, zIndexMode }), jsx(GraphView, { onInit, onNodeClick, onEdgeClick, onNodeMouseEnter, onNodeMouseMove, onNodeMouseLeave, onNodeContextMenu, onNodeDoubleClick, nodeTypes, edgeTypes, connectionLineType, connectionLineStyle, connectionLineComponent, connectionLineContainerStyle, selectionKeyCode, selectionOnDrag, selectionMode, deleteKeyCode, multiSelectionKeyCode, panActivationKeyCode, zoomActivationKeyCode, onlyRenderVisibleElements, defaultViewport: defaultViewport$1, translateExtent, minZoom, maxZoom, preventScrolling, zoomOnScroll, zoomOnPinch, zoomOnDoubleClick, panOnScroll, panOnScrollSpeed, panOnScrollMode, panOnDrag, autoPanOnSelection, onPaneClick, onPaneMouseEnter, onPaneMouseMove, onPaneMouseLeave, onPaneScroll, onPaneContextMenu, paneClickDistance, nodeClickDistance, onSelectionContextMenu, onSelectionStart, onSelectionEnd, onReconnect, onReconnectStart, onReconnectEnd, onEdgeContextMenu, onEdgeDoubleClick, onEdgeMouseEnter, onEdgeMouseMove, onEdgeMouseLeave, reconnectRadius, defaultMarkerColor, noDragClassName, noWheelClassName, noPanClassName, rfId, disableKeyboardA11y, nodeExtent, viewport, onViewportChange, nodesDraggable }), jsx(SelectionListener, { onSelectionChange }), children2, jsx(Attribution, { proOptions, position: attributionPosition }), jsx(A11yDescriptions, { rfId, disableKeyboardA11y })] }) });
}
var index = fixedForwardRef(ReactFlow);
var selector$6 = (s) => s.domNode?.querySelector(".react-flow__edgelabel-renderer");
function EdgeLabelRenderer({ children: children2 }) {
  const edgeLabelRenderer = useStore(selector$6);
  if (!edgeLabelRenderer) {
    return null;
  }
  return createPortal(children2, edgeLabelRenderer);
}
var error014 = errorMessages["error014"]();
function LinePattern({ dimensions, lineWidth, variant, className }) {
  return jsx("path", { strokeWidth: lineWidth, d: `M${dimensions[0] / 2} 0 V${dimensions[1]} M0 ${dimensions[1] / 2} H${dimensions[0]}`, className: cc(["react-flow__background-pattern", variant, className]) });
}
function DotPattern({ radius, className }) {
  return jsx("circle", { cx: radius, cy: radius, r: radius, className: cc(["react-flow__background-pattern", "dots", className]) });
}
var BackgroundVariant;
(function(BackgroundVariant2) {
  BackgroundVariant2["Lines"] = "lines";
  BackgroundVariant2["Dots"] = "dots";
  BackgroundVariant2["Cross"] = "cross";
})(BackgroundVariant || (BackgroundVariant = {}));
var defaultSize = {
  [BackgroundVariant.Dots]: 1,
  [BackgroundVariant.Lines]: 1,
  [BackgroundVariant.Cross]: 6
};
var selector$3 = (s) => ({ transform: s.transform, patternId: `pattern-${s.rfId}` });
function BackgroundComponent({
  id: id2,
  variant = BackgroundVariant.Dots,
  gap = 20,
  size,
  lineWidth = 1,
  offset = 0,
  color: color2,
  bgColor,
  style: style2,
  className,
  patternClassName
}) {
  const ref = useRef2(null);
  const { transform: transform2, patternId } = useStore(selector$3, shallow$1);
  const patternSize = size || defaultSize[variant];
  const isDots = variant === BackgroundVariant.Dots;
  const isCross = variant === BackgroundVariant.Cross;
  const gapXY = Array.isArray(gap) ? gap : [gap, gap];
  const scaledGap = [gapXY[0] * transform2[2] || 1, gapXY[1] * transform2[2] || 1];
  const scaledSize = patternSize * transform2[2];
  const offsetXY = Array.isArray(offset) ? offset : [offset, offset];
  const patternDimensions = isCross ? [scaledSize, scaledSize] : scaledGap;
  const scaledOffset = [
    offsetXY[0] * transform2[2] + patternDimensions[0] / 2,
    offsetXY[1] * transform2[2] + patternDimensions[1] / 2
  ];
  const _patternId = `${patternId}${id2 ? id2 : ""}`;
  return jsxs("svg", { className: cc(["react-flow__background", className]), style: {
    ...style2,
    ...containerStyle,
    "--xy-background-color-props": bgColor,
    "--xy-background-pattern-color-props": color2
  }, ref, "data-testid": "rf__background", children: [jsx("pattern", { id: _patternId, x: transform2[0] % scaledGap[0], y: transform2[1] % scaledGap[1], width: scaledGap[0], height: scaledGap[1], patternUnits: "userSpaceOnUse", patternTransform: `translate(-${scaledOffset[0]},-${scaledOffset[1]})`, children: isDots ? jsx(DotPattern, { radius: scaledSize / 2, className: patternClassName }) : jsx(LinePattern, { dimensions: patternDimensions, lineWidth, variant, className: patternClassName }) }), jsx("rect", { x: "0", y: "0", width: "100%", height: "100%", fill: `url(#${_patternId})` })] });
}
BackgroundComponent.displayName = "Background";
var Background = memo(BackgroundComponent);
function PlusIcon() {
  return jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 32 32", children: jsx("path", { d: "M32 18.133H18.133V32h-4.266V18.133H0v-4.266h13.867V0h4.266v13.867H32z" }) });
}
function MinusIcon() {
  return jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 32 5", children: jsx("path", { d: "M0 0h32v4.2H0z" }) });
}
function FitViewIcon() {
  return jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 32 30", children: jsx("path", { d: "M3.692 4.63c0-.53.4-.938.939-.938h5.215V0H4.708C2.13 0 0 2.054 0 4.63v5.216h3.692V4.631zM27.354 0h-5.2v3.692h5.17c.53 0 .984.4.984.939v5.215H32V4.631A4.624 4.624 0 0027.354 0zm.954 24.83c0 .532-.4.94-.939.94h-5.215v3.768h5.215c2.577 0 4.631-2.13 4.631-4.707v-5.139h-3.692v5.139zm-23.677.94c-.531 0-.939-.4-.939-.94v-5.138H0v5.139c0 2.577 2.13 4.707 4.708 4.707h5.138V25.77H4.631z" }) });
}
function LockIcon() {
  return jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 25 32", children: jsx("path", { d: "M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0 8 0 4.571 3.429 4.571 7.619v3.048H3.048A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047zm4.724-13.866H7.467V7.619c0-2.59 2.133-4.724 4.723-4.724 2.591 0 4.724 2.133 4.724 4.724v3.048z" }) });
}
function UnlockIcon() {
  return jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 25 32", children: jsx("path", { d: "M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0c-4.114 1.828-1.37 2.133.305 2.438 1.676.305 4.42 2.59 4.42 5.181v3.048H3.047A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047z" }) });
}
function ControlButton({ children: children2, className, ...rest }) {
  return jsx("button", { type: "button", className: cc(["react-flow__controls-button", className]), ...rest, children: children2 });
}
var selector$2 = (s) => ({
  isInteractive: s.nodesDraggable || s.nodesConnectable || s.elementsSelectable,
  minZoomReached: s.transform[2] <= s.minZoom,
  maxZoomReached: s.transform[2] >= s.maxZoom,
  ariaLabelConfig: s.ariaLabelConfig
});
function ControlsComponent({ style: style2, showZoom = true, showFitView = true, showInteractive = true, fitViewOptions, onZoomIn, onZoomOut, onFitView, onInteractiveChange, className, children: children2, position = "bottom-left", orientation = "vertical", "aria-label": ariaLabel }) {
  const store = useStoreApi();
  const { isInteractive, minZoomReached, maxZoomReached, ariaLabelConfig } = useStore(selector$2, shallow$1);
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const onZoomInHandler = () => {
    zoomIn();
    onZoomIn?.();
  };
  const onZoomOutHandler = () => {
    zoomOut();
    onZoomOut?.();
  };
  const onFitViewHandler = () => {
    fitView(fitViewOptions);
    onFitView?.();
  };
  const onToggleInteractivity = () => {
    store.setState({
      nodesDraggable: !isInteractive,
      nodesConnectable: !isInteractive,
      elementsSelectable: !isInteractive
    });
    onInteractiveChange?.(!isInteractive);
  };
  const orientationClass = orientation === "horizontal" ? "horizontal" : "vertical";
  return jsxs(Panel, { className: cc(["react-flow__controls", orientationClass, className]), position, style: style2, "data-testid": "rf__controls", "aria-label": ariaLabel ?? ariaLabelConfig["controls.ariaLabel"], children: [showZoom && jsxs(Fragment, { children: [jsx(ControlButton, { onClick: onZoomInHandler, className: "react-flow__controls-zoomin", title: ariaLabelConfig["controls.zoomIn.ariaLabel"], "aria-label": ariaLabelConfig["controls.zoomIn.ariaLabel"], disabled: maxZoomReached, children: jsx(PlusIcon, {}) }), jsx(ControlButton, { onClick: onZoomOutHandler, className: "react-flow__controls-zoomout", title: ariaLabelConfig["controls.zoomOut.ariaLabel"], "aria-label": ariaLabelConfig["controls.zoomOut.ariaLabel"], disabled: minZoomReached, children: jsx(MinusIcon, {}) })] }), showFitView && jsx(ControlButton, { className: "react-flow__controls-fitview", onClick: onFitViewHandler, title: ariaLabelConfig["controls.fitView.ariaLabel"], "aria-label": ariaLabelConfig["controls.fitView.ariaLabel"], children: jsx(FitViewIcon, {}) }), showInteractive && jsx(ControlButton, { className: "react-flow__controls-interactive", onClick: onToggleInteractivity, title: ariaLabelConfig["controls.interactive.ariaLabel"], "aria-label": ariaLabelConfig["controls.interactive.ariaLabel"], children: isInteractive ? jsx(UnlockIcon, {}) : jsx(LockIcon, {}) }), children2] });
}
ControlsComponent.displayName = "Controls";
var Controls = memo(ControlsComponent);
function MiniMapNodeComponent({ id: id2, x, y, width, height, style: style2, color: color2, strokeColor, strokeWidth, className, borderRadius, shapeRendering, selected: selected2, onClick }) {
  const { background, backgroundColor } = style2 || {};
  const fill = color2 || background || backgroundColor;
  return jsx("rect", { className: cc(["react-flow__minimap-node", { selected: selected2 }, className]), x, y, rx: borderRadius, ry: borderRadius, width, height, style: {
    fill,
    stroke: strokeColor,
    strokeWidth
  }, shapeRendering, onClick: onClick ? (event) => onClick(event, id2) : undefined });
}
var MiniMapNode = memo(MiniMapNodeComponent);
var selectorNodeIds = (s) => s.nodes.map((node) => node.id);
var getAttrFunction = (func) => func instanceof Function ? func : () => func;
function MiniMapNodes({
  nodeStrokeColor,
  nodeColor,
  nodeClassName = "",
  nodeBorderRadius = 5,
  nodeStrokeWidth,
  nodeComponent: NodeComponent = MiniMapNode,
  onClick
}) {
  const nodeIds = useStore(selectorNodeIds, shallow$1);
  const nodeColorFunc = getAttrFunction(nodeColor);
  const nodeStrokeColorFunc = getAttrFunction(nodeStrokeColor);
  const nodeClassNameFunc = getAttrFunction(nodeClassName);
  const shapeRendering = typeof window === "undefined" || !!window.chrome ? "crispEdges" : "geometricPrecision";
  return jsx(Fragment, { children: nodeIds.map((nodeId) => jsx(NodeComponentWrapper, { id: nodeId, nodeColorFunc, nodeStrokeColorFunc, nodeClassNameFunc, nodeBorderRadius, nodeStrokeWidth, NodeComponent, onClick, shapeRendering }, nodeId)) });
}
function NodeComponentWrapperInner({ id: id2, nodeColorFunc, nodeStrokeColorFunc, nodeClassNameFunc, nodeBorderRadius, nodeStrokeWidth, shapeRendering, NodeComponent, onClick }) {
  const { node, x, y, width, height } = useStore((s) => {
    const node2 = s.nodeLookup.get(id2);
    if (!node2) {
      return { node: undefined, x: 0, y: 0, width: 0, height: 0 };
    }
    const userNode = node2.internals.userNode;
    const { x: x2, y: y2 } = node2.internals.positionAbsolute;
    const { width: width2, height: height2 } = getNodeDimensions(userNode);
    return {
      node: userNode,
      x: x2,
      y: y2,
      width: width2,
      height: height2
    };
  }, shallow$1);
  if (!node || node.hidden || !nodeHasDimensions(node)) {
    return null;
  }
  return jsx(NodeComponent, { x, y, width, height, style: node.style, selected: !!node.selected, className: nodeClassNameFunc(node), color: nodeColorFunc(node), borderRadius: nodeBorderRadius, strokeColor: nodeStrokeColorFunc(node), strokeWidth: nodeStrokeWidth, shapeRendering, onClick, id: node.id });
}
var NodeComponentWrapper = memo(NodeComponentWrapperInner);
var MiniMapNodes$1 = memo(MiniMapNodes);
var defaultWidth = 200;
var defaultHeight = 150;
var filterHidden = (node) => !node.hidden;
var selector$1 = (s) => {
  const viewBB = {
    x: -s.transform[0] / s.transform[2],
    y: -s.transform[1] / s.transform[2],
    width: s.width / s.transform[2],
    height: s.height / s.transform[2]
  };
  return {
    viewBB,
    boundingRect: s.nodeLookup.size > 0 ? getBoundsOfRects(getInternalNodesBounds(s.nodeLookup, { filter: filterHidden }), viewBB) : viewBB,
    rfId: s.rfId,
    panZoom: s.panZoom,
    translateExtent: s.translateExtent,
    flowWidth: s.width,
    flowHeight: s.height,
    ariaLabelConfig: s.ariaLabelConfig
  };
};
var rectEqual = (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
var areEqual = (a, b) => rectEqual(a.viewBB, b.viewBB) && rectEqual(a.boundingRect, b.boundingRect) && a.rfId === b.rfId && a.panZoom === b.panZoom && a.translateExtent === b.translateExtent && a.flowWidth === b.flowWidth && a.flowHeight === b.flowHeight && a.ariaLabelConfig === b.ariaLabelConfig;
var ARIA_LABEL_KEY = "react-flow__minimap-desc";
function MiniMapComponent({
  style: style2,
  className,
  nodeStrokeColor,
  nodeColor,
  nodeClassName = "",
  nodeBorderRadius = 5,
  nodeStrokeWidth,
  nodeComponent,
  bgColor,
  maskColor,
  maskStrokeColor,
  maskStrokeWidth,
  position = "bottom-right",
  onClick,
  onNodeClick,
  pannable = false,
  zoomable = false,
  ariaLabel,
  inversePan,
  zoomStep = 1,
  offsetScale = 5
}) {
  const store = useStoreApi();
  const svg = useRef2(null);
  const { boundingRect, viewBB, rfId, panZoom, translateExtent, flowWidth, flowHeight, ariaLabelConfig } = useStore(selector$1, areEqual);
  const elementWidth = style2?.width ?? defaultWidth;
  const elementHeight = style2?.height ?? defaultHeight;
  const scaledWidth = boundingRect.width / elementWidth;
  const scaledHeight = boundingRect.height / elementHeight;
  const viewScale = Math.max(scaledWidth, scaledHeight);
  const viewWidth = viewScale * elementWidth;
  const viewHeight = viewScale * elementHeight;
  const offset = offsetScale * viewScale;
  const x = boundingRect.x - (viewWidth - boundingRect.width) / 2 - offset;
  const y = boundingRect.y - (viewHeight - boundingRect.height) / 2 - offset;
  const width = viewWidth + offset * 2;
  const height = viewHeight + offset * 2;
  const labelledBy = `${ARIA_LABEL_KEY}-${rfId}`;
  const viewScaleRef = useRef2(0);
  const minimapInstance = useRef2();
  viewScaleRef.current = viewScale;
  useEffect4(() => {
    if (svg.current && panZoom) {
      minimapInstance.current = XYMinimap({
        domNode: svg.current,
        panZoom,
        getTransform: () => store.getState().transform,
        getViewScale: () => viewScaleRef.current
      });
      return () => {
        minimapInstance.current?.destroy();
      };
    }
  }, [panZoom]);
  useEffect4(() => {
    minimapInstance.current?.update({
      translateExtent,
      width: flowWidth,
      height: flowHeight,
      inversePan,
      pannable,
      zoomStep,
      zoomable
    });
  }, [pannable, zoomable, inversePan, zoomStep, translateExtent, flowWidth, flowHeight]);
  const onSvgClick = onClick ? (event) => {
    const [x2, y2] = minimapInstance.current?.pointer(event) || [0, 0];
    onClick(event, { x: x2, y: y2 });
  } : undefined;
  const onSvgNodeClick = onNodeClick ? useCallback3((event, nodeId) => {
    const node = store.getState().nodeLookup.get(nodeId).internals.userNode;
    onNodeClick(event, node);
  }, []) : undefined;
  const _ariaLabel = ariaLabel ?? ariaLabelConfig["minimap.ariaLabel"];
  return jsx(Panel, { position, style: {
    ...style2,
    "--xy-minimap-background-color-props": typeof bgColor === "string" ? bgColor : undefined,
    "--xy-minimap-mask-background-color-props": typeof maskColor === "string" ? maskColor : undefined,
    "--xy-minimap-mask-stroke-color-props": typeof maskStrokeColor === "string" ? maskStrokeColor : undefined,
    "--xy-minimap-mask-stroke-width-props": typeof maskStrokeWidth === "number" ? maskStrokeWidth * viewScale : undefined,
    "--xy-minimap-node-background-color-props": typeof nodeColor === "string" ? nodeColor : undefined,
    "--xy-minimap-node-stroke-color-props": typeof nodeStrokeColor === "string" ? nodeStrokeColor : undefined,
    "--xy-minimap-node-stroke-width-props": typeof nodeStrokeWidth === "number" ? nodeStrokeWidth : undefined
  }, className: cc(["react-flow__minimap", className]), "data-testid": "rf__minimap", children: jsxs("svg", { width: elementWidth, height: elementHeight, viewBox: `${x} ${y} ${width} ${height}`, className: "react-flow__minimap-svg", role: "img", "aria-labelledby": labelledBy, ref: svg, onClick: onSvgClick, children: [_ariaLabel && jsx("title", { id: labelledBy, children: _ariaLabel }), jsx(MiniMapNodes$1, { onClick: onSvgNodeClick, nodeColor, nodeStrokeColor, nodeBorderRadius, nodeClassName, nodeStrokeWidth, nodeComponent }), jsx("path", { className: "react-flow__minimap-mask", d: `M${x - offset},${y - offset}h${width + offset * 2}v${height + offset * 2}h${-width - offset * 2}z
        M${viewBB.x},${viewBB.y}h${viewBB.width}v${viewBB.height}h${-viewBB.width}z`, fillRule: "evenodd", pointerEvents: "none" })] }) });
}
MiniMapComponent.displayName = "MiniMap";
var MiniMap = memo(MiniMapComponent);
var scaleSelector = (calculateScale) => (store) => calculateScale ? `${Math.max(1 / store.transform[2], 1)}` : undefined;
var defaultPositions = {
  [ResizeControlVariant.Line]: "right",
  [ResizeControlVariant.Handle]: "bottom-right"
};
function ResizeControl({ nodeId, position, variant = ResizeControlVariant.Handle, className, style: style2 = undefined, children: children2, color: color2, minWidth = 10, minHeight = 10, maxWidth = Number.MAX_VALUE, maxHeight = Number.MAX_VALUE, keepAspectRatio = false, resizeDirection, autoScale = true, shouldResize, onResizeStart, onResize, onResizeEnd }) {
  const contextNodeId = useNodeId();
  const id2 = typeof nodeId === "string" ? nodeId : contextNodeId;
  const store = useStoreApi();
  const resizeControlRef = useRef2(null);
  const isHandleControl = variant === ResizeControlVariant.Handle;
  const scale = useStore(useCallback3(scaleSelector(isHandleControl && autoScale), [isHandleControl, autoScale]), shallow$1);
  const resizer = useRef2(null);
  const controlPosition = position ?? defaultPositions[variant];
  useEffect4(() => {
    if (!resizeControlRef.current || !id2) {
      return;
    }
    if (!resizer.current) {
      resizer.current = XYResizer({
        domNode: resizeControlRef.current,
        nodeId: id2,
        getStoreItems: () => {
          const { nodeLookup, transform: transform2, snapGrid, snapToGrid, nodeOrigin, domNode } = store.getState();
          return {
            nodeLookup,
            transform: transform2,
            snapGrid,
            snapToGrid,
            nodeOrigin,
            paneDomNode: domNode
          };
        },
        onChange: (change, childChanges) => {
          const { triggerNodeChanges, nodeLookup, parentLookup, nodeOrigin } = store.getState();
          const changes = [];
          const nextPosition = { x: change.x, y: change.y };
          const node = nodeLookup.get(id2);
          if (node && node.expandParent && node.parentId) {
            const origin = node.origin ?? nodeOrigin;
            const width = change.width ?? node.measured.width ?? 0;
            const height = change.height ?? node.measured.height ?? 0;
            const child = {
              id: node.id,
              parentId: node.parentId,
              rect: {
                width,
                height,
                ...evaluateAbsolutePosition({
                  x: change.x ?? node.position.x,
                  y: change.y ?? node.position.y
                }, { width, height }, node.parentId, nodeLookup, origin)
              }
            };
            const parentExpandChanges = handleExpandParent([child], nodeLookup, parentLookup, nodeOrigin);
            changes.push(...parentExpandChanges);
            nextPosition.x = change.x ? Math.max(origin[0] * width, change.x) : undefined;
            nextPosition.y = change.y ? Math.max(origin[1] * height, change.y) : undefined;
          }
          if (nextPosition.x !== undefined && nextPosition.y !== undefined) {
            const positionChange = {
              id: id2,
              type: "position",
              position: { ...nextPosition }
            };
            changes.push(positionChange);
          }
          if (change.width !== undefined && change.height !== undefined) {
            const setAttributes = !resizeDirection ? true : resizeDirection === "horizontal" ? "width" : "height";
            const dimensionChange = {
              id: id2,
              type: "dimensions",
              resizing: true,
              setAttributes,
              dimensions: {
                width: change.width,
                height: change.height
              }
            };
            changes.push(dimensionChange);
          }
          for (const childChange of childChanges) {
            const positionChange = {
              ...childChange,
              type: "position"
            };
            changes.push(positionChange);
          }
          triggerNodeChanges(changes);
        },
        onEnd: ({ width, height }) => {
          const dimensionChange = {
            id: id2,
            type: "dimensions",
            resizing: false,
            dimensions: {
              width,
              height
            }
          };
          store.getState().triggerNodeChanges([dimensionChange]);
        }
      });
    }
    resizer.current.update({
      controlPosition,
      boundaries: {
        minWidth,
        minHeight,
        maxWidth,
        maxHeight
      },
      keepAspectRatio,
      resizeDirection,
      onResizeStart,
      onResize,
      onResizeEnd,
      shouldResize
    });
    return () => {
      resizer.current?.destroy();
    };
  }, [
    controlPosition,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    keepAspectRatio,
    onResizeStart,
    onResize,
    onResizeEnd,
    shouldResize
  ]);
  const positionClassNames = controlPosition.split("-");
  return jsx("div", { className: cc(["react-flow__resize-control", "nodrag", ...positionClassNames, variant, className]), ref: resizeControlRef, style: {
    ...style2,
    scale,
    ...color2 && { [isHandleControl ? "backgroundColor" : "borderColor"]: color2 }
  }, children: children2 });
}
var NodeResizeControl = memo(ResizeControl);

// src/components/GraphCanvas.tsx
import { useCallback as useCallback5, useMemo as useMemo4 } from "react";

// src/components/NodeComponent.tsx
import { useCallback as useCallback4 } from "react";
import { jsxDEV as jsxDEV3, Fragment as Fragment2 } from "react/jsx-dev-runtime";
var TYPE_GLYPHS = {
  feature: "◆",
  bugfix: "⚠",
  quick: "⚡",
  unknown: "?"
};
var TYPE_LABELS = {
  feature: "Feature",
  bugfix: "Bugfix",
  quick: "Quick",
  unknown: "Unknown"
};
function SpecNode({ data }) {
  const {
    id: id2,
    title,
    type,
    stage,
    progress,
    owner,
    selected: selected2,
    superseded,
    onSelect
  } = data;
  const handleKeyDown = useCallback4((e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(id2);
    }
  }, [onSelect, id2]);
  const handleClick = useCallback4(() => {
    onSelect?.(id2);
  }, [onSelect, id2]);
  const ariaLabel = `${title}, ${TYPE_LABELS[type]}, ${stage}, ${progress}%`;
  const isSelected = selected2 ?? false;
  return /* @__PURE__ */ jsxDEV3("button", {
    type: "button",
    className: `spec-node spec-node--${type}${isSelected ? " spec-node--selected" : ""}${superseded ? " spec-node--superseded" : ""}`,
    "data-stage": stage,
    "data-type": type,
    "data-selected": isSelected || undefined,
    "aria-label": ariaLabel,
    "aria-pressed": isSelected,
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    children: [
      /* @__PURE__ */ jsxDEV3(Handle, {
        type: "target",
        position: Position.Left
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV3("span", {
        className: "spec-node__header",
        children: [
          /* @__PURE__ */ jsxDEV3("span", {
            className: "spec-node__glyph",
            "aria-hidden": "true",
            children: TYPE_GLYPHS[type]
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV3("span", {
            className: "spec-node__type-label",
            children: TYPE_LABELS[type]
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV3("strong", {
        className: "spec-node__title",
        children: title
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV3("span", {
        className: "spec-node__meta",
        children: [
          /* @__PURE__ */ jsxDEV3("span", {
            className: "spec-node__stage",
            children: stage
          }, undefined, false, undefined, this),
          " · ",
          /* @__PURE__ */ jsxDEV3("span", {
            className: "spec-node__progress",
            children: [
              progress,
              "%"
            ]
          }, undefined, true, undefined, this),
          owner && /* @__PURE__ */ jsxDEV3(Fragment2, {
            children: [
              " · ",
              /* @__PURE__ */ jsxDEV3("span", {
                className: "spec-node__owner",
                children: owner
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV3(Handle, {
        type: "source",
        position: Position.Right
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/components/EdgeComponent.tsx
import { jsxDEV as jsxDEV4, Fragment as Fragment3 } from "react/jsx-dev-runtime";
var PARALLEL_OFFSET_PX = 14;
function SpecEdge({
  id: id2,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd
}) {
  const parallelIndex = data?.parallelIndex ?? 0;
  const offset = parallelIndex * PARALLEL_OFFSET_PX;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY: sourceY + offset,
    targetX,
    targetY: targetY + offset,
    sourcePosition,
    targetPosition
  });
  const pending = data?.pending === true;
  const selected2 = data?.selected === true;
  const relationshipType = data?.relationshipType ?? "related";
  return /* @__PURE__ */ jsxDEV4(Fragment3, {
    children: [
      /* @__PURE__ */ jsxDEV4(BaseEdge, {
        id: id2,
        path: edgePath,
        markerEnd,
        className: `spec-edge ${pending ? "spec-edge--pending" : "spec-edge--accepted"}${selected2 ? " spec-edge--selected" : ""}`,
        style: {
          strokeDasharray: pending ? "6 4" : undefined,
          pointerEvents: "none"
        }
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV4(EdgeLabelRenderer, {
        children: /* @__PURE__ */ jsxDEV4("div", {
          className: `spec-edge-label${selected2 ? " spec-edge-label--selected" : ""}`,
          "data-status": pending ? "pending" : "accepted",
          style: {
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all"
          },
          "aria-label": `${relationshipType} (${pending ? "suggested" : "accepted"})`,
          children: [
            relationshipType,
            pending ? " · suggested" : " · accepted"
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/components/GraphCanvas.tsx
import { jsxDEV as jsxDEV5 } from "react/jsx-dev-runtime";
var Y_AXIS_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "repository", label: "Repository" },
  { value: "type", label: "Type" },
  { value: "theme", label: "Theme" }
];
var STAGES2 = ["requirements", "bug_analysis", "design", "tasks", "completed"];
var LEFT_GUTTER = 160;
var STAGE_WIDTH = 270;
var LANE_GAP = 220;
var NODE_GAP = 138;
var nodeTypes = { spec: SpecNode };
var edgeTypes = { spec: SpecEdge };
function getLaneValue(spec, field) {
  switch (field) {
    case "owner":
      return spec.owner || "Unassigned";
    case "repository":
      return spec.repository || "Unassigned";
    case "type":
      return spec.type || "unknown";
    case "theme":
      return spec.theme || "Unassigned";
  }
}
function placeGraphNodes(specs, yAxisField = "theme") {
  const lanes = [...new Set(specs.map((spec) => getLaneValue(spec, yAxisField)))].sort();
  const nodes = [];
  for (const lane of lanes) {
    const laneIndex = lanes.indexOf(lane);
    for (const stage of STAGES2) {
      const inCell = specs.filter((spec) => getLaneValue(spec, yAxisField) === lane && spec.stage === stage).sort((a, b) => a.title.localeCompare(b.title) || a.key.localeCompare(b.key));
      inCell.forEach((spec, rowIndex) => {
        nodes.push({
          id: spec.key,
          type: "spec",
          position: { x: LEFT_GUTTER + STAGES2.indexOf(stage) * STAGE_WIDTH, y: laneIndex * LANE_GAP + rowIndex * NODE_GAP },
          draggable: false,
          connectable: false,
          data: {
            id: spec.key,
            title: spec.title,
            type: spec.type,
            stage: spec.stage,
            progress: spec.progress,
            owner: spec.owner,
            theme: spec.theme || "Unassigned"
          }
        });
      });
    }
  }
  return nodes;
}
function buildGraphEdges(specs, selectedKey) {
  const existing = new Set(specs.map((spec) => spec.key));
  const pairCounts = new Map;
  const edges = [];
  const nextParallelIndex = (a, b) => {
    const pair = [a, b].sort().join("::");
    const current = pairCounts.get(pair) ?? 0;
    pairCounts.set(pair, current + 1);
    return current;
  };
  for (const source of specs) {
    for (const rel of source.relationships ?? []) {
      if (!existing.has(rel.targetKey))
        continue;
      const selected2 = source.key === selectedKey || rel.targetKey === selectedKey;
      const data = {
        relationshipType: rel.type,
        pending: false,
        selected: selected2,
        parallelIndex: nextParallelIndex(source.key, rel.targetKey)
      };
      edges.push({
        id: `relationship:${source.key}:${rel.targetKey}:${rel.type}:${data.parallelIndex}`,
        source: source.key,
        target: rel.targetKey,
        type: "spec",
        animated: selected2,
        data
      });
    }
    for (const suggestion of source.suggestions ?? []) {
      if (!existing.has(suggestion.targetKey))
        continue;
      const selected2 = source.key === selectedKey || suggestion.targetKey === selectedKey;
      const data = {
        relationshipType: suggestion.type,
        pending: true,
        selected: selected2,
        parallelIndex: nextParallelIndex(source.key, suggestion.targetKey)
      };
      edges.push({
        id: `suggestion:${source.key}:${suggestion.targetKey}:${suggestion.type}:${data.parallelIndex}`,
        source: source.key,
        target: suggestion.targetKey,
        type: "spec",
        animated: selected2,
        data
      });
    }
  }
  return edges;
}
function GraphLegend() {
  return /* @__PURE__ */ jsxDEV5("div", {
    className: "graph-legend",
    "aria-label": "Relationship legend",
    children: [
      /* @__PURE__ */ jsxDEV5("span", {
        children: [
          /* @__PURE__ */ jsxDEV5("i", {
            className: "graph-legend__solid"
          }, undefined, false, undefined, this),
          "Accepted relationship"
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV5("span", {
        children: [
          /* @__PURE__ */ jsxDEV5("i", {
            className: "graph-legend__dashed"
          }, undefined, false, undefined, this),
          "Pending suggestion"
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function GraphOverlays({ specs, yAxisField }) {
  const lanes = [...new Set(specs.map((spec) => getLaneValue(spec, yAxisField)))].sort();
  return /* @__PURE__ */ jsxDEV5("div", {
    className: "graph-overlay-labels",
    "aria-hidden": "true",
    children: [
      /* @__PURE__ */ jsxDEV5("div", {
        className: "graph-stage-labels",
        children: STAGES2.map((stage) => /* @__PURE__ */ jsxDEV5("span", {
          children: stage.replace("_", " ")
        }, stage, false, undefined, this))
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV5("div", {
        className: "graph-lane-labels",
        children: lanes.map((lane) => /* @__PURE__ */ jsxDEV5("span", {
          children: lane
        }, lane, false, undefined, this))
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function GraphCanvasInner({ specs, selectedKey, onSelect, colorMode = "dark", yAxisField = "theme" }) {
  const supersededKeys = useMemo4(() => {
    const keys = new Set;
    for (const spec of specs) {
      for (const rel of spec.relationships ?? []) {
        if (rel.type === "supersedes")
          keys.add(rel.targetKey);
      }
    }
    return keys;
  }, [specs]);
  const nodes = useMemo4(() => placeGraphNodes(specs, yAxisField).map((node) => ({ ...node, data: { ...node.data, selected: node.id === selectedKey, superseded: supersededKeys.has(node.id), onSelect } })), [specs, selectedKey, onSelect, supersededKeys, yAxisField]);
  const edges = useMemo4(() => buildGraphEdges(specs, selectedKey), [specs, selectedKey]);
  const handleNodeClick2 = useCallback5((_event, node) => onSelect?.(node.id), [onSelect]);
  const handleInit = useCallback5((instance) => {
    instance.fitView({ padding: 0.15 });
  }, []);
  return /* @__PURE__ */ jsxDEV5("div", {
    className: "graph-canvas-container",
    children: [
      /* @__PURE__ */ jsxDEV5(index, {
        nodes,
        edges,
        nodeTypes,
        edgeTypes,
        colorMode,
        onNodeClick: handleNodeClick2,
        onInit: handleInit,
        minZoom: 0.25,
        maxZoom: 4,
        nodesDraggable: false,
        nodesConnectable: false,
        fitView: true,
        fitViewOptions: { padding: 0.15 },
        children: [
          /* @__PURE__ */ jsxDEV5(Background, {
            color: colorMode === "dark" ? "#34323d" : "#d0d0d8",
            gap: 26,
            size: 1
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV5(Controls, {
            showInteractive: false
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV5(GraphOverlays, {
        specs,
        yAxisField
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV5(GraphLegend, {}, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function GraphCanvas(props) {
  return /* @__PURE__ */ jsxDEV5(ReactFlowProvider, {
    children: /* @__PURE__ */ jsxDEV5(GraphCanvasInner, {
      ...props
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}

// src/components/DetailPanel.tsx
import { useEffect as useEffect7 } from "react";

// src/hooks/useSpecDetail.ts
import { useCallback as useCallback6, useEffect as useEffect5, useMemo as useMemo5, useRef as useRef3, useState as useState5 } from "react";
function str(v, fallback = "") {
  return typeof v === "string" ? v : fallback;
}
function num(v, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function normalizeDetail(raw) {
  const r = raw;
  if (!r || typeof r !== "object")
    return null;
  const spec = r["spec"] ?? {};
  const meta = r["metadata"] ?? {};
  const tags = Array.isArray(meta["tags"]) ? meta["tags"].filter((t) => typeof t === "string") : [];
  const approvers = Array.isArray(meta["approvers"]) ? meta["approvers"].filter((a) => typeof a === "string") : [];
  const retention = meta["retentionPolicy"];
  const legal = meta["legalHold"];
  const stage = str(spec["stage"], "draft");
  const indexedAt = str(spec["indexed_at"] ?? spec["indexedAt"]);
  return {
    key: str(spec["key"]),
    specId: str(spec["spec_id"]) || str(spec["specId"]),
    type: str(spec["type"], "unknown"),
    stage,
    progress: num(spec["progress"]),
    revision: num(r["revision"]),
    metadata: {
      title: str(meta["title"]) || str(spec["title"]) || "Untitled",
      summary: str(meta["summary"]) || undefined,
      owner: str(meta["owner"]),
      theme: str(meta["theme"]) || undefined,
      tags,
      targetRelease: str(meta["targetRelease"]) || undefined,
      retentionPolicy: retention ? {
        type: str(retention.type, "active_plus_2_years"),
        customDate: str(retention.customDate) || undefined
      } : undefined,
      legalHold: legal ? { active: legal.active === true, reason: str(legal.reason) || undefined } : undefined,
      approvers,
      implementationRef: str(meta["implementationRef"]) || undefined
    },
    provenance: {
      repository: str(spec["repository"], "—"),
      relativePath: str(spec["relative_path"] ?? spec["relativePath"], "—"),
      branch: str(spec["branch"], "main"),
      commitHash: str(spec["commit_hash"] ?? spec["commitHash"]),
      isDirty: spec["is_dirty"] === 1 || spec["is_dirty"] === true,
      remoteUrl: str(spec["remote_url"] ?? spec["remoteUrl"]) || undefined
    },
    createdAt: indexedAt || new Date().toISOString(),
    completedAt: stage === "completed" ? indexedAt || undefined : undefined
  };
}
function normalizeSuggestions(raw) {
  const r = raw;
  const arr = r?.["suggestions"];
  if (!Array.isArray(arr))
    return [];
  return arr.filter((s) => !!s && typeof s === "object").map((s) => ({
    id: str(s["id"]),
    targetSpecKey: str(s["target_spec_key"] ?? s["targetSpecKey"]),
    type: str(s["type"], "related"),
    confidence: num(s["confidence"]),
    reason: str(s["reason"]),
    evidence: str(s["evidence"])
  })).filter((s) => s.id !== "");
}
function useSpecDetail(specKey) {
  const { api, notify } = useCrew();
  const [detail, setDetail] = useState5(null);
  const [suggestions, setSuggestions] = useState5([]);
  const [loading, setLoading] = useState5(false);
  const [saving, setSaving] = useState5(false);
  const [error, setError] = useState5(null);
  const fetchIdRef = useRef3(0);
  const load = useCallback6(async () => {
    if (!specKey) {
      setDetail(null);
      setSuggestions([]);
      setError(null);
      return;
    }
    const id2 = ++fetchIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const [detailRes, sugRes] = await Promise.all([
        api.fetch(`/specs/${encodeURIComponent(specKey)}`),
        api.fetch(`/specs/${encodeURIComponent(specKey)}/suggestions`)
      ]);
      if (!detailRes.ok)
        throw new Error(`Failed to load spec: ${detailRes.status}`);
      const detailData = await detailRes.json();
      const sugData = sugRes.ok ? await sugRes.json() : { suggestions: [] };
      if (id2 === fetchIdRef.current) {
        setDetail(normalizeDetail(detailData));
        setSuggestions(normalizeSuggestions(sugData));
      }
    } catch (err) {
      if (id2 === fetchIdRef.current) {
        setError(err instanceof Error ? err.message : String(err));
        setDetail(null);
        setSuggestions([]);
      }
    } finally {
      if (id2 === fetchIdRef.current)
        setLoading(false);
    }
  }, [api, specKey]);
  useEffect5(() => {
    load();
  }, [load]);
  const save = useCallback6(async (patch) => {
    if (!specKey || !detail)
      return false;
    setSaving(true);
    setError(null);
    const attempt = async (expectedRevision) => {
      const res = await api.fetch(`/specs/${encodeURIComponent(specKey)}/metadata`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedRevision, patch })
      });
      if (res.ok) {
        const body2 = await res.json();
        setDetail((prev) => prev ? {
          ...prev,
          revision: body2.revision,
          metadata: { ...prev.metadata, ...patch }
        } : prev);
        return true;
      }
      if (res.status === 409) {
        const body2 = await res.json().catch(() => null);
        if (body2 && typeof body2.actual === "number") {
          return attempt(body2.actual);
        }
      }
      const body = await res.json().catch(() => null);
      throw new Error(body?.message ?? `Save failed: ${res.status}`);
    };
    try {
      const ok = await attempt(detail.revision);
      if (ok)
        notify.success("Metadata saved.");
      return ok;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      notify.error(msg);
      return false;
    } finally {
      setSaving(false);
    }
  }, [api, specKey, detail, notify]);
  const acceptSuggestion = useCallback6(async (id2) => {
    try {
      const res = await api.fetch(`/suggestions/${encodeURIComponent(id2)}/accept`, {
        method: "POST"
      });
      if (!res.ok)
        throw new Error(`Accept failed: ${res.status}`);
      setSuggestions((prev) => prev.filter((s) => s.id !== id2));
      notify.success("Suggestion accepted.");
    } catch (err) {
      notify.error(err instanceof Error ? err.message : String(err));
    }
  }, [api, notify]);
  const rejectSuggestion = useCallback6(async (id2) => {
    try {
      const res = await api.fetch(`/suggestions/${encodeURIComponent(id2)}/reject`, {
        method: "POST"
      });
      if (!res.ok)
        throw new Error(`Reject failed: ${res.status}`);
      setSuggestions((prev) => prev.filter((s) => s.id !== id2));
      notify.info("Suggestion dismissed.");
    } catch (err) {
      notify.error(err instanceof Error ? err.message : String(err));
    }
  }, [api, notify]);
  return useMemo5(() => ({
    detail,
    suggestions,
    loading,
    saving,
    error,
    save,
    acceptSuggestion,
    rejectSuggestion,
    refetch: load
  }), [detail, suggestions, loading, saving, error, save, acceptSuggestion, rejectSuggestion, load]);
}

// src/components/SpecActions.tsx
import { jsxDEV as jsxDEV6 } from "react/jsx-dev-runtime";
function buildPermalink(detail) {
  const { remoteUrl, relativePath, commitHash, branch } = detail.provenance;
  if (!remoteUrl)
    return null;
  let base = null;
  const https = remoteUrl.match(/^https?:\/\/([^/]+)\/(.+?)(?:\.git)?\/?$/);
  const ssh = remoteUrl.match(/^git@([^:]+):(.+?)(?:\.git)?\/?$/);
  if (https)
    base = `https://${https[1]}/${https[2]}`;
  else if (ssh)
    base = `https://${ssh[1]}/${ssh[2]}`;
  if (!base)
    return null;
  const host = base.replace(/^https:\/\//, "").split("/")[0] ?? "";
  const ref = commitHash || branch || "main";
  const path = relativePath.replace(/^\/+/, "");
  if (host.includes("gitlab"))
    return `${base}/-/tree/${ref}/${path}`;
  return `${base}/tree/${ref}/${path}`;
}
function SpecActions({ detail }) {
  const { chatLauncher } = useCrew();
  const permalink = buildPermalink(detail);
  const { isDirty, commitHash } = detail.provenance;
  const openInChat = () => {
    chatLauncher.open({
      specId: detail.specId || detail.key,
      revisionId: commitHash || undefined
    });
  };
  return /* @__PURE__ */ jsxDEV6("div", {
    className: "spec-actions",
    role: "group",
    "aria-label": "Spec actions",
    children: [
      /* @__PURE__ */ jsxDEV6("button", {
        type: "button",
        className: "spec-actions__primary",
        onClick: openInChat,
        children: "Open in Crew chat"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV6("div", {
        className: "spec-actions__permalink",
        children: [
          permalink ? /* @__PURE__ */ jsxDEV6("a", {
            className: "spec-actions__link",
            href: permalink,
            target: "_blank",
            rel: "noopener noreferrer",
            children: "Repository permalink ↗"
          }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV6("span", {
            className: "spec-actions__link spec-actions__link--disabled",
            "aria-disabled": "true",
            title: "No web URL is available for this source",
            children: "Repository permalink"
          }, undefined, false, undefined, this),
          isDirty && /* @__PURE__ */ jsxDEV6("span", {
            className: "spec-actions__dirty",
            title: "Working tree has uncommitted changes; the permalink points at the last commit",
            children: "● Uncommitted changes"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/components/MetadataPanel.tsx
import { useEffect as useEffect6, useRef as useRef4, useState as useState6 } from "react";
import { jsxDEV as jsxDEV7 } from "react/jsx-dev-runtime";
function EditableField({
  label,
  value,
  placeholder,
  multiline,
  saving,
  commitTrigger,
  onCommit
}) {
  const [editing, setEditing] = useState6(false);
  const [draft, setDraft] = useState6(value);
  const draftRef = useRef4(draft);
  draftRef.current = draft;
  const valueRef = useRef4(value);
  valueRef.current = value;
  const start2 = () => {
    setDraft(value);
    setEditing(true);
  };
  const cancel = () => setEditing(false);
  const commit = () => {
    setEditing(false);
    if (draft !== value)
      onCommit(draft.trim());
  };
  const isFirstTrigger = useRef4(true);
  useEffect6(() => {
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
  }, [commitTrigger]);
  return /* @__PURE__ */ jsxDEV7("div", {
    className: "meta-field",
    children: [
      /* @__PURE__ */ jsxDEV7("div", {
        className: "meta-field__head",
        children: [
          /* @__PURE__ */ jsxDEV7("span", {
            className: "meta-field__label",
            children: label
          }, undefined, false, undefined, this),
          !editing && /* @__PURE__ */ jsxDEV7("button", {
            type: "button",
            className: "meta-field__edit",
            onClick: start2,
            "aria-label": `Edit ${label}`,
            children: "Edit"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      editing ? /* @__PURE__ */ jsxDEV7("div", {
        className: "meta-field__editor",
        children: [
          multiline ? /* @__PURE__ */ jsxDEV7("textarea", {
            value: draft,
            rows: 3,
            autoFocus: true,
            onChange: (e) => setDraft(e.target.value),
            "aria-label": label
          }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV7("input", {
            type: "text",
            value: draft,
            autoFocus: true,
            onChange: (e) => setDraft(e.target.value),
            "aria-label": label
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV7("div", {
            className: "meta-field__actions",
            children: [
              /* @__PURE__ */ jsxDEV7("button", {
                type: "button",
                onClick: commit,
                disabled: saving,
                children: "Save"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV7("button", {
                type: "button",
                onClick: cancel,
                className: "meta-field__cancel",
                children: "Cancel"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this) : /* @__PURE__ */ jsxDEV7("p", {
        className: `meta-field__value${value ? "" : " meta-field__value--empty"}`,
        children: value || placeholder || "—"
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function MetadataPanel({
  detail,
  suggestions,
  saving,
  onSave,
  onAcceptSuggestion,
  onRejectSuggestion
}) {
  const { notify, chatLauncher } = useCrew();
  const { metadata } = detail;
  const [tagsEditing, setTagsEditing] = useState6(false);
  const [tagsDraft, setTagsDraft] = useState6(metadata.tags.join(", "));
  const tagsDraftRef = useRef4(tagsDraft);
  tagsDraftRef.current = tagsDraft;
  const commitTags = () => {
    setTagsEditing(false);
    const next = tagsDraft.split(",").map((t) => t.trim()).filter(Boolean);
    if (next.join("|") !== metadata.tags.join("|")) {
      onSave({ tags: next });
    }
  };
  const isFirstKeyChange = useRef4(true);
  useEffect6(() => {
    if (isFirstKeyChange.current) {
      isFirstKeyChange.current = false;
      return;
    }
    if (tagsEditing) {
      setTagsEditing(false);
      const next = tagsDraftRef.current.split(",").map((t) => t.trim()).filter(Boolean);
      if (next.join("|") !== metadata.tags.join("|")) {
        onSave({ tags: next });
      }
    }
  }, [detail.key]);
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
        implementationRef: metadata.implementationRef
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${detail.key}.spec-library.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file)
      return;
    const reader = new FileReader;
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed.metadata) {
          onSave(parsed.metadata);
        } else {
          notify.error("No metadata found in the imported file.");
        }
      } catch {
        notify.error("Could not parse the imported file as JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };
  return /* @__PURE__ */ jsxDEV7("section", {
    className: "metadata-panel",
    "aria-label": "Spec metadata",
    children: [
      /* @__PURE__ */ jsxDEV7("header", {
        className: "metadata-panel__head",
        children: [
          /* @__PURE__ */ jsxDEV7("h3", {
            children: "Metadata"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV7("div", {
            className: "metadata-panel__io",
            children: [
              /* @__PURE__ */ jsxDEV7("label", {
                className: "metadata-panel__import",
                children: [
                  "Import",
                  /* @__PURE__ */ jsxDEV7("input", {
                    type: "file",
                    accept: "application/json,.json",
                    onChange: handleImport,
                    className: "visually-hidden"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV7("button", {
                type: "button",
                onClick: handleExport,
                children: "Export"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV7(EditableField, {
        label: "Title",
        value: metadata.title,
        saving,
        commitTrigger: detail.key,
        onCommit: (v) => void onSave({ title: v })
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV7(EditableField, {
        label: "Summary",
        value: metadata.summary ?? "",
        placeholder: "No summary yet",
        multiline: true,
        saving,
        commitTrigger: detail.key,
        onCommit: (v) => void onSave({ summary: v })
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV7(EditableField, {
        label: "Owner",
        value: metadata.owner,
        placeholder: "Unassigned",
        saving,
        commitTrigger: detail.key,
        onCommit: (v) => void onSave({ owner: v })
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV7(EditableField, {
        label: "Theme",
        value: metadata.theme ?? "",
        placeholder: "No theme",
        saving,
        commitTrigger: detail.key,
        onCommit: (v) => void onSave({ theme: v })
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV7("div", {
        className: "meta-field",
        children: [
          /* @__PURE__ */ jsxDEV7("div", {
            className: "meta-field__head",
            children: [
              /* @__PURE__ */ jsxDEV7("span", {
                className: "meta-field__label",
                children: "Tags"
              }, undefined, false, undefined, this),
              !tagsEditing && /* @__PURE__ */ jsxDEV7("button", {
                type: "button",
                className: "meta-field__edit",
                onClick: () => {
                  setTagsDraft(metadata.tags.join(", "));
                  setTagsEditing(true);
                },
                "aria-label": "Edit tags",
                children: "Edit"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          tagsEditing ? /* @__PURE__ */ jsxDEV7("div", {
            className: "meta-field__editor",
            children: [
              /* @__PURE__ */ jsxDEV7("input", {
                type: "text",
                value: tagsDraft,
                autoFocus: true,
                onChange: (e) => setTagsDraft(e.target.value),
                "aria-label": "Tags, comma separated"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV7("small", {
                children: "Separate tags with commas."
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV7("div", {
                className: "meta-field__actions",
                children: [
                  /* @__PURE__ */ jsxDEV7("button", {
                    type: "button",
                    onClick: commitTags,
                    disabled: saving,
                    children: "Save"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV7("button", {
                    type: "button",
                    className: "meta-field__cancel",
                    onClick: () => setTagsEditing(false),
                    children: "Cancel"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this) : metadata.tags.length > 0 ? /* @__PURE__ */ jsxDEV7("div", {
            className: "meta-tags",
            children: metadata.tags.map((t) => /* @__PURE__ */ jsxDEV7("span", {
              children: t
            }, t, false, undefined, this))
          }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV7("p", {
            className: "meta-field__value meta-field__value--empty",
            children: "No tags"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV7(EditableField, {
        label: "Target release",
        value: metadata.targetRelease ?? "",
        placeholder: "Unscheduled",
        saving,
        commitTrigger: detail.key,
        onCommit: (v) => void onSave({ targetRelease: v })
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV7("div", {
        className: "meta-field",
        children: [
          /* @__PURE__ */ jsxDEV7("div", {
            className: "meta-field__head",
            children: /* @__PURE__ */ jsxDEV7("span", {
              className: "meta-field__label",
              children: "Approvers"
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV7("p", {
            className: `meta-field__value${metadata.approvers.length > 0 ? "" : " meta-field__value--empty"}`,
            children: metadata.approvers.length > 0 ? metadata.approvers.join(", ") : "None"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV7(EditableField, {
        label: "Implementation link",
        value: metadata.implementationRef ?? "",
        placeholder: "No link",
        saving,
        commitTrigger: detail.key,
        onCommit: (v) => void onSave({ implementationRef: v })
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV7("div", {
        className: "meta-field",
        children: [
          /* @__PURE__ */ jsxDEV7("div", {
            className: "meta-field__head",
            children: /* @__PURE__ */ jsxDEV7("span", {
              className: "meta-field__label",
              children: "Created"
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV7("p", {
            className: "meta-field__value",
            children: detail.createdAt ? new Date(detail.createdAt).toLocaleDateString() : "—"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      detail.completedAt && /* @__PURE__ */ jsxDEV7("div", {
        className: "meta-field",
        children: [
          /* @__PURE__ */ jsxDEV7("div", {
            className: "meta-field__head",
            children: /* @__PURE__ */ jsxDEV7("span", {
              className: "meta-field__label",
              children: "Completed"
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV7("p", {
            className: "meta-field__value",
            children: new Date(detail.completedAt).toLocaleDateString()
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV7("div", {
        className: "metadata-panel__relationships",
        children: [
          /* @__PURE__ */ jsxDEV7("h4", {
            children: "Suggested relationships"
          }, undefined, false, undefined, this),
          suggestions.length === 0 ? /* @__PURE__ */ jsxDEV7("p", {
            className: "meta-field__value meta-field__value--empty",
            children: "No pending suggestions."
          }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV7("ul", {
            className: "suggestion-list",
            children: suggestions.map((s) => /* @__PURE__ */ jsxDEV7("li", {
              className: "suggestion",
              children: [
                /* @__PURE__ */ jsxDEV7("div", {
                  className: "suggestion__body",
                  children: [
                    /* @__PURE__ */ jsxDEV7("span", {
                      className: "suggestion__type",
                      children: s.type
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsxDEV7("strong", {
                      className: "suggestion__target",
                      children: s.targetSpecKey
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsxDEV7("span", {
                      className: "suggestion__evidence",
                      children: s.evidence
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsxDEV7("span", {
                      className: "suggestion__confidence",
                      children: [
                        Math.round(s.confidence * 100),
                        "% confidence"
                      ]
                    }, undefined, true, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ jsxDEV7("div", {
                  className: "suggestion__actions",
                  children: [
                    /* @__PURE__ */ jsxDEV7("button", {
                      type: "button",
                      className: "suggestion__why",
                      onClick: () => {
                        chatLauncher.open({
                          specId: detail.key,
                          prompt: `Explain this suggested relationship:
- Source: ${metadata.title} (${detail.key})
- Target: ${s.targetSpecKey}
- Type: ${s.type}
- Confidence: ${Math.round(s.confidence * 100)}%
- Evidence: ${s.evidence}

Show me the relevant content from both specs that supports or contradicts this suggestion.`
                        });
                      },
                      title: "Open Crew chat to explain this suggestion",
                      children: "Why?"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsxDEV7("button", {
                      type: "button",
                      className: "suggestion__accept",
                      onClick: () => onAcceptSuggestion(s.id),
                      children: "Accept"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsxDEV7("button", {
                      type: "button",
                      className: "suggestion__reject",
                      onClick: () => onRejectSuggestion(s.id),
                      children: "Dismiss"
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this)
              ]
            }, s.id, true, undefined, this))
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/components/DetailPanel.tsx
import { jsxDEV as jsxDEV8, Fragment as Fragment4 } from "react/jsx-dev-runtime";
function DetailPanel({
  specKey,
  variant = "rail",
  onClose
}) {
  const {
    detail,
    suggestions,
    loading,
    saving,
    error,
    save,
    acceptSuggestion,
    rejectSuggestion
  } = useSpecDetail(specKey);
  useEffect7(() => {
    if (!onClose)
      return;
    const handleKey = (e) => {
      if (e.key === "Escape")
        onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);
  if (!specKey)
    return null;
  return /* @__PURE__ */ jsxDEV8("aside", {
    className: `detail-panel detail-panel--${variant}`,
    "aria-label": "Spec detail",
    "aria-busy": loading,
    children: [
      onClose && /* @__PURE__ */ jsxDEV8("button", {
        type: "button",
        className: "detail-panel__close",
        onClick: onClose,
        "aria-label": "Close detail",
        children: "✕"
      }, undefined, false, undefined, this),
      loading && !detail && /* @__PURE__ */ jsxDEV8("p", {
        className: "detail-panel__status",
        role: "status",
        children: "Loading spec…"
      }, undefined, false, undefined, this),
      error && !detail && /* @__PURE__ */ jsxDEV8("p", {
        className: "detail-panel__status",
        role: "alert",
        children: error
      }, undefined, false, undefined, this),
      detail && /* @__PURE__ */ jsxDEV8(Fragment4, {
        children: [
          /* @__PURE__ */ jsxDEV8("header", {
            className: "detail-panel__header",
            children: [
              /* @__PURE__ */ jsxDEV8("p", {
                className: "detail-panel__eyebrow",
                children: [
                  detail.type,
                  " · ",
                  detail.stage,
                  " · ",
                  detail.progress,
                  "%"
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV8("h2", {
                className: "detail-panel__title",
                children: [
                  detail.metadata.title,
                  saving && /* @__PURE__ */ jsxDEV8("span", {
                    className: "detail-panel__saving",
                    role: "status",
                    "aria-live": "polite",
                    children: "Saving…"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV8("p", {
                className: "detail-panel__key",
                children: detail.key
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV8(SpecActions, {
            detail
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV8(MetadataPanel, {
            detail,
            suggestions,
            saving,
            onSave: save,
            onAcceptSuggestion: acceptSuggestion,
            onRejectSuggestion: rejectSuggestion
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/views/RelationshipView.tsx
import { jsxDEV as jsxDEV9, Fragment as Fragment5 } from "react/jsx-dev-runtime";
var MAX_VISIBLE_NODES = 250;
var LOCAL_ALIASES_KEY = "kiro-spec-library:aliases";
function getLocalAliases() {
  try {
    const raw = localStorage.getItem(LOCAL_ALIASES_KEY);
    if (!raw)
      return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((v) => typeof v === "string");
    }
    return [];
  } catch {
    return [];
  }
}
function normalizeSpec(record) {
  const r = record;
  if (!r || typeof r !== "object") {
    return {
      key: crypto.randomUUID(),
      title: "Unknown",
      type: "unknown",
      stage: "draft",
      owner: "",
      theme: "",
      progress: 0,
      relationships: [],
      suggestions: []
    };
  }
  const str2 = (field, fallback = "") => {
    const v = r[field];
    return typeof v === "string" ? v : fallback;
  };
  const num2 = (field, fallback = 0) => {
    const v = r[field];
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
  };
  const parseRelArray = (field) => {
    const arr = r[field];
    if (!Array.isArray(arr))
      return [];
    return arr.filter((item) => item !== null && typeof item === "object").map((item) => ({
      targetKey: typeof item["targetKey"] === "string" ? item["targetKey"] : "",
      type: typeof item["type"] === "string" ? item["type"] : "related"
    })).filter((rel) => rel.targetKey !== "");
  };
  const key = str2("key") || str2("id") || str2("slug") || crypto.randomUUID();
  const title = str2("title") || str2("name") || "Untitled";
  const rawType = str2("type", "unknown");
  const type = rawType === "feature" || rawType === "bugfix" || rawType === "quick" ? rawType : "unknown";
  return {
    key,
    title,
    type,
    stage: str2("stage", "draft"),
    owner: str2("owner"),
    theme: str2("theme"),
    progress: num2("progress", 0),
    relationships: parseRelArray("relationships"),
    suggestions: parseRelArray("suggestions")
  };
}
function normalizeSpecExtended(record) {
  const base = normalizeSpec(record);
  const r = record;
  const repository = r && typeof r === "object" ? typeof r["repository"] === "string" ? r["repository"] : typeof r["repo"] === "string" ? r["repo"] : "" : "";
  const metadataComplete = r && typeof r === "object" ? r["metadataComplete"] === true : false;
  return { ...base, repository, metadataComplete };
}
function deriveFilterOptions(specs) {
  const themes = new Set;
  const owners = new Set;
  const repositories = new Set;
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
    repositories: [...repositories].sort()
  };
}
function RelationshipView() {
  const [urlState, setUrlState] = useUrlState();
  const [hintVisible, setHintVisible] = useState7(false);
  const hintShownRef = useRef5(false);
  const [filters, setFilters] = useState7(() => ({
    scope: "team",
    theme: urlState.filters.theme,
    type: urlState.filters.type,
    stage: urlState.filters.stage,
    owner: urlState.filters.owner,
    repository: urlState.filters.repository,
    query: urlState.query
  }));
  const { specs: rawSpecs, loading, error } = useSpecData({
    query: filters.query,
    filters: {
      type: filters.type,
      stage: filters.stage,
      owner: filters.owner,
      repository: filters.repository
    },
    limit: 500
  });
  const allSpecs = useMemo6(() => (rawSpecs ?? []).map(normalizeSpecExtended), [rawSpecs]);
  const filteredSpecs = useMemo6(() => {
    let result = allSpecs;
    if (filters.scope === "mine") {
      const aliases = getLocalAliases();
      if (aliases.length > 0) {
        const aliasSet = new Set(aliases.map((a) => a.toLowerCase()));
        result = result.filter((s) => s.owner !== "" && aliasSet.has(s.owner.toLowerCase()));
      }
    }
    if (filters.theme) {
      result = result.filter((s) => s.theme === filters.theme);
    }
    if (filters.metadataComplete !== undefined) {
      result = result.filter((s) => s.metadataComplete === filters.metadataComplete);
    }
    return result;
  }, [allSpecs, filters.scope, filters.theme, filters.metadataComplete]);
  const sortedSpecs = useMemo6(() => [...filteredSpecs].sort((a, b) => a.title.localeCompare(b.title)), [filteredSpecs]);
  const isTruncated = sortedSpecs.length > MAX_VISIBLE_NODES;
  const visibleSpecs = useMemo6(() => isTruncated ? sortedSpecs.slice(0, MAX_VISIBLE_NODES) : sortedSpecs, [sortedSpecs, isTruncated]);
  const graphSpecs = useMemo6(() => visibleSpecs.map(({ metadataComplete: _m, ...spec }) => spec), [visibleSpecs]);
  const filterOptions = useMemo6(() => deriveFilterOptions(allSpecs), [allSpecs]);
  const [selectedKey, setSelectedKey] = useState7(urlState.selected);
  const selectSpec = useCallback7((key) => {
    setSelectedKey(key);
    setUrlState({ selected: key });
  }, [setUrlState]);
  const handleCanvasSelect = useCallback7((key) => {
    selectSpec(key);
  }, [selectSpec]);
  const selectedSpec = useMemo6(() => selectedKey ? visibleSpecs.find((s) => s.key === selectedKey) : undefined, [selectedKey, visibleSpecs]);
  const containerRef = useRef5(null);
  const [focusIndex, setFocusIndex] = useState7(-1);
  useEffect8(() => {
    const el = containerRef.current;
    if (!el)
      return;
    const handleKeyDown = (e) => {
      if (visibleSpecs.length === 0)
        return;
      let nextIndex = focusIndex;
      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
          e.preventDefault();
          nextIndex = focusIndex < visibleSpecs.length - 1 ? focusIndex + 1 : 0;
          break;
        case "ArrowUp":
        case "ArrowLeft":
          e.preventDefault();
          nextIndex = focusIndex > 0 ? focusIndex - 1 : visibleSpecs.length - 1;
          break;
        case "Home":
          e.preventDefault();
          nextIndex = 0;
          break;
        case "End":
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
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [focusIndex, visibleSpecs, selectSpec]);
  useEffect8(() => {
    if (urlState.selected !== selectedKey) {
      setSelectedKey(urlState.selected);
    }
  }, [urlState.selected]);
  const handleFilterChange = useCallback7((next) => {
    setFilters(next);
    setUrlState({
      query: next.query,
      filters: {
        type: next.type,
        stage: next.stage,
        owner: next.owner,
        repository: next.repository
      }
    });
  }, [setUrlState]);
  const statusText = useMemo6(() => {
    if (loading)
      return "Loading specifications…";
    if (error)
      return `Error: ${error}`;
    if (visibleSpecs.length === 0)
      return "No specifications to display.";
    const sel = selectedSpec ? ` Selected: ${selectedSpec.title}.` : "";
    return `Showing ${visibleSpecs.length} of ${filteredSpecs.length} specifications.${sel}`;
  }, [loading, error, visibleSpecs.length, filteredSpecs.length, selectedSpec]);
  const handleContainerFocus = useCallback7(() => {
    if (!hintShownRef.current) {
      hintShownRef.current = true;
      setHintVisible(true);
      setTimeout(() => setHintVisible(false), 4000);
    }
  }, []);
  if (error) {
    return /* @__PURE__ */ jsxDEV9("div", {
      className: "relationship-view",
      role: "alert",
      "aria-live": "assertive",
      children: [
        /* @__PURE__ */ jsxDEV9("header", {
          className: "relationship-header",
          children: [
            /* @__PURE__ */ jsxDEV9("p", {
              className: "eyebrow",
              children: "Relationship observatory"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV9("h1", {
              children: "Spec Library"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsxDEV9("div", {
          className: "graph-shell",
          children: [
            /* @__PURE__ */ jsxDEV9("p", {
              children: [
                "Failed to load specifications: ",
                error
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV9("p", {
              children: "Check your connection and try again."
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  return /* @__PURE__ */ jsxDEV9("div", {
    ref: containerRef,
    className: "relationship-view",
    tabIndex: 0,
    "aria-label": "Specification relationship graph view",
    role: "application",
    onFocus: handleContainerFocus,
    children: [
      /* @__PURE__ */ jsxDEV9("header", {
        className: "relationship-header",
        children: [
          /* @__PURE__ */ jsxDEV9("p", {
            className: "eyebrow",
            children: "Relationship observatory"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV9("h1", {
            children: "Spec Library"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV9(FilterBar, {
        filters,
        options: filterOptions,
        onChange: handleFilterChange,
        resultCount: visibleSpecs.length
      }, undefined, false, undefined, this),
      isTruncated && /* @__PURE__ */ jsxDEV9("div", {
        role: "status",
        "aria-live": "polite",
        className: "truncation-prompt",
        children: /* @__PURE__ */ jsxDEV9("p", {
          children: [
            "Showing ",
            MAX_VISIBLE_NODES,
            " of ",
            filteredSpecs.length,
            " specifications. Refine your filters to narrow the results."
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV9("div", {
        className: "visually-hidden",
        "aria-live": "polite",
        "aria-atomic": "true",
        children: statusText
      }, undefined, false, undefined, this),
      loading ? /* @__PURE__ */ jsxDEV9("div", {
        className: "graph-shell",
        "aria-busy": "true",
        "aria-label": "Loading specifications",
        children: /* @__PURE__ */ jsxDEV9("div", {
          className: "skeleton-container",
          children: [
            /* @__PURE__ */ jsxDEV9("div", {
              className: "skeleton-node"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV9("div", {
              className: "skeleton-node"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV9("div", {
              className: "skeleton-node"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV9("div", {
              className: "skeleton-node"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV9("div", {
              className: "skeleton-node"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this) : visibleSpecs.length === 0 ? /* @__PURE__ */ jsxDEV9("div", {
        className: "graph-shell",
        children: /* @__PURE__ */ jsxDEV9("p", {
          children: "No specifications match the current view."
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV9(Fragment5, {
        children: /* @__PURE__ */ jsxDEV9("div", {
          className: "graph-with-rail",
          children: [
            /* @__PURE__ */ jsxDEV9("div", {
              className: "graph-column",
              children: [
                /* @__PURE__ */ jsxDEV9("div", {
                  className: "graph-toolbar",
                  children: /* @__PURE__ */ jsxDEV9("label", {
                    className: "y-axis-selector",
                    children: [
                      /* @__PURE__ */ jsxDEV9("span", {
                        children: "Y-axis:"
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV9("select", {
                        value: urlState.yAxis,
                        onChange: (e) => setUrlState({ yAxis: e.target.value }),
                        "aria-label": "Y-axis grouping",
                        children: Y_AXIS_OPTIONS.map((opt) => /* @__PURE__ */ jsxDEV9("option", {
                          value: opt.value,
                          children: opt.label
                        }, opt.value, false, undefined, this))
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV9("div", {
                  className: "graph-shell",
                  children: /* @__PURE__ */ jsxDEV9(GraphCanvas, {
                    specs: graphSpecs,
                    selectedKey,
                    onSelect: handleCanvasSelect,
                    colorMode: urlState.themeMode,
                    yAxisField: urlState.yAxis
                  }, undefined, false, undefined, this)
                }, undefined, false, undefined, this),
                hintVisible && /* @__PURE__ */ jsxDEV9("p", {
                  className: "keyboard-hint",
                  children: "↑↓ navigate · Enter select · Home/End jump"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            selectedKey && /* @__PURE__ */ jsxDEV9(DetailPanel, {
              specKey: selectedKey,
              variant: "rail",
              onClose: () => selectSpec(undefined)
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/views/ArchiveView.tsx
import {
  useCallback as useCallback8,
  useEffect as useEffect9,
  useMemo as useMemo7,
  useRef as useRef6,
  useState as useState8
} from "react";

// src/components/ArchiveFilterBar.tsx
import { jsxDEV as jsxDEV10 } from "react/jsx-dev-runtime";
function isNonDefault2(f) {
  return Boolean(f.query || f.type || f.theme || f.repository || f.owner || f.fromDate || f.toDate || f.metadataComplete !== undefined);
}
function ArchiveFilterBar({
  filters,
  options,
  onChange
}) {
  const set3 = (key, value) => {
    onChange({ ...filters, [key]: value });
  };
  const handleSearch = (e) => {
    set3("query", e.target.value.slice(0, 200) || undefined);
  };
  const selectHandler = (key) => (e) => {
    set3(key, e.target.value || undefined);
  };
  return /* @__PURE__ */ jsxDEV10("div", {
    className: "archive-tools",
    role: "search",
    "aria-label": "Filter archived specs",
    children: [
      /* @__PURE__ */ jsxDEV10("label", {
        className: "archive-search",
        children: [
          /* @__PURE__ */ jsxDEV10("span", {
            className: "visually-hidden",
            children: "Search archived specs"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV10("input", {
            type: "search",
            maxLength: 200,
            value: filters.query ?? "",
            onChange: handleSearch,
            placeholder: "Search…",
            "aria-label": "Search archived specs"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV10("div", {
        className: "archive-filter-group",
        children: [
          /* @__PURE__ */ jsxDEV10("label", {
            children: [
              /* @__PURE__ */ jsxDEV10("span", {
                className: "visually-hidden",
                children: "Type"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV10("select", {
                value: filters.type ?? "",
                onChange: selectHandler("type"),
                "aria-label": "Filter by type",
                children: [
                  /* @__PURE__ */ jsxDEV10("option", {
                    value: "",
                    children: "All types"
                  }, undefined, false, undefined, this),
                  options.types.map((t) => /* @__PURE__ */ jsxDEV10("option", {
                    value: t,
                    children: t
                  }, t, false, undefined, this))
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV10("label", {
            children: [
              /* @__PURE__ */ jsxDEV10("span", {
                className: "visually-hidden",
                children: "Theme"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV10("select", {
                value: filters.theme ?? "",
                onChange: selectHandler("theme"),
                "aria-label": "Filter by theme",
                children: [
                  /* @__PURE__ */ jsxDEV10("option", {
                    value: "",
                    children: "All themes"
                  }, undefined, false, undefined, this),
                  options.themes.map((t) => /* @__PURE__ */ jsxDEV10("option", {
                    value: t,
                    children: t
                  }, t, false, undefined, this))
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV10("label", {
            children: [
              /* @__PURE__ */ jsxDEV10("span", {
                className: "visually-hidden",
                children: "Repository"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV10("select", {
                value: filters.repository ?? "",
                onChange: selectHandler("repository"),
                "aria-label": "Filter by repository",
                children: [
                  /* @__PURE__ */ jsxDEV10("option", {
                    value: "",
                    children: "All repositories"
                  }, undefined, false, undefined, this),
                  options.repositories.map((r) => /* @__PURE__ */ jsxDEV10("option", {
                    value: r,
                    children: r
                  }, r, false, undefined, this))
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV10("label", {
            children: [
              /* @__PURE__ */ jsxDEV10("span", {
                className: "visually-hidden",
                children: "Owner"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV10("select", {
                value: filters.owner ?? "",
                onChange: selectHandler("owner"),
                "aria-label": "Filter by owner",
                children: [
                  /* @__PURE__ */ jsxDEV10("option", {
                    value: "",
                    children: "All owners"
                  }, undefined, false, undefined, this),
                  options.owners.map((o) => /* @__PURE__ */ jsxDEV10("option", {
                    value: o,
                    children: o
                  }, o, false, undefined, this))
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV10("label", {
            children: [
              /* @__PURE__ */ jsxDEV10("span", {
                className: "visually-hidden",
                children: "Metadata completeness"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV10("select", {
                value: filters.metadataComplete === true ? "true" : filters.metadataComplete === false ? "false" : "",
                onChange: (e) => {
                  const v = e.target.value;
                  set3("metadataComplete", v === "true" ? true : v === "false" ? false : undefined);
                },
                "aria-label": "Filter by metadata completeness",
                children: [
                  /* @__PURE__ */ jsxDEV10("option", {
                    value: "",
                    children: "Any completeness"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV10("option", {
                    value: "true",
                    children: "Metadata complete"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV10("option", {
                    value: "false",
                    children: "Needs metadata"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV10("label", {
            className: "archive-date",
            children: [
              /* @__PURE__ */ jsxDEV10("span", {
                className: "visually-hidden",
                children: "From date"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV10("input", {
                type: "date",
                value: filters.fromDate ?? "",
                onChange: (e) => set3("fromDate", e.target.value || undefined),
                "aria-label": "Completed on or after"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV10("label", {
            className: "archive-date",
            children: [
              /* @__PURE__ */ jsxDEV10("span", {
                className: "visually-hidden",
                children: "To date"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV10("input", {
                type: "date",
                value: filters.toDate ?? "",
                onChange: (e) => set3("toDate", e.target.value || undefined),
                "aria-label": "Completed on or before"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      isNonDefault2(filters) && /* @__PURE__ */ jsxDEV10("button", {
        type: "button",
        className: "archive-clear",
        onClick: () => onChange({}),
        children: "Clear filters"
      }, undefined, false, undefined, this),
      isNonDefault2(filters) && /* @__PURE__ */ jsxDEV10("div", {
        className: "filter-chips",
        role: "list",
        "aria-label": "Active filters",
        children: [
          filters.query && /* @__PURE__ */ jsxDEV10("span", {
            className: "filter-chip",
            role: "listitem",
            children: [
              "search: ",
              filters.query,
              /* @__PURE__ */ jsxDEV10("button", {
                type: "button",
                "aria-label": "Remove search filter",
                onClick: () => set3("query", undefined),
                children: "✕"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          filters.type && /* @__PURE__ */ jsxDEV10("span", {
            className: "filter-chip",
            role: "listitem",
            children: [
              "type: ",
              filters.type,
              /* @__PURE__ */ jsxDEV10("button", {
                type: "button",
                "aria-label": `Remove type filter: ${filters.type}`,
                onClick: () => set3("type", undefined),
                children: "✕"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          filters.theme && /* @__PURE__ */ jsxDEV10("span", {
            className: "filter-chip",
            role: "listitem",
            children: [
              "theme: ",
              filters.theme,
              /* @__PURE__ */ jsxDEV10("button", {
                type: "button",
                "aria-label": `Remove theme filter: ${filters.theme}`,
                onClick: () => set3("theme", undefined),
                children: "✕"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          filters.repository && /* @__PURE__ */ jsxDEV10("span", {
            className: "filter-chip",
            role: "listitem",
            children: [
              "repository: ",
              filters.repository,
              /* @__PURE__ */ jsxDEV10("button", {
                type: "button",
                "aria-label": `Remove repository filter: ${filters.repository}`,
                onClick: () => set3("repository", undefined),
                children: "✕"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          filters.owner && /* @__PURE__ */ jsxDEV10("span", {
            className: "filter-chip",
            role: "listitem",
            children: [
              "owner: ",
              filters.owner,
              /* @__PURE__ */ jsxDEV10("button", {
                type: "button",
                "aria-label": `Remove owner filter: ${filters.owner}`,
                onClick: () => set3("owner", undefined),
                children: "✕"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/views/ArchiveView.tsx
import { jsxDEV as jsxDEV11 } from "react/jsx-dev-runtime";
var MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
var SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];
var NARROW_BREAKPOINT = 1024;
function str2(v, fallback = "") {
  return typeof v === "string" ? v : fallback;
}
function retentionLabel(policy, metadataComplete) {
  if (!metadataComplete)
    return "Needs metadata";
  const p = policy;
  const type = p && typeof p === "object" ? str2(p["type"]) : "";
  switch (type) {
    case "3_months":
      return "Review: 3 mo";
    case "6_months":
      return "Review: 6 mo";
    case "annually":
      return "Review: annual";
    case "none":
    default:
      return "No review scheduled";
  }
}
function normalizeSnapshot(record) {
  const r = record ?? {};
  const parse = (val) => {
    if (val && typeof val === "object")
      return val;
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        return {};
      }
    }
    return {};
  };
  const metadata = parse(r["metadata_projection"] ?? r["metadata"]);
  const provenance = parse(r["provenance"]);
  const createdAt = str2(r["created_at"] ?? r["createdAt"]) || new Date(0).toISOString();
  const date = new Date(createdAt);
  const valid = !Number.isNaN(date.getTime());
  const monthLabel = valid ? `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}` : "Unknown";
  const dateLabel = valid ? `${SHORT_MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}` : "—";
  const tags = Array.isArray(metadata["tags"]) ? metadata["tags"].filter((t) => typeof t === "string") : [];
  const metadataComplete = r["metadataComplete"] === true || str2(metadata["title"]) !== "" && str2(metadata["owner"]) !== "" && str2(metadata["theme"]) !== "" && tags.length > 0;
  const legalHoldActive = r["legal_hold_active"] === 1 || r["legal_hold_active"] === true;
  return {
    id: str2(r["id"]) || str2(r["spec_key"]) || crypto.randomUUID(),
    specKey: str2(r["spec_key"] ?? r["specKey"]),
    title: str2(metadata["title"]) || str2(r["spec_key"]) || "Untitled",
    type: str2(metadata["type"], "spec"),
    theme: str2(metadata["theme"], "—"),
    owner: str2(metadata["owner"], "—"),
    repository: str2(provenance["repository"], "—"),
    tags,
    createdAt,
    monthLabel,
    dateLabel,
    retentionLabel: retentionLabel(r["retention_policy"] ?? metadata["retentionPolicy"], metadataComplete),
    legalHoldActive,
    legalHoldReason: str2(r["legal_hold_reason"]) || undefined,
    metadataComplete,
    contentDigest: str2(r["content_digest"] ?? r["contentDigest"]),
    provenance: {
      repository: str2(provenance["repository"], "—"),
      relativePath: str2(provenance["relativePath"], "—"),
      branch: str2(provenance["branch"], "main"),
      commitHash: str2(provenance["commitHash"], "—")
    }
  };
}
function applyFilters(snapshots, filters) {
  const query = (filters.query ?? "").trim().toLowerCase();
  return snapshots.filter((s) => {
    if (query.length >= 2) {
      const haystack = `${s.title} ${s.theme} ${s.owner} ${s.repository} ${s.tags.join(" ")}`.toLowerCase();
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
    if (filters.legalHold === "active" && s.legalHoldActive)
      return false;
    if (filters.legalHold === "none" && !s.legalHoldActive)
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
function groupByMonth(snapshots) {
  const groups = new Map;
  for (const s of snapshots) {
    const list = groups.get(s.monthLabel) ?? [];
    list.push(s);
    groups.set(s.monthLabel, list);
  }
  return [...groups.entries()].map(([month, rows]) => ({
    month,
    rows: [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  })).sort((a, b) => {
    const da = a.rows[0]?.createdAt ?? "";
    const db = b.rows[0]?.createdAt ?? "";
    return db.localeCompare(da);
  });
}
function ArchiveView() {
  const [urlState, setUrlState] = useUrlState();
  const { snapshots: rawSnapshots, nextCursor, loadMore, loading, error } = useArchiveData({ limit: 50 });
  const [filters, setFilters] = useState8(() => ({
    query: urlState.query,
    type: urlState.filters.type,
    theme: urlState.filters.theme,
    repository: urlState.filters.repository,
    owner: urlState.filters.owner
  }));
  const [selectedId, setSelectedId] = useState8(urlState.selected);
  const [isNarrow, setIsNarrow] = useState8(() => typeof window !== "undefined" && window.innerWidth < NARROW_BREAKPOINT);
  const [drawerOpen, setDrawerOpen] = useState8(false);
  const triggerRef = useRef6(null);
  const drawerRef = useRef6(null);
  useEffect9(() => {
    if (typeof window === "undefined")
      return;
    const onResize = () => setIsNarrow(window.innerWidth < NARROW_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect9(() => {
    if (!drawerOpen)
      return;
    const handleKey = (e) => {
      if (e.key === "Escape")
        setDrawerOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [drawerOpen]);
  useEffect9(() => {
    if (drawerOpen) {
      const el = drawerRef.current;
      if (el) {
        const firstFocusable = el.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        firstFocusable?.focus();
      }
    } else {
      triggerRef.current?.focus();
    }
  }, [drawerOpen]);
  const allSnapshots = useMemo7(() => (rawSnapshots ?? []).map(normalizeSnapshot), [rawSnapshots]);
  const filtered = useMemo7(() => applyFilters(allSnapshots, filters), [allSnapshots, filters]);
  const groups = useMemo7(() => groupByMonth(filtered), [filtered]);
  const filterOptions = useMemo7(() => {
    const themes = new Set;
    const owners = new Set;
    const repositories = new Set;
    const types = new Set;
    for (const s of allSnapshots) {
      if (s.theme && s.theme !== "—")
        themes.add(s.theme);
      if (s.owner && s.owner !== "—")
        owners.add(s.owner);
      if (s.repository && s.repository !== "—")
        repositories.add(s.repository);
      if (s.type)
        types.add(s.type);
    }
    return {
      themes: [...themes].sort(),
      owners: [...owners].sort(),
      repositories: [...repositories].sort(),
      types: [...types].sort()
    };
  }, [allSnapshots]);
  const monthIndex = useMemo7(() => groups.map((g) => ({ label: g.month, short: g.month.split(" ")[0] })), [groups]);
  const selected2 = useMemo7(() => filtered.find((s) => s.id === selectedId) ?? filtered[0], [filtered, selectedId]);
  const handleSelect = useCallback8((id2, triggerEl) => {
    setSelectedId(id2);
    setUrlState({ selected: id2 });
    if (isNarrow) {
      if (triggerEl)
        triggerRef.current = triggerEl;
      setDrawerOpen(true);
    }
  }, [setUrlState, isNarrow]);
  const handleFilterChange = useCallback8((next) => {
    setFilters(next);
    setUrlState({
      query: next.query,
      filters: {
        type: next.type,
        theme: next.theme,
        repository: next.repository,
        owner: next.owner
      }
    });
  }, [setUrlState]);
  const scrollRef = useRef6(null);
  const monthRefs = useRef6(new Map);
  const [activeMonth, setActiveMonth] = useState8();
  useEffect9(() => {
    const root2 = scrollRef.current;
    if (!root2 || monthIndex.length === 0)
      return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      const first = visible[0]?.target.getAttribute("data-month");
      if (first)
        setActiveMonth(first);
    }, { root: root2, threshold: 0.1, rootMargin: "0px 0px -60% 0px" });
    for (const el of monthRefs.current.values())
      observer.observe(el);
    return () => observer.disconnect();
  }, [monthIndex]);
  const scrollToMonth = useCallback8((month) => {
    const el = monthRefs.current.get(month);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  const handleScroll = useCallback8(() => {
    const el = scrollRef.current;
    if (!el || loading || !nextCursor)
      return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 240;
    if (nearBottom)
      loadMore();
  }, [loading, nextCursor, loadMore]);
  if (error) {
    return /* @__PURE__ */ jsxDEV11("div", {
      className: "archive-view",
      role: "alert",
      children: [
        /* @__PURE__ */ jsxDEV11("header", {
          className: "archive-header",
          children: /* @__PURE__ */ jsxDEV11("div", {
            children: [
              /* @__PURE__ */ jsxDEV11("h1", {
                children: "Spec Library"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV11("p", {
                children: "Browse, retrieve, and curate completed Kiro Specs."
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV11("div", {
          className: "archive-empty",
          children: /* @__PURE__ */ jsxDEV11("p", {
            children: [
              "Failed to load the archive: ",
              error
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  const detail = selected2 ? /* @__PURE__ */ jsxDEV11(SnapshotDetail, {
    snapshot: selected2
  }, undefined, false, undefined, this) : null;
  return /* @__PURE__ */ jsxDEV11("div", {
    className: `archive-view${isNarrow ? " archive-view--narrow" : ""}`,
    children: [
      /* @__PURE__ */ jsxDEV11("header", {
        className: "archive-header",
        children: [
          /* @__PURE__ */ jsxDEV11("div", {
            children: [
              /* @__PURE__ */ jsxDEV11("h1", {
                children: "Spec Library"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV11("p", {
                children: "Browse, retrieve, and curate completed Kiro Specs."
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV11("span", {
            "aria-live": "polite",
            children: loading ? "Loading…" : `${filtered.length} archived spec${filtered.length === 1 ? "" : "s"}`
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV11(ArchiveFilterBar, {
        filters,
        options: filterOptions,
        onChange: handleFilterChange,
        resultCount: filtered.length
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV11("div", {
        className: "archive-body",
        children: [
          /* @__PURE__ */ jsxDEV11("section", {
            className: "archive-table",
            "aria-label": "Completed specs",
            ref: scrollRef,
            onScroll: handleScroll,
            children: [
              /* @__PURE__ */ jsxDEV11("div", {
                className: "archive-row archive-row--head",
                role: "row",
                children: [
                  /* @__PURE__ */ jsxDEV11("span", {
                    children: "Spec name"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV11("span", {
                    children: "Type"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV11("span", {
                    children: "Theme"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV11("span", {
                    children: "Repository"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV11("span", {
                    children: "Owner"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV11("span", {
                    children: "Completed"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              groups.map((group) => /* @__PURE__ */ jsxDEV11("div", {
                className: "archive-month",
                "data-month": group.month,
                ref: (el) => {
                  if (el)
                    monthRefs.current.set(group.month, el);
                  else
                    monthRefs.current.delete(group.month);
                },
                children: [
                  /* @__PURE__ */ jsxDEV11("h2", {
                    children: group.month
                  }, undefined, false, undefined, this),
                  group.rows.map((row) => /* @__PURE__ */ jsxDEV11("button", {
                    type: "button",
                    className: `archive-row${selected2?.id === row.id ? " is-selected" : ""}`,
                    onClick: (e) => handleSelect(row.id, e.currentTarget),
                    "aria-pressed": selected2?.id === row.id,
                    children: [
                      /* @__PURE__ */ jsxDEV11("span", {
                        children: /* @__PURE__ */ jsxDEV11("strong", {
                          children: row.title
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV11("span", {
                        children: row.type
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV11("span", {
                        children: row.theme
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV11("span", {
                        children: row.repository
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV11("span", {
                        children: row.owner
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV11("span", {
                        children: row.dateLabel
                      }, undefined, false, undefined, this)
                    ]
                  }, row.id, true, undefined, this))
                ]
              }, group.month, true, undefined, this)),
              loading && /* @__PURE__ */ jsxDEV11("div", {
                className: "archive-loading",
                role: "status",
                "aria-live": "polite",
                "aria-label": "Loading more specs",
                children: [
                  /* @__PURE__ */ jsxDEV11("div", {
                    className: "skeleton-row"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV11("div", {
                    className: "skeleton-row"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV11("div", {
                    className: "skeleton-row"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV11("div", {
                    className: "skeleton-row"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV11("div", {
                    className: "skeleton-row"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV11("div", {
                    className: "skeleton-row"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              !loading && filtered.length === 0 && /* @__PURE__ */ jsxDEV11("div", {
                className: "archive-empty",
                children: "No archived specs match your filters. Filters have been retained so you can adjust them."
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          monthIndex.length > 0 && /* @__PURE__ */ jsxDEV11("nav", {
            className: "month-index",
            "aria-label": "Jump to month",
            children: monthIndex.map((m) => /* @__PURE__ */ jsxDEV11("button", {
              type: "button",
              className: activeMonth === m.label ? "active" : undefined,
              onClick: () => scrollToMonth(m.label),
              "aria-current": activeMonth === m.label ? "true" : undefined,
              children: m.short
            }, m.label, false, undefined, this))
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      !isNarrow && selected2 && /* @__PURE__ */ jsxDEV11("div", {
        className: "archive-detail-region",
        children: [
          detail,
          selected2.specKey && /* @__PURE__ */ jsxDEV11(DetailPanel, {
            specKey: selected2.specKey,
            variant: "drawer"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      isNarrow && drawerOpen && selected2 && /* @__PURE__ */ jsxDEV11("div", {
        className: "archive-drawer-backdrop",
        role: "presentation",
        onMouseDown: () => setDrawerOpen(false),
        children: /* @__PURE__ */ jsxDEV11("aside", {
          className: "archive-drawer",
          role: "dialog",
          "aria-modal": "true",
          "aria-label": `Details for ${selected2.title}`,
          ref: drawerRef,
          onMouseDown: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ jsxDEV11("button", {
              type: "button",
              className: "archive-drawer__close",
              onClick: () => setDrawerOpen(false),
              "aria-label": "Close details",
              children: "✕"
            }, undefined, false, undefined, this),
            detail,
            selected2.specKey && /* @__PURE__ */ jsxDEV11(DetailPanel, {
              specKey: selected2.specKey,
              variant: "drawer"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function SnapshotDetail({
  snapshot
}) {
  const completenessPct = snapshot.metadataComplete ? 100 : 50;
  return /* @__PURE__ */ jsxDEV11("section", {
    className: "archive-detail",
    "aria-label": `Details for ${snapshot.title}`,
    children: [
      /* @__PURE__ */ jsxDEV11("div", {
        className: "archive-detail__intro",
        children: /* @__PURE__ */ jsxDEV11("div", {
          children: [
            /* @__PURE__ */ jsxDEV11("div", {
              className: "archive-detail__title",
              children: [
                /* @__PURE__ */ jsxDEV11("h2", {
                  children: snapshot.title
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV11("span", {
                  children: "Completed"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            snapshot.tags.length > 0 && /* @__PURE__ */ jsxDEV11("div", {
              className: "archive-tags",
              children: snapshot.tags.map((tag) => /* @__PURE__ */ jsxDEV11("span", {
                children: tag
              }, tag, false, undefined, this))
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV11("div", {
        className: "archive-columns",
        children: [
          /* @__PURE__ */ jsxDEV11("section", {
            children: [
              /* @__PURE__ */ jsxDEV11("h3", {
                children: "Artifact completeness"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV11("div", {
                className: "archive-fact",
                children: [
                  /* @__PURE__ */ jsxDEV11("span", {
                    children: "Metadata"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV11("strong", {
                    children: snapshot.metadataComplete ? "Complete" : "Incomplete"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV11("progress", {
                    max: 100,
                    value: completenessPct
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV11("section", {
            children: [
              /* @__PURE__ */ jsxDEV11("h3", {
                children: "Source"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV11("div", {
                className: "archive-fact",
                children: [
                  /* @__PURE__ */ jsxDEV11("span", {
                    children: "Repository"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV11("strong", {
                    children: snapshot.provenance.repository
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV11("div", {
                className: "archive-fact",
                children: [
                  /* @__PURE__ */ jsxDEV11("span", {
                    children: "Path"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV11("strong", {
                    children: snapshot.provenance.relativePath
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV11("div", {
                className: "archive-fact",
                children: [
                  /* @__PURE__ */ jsxDEV11("span", {
                    children: "Branch"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV11("strong", {
                    children: snapshot.provenance.branch
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV11("div", {
                className: "archive-fact",
                children: [
                  /* @__PURE__ */ jsxDEV11("span", {
                    children: "Commit"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV11("strong", {
                    children: snapshot.provenance.commitHash.slice(0, 12) || "—"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV11("section", {
            children: [
              /* @__PURE__ */ jsxDEV11("h3", {
                children: "Provenance"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV11("div", {
                className: "archive-fact",
                children: [
                  /* @__PURE__ */ jsxDEV11("span", {
                    children: "Owner"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV11("strong", {
                    children: snapshot.owner
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV11("div", {
                className: "archive-fact",
                children: [
                  /* @__PURE__ */ jsxDEV11("span", {
                    children: "Archived on"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV11("strong", {
                    children: snapshot.dateLabel
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV11("div", {
                className: "archive-fact",
                children: [
                  /* @__PURE__ */ jsxDEV11("span", {
                    children: "Spec key"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV11("strong", {
                    children: snapshot.specKey || "—"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV11("div", {
                className: "archive-fact",
                children: [
                  /* @__PURE__ */ jsxDEV11("span", {
                    children: "Content digest"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV11("strong", {
                    children: snapshot.contentDigest.slice(0, 12) || "—"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV11("section", {
            children: [
              /* @__PURE__ */ jsxDEV11("h3", {
                children: "Disposition"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV11("div", {
                className: "archive-fact",
                children: [
                  /* @__PURE__ */ jsxDEV11("span", {
                    children: "Status"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV11("strong", {
                    children: snapshot.legalHoldActive ? "Superseded" : "Active"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              snapshot.legalHoldActive && snapshot.legalHoldReason && /* @__PURE__ */ jsxDEV11("div", {
                className: "archive-fact",
                children: [
                  /* @__PURE__ */ jsxDEV11("span", {
                    children: "Successor"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV11("strong", {
                    children: snapshot.legalHoldReason
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/components/AppChrome.tsx
import { useState as useState9 } from "react";
import { jsxDEV as jsxDEV12 } from "react/jsx-dev-runtime";
function AppChrome({
  view,
  themeMode,
  onViewChange,
  onThemeChange
}) {
  const nextTheme = themeMode === "dark" ? "light" : "dark";
  const [copyLabel, setCopyLabel] = useState9("Copy link");
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyLabel("Copied!");
    setTimeout(() => setCopyLabel("Copy link"), 1500);
  };
  return /* @__PURE__ */ jsxDEV12("div", {
    className: "app-chrome",
    children: [
      /* @__PURE__ */ jsxDEV12("div", {
        className: "view-switcher",
        role: "tablist",
        "aria-label": "View",
        children: [
          /* @__PURE__ */ jsxDEV12("button", {
            type: "button",
            role: "tab",
            "aria-selected": view === "relationship",
            className: view === "relationship" ? "active" : undefined,
            onClick: () => onViewChange("relationship"),
            children: "Relationships"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV12("button", {
            type: "button",
            role: "tab",
            "aria-selected": view === "archive",
            className: view === "archive" ? "active" : undefined,
            onClick: () => onViewChange("archive"),
            children: "Archive"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV12("div", {
        className: "chrome-actions",
        children: [
          /* @__PURE__ */ jsxDEV12("button", {
            type: "button",
            className: "copy-link-btn",
            onClick: handleCopyLink,
            "aria-label": "Copy current page link",
            title: "Copy current page link",
            children: copyLabel
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV12("button", {
            type: "button",
            className: "theme-switcher",
            onClick: () => onThemeChange(nextTheme),
            "aria-label": `Switch to ${nextTheme} theme`,
            title: `Switch to ${nextTheme} theme`,
            children: themeMode === "dark" ? "☾ Dark" : "☀ Light"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/App.tsx
import { jsxDEV as jsxDEV13 } from "react/jsx-dev-runtime";
function AppProvider({
  children: children2,
  overrides
}) {
  return /* @__PURE__ */ jsxDEV13(CrewProvider, {
    overrides,
    children: children2
  }, undefined, false, undefined, this);
}
function AppContent() {
  const { ready, error } = useCrew();
  const [urlState, setUrlState] = useUrlState();
  if (error) {
    return /* @__PURE__ */ jsxDEV13("div", {
      role: "alert",
      className: "crew-error",
      children: [
        /* @__PURE__ */ jsxDEV13("h2", {
          children: "Integration Error"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV13("p", {
          children: error
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (!ready) {
    return /* @__PURE__ */ jsxDEV13("div", {
      className: "loading",
      "aria-busy": "true",
      children: /* @__PURE__ */ jsxDEV13("p", {
        children: "Initializing…"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
  }
  const { view, themeMode } = urlState;
  return /* @__PURE__ */ jsxDEV13("div", {
    "data-theme": themeMode,
    className: `app-root theme-${themeMode}`,
    children: [
      /* @__PURE__ */ jsxDEV13(AppChrome, {
        view,
        themeMode,
        onViewChange: (v) => setUrlState({ view: v }),
        onThemeChange: (m) => setUrlState({ themeMode: m })
      }, undefined, false, undefined, this),
      view === "relationship" ? /* @__PURE__ */ jsxDEV13(RelationshipView, {}, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV13(ArchiveView, {}, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function App({ crewOverrides } = {}) {
  return /* @__PURE__ */ jsxDEV13(AppProvider, {
    overrides: crewOverrides,
    children: /* @__PURE__ */ jsxDEV13(AppContent, {}, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}

// src/index.tsx
var cssUrl = new URL("./index.css", import.meta.url).href;
if (!document.querySelector(`link[href="${cssUrl}"]`)) {
  const link2 = document.createElement("link");
  link2.rel = "stylesheet";
  link2.href = cssUrl;
  document.head.appendChild(link2);
}
export {
  App as default,
  App as SpecLibraryApp
};
