import type { StoredReadingState } from '../types/reading';

type RestorationWindow = {
  readonly innerHeight: number;
  readonly scrollY: number;
  readonly addEventListener: Window['addEventListener'];
  readonly removeEventListener: Window['removeEventListener'];
  readonly scrollTo: (x: number, y: number) => void;
};

type RestorationDocument = {
  readonly readyState: DocumentReadyState;
  readonly documentElement: Pick<HTMLElement, 'scrollHeight'>;
  readonly body: Pick<HTMLElement, 'scrollHeight'> | null;
  readonly addEventListener: Document['addEventListener'];
  readonly removeEventListener: Document['removeEventListener'];
};

type RestorationTimer = ReturnType<typeof globalThis.setTimeout>;

export type RestorationEnvironment = {
  readonly window: RestorationWindow;
  readonly document: RestorationDocument;
  readonly setTimeout: (handler: () => void, timeoutMs: number) => RestorationTimer;
  readonly clearTimeout: (timerId: RestorationTimer) => void;
};

export type RestorationResult = 'restored' | 'skipped' | 'timed-out';

export type RestorationOptions = {
  readonly maxAttempts?: number;
  readonly retryDelayMs?: number;
  readonly timeoutMs?: number;
  readonly shouldContinue?: () => boolean;
  readonly environment?: RestorationEnvironment;
};

const DEFAULT_MAX_ATTEMPTS = 12;
const DEFAULT_RETRY_DELAY_MS = 250;
const DEFAULT_TIMEOUT_MS = 5_000;
const SCROLL_EVENT_GRACE_MS = 50;

export function calculateRestorationScrollTop(
  storedScrollY: number,
  scrollHeight: number,
  viewportHeight: number,
): number {
  const safeScrollY = Number.isFinite(storedScrollY) ? Math.max(storedScrollY, 0) : 0;
  const safeScrollHeight = Number.isFinite(scrollHeight) ? Math.max(scrollHeight, 0) : 0;
  const safeViewportHeight = Number.isFinite(viewportHeight) ? Math.max(viewportHeight, 0) : 0;
  const maximumScroll = Math.max(safeScrollHeight - safeViewportHeight, 0);

  return Math.min(safeScrollY, maximumScroll);
}

export function isRestorationPositionAvailable(
  storedScrollY: number,
  scrollHeight: number,
  viewportHeight: number,
): boolean {
  const safeScrollY = Number.isFinite(storedScrollY) ? Math.max(storedScrollY, 0) : 0;
  const maximumScroll = Math.max(
    (Number.isFinite(scrollHeight) ? Math.max(scrollHeight, 0) : 0) -
      (Number.isFinite(viewportHeight) ? Math.max(viewportHeight, 0) : 0),
    0,
  );

  return safeScrollY <= maximumScroll;
}

const getScrollHeight = (document: RestorationDocument): number =>
  Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0);

const createBrowserEnvironment = (): RestorationEnvironment => ({
  window: globalThis.window,
  document: globalThis.document,
  setTimeout: (handler, timeoutMs) => globalThis.setTimeout(handler, timeoutMs),
  clearTimeout: (timerId) => globalThis.clearTimeout(timerId),
});

export function restoreReadingPosition(
  state: StoredReadingState,
  options: RestorationOptions = {},
): Promise<RestorationResult> {
  const environment = options.environment ?? createBrowserEnvironment();
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const shouldContinue = options.shouldContinue ?? (() => true);
  let attempts = 0;
  let userScrolled = false;
  let applyingScroll = false;
  let settled = false;
  let retryTimer: RestorationTimer | undefined;
  let timeoutTimer: RestorationTimer | undefined;

  return new Promise<RestorationResult>((resolve) => {
    const finish = (result: RestorationResult): void => {
      if (settled) return;
      settled = true;
      if (retryTimer !== undefined) environment.clearTimeout(retryTimer);
      if (timeoutTimer !== undefined) environment.clearTimeout(timeoutTimer);
      environment.window.removeEventListener('scroll', onScroll);
      environment.document.removeEventListener('DOMContentLoaded', onReady);
      resolve(result);
    };

    const onScroll = (): void => {
      if (!applyingScroll) {
        userScrolled = true;
        finish('skipped');
      }
    };

    const attemptRestore = (): void => {
      retryTimer = undefined;
      if (settled || userScrolled || !shouldContinue()) {
        finish('skipped');
        return;
      }

      attempts += 1;
      const scrollHeight = getScrollHeight(environment.document);
      const viewportHeight = environment.window.innerHeight;
      if (isRestorationPositionAvailable(state.scrollY, scrollHeight, viewportHeight)) {
        const target = calculateRestorationScrollTop(state.scrollY, scrollHeight, viewportHeight);
        applyingScroll = true;
        environment.window.scrollTo(0, target);
        applyingScroll = false;
        finish('restored');
        return;
      }

      if (attempts >= maxAttempts) {
        finish('timed-out');
        return;
      }

      retryTimer = environment.setTimeout(attemptRestore, retryDelayMs);
    };

    const onReady = (): void => attemptRestore();

    environment.window.addEventListener('scroll', onScroll, { passive: true });
    environment.document.addEventListener('DOMContentLoaded', onReady, { once: true });
    timeoutTimer = environment.setTimeout(() => finish('timed-out'), timeoutMs);

    if (environment.document.readyState === 'loading') {
      return;
    }

    // Defer the first attempt to allow layout and late-loading content to settle.
    retryTimer = environment.setTimeout(attemptRestore, SCROLL_EVENT_GRACE_MS);
  });
}
