export interface UseSpecDataOptions {
    query?: string;
    filters?: Record<string, string | undefined>;
    limit?: number;
    offset?: number;
}
export interface UseSpecDataResult {
    specs: unknown[];
    total: number;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}
export interface UseArchiveDataResult {
    snapshots: unknown[];
    nextCursor: string | null;
    loadMore: () => void;
    loading: boolean;
    error: string | null;
}
/**
 * Build the `/specs` request path from query options.
 *
 * The returned string is a pure, value-derived key: two calls with equal
 * option VALUES produce an identical string regardless of object identity or
 * property ordering. `useSpecData` uses this string as the SOLE dependency of
 * its fetch effect, which is what prevents an infinite refetch loop when a
 * parent passes a fresh `filters` object literal on every render.
 *
 * Exported for regression testing of that stability contract.
 */
export declare function buildSpecsQuery(options: UseSpecDataOptions): string;
/**
 * Fetches specs from the backend with filters, pagination, and search.
 *
 * Search queries are debounced: the fetch fires 500ms after the query
 * stabilizes, and only when the query is ≥ 2 characters (or empty to
 * clear the filter).
 */
export declare function useSpecData(options: UseSpecDataOptions): UseSpecDataResult;
export interface UseArchiveDataOptions {
    limit?: number;
}
/**
 * Fetches archive snapshots with cursor-based pagination.
 * Call `loadMore()` to fetch the next page; results accumulate.
 */
export declare function useArchiveData(options?: UseArchiveDataOptions): UseArchiveDataResult;
//# sourceMappingURL=useSpecData.d.ts.map