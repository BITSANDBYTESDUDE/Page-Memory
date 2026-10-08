import type { RuntimeReply, RuntimeRequest } from '../types';
import type { ReadingPositionUpdate } from '../types/reading';
import { extractPageMetadata } from '../utils/pageMetadata';
import { createReadingTracker } from './tracker';

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (
    typeof message !== 'object' ||
    message === null ||
    !('type' in message) ||
    message.type !== 'GET_CURRENT_PAGE'
  ) {
    return false;
  }

  const request: RuntimeRequest<'GET_CURRENT_PAGE'> = { type: message.type };
  const reply: RuntimeReply<'GET_CURRENT_PAGE'> = {
    type: request.type,
    ok: true,
    value: extractPageMetadata(document, window.location.href),
  };
  sendResponse(reply);
  return false;
});

const sendUpdate = (update: ReadingPositionUpdate): void => {
  chrome.runtime.sendMessage(update).catch(() => {
    // The service worker may be unavailable while Chrome is restarting it.
  });
};

createReadingTracker(sendUpdate);
