import { StorageError } from './errors';
import type { CreatePageInput, PageRecord, UpdatePageInput } from './models';
import { StorageService, storageService } from './StorageService';
import { validatePageInput } from './validation';
import { normalizePageUrl, UrlNormalizationError } from '../utils/url';
import type { PageInfo } from '../types';

function normalizeStorageUrl(url: string): ReturnType<typeof normalizePageUrl> {
  try {
    return normalizePageUrl(url);
  } catch (error: unknown) {
    if (error instanceof UrlNormalizationError) {
      throw new StorageError('INVALID_INPUT', error.message, error);
    }
    throw error;
  }
}

function now(): string {
  return new Date().toISOString();
}

export class PageRepository {
  constructor(private readonly storage: StorageService = storageService) {}

  async createPage(input: CreatePageInput): Promise<PageRecord> {
    const normalizedUrl = normalizeStorageUrl(input.url);
    const timestamp = now();
    const page: PageRecord = validatePageInput({
      id: globalThis.crypto.randomUUID(),
      url: input.url,
      canonicalUrl: input.canonicalUrl ?? normalizedUrl.canonicalUrl,
      title: input.title,
      domain: input.domain ?? normalizedUrl.domain,
      favicon: input.favicon ?? null,
      progress: input.progress ?? 0,
      scrollY: input.scrollY ?? 0,
      scrollHeight: input.scrollHeight ?? 0,
      lastReadAt: input.lastReadAt ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
      isFavorite: input.isFavorite ?? false,
      tags: input.tags ?? [],
      notes: input.notes ?? '',
      collectionId: input.collectionId ?? null,
    });

    await this.storage.updateDatabase((database) => {
      if (
        Object.values(database.pages).some(
          (existing) => existing.canonicalUrl === page.canonicalUrl,
        )
      ) {
        throw new StorageError(
          'DUPLICATE_PAGE',
          `A page with canonical URL "${page.canonicalUrl}" already exists.`,
        );
      }

      return {
        ...database,
        pages: { ...database.pages, [page.id]: page },
      };
    });
    return page;
  }

  async savePage(metadata: PageInfo): Promise<{ page: PageRecord; created: boolean }> {
    const normalizedUrl = normalizeStorageUrl(metadata.url);
    const normalizedCanonicalUrl = normalizeStorageUrl(metadata.canonicalUrl);
    const timestamp = now();
    let savedPage: PageRecord | undefined;
    let created = false;

    await this.storage.updateDatabase((database) => {
      const existing = Object.values(database.pages).find(
        (page) => page.canonicalUrl === normalizedCanonicalUrl.canonicalUrl,
      );

      if (existing) {
        savedPage = validatePageInput({
          ...existing,
          lastReadAt: timestamp,
          updatedAt: timestamp,
        });
        return {
          ...database,
          pages: { ...database.pages, [existing.id]: savedPage },
        };
      }

      const page = validatePageInput({
        id: metadata.pageId,
        url: normalizedUrl.url,
        canonicalUrl: normalizedCanonicalUrl.canonicalUrl,
        title: metadata.title,
        domain: normalizedUrl.domain,
        favicon: metadata.favicon,
        progress: 0,
        scrollY: 0,
        scrollHeight: 0,
        lastReadAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
        isFavorite: false,
        tags: [],
        notes: '',
        collectionId: null,
      });

      if (database.pages[page.id]) {
        throw new StorageError(
          'DUPLICATE_PAGE',
          `A page with ID "${page.id}" already exists for another URL.`,
        );
      }

      savedPage = page;
      created = true;
      return {
        ...database,
        pages: { ...database.pages, [page.id]: page },
      };
    });

    if (!savedPage) {
      throw new StorageError('WRITE_FAILED', 'The saved page was not returned from storage.');
    }

    return { page: savedPage, created };
  }

  async getPage(id: string): Promise<PageRecord | null> {
    const database = await this.storage.getDatabase();
    return database.pages[id] ?? null;
  }

  async getPageByUrl(url: string): Promise<PageRecord | null> {
    const normalizedUrl = normalizeStorageUrl(url);
    const database = await this.storage.getDatabase();
    return (
      Object.values(database.pages).find(
        (page) =>
          page.canonicalUrl === normalizedUrl.canonicalUrl ||
          page.url === url,
      ) ?? null
    );
  }

  async getPages(): Promise<PageRecord[]> {
    const database = await this.storage.getDatabase();
    return Object.values(database.pages).sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    );
  }

  updatePage(id: string, input: UpdatePageInput): Promise<PageRecord> {
    return this.storage
      .updateDatabase((database) => {
        const existing = database.pages[id];
        if (!existing) {
          throw new StorageError('NOT_FOUND', `Page "${id}" was not found.`);
        }

        const urlChanged = input.url !== undefined && input.url !== existing.url;
        const normalizedUrl = urlChanged ? normalizeStorageUrl(input.url) : null;
        const updated: PageRecord = validatePageInput({
          ...existing,
          ...input,
          ...(normalizedUrl && input.canonicalUrl === undefined
            ? { canonicalUrl: normalizedUrl.canonicalUrl }
            : {}),
          ...(normalizedUrl && input.domain === undefined
            ? { domain: normalizedUrl.domain }
            : {}),
          updatedAt: now(),
        });

        if (
          Object.values(database.pages).some(
            (page) => page.id !== id && page.canonicalUrl === updated.canonicalUrl,
          )
        ) {
          throw new StorageError(
            'DUPLICATE_PAGE',
            `A page with canonical URL "${updated.canonicalUrl}" already exists.`,
          );
        }

        return {
          ...database,
          pages: { ...database.pages, [id]: updated },
        };
      })
      .then((database) => database.pages[id]);
  }

  async deletePage(id: string): Promise<boolean> {
    let deleted = false;
    await this.storage.updateDatabase((database) => {
      if (!database.pages[id]) return database;
      deleted = true;
      const pages = { ...database.pages };
      delete pages[id];
      return { ...database, pages };
    });
    return deleted;
  }
}

export const pageRepository = new PageRepository();
