import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  calculateRestorationScrollTop,
  isRestorationPositionAvailable,
  restoreReadingPosition,
  type RestorationEnvironment,
} from './restoration';

afterEach(() => {
  vi.useRealTimers();
});

function createEnvironment() {
  const listeners = new Map<string, EventListener>();
  const scrollTo = vi.fn();
  const environment: RestorationEnvironment = {
    window: {
      innerHeight: 800,
      scrollY: 0,
      addEventListener: vi.fn((event: string, listener: EventListener) => {
        listeners.set(event, listener);
      }),
      removeEventListener: vi.fn((event: string, listener: EventListener) => {
        if (listeners.get(event) === listener) listeners.delete(event);
      }),
      scrollTo,
    },
    document: {
      readyState: 'complete',
      documentElement: { scrollHeight: 1_000 },
      body: { scrollHeight: 1_000 },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
    setTimeout: (handler, timeoutMs) => globalThis.setTimeout(handler, timeoutMs),
    clearTimeout: (timerId) => globalThis.clearTimeout(timerId),
  };
  return { environment, listeners, scrollTo };
}

describe('reading-position restoration calculations', () => {
  it('keeps a stored position inside the current scrollable range', () => {
    expect(calculateRestorationScrollTop(1_000, 2_000, 800)).toBe(1_000);
    expect(calculateRestorationScrollTop(5_000, 2_000, 800)).toBe(1_200);
  });

  it('avoids negative or non-finite restoration targets', () => {
    expect(calculateRestorationScrollTop(-100, 2_000, 800)).toBe(0);
    expect(calculateRestorationScrollTop(Number.NaN, Number.POSITIVE_INFINITY, 800)).toBe(0);
  });

  it('waits for enough dynamic content before restoring deep positions', () => {
    expect(isRestorationPositionAvailable(1_000, 1_500, 800)).toBe(false);
    expect(isRestorationPositionAvailable(1_000, 2_000, 800)).toBe(true);
    expect(isRestorationPositionAvailable(0, 0, 800)).toBe(true);
  });

  it('times out without jumping to the current bottom when content stays too short', async () => {
    vi.useFakeTimers();
    const { environment, scrollTo } = createEnvironment();
    const restoration = restoreReadingPosition(
      { scrollY: 2_000, scrollHeight: 4_000, progress: 0.5, lastReadAt: null },
      { environment, maxAttempts: 2, retryDelayMs: 10, timeoutMs: 100 },
    );

    await vi.advanceTimersByTimeAsync(70);

    await expect(restoration).resolves.toBe('timed-out');
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('cancels before applying a restore when the user scrolls', async () => {
    vi.useFakeTimers();
    const { environment, listeners, scrollTo } = createEnvironment();
    const restoration = restoreReadingPosition(
      { scrollY: 400, scrollHeight: 2_000, progress: 0.33, lastReadAt: null },
      { environment },
    );

    listeners.get('scroll')?.(new Event('scroll'));

    await expect(restoration).resolves.toBe('skipped');
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
