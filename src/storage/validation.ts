import {
  DATABASE_SCHEMA_VERSION,
  type AppSettings,
  type PageMemoryDatabase,
  type PageRecord,
} from './models';
import { StorageError } from './errors';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isDateString = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(Date.parse(value));

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isPageRecord = (value: unknown): value is PageRecord => {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.url) &&
    isNonEmptyString(value.canonicalUrl) &&
    typeof value.title === 'string' &&
    isNonEmptyString(value.domain) &&
    (typeof value.favicon === 'string' || value.favicon === null) &&
    isFiniteNumber(value.progress) &&
    value.progress >= 0 &&
    value.progress <= 100 &&
    isFiniteNumber(value.scrollY) &&
    value.scrollY >= 0 &&
    isFiniteNumber(value.scrollHeight) &&
    value.scrollHeight >= 0 &&
    (value.lastReadAt === null || isDateString(value.lastReadAt)) &&
    isDateString(value.createdAt) &&
    isDateString(value.updatedAt) &&
    typeof value.isFavorite === 'boolean' &&
    Array.isArray(value.tags) &&
    value.tags.every((tag: unknown) => typeof tag === 'string') &&
    typeof value.notes === 'string' &&
    (typeof value.collectionId === 'string' || value.collectionId === null)
  );
};

const isAppSettings = (value: unknown): value is AppSettings =>
  isRecord(value) &&
  typeof value.autoSavePages === 'boolean' &&
  (value.theme === 'system' || value.theme === 'light' || value.theme === 'dark');

export function validateDatabase(value: unknown): PageMemoryDatabase {
  if (!isRecord(value)) {
    throw new StorageError('INVALID_DATA', 'PageMemory data is not a valid object.');
  }

  if (value.schemaVersion !== DATABASE_SCHEMA_VERSION) {
    throw new StorageError(
      'UNSUPPORTED_SCHEMA',
      `PageMemory data schema ${String(value.schemaVersion)} is not supported.`,
    );
  }

  if (!isRecord(value.pages) || !isAppSettings(value.settings)) {
    throw new StorageError('INVALID_DATA', 'PageMemory data has an invalid pages or settings field.');
  }

  const pages: Record<string, PageRecord> = {};
  for (const [id, page] of Object.entries(value.pages)) {
    if (!isPageRecord(page) || page.id !== id) {
      throw new StorageError('INVALID_DATA', `Page record "${id}" is invalid.`);
    }
    pages[id] = page;
  }

  return {
    schemaVersion: DATABASE_SCHEMA_VERSION,
    pages,
    settings: value.settings,
  };
}

export function validatePageInput(page: PageRecord): PageRecord {
  if (!isPageRecord(page)) {
    throw new StorageError('INVALID_INPUT', 'Page data does not satisfy the PageMemory page schema.');
  }

  return page;
}
