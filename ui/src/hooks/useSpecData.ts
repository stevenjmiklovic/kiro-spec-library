import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCrewApi } from './useCrewIntegration.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 500;
const MIN_QUERY_LENGTH = 2;
const DEFAULT_LIMIT = 50;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
export function buildSpecsQuery(options: UseSpecDataOptions): string {
  const params = new URLSearchParams();

  if (options.query && options.query.length >= MIN_QUERY_LENGTH) {
    params.set('q', options.query);
  }
  if (options.limit) params.set('limit', String(options.limit));
  if (options.offset) params.set('offset', String(options.offset));

  if (options.filters) {
    // Sort filter keys so equal values always yield an identical string,
    // independent of the order the caller assembled the object.
    const entries = Object.entries(options.filters).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    for (const [key, val] of entries) {
      if (val) {
        // Map 'repository' → 'repo' for the API param
        const apiKey = key === 'repository' ? 'repo' : key;
        params.set(apiKey, val);
      }
    }
  }

  const qs = params.toString();
  return qs ? `/specs?${qs}` : '/specs';
}

// ---------------------------------------------------------------------------
// useSpecData — paginated spec fetching with debounced search
// ---------------------------------------------------------------------------

/**
 * Fetches specs from the backend with filters, pagination, and search.
 *
 * Search queries are debounced: the fetch fires 500ms after the query
 * stabilizes, and only when the query is ≥ 2 characters (or empty to
 * clear the filter).
 */
export function useSpecData(options: UseSpecDataOptions): UseSpecDataResult {
  const api = useCrewApi();

  const [specs, setSpecs] = useState<unknown[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounced query value
  const [debouncedQuery, setDebouncedQuery] = useState(options.query);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track the latest fetch to avoid stale responses overwriting newer ones
  const fetchIdRef = useRef(0);

  // Debounce the query input
  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    const raw = options.query;

    // Fire immediately when clearing or below threshold
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

  // Serialize filters to a stable string so the memo only recomputes when
  // the actual filter VALUES change, not when the parent passes a new object.
  const filtersKey = JSON.stringify(options.filters ?? {});

  const path = useMemo(
    () =>
      buildSpecsQuery({
        query: debouncedQuery,
        filters: options.filters,
        limit: options.limit,
        offset: options.offset,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debouncedQuery, filtersKey, options.limit, options.offset],
  );

  // Core fetch function — driven by the memoized `path` so it only changes
  // when the actual query string changes, not on every parent re-render.
  const fetchSpecs = useCallback(async () => {
    const id = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await api.fetch(path);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg =
          (body as { message?: string })?.message ??
          `Request failed: ${res.status}`;
        throw new Error(msg);
      }

      const data = (await res.json()) as { specs: unknown[]; total: number };

      // Only apply if this is still the most recent fetch
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

  // Re-fetch when dependencies change
  useEffect(() => {
    void fetchSpecs();
  }, [fetchSpecs]);

  return { specs, total, loading, error, refetch: fetchSpecs };
}

// ---------------------------------------------------------------------------
// useArchiveData — cursor-based pagination for archive snapshots
// ---------------------------------------------------------------------------

export interface UseArchiveDataOptions {
  limit?: number;
}

/**
 * Fetches archive snapshots with cursor-based pagination.
 * Call `loadMore()` to fetch the next page; results accumulate.
 */
export function useArchiveData(
  options: UseArchiveDataOptions = {},
): UseArchiveDataResult {
  const api = useCrewApi();
  const limit = options.limit ?? DEFAULT_LIMIT;

  const [snapshots, setSnapshots] = useState<unknown[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cursorRef = useRef<string | null>(null);
  const initialFetchDone = useRef(false);

  const fetchPage = useCallback(
    async (cursor: string | null, append: boolean) => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (cursor) params.set('cursor', cursor);

      try {
        const res = await api.fetch(`/archive?${params.toString()}`);
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          const msg =
            (body as { message?: string })?.message ??
            `Request failed: ${res.status}`;
          throw new Error(msg);
        }

        const data = (await res.json()) as {
          snapshots: unknown[];
          nextCursor: string | null;
        };

        setSnapshots((prev) => (append ? [...prev, ...data.snapshots] : data.snapshots));
        setNextCursor(data.nextCursor);
        cursorRef.current = data.nextCursor;
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    [api, limit],
  );

  // Initial fetch
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      void fetchPage(null, false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (cursorRef.current && !loading) {
      void fetchPage(cursorRef.current, true);
    }
  }, [fetchPage, loading]);

  return { snapshots, nextCursor, loadMore, loading, error };
}
