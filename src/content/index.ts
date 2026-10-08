import type { RuntimeReply, RuntimeRequest } from '../types';
import type { ReadingPositionUpdate } from '../types/reading';
import { getReadingState } from '../messaging/client';
import { extractPageMetadata } from '../utils/pageMetadata';
import { createNavigationObserver } from './navigation';
import { restoreReadingPosition } from './restoration';
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

let stopTracker: (() => void) | undefined;
let navigationGeneration = 0;
const initializeCurrentPage = (restorePosition: boolean): void => {
  const generation = ++navigationGeneration;
  let trackingReady = !restorePosition;
  let pendingUpdate: ReadingPositionUpdate | undefined;
  const sendPageUpdate = (update: ReadingPositionUpdate): void => {
    if (!trackingReady) {
      pendingUpdate = update;
      return;
    }
    sendUpdate(update);
  };
  stopTracker?.();
  stopTracker = createReadingTracker(sendPageUpdate);
  if (restorePosition) {
    const url = window.location.href;
    void restoreSavedPosition(generation, url).finally(() => {
      if (generation !== navigationGeneration || window.location.href !== url) {
        return;
      }
      trackingReady = true;
      if (pendingUpdate) {
        sendUpdate(pendingUpdate);
        pendingUpdate = undefined;
      }
    });
  }
};

initializeCurrentPage(true);
createNavigationObserver((event) => initializeCurrentPage(!event.isHashOnlyChange));

async function restoreSavedPosition(generation: number, url: string): Promise<void> {
  try {
    const reply = await getReadingState(url);
    if (!reply.ok || reply.value === null) {
      return;
    }

    if (generation !== navigationGeneration || window.location.href !== url) {
      return;
    }
    await restoreReadingPosition(reply.value, {
      shouldContinue: () => generation === navigationGeneration && window.location.href === url,
    });
  } catch {
    // Restoration is best effort; a page must remain usable if messaging fails.
  }
}
