export type NavigationMethod = 'pushState' | 'replaceState' | 'popstate' | 'hashchange';

export type NavigationEvent = {
  readonly from: string;
  readonly to: string;
  readonly method: NavigationMethod;
  readonly isHashOnlyChange: boolean;
};

export type NavigationEnvironment = {
  readonly history: Pick<History, 'pushState' | 'replaceState'>;
  readonly location: Pick<Location, 'href'>;
  readonly addEventListener: Window['addEventListener'];
  readonly removeEventListener: Window['removeEventListener'];
};

const isHashOnlyChange = (from: string, to: string): boolean => {
  try {
    const previous = new URL(from);
    const next = new URL(to);
    previous.hash = '';
    next.hash = '';
    return previous.href === next.href;
  } catch {
    return false;
  }
};

export function createNavigationObserver(
  onNavigation: (event: NavigationEvent) => void,
  environment: NavigationEnvironment = {
    history: globalThis.history,
    location: globalThis.location,
    addEventListener: globalThis.addEventListener.bind(globalThis),
    removeEventListener: globalThis.removeEventListener.bind(globalThis),
  },
): () => void {
  let currentUrl = environment.location.href;

  const notify = (method: NavigationMethod): void => {
    const nextUrl = environment.location.href;
    if (nextUrl === currentUrl) {
      return;
    }

    const previousUrl = currentUrl;
    currentUrl = nextUrl;
    onNavigation({
      from: previousUrl,
      to: nextUrl,
      method,
      isHashOnlyChange: isHashOnlyChange(previousUrl, nextUrl),
    });
  };

  const originalPushState = environment.history.pushState;
  const originalReplaceState = environment.history.replaceState;
  environment.history.pushState = function pushState(
    ...args: Parameters<History['pushState']>
  ): void {
    originalPushState.apply(this, args);
    notify('pushState');
  };
  environment.history.replaceState = function replaceState(
    ...args: Parameters<History['replaceState']>
  ): void {
    originalReplaceState.apply(this, args);
    notify('replaceState');
  };

  const onPopState = (): void => notify('popstate');
  const onHashChange = (): void => notify('hashchange');
  environment.addEventListener('popstate', onPopState);
  environment.addEventListener('hashchange', onHashChange);

  return () => {
    environment.history.pushState = originalPushState;
    environment.history.replaceState = originalReplaceState;
    environment.removeEventListener('popstate', onPopState);
    environment.removeEventListener('hashchange', onHashChange);
  };
}
