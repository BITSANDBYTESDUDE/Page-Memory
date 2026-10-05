import { beforeEach, describe, expect, it } from 'vitest';
import { StorageError } from './errors';
import { PageRepository } from './PageRepository';
import { SettingsRepository } from './SettingsRepository';
import {
  DATABASE_STORAGE_KEY,
  StorageService,
  type LocalStorageAdapter,
} from './StorageService';
import { DATABASE_SCHEMA_VERSION, type PageMemoryDatabase } from './models';

class MemoryStorage implements LocalStorageAdapter {
  value: unknown;
  failReads = false;
  failWrites = false;
  writeCount = 0;

  async get(key: string): Promise<unknown> {
    if (this.failReads) throw new Error('read unavailable');
    return key === DATABASE_STORAGE_KEY ? this.value : undefined;
  }

  async set(key: string, value: unknown): Promise<void> {
    if (this.failWrites) throw new Error('write unavailable');
    if (key === DATABASE_STORAGE_KEY) {
      this.value = value;
      this.writeCount += 1;
    }
  }
}

describe('PageRepository', () => {
  let adapter: MemoryStorage;
  let storage: StorageService;
  let repository: PageRepository;

  beforeEach(() => {
    adapter = new MemoryStorage();
    storage = new StorageService(adapter);
    repository = new PageRepository(storage);
  });

  it('initializes the versioned database and creates pages with defaults', async () => {
    const page = await repository.createPage({
      url: 'https://example.com/article#chapter',
      title: 'Example article',
    });

    expect(page.id).toBeTruthy();
    expect(page.canonicalUrl).toBe('https://example.com/article');
    expect(page.domain).toBe('example.com');
    expect(page.progress).toBe(0);
    expect(page.scrollY).toBe(0);
    expect(page.scrollHeight).toBe(0);
    expect(page.lastReadAt).toBeNull();
    expect(page.isFavorite).toBe(false);
    expect(page.tags).toEqual([]);
    expect(page.notes).toBe('');
    expect(page.collectionId).toBeNull();

    const database = adapter.value as PageMemoryDatabase;
    expect(database.schemaVersion).toBe(DATABASE_SCHEMA_VERSION);
    expect(database.pages[page.id]).toEqual(page);
  });

  it('reads pages by id, canonical URL, and list', async () => {
    const created = await repository.createPage({
      url: 'https://example.com/article?edition=1',
      title: 'Example article',
    });

    await expect(repository.getPage(created.id)).resolves.toEqual(created);
    await expect(
      repository.getPageByUrl('https://example.com/article?edition=1#section'),
    ).resolves.toEqual(created);
    await expect(repository.getPage('missing')).resolves.toBeNull();
    await expect(repository.getPageByUrl('https://missing.example/')).resolves.toBeNull();
    await expect(repository.getPages()).resolves.toEqual([created]);
  });

  it('updates page fields and derived URL metadata', async () => {
    const created = await repository.createPage({
      url: 'https://example.com/old',
      title: 'Before',
    });

    const updated = await repository.updatePage(created.id, {
      url: 'https://news.example/new#section',
      title: 'After',
      progress: 42,
      isFavorite: true,
      tags: ['typescript'],
    });

    expect(updated.url).toBe('https://news.example/new#section');
    expect(updated.canonicalUrl).toBe('https://news.example/new');
    expect(updated.domain).toBe('news.example');
    expect(updated.title).toBe('After');
    expect(updated.progress).toBe(42);
    expect(updated.isFavorite).toBe(true);
    expect(updated.tags).toEqual(['typescript']);
    expect(updated.createdAt).toBe(created.createdAt);
    expect(Date.parse(updated.updatedAt)).toBeGreaterThanOrEqual(
      Date.parse(created.updatedAt),
    );
  });

  it('deletes a page and reports whether it existed', async () => {
    const page = await repository.createPage({
      url: 'https://example.com/remove',
      title: 'Remove me',
    });

    await expect(repository.deletePage(page.id)).resolves.toBe(true);
    await expect(repository.deletePage(page.id)).resolves.toBe(false);
    await expect(repository.getPage(page.id)).resolves.toBeNull();
  });

  it('rejects duplicate canonical URLs, including URL fragments', async () => {
    await repository.createPage({
      url: 'https://example.com/article#first',
      title: 'First',
    });

    await expect(
      repository.createPage({
        url: 'https://example.com/article#second',
        title: 'Duplicate',
      }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_PAGE' });
  });

  it('serializes concurrent writes without losing a page', async () => {
    const pages = await Promise.all(
      ['one', 'two', 'three'].map((slug) =>
        repository.createPage({
          url: `https://example.com/${slug}`,
          title: slug,
        }),
      ),
    );

    await expect(repository.getPages()).resolves.toHaveLength(3);
    expect(new Set(pages.map((page) => page.id)).size).toBe(3);
  });

  it('rejects invalid page input and missing-page updates', async () => {
    await expect(
      repository.createPage({ url: 'not a URL', title: 'Invalid URL' }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });

    await expect(
      repository.createPage({
        url: 'https://example.com/invalid-progress',
        title: 'Invalid progress',
        progress: 101,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });

    await expect(
      repository.updatePage('missing', { title: 'Missing' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('SettingsRepository and StorageService', () => {
  it('returns default settings and saves updates', async () => {
    const storage = new StorageService(new MemoryStorage());
    const repository = new SettingsRepository(storage);

    await expect(repository.getSettings()).resolves.toEqual({
      autoSavePages: false,
      theme: 'system',
    });
    await expect(repository.updateSettings({ theme: 'dark' })).resolves.toEqual({
      autoSavePages: false,
      theme: 'dark',
    });
  });

  it('does not overwrite data with an unsupported schema version', async () => {
    const adapter = new MemoryStorage();
    const unsupportedData = {
      schemaVersion: DATABASE_SCHEMA_VERSION + 1,
      pages: {},
      settings: { autoSavePages: false, theme: 'system' },
    };
    adapter.value = unsupportedData;
    const storage = new StorageService(adapter);

    await expect(storage.initialize()).rejects.toMatchObject({
      code: 'UNSUPPORTED_SCHEMA',
    });
    expect(adapter.value).toBe(unsupportedData);
    expect(adapter.writeCount).toBe(0);
  });

  it('reports storage read and write failures', async () => {
    const readAdapter = new MemoryStorage();
    readAdapter.failReads = true;
    await expect(new StorageService(readAdapter).initialize()).rejects.toMatchObject({
      code: 'READ_FAILED',
    });

    const writeAdapter = new MemoryStorage();
    writeAdapter.failWrites = true;
    await expect(new StorageService(writeAdapter).initialize()).rejects.toMatchObject({
      code: 'WRITE_FAILED',
    });
  });

  it('rejects malformed stored records instead of resetting data', async () => {
    const adapter = new MemoryStorage();
    const malformedData = {
      schemaVersion: DATABASE_SCHEMA_VERSION,
      pages: { broken: { id: 'different-id' } },
      settings: { autoSavePages: false, theme: 'system' },
    };
    adapter.value = malformedData;

    await expect(new StorageService(adapter).initialize()).rejects.toBeInstanceOf(
      StorageError,
    );
    expect(adapter.value).toBe(malformedData);
    expect(adapter.writeCount).toBe(0);
  });
});
