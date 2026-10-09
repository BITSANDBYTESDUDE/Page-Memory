import { useEffect, useState, type KeyboardEvent } from 'react';
import type { PageRecord } from '../storage/models';
import { Button, Card, IconButton, ProgressBar } from './ui';
import { cn, focusRing } from './ui/utils';

export interface PageCardProps {
  readonly page: PageRecord;
  readonly onContinue: (page: PageRecord) => void;
  readonly onFavorite: (page: PageRecord) => void;
  readonly onDelete: (page: PageRecord) => void;
  readonly className?: string;
}

export function getPageTitle(page: Pick<PageRecord, 'title' | 'url'>): string {
  return page.title.trim() || page.url.trim() || 'Untitled page';
}

export function getPageDomain(page: Pick<PageRecord, 'domain' | 'url'>): string {
  if (page.domain.trim()) return page.domain.trim();
  try {
    return new URL(page.url).hostname || 'Unknown domain';
  } catch {
    return 'Unknown domain';
  }
}

export function getPageProgress(progress: number): number {
  return Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 100) : 0;
}

export function formatLastReadAt(value: string | null, now = Date.now()): string {
  if (!value) return 'Not read yet';
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp) || timestamp > now) return 'Not read yet';

  const elapsedMinutes = Math.floor((now - timestamp) / 60_000);
  if (elapsedMinutes < 1) return 'Just now';
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) return `${elapsedDays}d ago`;

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(timestamp);
}

function Favicon({ page }: { readonly page: PageRecord }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const title = getPageTitle(page);
  const source = page.favicon?.trim() || null;
  const showImage = source !== null && failedSource !== source;

  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-indigo-50 text-indigo-600"
    >
      {showImage ? (
        <img
          alt=""
          className="h-6 w-6 object-contain"
          onError={() => setFailedSource(source)}
          src={source}
        />
      ) : (
        <svg fill="none" height="20" viewBox="0 0 24 24" width="20">
          <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M3.5 9h17M3.5 15h17M12 3c2 2.4 3 5.4 3 9s-1 6.6-3 9c-2-2.4-3-5.4-3-9s1-6.6 3-9Z"
            stroke="currentColor"
            strokeWidth="1.4"
          />
        </svg>
      )}
      <span className="sr-only">Favicon for {title}</span>
    </span>
  );
}

function StarIcon({ filled }: { readonly filled: boolean }) {
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

export function PageCard({ page, onContinue, onFavorite, onDelete, className }: PageCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const title = getPageTitle(page);
  const domain = getPageDomain(page);
  const progress = getPageProgress(page.progress);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab') setMenuOpen(false);
  };

  const handleFavorite = () => {
    setMenuOpen(false);
    onFavorite(page);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    onDelete(page);
  };

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start gap-3">
        <Favicon page={page} />
        <div className="min-w-0 flex-1">
          <h2
            className="line-clamp-2 break-words text-sm font-semibold text-slate-900"
            title={title}
          >
            {title}
          </h2>
          <p className="mt-1 truncate text-xs text-slate-500" title={domain}>
            {domain}
          </p>
        </div>
        <div className="relative" onKeyDown={handleMenuKeyDown}>
          <IconButton
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={`More actions for ${title}`}
            onClick={() => setMenuOpen((open) => !open)}
            size="sm"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ⋯
            </span>
          </IconButton>
          {menuOpen && (
            <div
              className="absolute right-0 top-9 z-10 min-w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
              role="menu"
            >
              <button
                className={cn(
                  'w-full rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50',
                  focusRing,
                )}
                onClick={() => {
                  setMenuOpen(false);
                  onContinue(page);
                }}
                role="menuitem"
                type="button"
              >
                Continue
              </button>
              <button
                className={cn(
                  'w-full rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50',
                  focusRing,
                )}
                onClick={handleFavorite}
                role="menuitem"
                type="button"
              >
                {page.isFavorite ? 'Remove favorite' : 'Favorite'}
              </button>
              <button
                className={cn(
                  'w-full rounded-md px-3 py-2 text-left text-xs text-rose-700 hover:bg-rose-50',
                  focusRing,
                )}
                onClick={handleDelete}
                role="menuitem"
                type="button"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
          <span>{progress}% read</span>
          <span>{formatLastReadAt(page.lastReadAt)}</span>
        </div>
        <ProgressBar label={`${progress}% read`} value={progress} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Button onClick={() => onContinue(page)} size="sm">
          Continue
        </Button>
        <IconButton
          aria-label={
            page.isFavorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`
          }
          aria-pressed={page.isFavorite}
          className={page.isFavorite ? 'text-amber-500 hover:text-amber-600' : undefined}
          onClick={() => onFavorite(page)}
          size="sm"
        >
          <StarIcon filled={page.isFavorite} />
        </IconButton>
      </div>
    </Card>
  );
}
