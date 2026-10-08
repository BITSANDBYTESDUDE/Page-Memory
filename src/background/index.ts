import type { RuntimeReply, RuntimeRequest } from '../types';
import type { ReadingPositionUpdate } from '../types/reading';
import { failureForRequest, success } from '../messaging/protocol';
import {
  getActiveTabId,
  registerRuntimeHandler,
  sendTabMessage,
} from '../messaging/chrome';
import { pageRepository } from '../storage/PageRepository';
import { StorageError } from '../storage/errors';
import { saveCurrentPage } from '../services/saveCurrentPage';

async function handleRuntimeRequest(request: RuntimeRequest): Promise<RuntimeReply> {
  switch (request.type) {
    case 'GET_CURRENT_PAGE': {
      let tabId: number;
      try {
        tabId = await getActiveTabId();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Could not identify the active tab.';
        return failureForRequest(request, 'ACTIVE_TAB_UNAVAILABLE', message);
      }

      try {
        return await sendTabMessage(tabId, request);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Could not contact the content script.';
        return failureForRequest(request, 'CONTENT_SCRIPT_UNAVAILABLE', message);
      }
    }
    case 'SAVE_PAGE':
      try {
        return success('SAVE_PAGE', await saveCurrentPage(request.payload));
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Could not save the current page.';
        const code =
          error instanceof StorageError && error.code === 'INVALID_INPUT'
            ? 'INVALID_REQUEST'
            : 'INTERNAL';
        return failureForRequest(request, code, message);
      }
    case 'GET_PAGE':
      try {
        const page = await pageRepository.getPageByUrl(request.payload.url);
        return success('GET_PAGE', { isSaved: page !== null });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Could not check whether the page is saved.';
        const code =
          error instanceof StorageError && error.code === 'INVALID_INPUT'
            ? 'INVALID_REQUEST'
            : 'INTERNAL';
        return failureForRequest(request, code, message);
      }
    case 'UPDATE_PROGRESS':
    case 'RESTORE_POSITION':
      return failureForRequest(
        request,
        'NOT_IMPLEMENTED',
        'Page persistence and reading-position features are not implemented yet.',
      );
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.info('PageMemory extension installed.');
});

registerRuntimeHandler(handleRuntimeRequest);

chrome.runtime.onMessage.addListener((message: unknown, sender) => {
  if (!isReadingPositionUpdate(message)) {
    return;
  }

  console.debug('PageMemory reading position received.', {
    tabId: sender.tab?.id,
    progress: message.progress,
  });
});

function isReadingPositionUpdate(message: unknown): message is ReadingPositionUpdate {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    message.type === 'READING_POSITION_UPDATE'
  );
}
