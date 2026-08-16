import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSpecData } from '../hooks/useSpecData.js';
import { useUrlState } from '../hooks/useUrlState.js';
import {
  FilterBar,
  type FilterOptions,
  type RelationshipFilters,
} from '../components/FilterBar.js';
import GraphCanvas from '../components/GraphCanvas.js';
import type { GraphSpec } from '../components/GraphCanvas.js';
import { Y_AXIS_OPTIONS, type YAxisField } from '../components/GraphCanvas.js';
import { X_AXIS_OPTIONS, type XAxisField } from '../components/GraphCanvas.js';
import { DetailPanel } from '../components/DetailPanel.js';
import { getLocalAliases } from '../hooks/useLocalAliases.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_VISIBLE_NODES = 250;

/** Cautiously normalize an unknown backend record into a GraphSpec. */
function normalizeSpec(record: unknown): GraphSpec {
  const r = record as Record<string, unknown> | null | undefined;
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

  const str = (field: string, fallback = ''): string => {
    const v = r[field];
    return typeof v === 'string' ? v : fallback;
  };

  const num = (field: string, fallback = 0): number => {
    const v = r[field];
    return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  };

  const parseRelArray = (
    field: string,
  ): Array<{ targetKey: string; type: string }> => {
    const arr = r[field];
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(
        (item): item is Record<string, unknown> =>
          item !== null && typeof item === 'object',
      )
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
    reviewed: !!(r['reviewed_at'] || r['reviewedAt']),
    indexedAt: str('indexed_at') || str('indexedAt') || undefined,
    relationships: parseRelArray('relationships'),
    suggestions: parseRelArray('suggestions'),
  };
}

/** Extended local shape with extra metadata for filtering. */
interface NormalizedSpec extends GraphSpec {
  repository: string;
  metadataComplete: boolean;
}

function normalizeSpecExtended(record: unknown): NormalizedSpec {
  const base = normalizeSpec(record);
  const r = record as Record<string, unknown> | null | undefined;
  const repository =
    r && typeof r === 'object'
      ? typeof r['repository'] === 'string'
        ? r['repository']
        : typeof r['repo'] === 'string'
          ? r['repo']
          : ''
      : '';
  const metadataComplete =
    r && typeof r === 'object' ? r['metadataComplete'] === true : false;

  return { ...base, repository, metadataComplete };
}

/** Derive FilterOptions from the current set. */
function deriveFilterOptions(specs: NormalizedSpec[]): FilterOptions {
  const themes = new Set<string>();
  const owners = new Set<string>();
  const repositories = new Set<string>();

  for (const s of specs) {
    if (s.theme) themes.add(s.theme);
    if (s.owner) owners.add(s.owner);
    if (s.repository) repositories.add(s.repository);
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

export function RelationshipView(): React.ReactElement {
  const [urlState, setUrlState] = useUrlState();

  // Keyboard hint visibility: fades in on first focus, fades out after 4s
  const [hintVisible, setHintVisible] = useState(false);
  const hintShownRef = useRef(false);

  // Local filter state: combines URL filters with scope/metadata not in URL
  const [filters, setFilters] = useState<RelationshipFilters>(() => ({
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
  const allSpecs = useMemo<NormalizedSpec[]>(
    () => (rawSpecs ?? []).map(normalizeSpecExtended),
    [rawSpecs],
  );

  // Client-side filtering (scope + metadata completeness)
  const filteredSpecs = useMemo<NormalizedSpec[]>(() => {
    let result = allSpecs;

    // Scope: "mine" — filter to localStorage aliases (client-only, not auth)
    if (filters.scope === 'mine') {
      const aliases = getLocalAliases();
      if (aliases.length > 0) {
        const aliasSet = new Set(aliases.map((a) => a.toLowerCase()));
        result = result.filter(
          (s) => s.owner !== '' && aliasSet.has(s.owner.toLowerCase()),
        );
      }
    }

    // Theme (client-side complement when not sent to backend)
    if (filters.theme) {
      result = result.filter((s) => s.theme === filters.theme);
    }

    // Metadata completeness
    if (filters.metadataComplete !== undefined) {
      result = result.filter(
        (s) => s.metadataComplete === filters.metadataComplete,
      );
    }

    return result;
  }, [allSpecs, filters.scope, filters.theme, filters.metadataComplete]);

  // Sort and enforce 250-node cap
  const sortedSpecs = useMemo<NormalizedSpec[]>(
    () => [...filteredSpecs].sort((a, b) => a.title.localeCompare(b.title)),
    [filteredSpecs],
  );

  const isTruncated = sortedSpecs.length > MAX_VISIBLE_NODES;
  const visibleSpecs = useMemo<NormalizedSpec[]>(
    () => (isTruncated ? sortedSpecs.slice(0, MAX_VISIBLE_NODES) : sortedSpecs),
    [sortedSpecs, isTruncated],
  );

  // GraphSpec[] for the canvas (strip extended fields)
  const graphSpecs = useMemo<GraphSpec[]>(
    () =>
      visibleSpecs.map(({ metadataComplete: _m, ...spec }) => spec),
    [visibleSpecs],
  );

  // Derive filter options from full (pre-truncation) set
  const filterOptions = useMemo(() => deriveFilterOptions(allSpecs), [allSpecs]);

  // --- Selection state (synced to URL) ---
  const [selectedKey, setSelectedKey] = useState<string | undefined>(
    urlState.selected,
  );

  const selectSpec = useCallback(
    (key: string | undefined) => {
      setSelectedKey(key);
      setUrlState({ selected: key });
    },
    [setUrlState],
  );

  const handleCanvasSelect = useCallback(
    (key: string) => {
      selectSpec(key);
    },
    [selectSpec],
  );

  // Selected spec detail
  const selectedSpec = useMemo<NormalizedSpec | undefined>(
    () =>
      selectedKey ? visibleSpecs.find((s) => s.key === selectedKey) : undefined,
    [selectedKey, visibleSpecs],
  );

  // --- Roving keyboard focus ---
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState<number>(-1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (visibleSpecs.length === 0) return;

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
  const handleFilterChange = useCallback(
    (next: RelationshipFilters) => {
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
    },
    [setUrlState],
  );

  // Status text for assistive tech
  const statusText = useMemo(() => {
    if (loading) return 'Loading specifications…';
    if (error) return `Error: ${error}`;
    if (visibleSpecs.length === 0) return 'No specifications to display.';
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
    return (
      <div
        className="relationship-view"
        role="alert"
        aria-live="assertive"
      >
        <header className="relationship-header">
          <p className="eyebrow">Relationship observatory</p>
          <h1>Spec Library</h1>
        </header>
        <div className="graph-shell">
          <p>Failed to load specifications: {error}</p>
          <p>Check your connection and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relationship-view"
      tabIndex={0}
      aria-label="Specification relationship graph view"
      role="application"
      onFocus={handleContainerFocus}
    >
      {/* Header */}
      <header className="relationship-header">
        <p className="eyebrow">Relationship observatory</p>
        <h1>Spec Library</h1>
      </header>

      {/* FilterBar */}
      <FilterBar
        filters={filters}
        options={filterOptions}
        onChange={handleFilterChange}
        resultCount={visibleSpecs.length}
      />

      {/* Truncation warning — accessible refinement prompt */}
      {isTruncated && (
        <div
          role="status"
          aria-live="polite"
          className="truncation-prompt"
        >
          <p>
            Showing {MAX_VISIBLE_NODES} of {filteredSpecs.length} specifications.
            Refine your filters to narrow the results.
          </p>
        </div>
      )}

      {/* Live status for screen readers */}
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {statusText}
      </div>

      {/* Main content */}
      {loading ? (
        <div className="graph-shell" aria-busy="true" aria-label="Loading specifications">
          <div className="skeleton-container">
            <div className="skeleton-node" />
            <div className="skeleton-node" />
            <div className="skeleton-node" />
            <div className="skeleton-node" />
            <div className="skeleton-node" />
          </div>
        </div>
      ) : visibleSpecs.length === 0 ? (
        <div className="graph-shell">
          <p>No specifications match the current view.</p>
        </div>
      ) : (
        <>
          {/* Graph + detail rail */}
          <div className="graph-with-rail">
            <div className="graph-column">
              <div className="graph-toolbar">
                <label className="x-axis-selector">
                  <span>X-axis:</span>
                  <select
                    value={urlState.xAxis}
                    onChange={(e) => setUrlState({ xAxis: e.target.value as XAxisField })}
                    aria-label="X-axis grouping"
                  >
                    {X_AXIS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
                <label className="y-axis-selector">
                  <span>Y-axis:</span>
                  <select
                    value={urlState.yAxis}
                    onChange={(e) => setUrlState({ yAxis: e.target.value as YAxisField })}
                    aria-label="Y-axis grouping"
                  >
                    {Y_AXIS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="graph-shell">
                <GraphCanvas
                  specs={graphSpecs}
                  selectedKey={selectedKey}
                  onSelect={handleCanvasSelect}
                  colorMode={urlState.themeMode}
                  yAxisField={urlState.yAxis}
                  xAxisField={urlState.xAxis}
                />
              </div>

              {/* Keyboard navigation hint */}
              {hintVisible && (
                <p className="keyboard-hint">
                  ↑↓ navigate · Enter select · Home/End jump
                </p>
              )}
            </div>

            {/* Right inspection rail — full detail + metadata panel */}
            {selectedKey && (
              <DetailPanel
                specKey={selectedKey}
                variant="rail"
                onClose={() => selectSpec(undefined)}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
