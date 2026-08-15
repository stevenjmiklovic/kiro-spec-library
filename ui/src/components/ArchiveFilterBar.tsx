import React from 'react';

export interface ArchiveFilters {
  query?: string;
  type?: string;
  theme?: string;
  repository?: string;
  owner?: string;
  fromDate?: string; // ISO date (YYYY-MM-DD)
  toDate?: string; // ISO date (YYYY-MM-DD)
  retention?: string;
  legalHold?: 'active' | 'none';
  metadataComplete?: boolean;
}

export interface ArchiveFilterOptions {
  types: string[];
  themes: string[];
  owners: string[];
  repositories: string[];
}

interface Props {
  filters: ArchiveFilters;
  options: ArchiveFilterOptions;
  onChange: (filters: ArchiveFilters) => void;
  resultCount: number;
}


function isNonDefault(f: ArchiveFilters): boolean {
  return Boolean(
    f.query ||
      f.type ||
      f.theme ||
      f.repository ||
      f.owner ||
      f.fromDate ||
      f.toDate ||
      f.metadataComplete !== undefined,
  );
}

export function ArchiveFilterBar({
  filters,
  options,
  onChange,
}: Props): React.ReactElement {
  const set = <K extends keyof ArchiveFilters>(
    key: K,
    value: ArchiveFilters[K],
  ): void => {
    onChange({ ...filters, [key]: value });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    set('query', e.target.value.slice(0, 200) || undefined);
  };

  const selectHandler =
    (key: keyof ArchiveFilters) =>
    (e: React.ChangeEvent<HTMLSelectElement>): void => {
      set(key, (e.target.value || undefined) as ArchiveFilters[typeof key]);
    };

  return (
    <div className="archive-tools" role="search" aria-label="Filter archived specs">
      <label className="archive-search">
        <span className="visually-hidden">Search archived specs</span>
        <input
          type="search"
          maxLength={200}
          value={filters.query ?? ''}
          onChange={handleSearch}
          placeholder="Search…"
          aria-label="Search archived specs"
        />
      </label>

      <div className="archive-filter-group">
        <label>
          <span className="visually-hidden">Type</span>
          <select
            value={filters.type ?? ''}
            onChange={selectHandler('type')}
            aria-label="Filter by type"
          >
            <option value="">All types</option>
            {options.types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <label>
          <span className="visually-hidden">Theme</span>
          <select
            value={filters.theme ?? ''}
            onChange={selectHandler('theme')}
            aria-label="Filter by theme"
          >
            <option value="">All themes</option>
            {options.themes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <label>
          <span className="visually-hidden">Repository</span>
          <select
            value={filters.repository ?? ''}
            onChange={selectHandler('repository')}
            aria-label="Filter by repository"
          >
            <option value="">All repositories</option>
            {options.repositories.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>

        <label>
          <span className="visually-hidden">Owner</span>
          <select
            value={filters.owner ?? ''}
            onChange={selectHandler('owner')}
            aria-label="Filter by owner"
          >
            <option value="">All owners</option>
            {options.owners.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </label>

        <label>
          <span className="visually-hidden">Metadata completeness</span>
          <select
            value={
              filters.metadataComplete === true
                ? 'true'
                : filters.metadataComplete === false
                  ? 'false'
                  : ''
            }
            onChange={(e) => {
              const v = e.target.value;
              set(
                'metadataComplete',
                v === 'true' ? true : v === 'false' ? false : undefined,
              );
            }}
            aria-label="Filter by metadata completeness"
          >
            <option value="">Any completeness</option>
            <option value="true">Metadata complete</option>
            <option value="false">Needs metadata</option>
          </select>
        </label>

        <label className="archive-date">
          <span className="visually-hidden">From date</span>
          <input
            type="date"
            value={filters.fromDate ?? ''}
            onChange={(e) => set('fromDate', e.target.value || undefined)}
            aria-label="Completed on or after"
          />
        </label>
        <label className="archive-date">
          <span className="visually-hidden">To date</span>
          <input
            type="date"
            value={filters.toDate ?? ''}
            onChange={(e) => set('toDate', e.target.value || undefined)}
            aria-label="Completed on or before"
          />
        </label>
      </div>

      {isNonDefault(filters) && (
        <button
          type="button"
          className="archive-clear"
          onClick={() => onChange({})}
        >
          Clear filters
        </button>
      )}

      {/* Active filter chips */}
      {isNonDefault(filters) && (
        <div className="filter-chips" role="list" aria-label="Active filters">
          {filters.query && (
            <span className="filter-chip" role="listitem">
              search: {filters.query}
              <button
                type="button"
                aria-label="Remove search filter"
                onClick={() => set('query', undefined)}
              >✕</button>
            </span>
          )}
          {filters.type && (
            <span className="filter-chip" role="listitem">
              type: {filters.type}
              <button
                type="button"
                aria-label={`Remove type filter: ${filters.type}`}
                onClick={() => set('type', undefined)}
              >✕</button>
            </span>
          )}
          {filters.theme && (
            <span className="filter-chip" role="listitem">
              theme: {filters.theme}
              <button
                type="button"
                aria-label={`Remove theme filter: ${filters.theme}`}
                onClick={() => set('theme', undefined)}
              >✕</button>
            </span>
          )}
          {filters.repository && (
            <span className="filter-chip" role="listitem">
              repository: {filters.repository}
              <button
                type="button"
                aria-label={`Remove repository filter: ${filters.repository}`}
                onClick={() => set('repository', undefined)}
              >✕</button>
            </span>
          )}
          {filters.owner && (
            <span className="filter-chip" role="listitem">
              owner: {filters.owner}
              <button
                type="button"
                aria-label={`Remove owner filter: ${filters.owner}`}
                onClick={() => set('owner', undefined)}
              >✕</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
