import type { ReadingPositionUpdate } from '../types/reading';
import { calculateReadingProgress } from './progress';

export type ReadingTrackerWindow = Pick<
  Window,
  'addEventListener' | 'removeEventListener' | 'innerHeight' | 'scrollY'
>;

export type ReadingTrackerDocument = Pick<
  Document,
  | 'documentElement'
  | 'body'
  | 'defaultView'
  | 'URL'
  | 'visibilityState'
  | 'addEventListener'
  | 'removeEventListener'
>;

type ResizeObserverLike = {
  observe: (target: Element) => void;
  disconnect: () => void;
};

type MutationObserverLike = {
  observe: (target: Node, options: MutationObserverInit) => void;
  disconnect: () => void;
};

export type ReadingTrackerEnvironment = {
  readonly window: ReadingTrackerWindow;
  readonly document: ReadingTrackerDocument;
  readonly setTimeout: (
    handler: () => void,
    timeoutMs: number,
  ) => ReturnType<typeof globalThis.setTimeout>;
  readonly clearTimeout: (timerId: ReturnType<typeof globalThis.setTimeout>) => void;
  readonly createResizeObserver?: (callback: ResizeObserverCallback) => ResizeObserverLike;
  readonly createMutationObserver?: (callback: MutationCallback) => MutationObserverLike;
};

export type ReadingTrackerOptions = {
  readonly debounceMs?: number;
  readonly environment?: ReadingTrackerEnvironment;
};

const DEFAULT_DEBOUNCE_MS = 200;

const getDocumentScrollHeight = (document: ReadingTrackerDocument): number =>
  Math.max(document.documentElement?.scrollHeight ?? 0, document.body?.scrollHeight ?? 0);

const createBrowserEnvironment = (): ReadingTrackerEnvironment => ({
  window: globalThis.window,
  document: globalThis.document,
  setTimeout: globalThis.setTimeout,
  clearTimeout: globalThis.clearTimeout,
  createResizeObserver:
    typeof globalThis.ResizeObserver === 'function'
      ? (callback) => new globalThis.ResizeObserver(callback)
      : undefined,
  createMutationObserver:
    typeof globalThis.MutationObserver === 'function'
      ? (callback) => new globalThis.MutationObserver(callback)
      : undefined,
});

export function createReadingTracker(
  sendUpdate: (update: ReadingPositionUpdate) => void,
  options: ReadingTrackerOptions = {},
): () => void {
  const environment = options.environment ?? createBrowserEnvironment();
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  let pendingTimer: ReturnType<typeof globalThis.setTimeout> | undefined;
  let stopped = false;

  const collectUpdate = (): ReadingPositionUpdate => {
    const scrollY = environment.window.scrollY;
    const scrollHeight = getDocumentScrollHeight(environment.document);
    const viewportHeight = environment.window.innerHeight;

    return {
      type: 'READING_POSITION_UPDATE',
      url: environment.document.URL,
      scrollY,
      scrollHeight,
      viewportHeight,
      progress: calculateReadingProgress(scrollY, scrollHeight, viewportHeight),
    };
  };

  const sendCurrentPosition = (isFinal = false): void => {
    if (pendingTimer !== undefined) {
      environment.clearTimeout(pendingTimer);
    }
    pendingTimer = undefined;
    if (!stopped) {
      sendUpdate({ ...collectUpdate(), isFinal });
    }
  };

  const scheduleUpdate = (): void => {
    if (stopped || pendingTimer !== undefined) {
      return;
    }

    pendingTimer = environment.setTimeout(sendCurrentPosition, debounceMs);
  };

  const onScroll = (): void => scheduleUpdate();
  const onResize = (): void => scheduleUpdate();
  const onPageHide = (): void => sendCurrentPosition(true);
  const onVisibilityChange = (): void => {
    if (environment.document.visibilityState === 'hidden') {
      sendCurrentPosition(true);
    }
  };

  environment.window.addEventListener('scroll', onScroll, { passive: true });
  environment.window.addEventListener('resize', onResize, { passive: true });
  environment.window.addEventListener('pagehide', onPageHide);
  environment.document.addEventListener('visibilitychange', onVisibilityChange);

  const resizeObserver = environment.createResizeObserver?.(() => scheduleUpdate());
  if (resizeObserver) {
    resizeObserver.observe(environment.document.documentElement);
    if (environment.document.body) {
      resizeObserver.observe(environment.document.body);
    }
  }

  const mutationObserver = environment.createMutationObserver?.(() => scheduleUpdate());
  mutationObserver?.observe(environment.document.documentElement, {
    childList: true,
    subtree: true,
  });

  sendUpdate(collectUpdate());

  return () => {
    stopped = true;
    environment.window.removeEventListener('scroll', onScroll);
    environment.window.removeEventListener('resize', onResize);
    environment.window.removeEventListener('pagehide', onPageHide);
    environment.document.removeEventListener('visibilitychange', onVisibilityChange);
    resizeObserver?.disconnect();
    mutationObserver?.disconnect();

    if (pendingTimer !== undefined) {
      environment.clearTimeout(pendingTimer);
      pendingTimer = undefined;
    }
  };
}
