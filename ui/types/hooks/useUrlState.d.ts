export type ViewMode = 'relationship' | 'archive';
export type ThemeMode = 'light' | 'dark';
export type YAxisField = 'theme' | 'owner' | 'repository' | 'type';
export interface UrlStateFilters {
    type?: string;
    stage?: string;
    theme?: string;
    owner?: string;
    repository?: string;
}
export interface UrlState {
    view: ViewMode;
    /** User-selected color theme, applies to BOTH views. */
    themeMode: ThemeMode;
    /** Y-axis grouping field for relationship view. */
    yAxis: YAxisField;
    selected?: string;
    revision?: string;
    query?: string;
    filters: UrlStateFilters;
}
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
export declare function useUrlState(): [UrlState, (update: Partial<UrlState>) => void];
//# sourceMappingURL=useUrlState.d.ts.map