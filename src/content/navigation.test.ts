import { describe, expect, it, vi } from 'vitest';
import { createNavigationObserver, type NavigationEnvironment } from './navigation';

function createEnvironment() {
  let currentUrl = 'https://example.com/';
  const listeners = new Map<string, EventListener>();
  const resolveUrl = (url: string | URL | null | undefined): void => {
    if (url !== null && url !== undefined) {
      currentUrl = new URL(String(url), currentUrl).href;
    }
  };
  const history = {
    pushState: ((_data: unknown, _unused: string, url?: string | URL | null) => {
      resolveUrl(url);
    }) as History['pushState'],
    replaceState: ((_data: unknown, _unused: string, url?: string | URL | null) => {
      resolveUrl(url);
    }) as History['replaceState'],
  };
  const environment: NavigationEnvironment = {
    history,
    location: {
      get href() {
        return currentUrl;
      },
    },
    addEventListener: vi.fn((event: string, listener: EventListener) => {
      listeners.set(event, listener);
    }) as unknown as Window['addEventListener'],
    removeEventListener: vi.fn((event: string, listener: EventListener) => {
      if (listeners.get(event) === listener) listeners.delete(event);
    }) as unknown as Window['removeEventListener'],
  };

  return { environment, history, listeners, setUrl: (url: string) => (currentUrl = url) };
}

describe('createNavigationObserver', () => {
  it('detects pushState and replaceState URL changes once', () => {
    const { environment, history } = createEnvironment();
    const events: string[] = [];
    const stop = createNavigationObserver(
      (event) => events.push(`${event.method}:${event.to}`),
      environment,
    );

    history.pushState({}, '', '/react-page');
    history.pushState({}, '', '/react-page');
    history.replaceState({}, '', '/next-page');
    stop();

    expect(events).toEqual([
      'pushState:https://example.com/react-page',
      'replaceState:https://example.com/next-page',
    ]);
  });

  it('handles popstate and deduplicates the matching hashchange', () => {
    const { environment, history, listeners, setUrl } = createEnvironment();
    const onNavigation = vi.fn();
    const stop = createNavigationObserver(onNavigation, environment);

    history.pushState({}, '', '/article');
    setUrl('https://example.com/article#section-1');
    listeners.get('popstate')?.(new Event('popstate'));
    listeners.get('hashchange')?.(new Event('hashchange'));
    stop();

    expect(onNavigation).toHaveBeenCalledTimes(2);
    expect(onNavigation.mock.calls[1]?.[0]).toMatchObject({
      method: 'popstate',
      isHashOnlyChange: true,
      to: 'https://example.com/article#section-1',
    });
  });

  it('restores the observer without leaving patched history methods behind', () => {
    const { environment, history } = createEnvironment();
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    const stop = createNavigationObserver(() => undefined, environment);
    stop();

    expect(history.pushState).toBe(originalPushState);
    expect(history.replaceState).toBe(originalReplaceState);
  });
});
