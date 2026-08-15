import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useArchiveData } from '../hooks/useSpecData.js';
import { useUrlState } from '../hooks/useUrlState.js';
import {
  ArchiveFilterBar,
  type ArchiveFilters,
  type ArchiveFilterOptions,
} from '../components/ArchiveFilterBar.js';
import { DetailPanel } from '../components/DetailPanel.js';

// ---------------------------------------------------------------------------
// View model
// ---------------------------------------------------------------------------

/** A normalized archive snapshot for display. */
export interface ArchiveSnapshot {
  id: string;
  specKey: string;
  title: string;
  type: string;
  theme: string;
  owner: string;
  repository: string;
  tags: string[];
  /** ISO 8601 */
  createdAt: string;
  /** e.g. "August 2026" — grouping key */
  monthLabel: string;
  /** e.g. "Aug 7, 2026" */
  dateLabel: string;
  retentionLabel: string;
  legalHoldActive: boolean;
  legalHoldReason?: string;
  metadataComplete: boolean;
  contentDigest: string;
  provenance: {
    repository: string;
    relativePath: string;
    branch: string;
    commitHash: string;
  };
}

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

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function retentionLabel(policy: unknown, metadataComplete: boolean): string {
  if (!metadataComplete) return 'Needs metadata';
  const p = policy as Record<string, unknown> | null | undefined;
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
function normalizeSnapshot(record: unknown): ArchiveSnapshot {
  const r = (record ?? {}) as Record<string, unknown>;

  // metadata_projection and provenance arrive as JSON strings (or objects).
  const parse = (val: unknown): Record<string, unknown> => {
    if (val && typeof val === 'object') return val as Record<string, unknown>;
    if (typeof val === 'string') {
      try {
        const parsed: unknown = JSON.parse(val);
        return parsed && typeof parsed === 'object'
          ? (parsed as Record<string, unknown>)
          : {};
      } catch {
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
    ? (metadata['tags'] as unknown[]).filter((t): t is string => typeof t === 'string')
    : [];

  const metadataComplete =
    r['metadataComplete'] === true ||
    (str(metadata['title']) !== '' &&
      str(metadata['owner']) !== '' &&
      str(metadata['theme']) !== '' &&
      tags.length > 0);

  const legalHoldActive =
    r['legal_hold_active'] === 1 || r['legal_hold_active'] === true;

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
    retentionLabel: retentionLabel(
      r['retention_policy'] ?? metadata['retentionPolicy'],
      metadataComplete,
    ),
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

function applyFilters(
  snapshots: ArchiveSnapshot[],
  filters: ArchiveFilters,
): ArchiveSnapshot[] {
  const query = (filters.query ?? '').trim().toLowerCase();
  return snapshots.filter((s) => {
    if (query.length >= 2) {
      const haystack = `${s.title} ${s.theme} ${s.owner} ${s.repository} ${s.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (filters.type && s.type !== filters.type) return false;
    if (filters.theme && s.theme !== filters.theme) return false;
    if (filters.repository && s.repository !== filters.repository) return false;
    if (filters.owner && s.owner !== filters.owner) return false;
    if (filters.legalHold === 'active' && s.legalHoldActive) return false;
    if (filters.legalHold === 'none' && !s.legalHoldActive) return false;
    if (filters.metadataComplete === true && !s.metadataComplete) return false;
    if (filters.metadataComplete === false && s.metadataComplete) return false;
    if (filters.fromDate && s.createdAt < filters.fromDate) return false;
    if (filters.toDate && s.createdAt > `${filters.toDate}T23:59:59Z`) return false;
    return true;
  });
}

/** Group snapshots by month label, newest month first, newest-first within. */
function groupByMonth(
  snapshots: ArchiveSnapshot[],
): Array<{ month: string; rows: ArchiveSnapshot[] }> {
  const groups = new Map<string, ArchiveSnapshot[]>();
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

export function ArchiveView(): React.ReactElement {
  const [urlState, setUrlState] = useUrlState();
  const { snapshots: rawSnapshots, nextCursor, loadMore, loading, error } =
    useArchiveData({ limit: 50 });

  const [filters, setFilters] = useState<ArchiveFilters>(() => ({
    query: urlState.query,
    type: urlState.filters.type,
    theme: urlState.filters.theme,
    repository: urlState.filters.repository,
    owner: urlState.filters.owner,
  }));

  const [selectedId, setSelectedId] = useState<string | undefined>(
    urlState.selected,
  );
  const [isNarrow, setIsNarrow] = useState(
    () =>
      typeof window !== 'undefined' && window.innerWidth < NARROW_BREAKPOINT,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Focus trap: ref to the trigger button and the drawer container
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLElement>(null);

  // Track viewport width for responsive drawer vs inline detail.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onResize = (): void =>
      setIsNarrow(window.innerWidth < NARROW_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Escape-to-close for the archive drawer
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setDrawerOpen(false);
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
        const firstFocusable = el.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        firstFocusable?.focus();
      }
    } else {
      // Restore focus to the trigger button
      triggerRef.current?.focus();
    }
  }, [drawerOpen]);

  const allSnapshots = useMemo<ArchiveSnapshot[]>(
    () => (rawSnapshots ?? []).map(normalizeSnapshot),
    [rawSnapshots],
  );

  const filtered = useMemo(
    () => applyFilters(allSnapshots, filters),
    [allSnapshots, filters],
  );

  const groups = useMemo(() => groupByMonth(filtered), [filtered]);

  const filterOptions = useMemo<ArchiveFilterOptions>(() => {
    const themes = new Set<string>();
    const owners = new Set<string>();
    const repositories = new Set<string>();
    const types = new Set<string>();
    for (const s of allSnapshots) {
      if (s.theme && s.theme !== '—') themes.add(s.theme);
      if (s.owner && s.owner !== '—') owners.add(s.owner);
      if (s.repository && s.repository !== '—') repositories.add(s.repository);
      if (s.type) types.add(s.type);
    }
    return {
      themes: [...themes].sort(),
      owners: [...owners].sort(),
      repositories: [...repositories].sort(),
      types: [...types].sort(),
    };
  }, [allSnapshots]);

  // Month index entries (short labels) derived from the visible groups.
  const monthIndex = useMemo(
    () => groups.map((g) => ({ label: g.month, short: g.month.split(' ')[0] })),
    [groups],
  );

  const selected = useMemo<ArchiveSnapshot | undefined>(
    () => filtered.find((s) => s.id === selectedId) ?? filtered[0],
    [filtered, selectedId],
  );

  // --- Selection ---
  const handleSelect = useCallback(
    (id: string, triggerEl?: HTMLButtonElement) => {
      setSelectedId(id);
      setUrlState({ selected: id });
      if (isNarrow) {
        if (triggerEl) triggerRef.current = triggerEl;
        setDrawerOpen(true);
      }
    },
    [setUrlState, isNarrow],
  );

  // --- Filter changes ---
  const handleFilterChange = useCallback(
    (next: ArchiveFilters) => {
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
    },
    [setUrlState],
  );

  // --- Sticky month index: track visible group + scroll-to ---
  const scrollRef = useRef<HTMLDivElement>(null);
  const monthRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [activeMonth, setActiveMonth] = useState<string | undefined>();

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || monthIndex.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const first = visible[0]?.target.getAttribute('data-month');
        if (first) setActiveMonth(first);
      },
      { root, threshold: 0.1, rootMargin: '0px 0px -60% 0px' },
    );

    for (const el of monthRefs.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [monthIndex]);

  const scrollToMonth = useCallback((month: string) => {
    const el = monthRefs.current.get(month);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // --- Infinite scroll: load next page near the bottom (no duplicate fetch) ---
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loading || !nextCursor) return;
    const nearBottom =
      el.scrollTop + el.clientHeight >= el.scrollHeight - 240;
    if (nearBottom) loadMore();
  }, [loading, nextCursor, loadMore]);

  // --- Error state ---
  if (error) {
    return (
      <div className="archive-view" role="alert">
        <header className="archive-header">
          <div>
            <h1>Spec Library</h1>
            <p>Browse, retrieve, and curate completed Kiro Specs.</p>
          </div>
        </header>
        <div className="archive-empty">
          <p>Failed to load the archive: {error}</p>
        </div>
      </div>
    );
  }

  const detail = selected ? <SnapshotDetail snapshot={selected} /> : null;

  return (
    <div
      className={`archive-view${isNarrow ? ' archive-view--narrow' : ''}`}
    >
      <header className="archive-header">
        <div>
          <h1>Spec Library</h1>
          <p>Browse, retrieve, and curate completed Kiro Specs.</p>
        </div>
        <span aria-live="polite">
          {loading
            ? 'Loading…'
            : `${filtered.length} archived spec${filtered.length === 1 ? '' : 's'}`}
        </span>
      </header>

      <ArchiveFilterBar
        filters={filters}
        options={filterOptions}
        onChange={handleFilterChange}
        resultCount={filtered.length}
      />

      <div className="archive-body">
        <section
          className="archive-table"
          aria-label="Completed specs"
          ref={scrollRef}
          onScroll={handleScroll}
        >
          <div className="archive-row archive-row--head" role="row">
            <span>Spec name</span>
            <span>Type</span>
            <span>Theme</span>
            <span>Repository</span>
            <span>Owner</span>
            <span>Completed</span>
          </div>

          {groups.map((group) => (
            <div
              className="archive-month"
              key={group.month}
              data-month={group.month}
              ref={(el) => {
                if (el) monthRefs.current.set(group.month, el);
                else monthRefs.current.delete(group.month);
              }}
            >
              <h2>{group.month}</h2>
              {group.rows.map((row) => (
                <button
                  type="button"
                  className={`archive-row${selected?.id === row.id ? ' is-selected' : ''}`}
                  key={row.id}
                  onClick={(e) => handleSelect(row.id, e.currentTarget)}
                  aria-pressed={selected?.id === row.id}
                >
                  <span>
                    <strong>{row.title}</strong>
                  </span>
                  <span>{row.type}</span>
                  <span>{row.theme}</span>
                  <span>{row.repository}</span>
                  <span>{row.owner}</span>
                  <span>{row.dateLabel}</span>
                </button>
              ))}
            </div>
          ))}

          {loading && (
            <div className="archive-loading" role="status" aria-live="polite" aria-label="Loading more specs">
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="archive-empty">
              No archived specs match your filters. Filters have been retained so
              you can adjust them.
            </div>
          )}
        </section>

        {/* Sticky year/month index */}
        {monthIndex.length > 0 && (
          <nav className="month-index" aria-label="Jump to month">
            {monthIndex.map((m) => (
              <button
                type="button"
                key={m.label}
                className={activeMonth === m.label ? 'active' : undefined}
                onClick={() => scrollToMonth(m.label)}
                aria-current={activeMonth === m.label ? 'true' : undefined}
              >
                {m.short}
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Detail: inline on wide viewports, slide-in drawer on narrow */}
      {!isNarrow && selected && (
        <div className="archive-detail-region">
          {detail}
          {selected.specKey && (
            <DetailPanel specKey={selected.specKey} variant="drawer" />
          )}
        </div>
      )}

      {isNarrow && drawerOpen && selected && (
        <div
          className="archive-drawer-backdrop"
          role="presentation"
          onMouseDown={() => setDrawerOpen(false)}
        >
          <aside
            className="archive-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Details for ${selected.title}`}
            ref={drawerRef}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="archive-drawer__close"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close details"
            >
              ✕
            </button>
            {detail}
            {selected.specKey && (
              <DetailPanel specKey={selected.specKey} variant="drawer" />
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Snapshot detail
// ---------------------------------------------------------------------------

function SnapshotDetail({
  snapshot,
}: {
  snapshot: ArchiveSnapshot;
}): React.ReactElement {
  const completenessPct = snapshot.metadataComplete ? 100 : 50;

  return (
    <section className="archive-detail" aria-label={`Details for ${snapshot.title}`}>
      <div className="archive-detail__intro">
        <div>
          <div className="archive-detail__title">
            <h2>{snapshot.title}</h2>
            <span>Completed</span>
          </div>
          {snapshot.tags.length > 0 && (
            <div className="archive-tags">
              {snapshot.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="archive-columns">
        <section>
          <h3>Artifact completeness</h3>
          <div className="archive-fact">
            <span>Metadata</span>
            <strong>{snapshot.metadataComplete ? 'Complete' : 'Incomplete'}</strong>
            <progress max={100} value={completenessPct} />
          </div>
        </section>

        <section>
          <h3>Source</h3>
          <div className="archive-fact">
            <span>Repository</span>
            <strong>{snapshot.provenance.repository}</strong>
          </div>
          <div className="archive-fact">
            <span>Path</span>
            <strong>{snapshot.provenance.relativePath}</strong>
          </div>
          <div className="archive-fact">
            <span>Branch</span>
            <strong>{snapshot.provenance.branch}</strong>
          </div>
          <div className="archive-fact">
            <span>Commit</span>
            <strong>{snapshot.provenance.commitHash.slice(0, 12) || '—'}</strong>
          </div>
        </section>

        <section>
          <h3>Provenance</h3>
          <div className="archive-fact">
            <span>Owner</span>
            <strong>{snapshot.owner}</strong>
          </div>
          <div className="archive-fact">
            <span>Archived on</span>
            <strong>{snapshot.dateLabel}</strong>
          </div>
          <div className="archive-fact">
            <span>Spec key</span>
            <strong>{snapshot.specKey || '—'}</strong>
          </div>
          <div className="archive-fact">
            <span>Content digest</span>
            <strong>{snapshot.contentDigest.slice(0, 12) || '—'}</strong>
          </div>
        </section>

        <section>
          <h3>Disposition</h3>
          <div className="archive-fact">
            <span>Status</span>
            <strong>{snapshot.legalHoldActive ? 'Superseded' : 'Active'}</strong>
          </div>
          {snapshot.legalHoldActive && snapshot.legalHoldReason && (
            <div className="archive-fact">
              <span>Successor</span>
              <strong>{snapshot.legalHoldReason}</strong>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
