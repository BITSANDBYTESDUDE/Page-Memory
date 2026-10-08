import { useCallback, useEffect, useState } from 'react';
import { getCurrentPage, getPages, savePage } from '../messaging/client';
import type { PageInfo, SavedPageSummary } from '../types';

export type PopupState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | {
      readonly status: 'ready';
      readonly pages: readonly SavedPageSummary[];
      readonly currentPage: PageInfo | null;
      readonly currentPageError: string | null;
      readonly saveStatus: 'saved' | 'unsaved' | 'saving' | 'unavailable' | 'error';
      readonly saveError?: string;
    };

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function isPageSaved(
  currentPage: PageInfo | null,
  pages: readonly SavedPageSummary[],
): boolean {
  return (
    currentPage !== null &&
    pages.some((page) => page.canonicalUrl === currentPage.canonicalUrl)
  );
}

export function useCurrentPage() {
  const [state, setState] = useState<PopupState>({ status: 'loading' });

  const reload = useCallback(async () => {
    setState({ status: 'loading' });

    try {
      const pagesReply = await getPages();
      if (!pagesReply.ok) {
        setState({ status: 'error', message: pagesReply.error.message });
        return;
      }

      let currentPage: PageInfo | null = null;
      let currentPageError: string | null = null;

      try {
        const currentPageReply = await getCurrentPage();
        if (currentPageReply.ok) {
          currentPage = currentPageReply.value;
        } else {
          currentPageError = currentPageReply.error.message;
        }
      } catch (error: unknown) {
        currentPageError = getErrorMessage(
          error,
          'Could not detect the current webpage.',
        );
      }

      setState({
        status: 'ready',
        pages: pagesReply.value,
        currentPage,
        currentPageError,
        saveStatus:
          currentPage === null
            ? 'unavailable'
            : isPageSaved(currentPage, pagesReply.value)
              ? 'saved'
              : 'unsaved',
      });
    } catch (error: unknown) {
      setState({
        status: 'error',
        message: getErrorMessage(error, 'Could not load your saved pages.'),
      });
    }
  }, []);

  const saveCurrentPage = useCallback(async () => {
    if (
      state.status !== 'ready' ||
      state.currentPage === null ||
      state.saveStatus === 'saving'
    ) {
      return;
    }

    const currentState = state;
    setState({ ...currentState, saveStatus: 'saving', saveError: undefined });

    try {
      const currentPageReply = await getCurrentPage();
      if (!currentPageReply.ok) {
        setState({
          ...currentState,
          saveStatus: 'error',
          saveError: currentPageReply.error.message,
        });
        return;
      }

      const saveReply = await savePage(currentPageReply.value);
      if (!saveReply.ok) {
        setState({
          ...currentState,
          currentPage: currentPageReply.value,
          saveStatus: 'error',
          saveError: saveReply.error.message,
        });
        return;
      }

      const pagesReply = await getPages();
      if (!pagesReply.ok) {
        setState({
          ...currentState,
          currentPage: currentPageReply.value,
          saveStatus: 'saved',
          saveError: `Page saved, but the library could not refresh: ${pagesReply.error.message}`,
        });
        return;
      }

      setState({
        status: 'ready',
        pages: pagesReply.value,
        currentPage: currentPageReply.value,
        currentPageError: null,
        saveStatus: 'saved',
      });
    } catch (error: unknown) {
      setState({
        ...currentState,
        saveStatus: 'error',
        saveError: getErrorMessage(error, 'Could not save this page.'),
      });
    }
  }, [state]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { state, reload, saveCurrentPage };
}
