import { useMemo, useState, type ReactNode } from 'react';
import type { PopupState } from '../hooks/useCurrentPage';
import type { SavedPageSummary } from '../types';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  ProgressBar,
  SearchInput,
} from '../components/ui';
import { openOptionsPage } from '../messaging/chrome';

interface PopupProps {
  readonly state: PopupState;
  readonly onRetry: () => void;
  readonly onSave: () => void;
  readonly onFavorite: (pageId: string) => void;
}

function recentTimestamp(timestamp: string | null): string {
  if (!timestamp) return 'Not read yet';
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed)) return 'Recently read';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

function findContinuePage(pages: readonly SavedPageSummary[]): SavedPageSummary | null {
  return (
    [...pages].sort((left, right) => {
      const leftDate = left.lastReadAt ? Date.parse(left.lastReadAt) : 0;
      const rightDate = right.lastReadAt ? Date.parse(right.lastReadAt) : 0;
      return rightDate - leftDate;
    })[0] ?? null
  );
}

function PageFavicon({ page }: { readonly page: SavedPageSummary }) {
  const [failed, setFailed] = useState(false);
  if (!page.favicon || failed) {
    return (
      <span
        aria-hidden="true"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-sm font-semibold text-indigo-700"
      >
        {page.domain.slice(0, 1).toUpperCase() || 'P'}
      </span>
    );
  }

  return (
    <img
      alt=""
      className="h-9 w-9 shrink-0 rounded-lg border border-slate-100 bg-white object-contain p-1"
      onError={() => setFailed(true)}
      src={page.favicon}
    />
  );
}

function FavoriteIcon({ filled }: { readonly filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      fill={filled ? 'currentColor' : 'none'}
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <path
        d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}
function PageRow({
  page,
  onFavorite,
}: {
  readonly page: SavedPageSummary;
  readonly onFavorite: (pageId: string) => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg p-2 transition-colors hover:bg-slate-50">
      <a
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        href={page.url}
        rel="noreferrer"
        target="_blank"
        title={`Open ${page.title || page.domain}`}
      >
        <PageFavicon page={page} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-slate-800">
            {page.title || page.domain}
          </span>
          <span className="mt-0.5 block truncate text-xs text-slate-500">
            {page.domain} · {recentTimestamp(page.lastReadAt)}
          </span>
        </span>
        <span aria-hidden="true" className="shrink-0 text-slate-400">
          ↗
        </span>
      </a>
      <IconButton
        aria-label={
          page.isFavorite
            ? `Remove ${page.title || page.domain} from favorites`
            : `Add ${page.title || page.domain} to favorites`
        }
        aria-pressed={page.isFavorite}
        className={page.isFavorite ? 'text-amber-500 hover:text-amber-600' : undefined}
        onClick={() => onFavorite(page.id)}
        size="sm"
      >
        <FavoriteIcon filled={page.isFavorite} />
      </IconButton>
    </div>
  );
}
export function Popup({ state, onRetry, onSave, onFavorite }: PopupProps) {
  const [search, setSearch] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pages = state.status === 'ready' ? state.pages : [];
  const continuePage = findContinuePage(pages);

  const searchQuery = search.trim().toLocaleLowerCase();
  const visiblePages = useMemo(
    () => (favoritesOnly ? pages.filter((page) => page.isFavorite) : pages),
    [favoritesOnly, pages],
  );
  const recentPages = useMemo(() => {
    return visiblePages
      .filter((page) => {
        if (!searchQuery) return true;
        return `${page.title} ${page.domain} ${page.url}`.toLocaleLowerCase().includes(searchQuery);
      })
      .slice(0, 6);
  }, [searchQuery, visiblePages]);
  const favoritePages = useMemo(() => recentPages.filter((page) => page.isFavorite), [recentPages]);

  const handleOpenSettings = async () => {
    setSettingsError(null);
    try {
      await openOptionsPage();
    } catch (error: unknown) {
      setSettingsError(
        error instanceof Error ? error.message : 'Could not open PageMemory settings.',
      );
    }
  };

  return (
    <main className="flex max-h-[600px] min-h-[480px] w-[380px] max-w-full flex-col overflow-y-auto bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 pb-3 pt-3 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <a
            aria-label="PageMemory home"
            className="inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            href="#home"
          >
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm"
            >
              P
            </span>
            <span className="text-sm font-bold tracking-tight text-slate-950">PageMemory</span>
          </a>
          <IconButton
            aria-label="Open settings"
            onClick={() => void handleOpenSettings()}
            size="sm"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
              <path
                d="M8.5 2.5h3l.5 1.8 1.4.8 1.8-.6 1.5 2.6-1.3 1.3v1.6l1.3 1.3-1.5 2.6-1.8-.6-1.4.8-.5 1.8h-3L8 14.1l-1.4-.8-1.8.6-1.5-2.6 1.3-1.3V8.4L3.3 7.1l1.5-2.6 1.8.6L8 4.3l.5-1.8Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.4"
              />
              <circle cx="10" cy="9.2" r="2.2" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </IconButton>
        </div>
        <SearchInput
          aria-label="Search saved pages"
          className="py-2"
          label="Search saved pages"
          onChange={(event) => setSearch(event.target.value)}
          onClear={() => setSearch('')}
          placeholder="Search pages or websites"
          value={search}
        />
        {settingsError && (
          <p className="mt-2 text-xs text-rose-700" role="alert">
            {settingsError}
          </p>
        )}
      </header>

      <div className="space-y-5 px-4 py-4">
        {state.status === 'loading' && (
          <Card className="p-4">
            <LoadingState label="Loading your saved pages…" />
          </Card>
        )}

        {state.status === 'error' && (
          <ErrorState
            action={
              <Button onClick={onRetry} size="sm">
                Try again
              </Button>
            }
            message={state.message}
            title="Your library couldn't load"
          />
        )}

        {state.status === 'ready' && (
          <>
            {state.currentPageError && (
              <ErrorState
                className="p-3"
                message={state.currentPageError}
                title="Current page unavailable"
              />
            )}

            {state.favoriteError && (
              <p className="text-xs text-rose-700" role="alert">
                {state.favoriteError}
              </p>
            )}

            {state.pages.length > 0 && (
              <section aria-labelledby="favorites-heading">
                <SectionHeader
                  count={favoritePages.length}
                  id="favorites-heading"
                  title="Favorites"
                />
                {favoritePages.length > 0 ? (
                  <Card className="mt-2 divide-y divide-slate-100 p-1.5">
                    {favoritePages.map((page) => (
                      <PageRow key={page.id} onFavorite={onFavorite} page={page} />
                    ))}
                  </Card>
                ) : (
                  <EmptyState
                    className="mt-2 p-4"
                    description={
                      search
                        ? 'Try another search or favorite a page to see it here.'
                        : 'Favorite pages will appear here for quick access.'
                    }
                    title="No favorites yet"
                  />
                )}
              </section>
            )}

            {state.pages.length === 0 ? (
              <section aria-labelledby="continue-heading">
                <SectionHeader id="continue-heading" title="Continue reading" />
                <EmptyState
                  action={
                    state.currentPage ? (
                      <Button
                        className="w-full"
                        disabled={state.saveStatus === 'saving'}
                        onClick={onSave}
                        size="sm"
                      >
                        {state.saveStatus === 'saving'
                          ? 'Saving…'
                          : state.saveStatus === 'error'
                            ? 'Try saving again'
                            : 'Save current page'}
                      </Button>
                    ) : undefined
                  }
                  className="mt-2"
                  description={
                    state.currentPage
                      ? `Save “${state.currentPage.title || state.currentPage.domain}” to continue reading later.`
                      : 'Pages you save will be ready for you here.'
                  }
                  title="Nothing saved yet"
                />
                {state.saveStatus === 'error' && state.saveError && (
                  <p className="mt-2 text-xs text-rose-700" role="alert">
                    {state.saveError}
                  </p>
                )}
              </section>
            ) : (
              <section aria-labelledby="continue-heading">
                <SectionHeader id="continue-heading" title="Continue reading" />
                {continuePage && (
                  <Card className="mt-2 overflow-hidden p-3">
                    <div className="flex items-start gap-3">
                      <PageFavicon page={continuePage} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="success">Saved</Badge>
                          <span className="truncate text-xs text-slate-500">
                            {continuePage.domain}
                          </span>
                        </div>
                        <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-900">
                          {continuePage.title || continuePage.domain}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {continuePage.progress > 0
                            ? `${Math.round(continuePage.progress)}% read`
                            : 'Ready when you are'}
                        </p>
                      </div>
                    </div>
                    <ProgressBar
                      className="mt-3"
                      label={`${Math.round(continuePage.progress)}% reading progress`}
                      value={continuePage.progress}
                    />
                    <a
                      className="mt-3 flex min-h-9 items-center justify-center rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                      href={continuePage.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Continue reading
                    </a>
                  </Card>
                )}
              </section>
            )}

            <section aria-labelledby="recent-heading">
              <SectionHeader
                action={
                  <Button
                    aria-pressed={favoritesOnly}
                    onClick={() => setFavoritesOnly((active) => !active)}
                    size="sm"
                    variant={favoritesOnly ? 'primary' : 'secondary'}
                  >
                    <FavoriteIcon filled={favoritesOnly} />
                    Favorites only
                  </Button>
                }
                count={search || favoritesOnly ? recentPages.length : state.pages.length}
                id="recent-heading"
                title="Recent pages"
              />
              {state.pages.length === 0 ? null : recentPages.length > 0 ? (
                <Card className="mt-2 divide-y divide-slate-100 p-1.5">
                  {recentPages.map((page) => (
                    <PageRow key={page.id} onFavorite={onFavorite} page={page} />
                  ))}
                </Card>
              ) : (
                <EmptyState
                  className="mt-2"
                  description="Try another title or website name."
                  title="No pages match your search"
                />
              )}
            </section>

            {state.currentPage && state.saveStatus !== 'saved' && state.pages.length > 0 && (
              <Card className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-800">Save this page</p>
                  <p className="truncate text-xs text-slate-500">
                    {state.currentPage.title || state.currentPage.domain}
                  </p>
                </div>
                <Button
                  disabled={state.saveStatus === 'saving'}
                  onClick={onSave}
                  size="sm"
                  variant="secondary"
                >
                  {state.saveStatus === 'saving' ? 'Saving…' : 'Save'}
                </Button>
              </Card>
            )}

            {state.saveStatus === 'error' && state.saveError && (
              <p className="text-xs text-rose-700" role="alert">
                {state.saveError}
              </p>
            )}
          </>
        )}
      </div>
      <footer className="mt-auto border-t border-slate-200 px-4 py-2.5 text-center text-[11px] text-slate-400">
        Your saved pages stay on this device
      </footer>
    </main>
  );
}

interface SectionHeaderProps {
  readonly id: string;
  readonly title: string;
  readonly count?: number;
  readonly action?: ReactNode;
}

function SectionHeader({ id, title, count, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-slate-900" id={id}>
        {title}
      </h2>
      <div className="flex items-center gap-2">
        {count !== undefined && <span className="text-xs text-slate-400">{count}</span>}
        {action}
      </div>
    </div>
  );
}
