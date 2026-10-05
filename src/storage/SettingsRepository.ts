import { StorageService, storageService } from './StorageService';
import type { AppSettings, UpdateSettingsInput } from './models';

export class SettingsRepository {
  constructor(private readonly storage: StorageService = storageService) {}

  async getSettings(): Promise<AppSettings> {
    const database = await this.storage.getDatabase();
    return database.settings;
  }

  async updateSettings(input: UpdateSettingsInput): Promise<AppSettings> {
    const database = await this.storage.updateDatabase((current) => ({
      ...current,
      settings: { ...current.settings, ...input },
    }));
    return database.settings;
  }
}

export const settingsRepository = new SettingsRepository();
