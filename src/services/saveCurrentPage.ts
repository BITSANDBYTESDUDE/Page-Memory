import type { PageInfo, PageSaveResult } from '../types';
import { pageRepository } from '../storage/PageRepository';
import type { PageRecord } from '../storage/models';

export interface SaveablePageRepository {
  savePage(metadata: PageInfo): Promise<{ page: PageRecord; created: boolean }>;
}

export async function saveCurrentPage(
  metadata: PageInfo,
  repository: SaveablePageRepository = pageRepository,
): Promise<PageSaveResult> {
  const { page, created } = await repository.savePage(metadata);
  if (page.lastReadAt === null) {
    throw new Error('Saved page is missing its last-read timestamp.');
  }

  return {
    pageId: page.id,
    created,
    lastReadAt: page.lastReadAt,
  };
}
