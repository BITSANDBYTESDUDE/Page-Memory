import { useEffect, useMemo, useState } from 'react';
import type { PageRecord } from '../storage/models';
import { searchPages } from '../services/searchPages';

export interface PageSearchState {
  readonly query: string;
  readonly debouncedQuery: string;
  readonly results: PageRecord[];
  readonly isSearching: boolean;
  readonly setQuery: (query: string) => void;
  readonly clearQuery: () => void;
}

export function usePageSearch(pages: readonly PageRecord[], debounceMs = 150): PageSearchState {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const isSearching = query !== debouncedQuery;

  useEffect(() => {
    const timer = globalThis.setTimeout(() => setDebouncedQuery(query), debounceMs);
    return () => globalThis.clearTimeout(timer);
  }, [debounceMs, query]);

  const results = useMemo(() => searchPages(pages, debouncedQuery), [debouncedQuery, pages]);

  return {
    query,
    debouncedQuery,
    results,
    isSearching,
    setQuery,
    clearQuery: () => setQuery(''),
  };
}
