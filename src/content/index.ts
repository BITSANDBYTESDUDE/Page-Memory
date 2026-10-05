import type { RuntimeReply, RuntimeRequest } from '../types';
import { extractPageMetadata } from '../utils/pageMetadata';

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
