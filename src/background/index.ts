import type { RuntimeReply, RuntimeRequest } from '../types';
import { failureForRequest } from '../messaging/protocol';
import {
  getActiveTabId,
  registerRuntimeHandler,
  sendTabMessage,
} from '../messaging/chrome';

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
    case 'GET_PAGE':
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
