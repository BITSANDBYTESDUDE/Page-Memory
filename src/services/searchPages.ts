import type { PageRecord } from '../storage/models';

const normalizeQuery = (query: string): string => query.trim().toLocaleLowerCase();

const getSearchText = (page: PageRecord): string =>
  [page.title, page.domain, page.url, ...page.tags, page.notes]
    .filter((value) => value.trim().length > 0)
    .join(' ')
    .toLocaleLowerCase();

export function searchPages(pages: readonly PageRecord[], query: string): PageRecord[] {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) return [...pages];

  return pages.filter((page) => getSearchText(page).includes(normalizedQuery));
}
