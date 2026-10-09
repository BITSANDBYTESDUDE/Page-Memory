import type { ReactNode } from 'react';
import type { PageRecord } from '../storage/models';
import { usePageSearch } from '../hooks/usePageSearch';
import { EmptyState, LoadingState, SearchInput } from './ui';

export interface PageSearchProps {
  readonly pages: readonly PageRecord[];
  readonly renderPage: (page: PageRecord) => ReactNode;
  readonly debounceMs?: number;
  readonly className?: string;
}

export function PageSearch({ pages, renderPage, debounceMs, className }: PageSearchProps) {
  const search = usePageSearch(pages, debounceMs);
  const hasQuery = search.query.trim().length > 0;

  return (
    <section className={className}>
      <SearchInput
        aria-label="Search saved pages"
        label="Search saved pages"
        onChange={(event) => search.setQuery(event.currentTarget.value)}
        onClear={search.clearQuery}
        placeholder="Search title, domain, URL, tags, or notes"
        value={search.query}
      />
      <div aria-live="polite" className="mt-4">
        {search.isSearching && <LoadingState label="Searching saved pages…" />}
        {!search.isSearching && search.results.length === 0 && (
          <EmptyState
            description={
              hasQuery
                ? `No saved pages match “${search.query.trim()}”.`
                : 'Save a page to start building your reading list.'
            }
            title={hasQuery ? 'No pages found' : 'No saved pages yet'}
          />
        )}
        {!search.isSearching && search.results.length > 0 && (
          <div className="space-y-3">
            {search.results.map((page) => (
              <div key={page.id}>{renderPage(page)}</div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
