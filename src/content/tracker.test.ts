import { describe, expect, it, vi } from 'vitest';
import { createReadingTracker, type ReadingTrackerEnvironment } from './tracker';

function createEnvironment() {
  const listeners = new Map<string, EventListener>();
  let timerCallback: (() => void) | undefined;
  const documentElement = { scrollHeight: 2_000 } as HTMLElement;
  const body = { scrollHeight: 2_000 } as HTMLElement;
  const windowRef = {
    innerHeight: 800,
    scrollY: 0,
    addEventListener: vi.fn((event: string, listener: EventListener) => {
      listeners.set(event, listener);
    }),
    removeEventListener: vi.fn((event: string, listener: EventListener) => {
      if (listeners.get(event) === listener) {
        listeners.delete(event);
      }
    }),
  } as unknown as ReadingTrackerEnvironment['window'];
  const documentRef = {
    documentElement,
    body,
    defaultView: windowRef,
    URL: 'https://example.com/long-article',
  } as unknown as ReadingTrackerEnvironment['document'];
  const environment: ReadingTrackerEnvironment = {
    window: windowRef,
    document: documentRef,
    setTimeout: vi.fn((callback: () => void, _timeoutMs: number) => {
      timerCallback = callback;
      return 1 as unknown as ReturnType<typeof globalThis.setTimeout>;
    }),
    clearTimeout: vi.fn(),
  };

  return {
    environment,
    listeners,
    documentElement,
    flushTimer: () => timerCallback?.(),
  };
}

describe('createReadingTracker', () => {
  it('debounces updates and reads the latest dynamic page height', () => {
    const { environment, listeners, documentElement, flushTimer } = createEnvironment();
    const updates: number[] = [];

    createReadingTracker((update) => updates.push(update.scrollHeight), {
      debounceMs: 200,
      environment,
    });
    expect(updates).toEqual([2_000]);

    (documentElement as unknown as { scrollHeight: number }).scrollHeight = 3_000;
    listeners.get('scroll')?.(new Event('scroll'));
    listeners.get('scroll')?.(new Event('scroll'));
    expect(updates).toEqual([2_000]);

    flushTimer();
    expect(updates).toEqual([2_000, 3_000]);
  });

  it('removes listeners and cancels pending work on cleanup', () => {
    const { environment, listeners, flushTimer } = createEnvironment();
    const sendUpdate = vi.fn();
    const stop = createReadingTracker(sendUpdate, { environment });

    stop();
    listeners.get('scroll')?.(new Event('scroll'));
    flushTimer();

    expect(environment.window.removeEventListener).toHaveBeenCalledTimes(2);
    expect(environment.clearTimeout).toHaveBeenCalledTimes(0);
    expect(sendUpdate).toHaveBeenCalledTimes(1);
  });
});
