import type { MessageType, RuntimeReply, RuntimeRequest } from '../types';
import { failureForRequest, isRuntimeReply, parseRuntimeRequest } from './protocol';

function sendChromeMessage<K extends MessageType>(
  send: (callback: (response: unknown) => void) => void,
  type: K,
): Promise<RuntimeReply<K>> {
  return new Promise((resolve, reject) => {
    send((response) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        reject(new Error(lastError.message ?? 'Chrome messaging failed.'));
        return;
      }

      if (!isRuntimeReply(response, type)) {
        reject(new Error(`Received an invalid ${type} response.`));
        return;
      }

      resolve(response);
    });
  });
}

export function sendRuntimeMessage<K extends MessageType>(
  request: RuntimeRequest<K>,
): Promise<RuntimeReply<K>> {
  return sendChromeMessage(
    (callback) => chrome.runtime.sendMessage(request, callback),
    request.type,
  );
}

export function sendTabMessage<K extends MessageType>(
  tabId: number,
  request: RuntimeRequest<K>,
): Promise<RuntimeReply<K>> {
  return sendChromeMessage(
    (callback) => chrome.tabs.sendMessage(tabId, request, callback),
    request.type,
  );
}

export function getActiveTabId(): Promise<number> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        reject(new Error(lastError.message ?? 'Could not query the active tab.'));
        return;
      }

      const activeTabId = tabs[0]?.id;
      if (activeTabId === undefined) {
        reject(new Error('There is no active browser tab.'));
        return;
      }

      resolve(activeTabId);
    });
  });
}

export function openOptionsPage(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.runtime.openOptionsPage(() => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        reject(new Error(lastError.message ?? 'Could not open PageMemory settings.'));
        return;
      }
      resolve();
    });
  });
}

export function openPageInNewTab(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url }, () => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        reject(new Error(lastError.message ?? 'Could not open the saved page.'));
        return;
      }
      resolve();
    });
  });
}

export function registerRuntimeHandler(
  handler: (request: RuntimeRequest) => Promise<RuntimeReply>,
): void {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const request = parseRuntimeRequest(message);
    if (!request) return false;

    void handler(request)
      .then(sendResponse)
      .catch((error: unknown) => {
        const messageText =
          error instanceof Error ? error.message : 'An unexpected runtime error occurred.';
        sendResponse(failureForRequest(request, 'INTERNAL', messageText));
      });

    return true;
  });
}
