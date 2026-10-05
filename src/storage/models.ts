export const DATABASE_SCHEMA_VERSION = 1;

export interface PageRecord {
  readonly id: string;
  readonly url: string;
  readonly canonicalUrl: string;
  readonly title: string;
  readonly domain: string;
  readonly favicon: string | null;
  readonly progress: number;
  readonly scrollY: number;
  readonly scrollHeight: number;
  readonly lastReadAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly isFavorite: boolean;
  readonly tags: readonly string[];
  readonly notes: string;
  readonly collectionId: string | null;
}

export type CreatePageInput = Pick<PageRecord, 'url' | 'title'> &
  Partial<
    Omit<
      PageRecord,
      'id' | 'url' | 'canonicalUrl' | 'domain' | 'createdAt' | 'updatedAt'
    >
  > & {
    readonly canonicalUrl?: string;
    readonly domain?: string;
  };

export type UpdatePageInput = Partial<
  Omit<PageRecord, 'id' | 'createdAt' | 'updatedAt'>
>;

export type ThemePreference = 'system' | 'light' | 'dark';

export interface AppSettings {
  readonly autoSavePages: boolean;
  readonly theme: ThemePreference;
}

export type UpdateSettingsInput = Partial<AppSettings>;

export interface PageMemoryDatabase {
  readonly schemaVersion: number;
  readonly pages: Readonly<Record<string, PageRecord>>;
  readonly settings: AppSettings;
}

export const DEFAULT_SETTINGS: AppSettings = {
  autoSavePages: false,
  theme: 'system',
};
