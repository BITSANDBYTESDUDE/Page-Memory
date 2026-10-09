import { describe, expect, it } from 'vitest';
import type { PageRecord } from '../storage/models';
import { searchPages } from './searchPages';

const page = (overrides: Partial<PageRecord> = {}): PageRecord => ({
  id: 'page-1',
  url: 'https://example.com/articles/typescript',
  canonicalUrl: 'https://example.com/articles/typescript',
  title: 'TypeScript Patterns',
  domain: 'example.com',
  favicon: null,
  progress: 50,
  scrollY: 400,
  scrollHeight: 2_000,
  lastReadAt: null,
  createdAt: '2026-10-09T10:00:00.000Z',
  updatedAt: '2026-10-09T10:00:00.000Z',
  isFavorite: false,
  tags: ['engineering', 'frontend'],
  notes: 'Review the generic constraints section.',
  collectionId: null,
  ...overrides,
});

describe('searchPages', () => {
  it('searches title, domain, URL, tags, and notes', () => {
    const pages = [
      page(),
      page({
        id: 'page-2',
        title: 'Design notes',
        domain: 'design.example',
        url: 'https://design.example/notes',
        tags: [],
        notes: '',
      }),
      page({
        id: 'page-3',
        title: 'Reading list',
        domain: 'reading.example',
        url: 'https://reading.example/list',
        tags: ['research'],
        notes: '',
      }),
      page({
        id: 'page-4',
        title: 'Product page',
        domain: 'product.example',
        url: 'https://product.example/page',
        tags: [],
        notes: 'Review accessibility later.',
      }),
    ];

    expect(searchPages(pages, 'typescript').map(({ id }) => id)).toEqual(['page-1']);
    expect(searchPages(pages, 'design.example').map(({ id }) => id)).toEqual(['page-2']);
    expect(searchPages(pages, 'articles/typescript').map(({ id }) => id)).toEqual(['page-1']);
    expect(searchPages(pages, 'research').map(({ id }) => id)).toEqual(['page-3']);
    expect(searchPages(pages, 'accessibility').map(({ id }) => id)).toEqual(['page-4']);
  });

  it('matches case-insensitively and ignores surrounding whitespace', () => {
    expect(searchPages([page()], '  TYPESCRIPT  ')).toHaveLength(1);
  });

  it('returns a new copy of all pages for an empty query', () => {
    const pages = [page(), page({ id: 'page-2' })];
    const results = searchPages(pages, '   ');

    expect(results).toEqual(pages);
    expect(results).not.toBe(pages);
  });

  it('returns an empty result when no searchable field matches', () => {
    expect(searchPages([page()], 'no-match')).toEqual([]);
  });
});
