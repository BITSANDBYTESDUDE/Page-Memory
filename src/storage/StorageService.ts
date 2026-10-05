import { StorageError } from './errors';
import {
  DATABASE_SCHEMA_VERSION,
  DEFAULT_SETTINGS,
  type PageMemoryDatabase,
} from './models';
import { validateDatabase } from './validation';

export const DATABASE_STORAGE_KEY = 'pagememory.database';

export interface LocalStorageAdapter {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

class ChromeLocalStorageAdapter implements LocalStorageAdapter {
  get(key: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], (items) => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          reject(new StorageError('READ_FAILED', lastError.message ?? 'Could not read local storage.'));
          return;
        }

        resolve(items[key]);
      });
    });
  }

  set(key: string, value: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          reject(new StorageError('WRITE_FAILED', lastError.message ?? 'Could not write local storage.'));
          return;
        }

        resolve();
      });
    });
  }
}

function createEmptyDatabase(): PageMemoryDatabase {
  return {
    schemaVersion: DATABASE_SCHEMA_VERSION,
    pages: {},
    settings: DEFAULT_SETTINGS,
  };
}

export class StorageService {
  private initialization: Promise<void> | undefined;
  private operationQueue: Promise<void> = Promise.resolve();

  constructor(private readonly adapter: LocalStorageAdapter = new ChromeLocalStorageAdapter()) {}

  initialize(): Promise<void> {
    return this.enqueue(async () => this.ensureInitialized());
  }

  getDatabase(): Promise<PageMemoryDatabase> {
    return this.enqueue(async () => {
      await this.ensureInitialized();
      return this.readDatabase();
    });
  }

  updateDatabase(
    update: (database: PageMemoryDatabase) => PageMemoryDatabase,
  ): Promise<PageMemoryDatabase> {
    return this.enqueue(async () => {
      await this.ensureInitialized();
      const current = await this.readDatabase();
      const updated = validateDatabase(update(current));
      await this.writeDatabase(updated);
      return updated;
    });
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.operationQueue.then(operation);
    this.operationQueue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private ensureInitialized(): Promise<void> {
    if (!this.initialization) {
      this.initialization = this.readStoredValue()
        .then(async (stored) => {
          if (stored === undefined) {
            await this.writeDatabase(createEmptyDatabase());
            return;
          }

          validateDatabase(stored);
        })
        .catch((error: unknown) => {
          this.initialization = undefined;
          throw error;
        });
    }

    return this.initialization;
  }

  private async readDatabase(): Promise<PageMemoryDatabase> {
    return validateDatabase(await this.readStoredValue());
  }

  private async readStoredValue(): Promise<unknown> {
    try {
      return await this.adapter.get(DATABASE_STORAGE_KEY);
    } catch (error: unknown) {
      if (error instanceof StorageError) throw error;
      throw new StorageError('READ_FAILED', 'Could not read PageMemory data.', error);
    }
  }

  private async writeDatabase(database: PageMemoryDatabase): Promise<void> {
    try {
      await this.adapter.set(DATABASE_STORAGE_KEY, database);
    } catch (error: unknown) {
      if (error instanceof StorageError) throw error;
      throw new StorageError('WRITE_FAILED', 'Could not save PageMemory data.', error);
    }
  }
}

export const storageService = new StorageService();
