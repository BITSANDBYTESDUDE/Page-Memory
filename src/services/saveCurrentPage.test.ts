import { afterEach, describe, expect, it, vi } from 'vitest';
import { PageRepository } from '../storage/PageRepository';
import { StorageError } from '../storage/errors';
import {
  DATABASE_STORAGE_KEY,
  StorageService,
  type LocalStorageAdapter,
} from '../storage/StorageService';
import type { PageInfo } from '../types';
import { saveCurrentPage } from './saveCurrentPage';

afterEach(() => {
  vi.useRealTimers();
});

class TestLocalStorage implements LocalStorageAdapter {
  value: unknown;
  failWrites = false;

  async get(key: string): Promise<unknown> {
    return key === DATABASE_STORAGE_KEY ? this.value : undefined;
  }

  async set(key: string, value: unknown): Promise<void> {
    if (this.failWrites) throw new Error('Local storage is unavailable.');
    if (key === DATABASE_STORAGE_KEY) this.value = value;
  }
}

const pageMetadata: PageInfo = {
  pageId: 'page-1',
  url: 'https://example.com/article?from=reader#chapter',
  canonicalUrl: 'https://example.com/article?from=reader',
  title: 'Example article',
  hostname: 'example.com',
  domain: 'example.com',
  favicon: 'https://example.com/favicon.ico',
};

describe('saveCurrentPage', () => {
  it('creates a page record on the first save', async () => {
    const storage = new StorageService(new TestLocalStorage());
    const repository = new PageRepository(storage);

    const result = await saveCurrentPage(pageMetadata, repository);

    expect(result).toMatchObject({ pageId: 'page-1', created: true });
    const page = await repository.getPage('page-1');
    expect(page).toMatchObject({
      id: 'page-1',
      url: pageMetadata.url,
      canonicalUrl: pageMetadata.canonicalUrl,
      title: pageMetadata.title,
      domain: pageMetadata.domain,
      favicon: pageMetadata.favicon,
      progress: 0,
      scrollY: 0,
      scrollHeight: 0,
      isFavorite: false,
    });
    expect(page?.lastReadAt).toBe(result.lastReadAt);
  });

  it('updates lastReadAt rather than creating a duplicate on repeated saves', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-05T08:00:00.000Z'));
    const storage = new StorageService(new TestLocalStorage());
    const repository = new PageRepository(storage);
    const firstResult = await saveCurrentPage(pageMetadata, repository);

    vi.setSystemTime(new Date('2026-10-05T08:01:00.000Z'));
    const repeatedSave = {
      ...pageMetadata,
      pageId: 'new-generated-page-id',
      url: 'https://example.com/article?from=reader#another-section',
    };
    const secondResult = await saveCurrentPage(repeatedSave, repository);

    expect(firstResult.created).toBe(true);
    expect(secondResult.created).toBe(false);
    expect(secondResult.pageId).toBe(firstResult.pageId);
    expect(Date.parse(secondResult.lastReadAt)).toBeGreaterThan(
      Date.parse(firstResult.lastReadAt),
    );
    await expect(repository.getPages()).resolves.toHaveLength(1);
    const savedPage = await repository.getPage(firstResult.pageId);
    expect(savedPage?.lastReadAt).toBe(secondResult.lastReadAt);
  });

  it('rejects an invalid page URL', async () => {
    const repository = new PageRepository(new StorageService(new TestLocalStorage()));

    await expect(
      saveCurrentPage({ ...pageMetadata, url: 'not a valid URL' }, repository),
    ).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    } satisfies Partial<StorageError>);
  });

  it('surfaces local storage write failures', async () => {
    const adapter = new TestLocalStorage();
    adapter.failWrites = true;
    const repository = new PageRepository(new StorageService(adapter));

    await expect(saveCurrentPage(pageMetadata, repository)).rejects.toMatchObject({
      code: 'WRITE_FAILED',
      message: 'Could not save PageMemory data.',
    });
  });
});
