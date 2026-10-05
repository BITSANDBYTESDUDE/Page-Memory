import type { RuntimeReply, RuntimeRequest } from '../types';

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
    value: { url: window.location.href, title: document.title },
  };
  sendResponse(reply);
  return false;
});
