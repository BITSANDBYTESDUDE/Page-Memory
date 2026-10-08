import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReadingPositionUpdate } from '../types/reading';
import type { PageRecord } from '../storage/models';
import { ReadingProgressPersister, type ReadingProgressRepository } from './persistReadingProgress';

afterEach(() => {
  vi.useRealTimers();
});

const savedPage: PageRecord = {
  id: 'page-1',
  url: 'https://example.com/article',
  canonicalUrl: 'https://example.com/article',
  title: 'Article',
  domain: 'example.com',
  favicon: null,
  progress: 10,
  scrollY: 100,
  scrollHeight: 1_000,
  lastReadAt: '2026-10-08T10:00:00.000Z',
  createdAt: '2026-10-08T09:00:00.000Z',
  updatedAt: '2026-10-08T10:00:00.000Z',
  isFavorite: false,
  tags: [],
  notes: '',
  collectionId: null,
};

const update = (overrides: Partial<ReadingPositionUpdate> = {}): ReadingPositionUpdate => ({
  type: 'READING_POSITION_UPDATE',
  url: savedPage.url,
  scrollY: 500,
  scrollHeight: 2_000,
  viewportHeight: 800,
  progress: 0.4167,
  ...overrides,
});

describe('ReadingProgressPersister', () => {
  it('debounces writes and persists only the latest update', async () => {
    vi.useFakeTimers();
    const repository: ReadingProgressRepository = {
      getPageByUrl: vi.fn().mockResolvedValue(savedPage),
      updatePage: vi.fn().mockResolvedValue(savedPage),
    };
    const persister = new ReadingProgressPersister(repository, { debounceMs: 1_000 });

    persister.schedule(update({ scrollY: 200, progress: 0.1 }));
    persister.schedule(update({ scrollY: 900, progress: 0.75 }));
    await vi.advanceTimersByTimeAsync(999);
    expect(repository.updatePage).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(repository.updatePage).toHaveBeenCalledTimes(1);
    expect(repository.updatePage).toHaveBeenCalledWith('page-1', {
      progress: 75,
      scrollY: 900,
      scrollHeight: 2_000,
      lastReadAt: expect.any(String),
    });
  });

  it('does not write for pages that have never been saved', async () => {
    vi.useFakeTimers();
    const repository: ReadingProgressRepository = {
      getPageByUrl: vi.fn().mockResolvedValue(null),
      updatePage: vi.fn(),
    };
    const persister = new ReadingProgressPersister(repository, { debounceMs: 500 });

    persister.schedule(update());
    await vi.advanceTimersByTimeAsync(500);

    expect(repository.getPageByUrl).toHaveBeenCalledWith(savedPage.url);
    expect(repository.updatePage).not.toHaveBeenCalled();
  });

  it('flushes final lifecycle updates immediately and updates lastReadAt', async () => {
    const repository: ReadingProgressRepository = {
      getPageByUrl: vi.fn().mockResolvedValue(savedPage),
      updatePage: vi.fn().mockResolvedValue(savedPage),
    };
    const persister = new ReadingProgressPersister(repository, {
      now: () => '2026-10-08T12:00:00.000Z',
    });

    persister.schedule(update({ isFinal: true }));
    await vi.waitFor(() => expect(repository.updatePage).toHaveBeenCalledTimes(1));

    expect(repository.updatePage).toHaveBeenCalledWith('page-1', {
      progress: 41.67,
      scrollY: 500,
      scrollHeight: 2_000,
      lastReadAt: '2026-10-08T12:00:00.000Z',
    });
  });

  it('normalizes invalid numeric state before writing', async () => {
    const repository: ReadingProgressRepository = {
      getPageByUrl: vi.fn().mockResolvedValue(savedPage),
      updatePage: vi.fn().mockResolvedValue(savedPage),
    };
    const persister = new ReadingProgressPersister(repository, {
      now: () => '2026-10-08T12:00:00.000Z',
    });

    persister.schedule(
      update({
        progress: Number.NaN,
        scrollY: Number.POSITIVE_INFINITY,
        scrollHeight: Number.NaN,
        isFinal: true,
      }),
    );
    await vi.waitFor(() => expect(repository.updatePage).toHaveBeenCalledTimes(1));

    expect(repository.updatePage).toHaveBeenCalledWith('page-1', {
      progress: 0,
      scrollY: 0,
      scrollHeight: 0,
      lastReadAt: '2026-10-08T12:00:00.000Z',
    });
  });
});
