import React from "react";

export interface RelationshipFilters {
  scope: "team" | "mine";
  theme?: string;
  type?: string;
  stage?: string;
  owner?: string;
  repository?: string;
  metadataComplete?: boolean;
  query?: string;
}

export interface FilterOptions {
  themes: string[];
  owners: string[];
  repositories: string[];
}

interface Props {
  filters: RelationshipFilters;
  options: FilterOptions;
  onChange: (filters: RelationshipFilters) => void;
  resultCount: number;
}

const TYPES = ["spec", "design", "adr", "runbook", "reference"];
const STAGES = ["new", "scoped", "refined", "in-flight", "done"];

const DEFAULT_FILTERS: RelationshipFilters = { scope: "team" };

function isNonDefault(filters: RelationshipFilters): boolean {
  if (filters.scope !== "team") return true;
  if (filters.theme) return true;
  if (filters.type) return true;
  if (filters.stage) return true;
  if (filters.owner) return true;
  if (filters.repository) return true;
  if (filters.metadataComplete !== undefined) return true;
  if (filters.query) return true;
  return false;
}

export function FilterBar({ filters, options, onChange, resultCount }: Props): React.ReactElement {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.slice(0, 200);
    onChange({ ...filters, query: value || undefined });
  };

  const handleScopeChange = (scope: "team" | "mine"): void => {
    onChange({ ...filters, scope });
  };

  const handleSelectChange = (
    field: keyof Pick<RelationshipFilters, "theme" | "type" | "stage" | "owner" | "repository">
  ) => (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const value = e.target.value || undefined;
    onChange({ ...filters, [field]: value });
  };

  const handleMetaCompleteChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const value = e.target.value;
    let metadataComplete: boolean | undefined;
    if (value === "true") metadataComplete = true;
    else if (value === "false") metadataComplete = false;
    else metadataComplete = undefined;
    onChange({ ...filters, metadataComplete });
  };

  const handleClear = (): void => {
    onChange({ ...DEFAULT_FILTERS });
  };

  const showClear = isNonDefault(filters);

  return (
    <div className="relationship-filter-bar" role="search" aria-label="Filter specifications">
      <div>
        <label>
          <span className="visually-hidden">Search specifications</span>
          <input
            type="search"
            aria-label="Search specifications"
            maxLength={200}
            value={filters.query ?? ""}
            onChange={handleSearchChange}
            placeholder="Search..."
          />
        </label>
        <span className="filter-help" aria-live="polite" aria-atomic="true">
          {filters.query && filters.query.length < 2
            ? "Search activates at 2 characters"
            : null}
        </span>
      </div>

      <div className="scope-toggle" role="group" aria-label="Scope">
        <button
          type="button"
          aria-pressed={filters.scope === "team"}
          onClick={() => handleScopeChange("team")}
        >
          Team
        </button>
        <button
          type="button"
          aria-pressed={filters.scope === "mine"}
          onClick={() => handleScopeChange("mine")}
          title="Show only specs you own — stored locally in your browser"
        >
          Mine
        </button>
      </div>

      <div>
        <label>
          <span className="visually-hidden">Theme</span>
          <select
            value={filters.theme ?? ""}
            onChange={handleSelectChange("theme")}
            aria-label="Filter by theme"
          >
            <option value="">All themes</option>
            {options.themes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="visually-hidden">Type</span>
          <select
            value={filters.type ?? ""}
            onChange={handleSelectChange("type")}
            aria-label="Filter by type"
          >
            <option value="">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="visually-hidden">Stage</span>
          <select
            value={filters.stage ?? ""}
            onChange={handleSelectChange("stage")}
            aria-label="Filter by stage"
          >
            <option value="">All stages</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="visually-hidden">Owner</span>
          <select
            value={filters.owner ?? ""}
            onChange={handleSelectChange("owner")}
            aria-label="Filter by owner"
          >
            <option value="">All owners</option>
            {options.owners.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="visually-hidden">Repository</span>
          <select
            value={filters.repository ?? ""}
            onChange={handleSelectChange("repository")}
            aria-label="Filter by repository"
          >
            <option value="">All repositories</option>
            {options.repositories.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="visually-hidden">Metadata completeness</span>
          <select
            value={
              filters.metadataComplete === true
                ? "true"
                : filters.metadataComplete === false
                  ? "false"
                  : ""
            }
            onChange={handleMetaCompleteChange}
            aria-label="Filter by metadata completeness"
          >
            <option value="">Any completeness</option>
            <option value="true">Metadata complete</option>
            <option value="false">Metadata incomplete</option>
          </select>
        </label>
      </div>

      {showClear && (
        <button type="button" onClick={handleClear}>
          Clear filters
        </button>
      )}

      {/* Active filter chips */}
      {isNonDefault(filters) && (
        <div className="filter-chips" role="list" aria-label="Active filters">
          {filters.theme && (
            <span className="filter-chip" role="listitem">
              theme: {filters.theme}
              <button
                type="button"
                aria-label={`Remove theme filter: ${filters.theme}`}
                onClick={() => onChange({ ...filters, theme: undefined })}
              >✕</button>
            </span>
          )}
          {filters.type && (
            <span className="filter-chip" role="listitem">
              type: {filters.type}
              <button
                type="button"
                aria-label={`Remove type filter: ${filters.type}`}
                onClick={() => onChange({ ...filters, type: undefined })}
              >✕</button>
            </span>
          )}
          {filters.stage && (
            <span className="filter-chip" role="listitem">
              stage: {filters.stage}
              <button
                type="button"
                aria-label={`Remove stage filter: ${filters.stage}`}
                onClick={() => onChange({ ...filters, stage: undefined })}
              >✕</button>
            </span>
          )}
          {filters.owner && (
            <span className="filter-chip" role="listitem">
              owner: {filters.owner}
              <button
                type="button"
                aria-label={`Remove owner filter: ${filters.owner}`}
                onClick={() => onChange({ ...filters, owner: undefined })}
              >✕</button>
            </span>
          )}
          {filters.repository && (
            <span className="filter-chip" role="listitem">
              repository: {filters.repository}
              <button
                type="button"
                aria-label={`Remove repository filter: ${filters.repository}`}
                onClick={() => onChange({ ...filters, repository: undefined })}
              >✕</button>
            </span>
          )}
          {filters.query && (
            <span className="filter-chip" role="listitem">
              search: {filters.query}
              <button
                type="button"
                aria-label="Remove search filter"
                onClick={() => onChange({ ...filters, query: undefined })}
              >✕</button>
            </span>
          )}
        </div>
      )}

      {resultCount === 0 && (
        <p role="status" aria-live="polite">
          No results match the current filters. Filters have been retained so you
          can adjust them.
        </p>
      )}
    </div>
  );
}
