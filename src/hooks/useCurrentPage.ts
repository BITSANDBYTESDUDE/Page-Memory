import { useCallback, useEffect, useRef, useState } from 'react';
import { getCurrentPage, getPages, savePage, updateFavorite } from '../messaging/client';
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
      readonly favoriteError: string | null;
    };

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function isPageSaved(currentPage: PageInfo | null, pages: readonly SavedPageSummary[]): boolean {
  return (
    currentPage !== null && pages.some((page) => page.canonicalUrl === currentPage.canonicalUrl)
  );
}

export function useCurrentPage() {
  const [state, setState] = useState<PopupState>({ status: 'loading' });
  const favoriteOperationIds = useRef(new Map<string, number>());

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
        currentPageError = getErrorMessage(error, 'Could not detect the current webpage.');
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
        favoriteError: null,
      });
    } catch (error: unknown) {
      setState({
        status: 'error',
        message: getErrorMessage(error, 'Could not load your saved pages.'),
      });
    }
  }, []);

  const saveCurrentPage = useCallback(async () => {
    if (state.status !== 'ready' || state.currentPage === null || state.saveStatus === 'saving') {
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
        favoriteError: null,
      });
    } catch (error: unknown) {
      setState({
        ...currentState,
        saveStatus: 'error',
        saveError: getErrorMessage(error, 'Could not save this page.'),
      });
    }
  }, [state]);

  const toggleFavorite = useCallback(
    async (pageId: string) => {
      if (state.status !== 'ready') return;
      const page = state.pages.find((candidate) => candidate.id === pageId);
      if (!page) return;

      const nextFavorite = !page.isFavorite;
      const operationId = (favoriteOperationIds.current.get(pageId) ?? 0) + 1;
      favoriteOperationIds.current.set(pageId, operationId);
      setState({
        ...state,
        favoriteError: null,
        pages: state.pages.map((candidate) =>
          candidate.id === pageId ? { ...candidate, isFavorite: nextFavorite } : candidate,
        ),
      });

      try {
        const reply = await updateFavorite(pageId, nextFavorite);
        if (reply.ok) return;
        throw new Error(reply.error.message);
      } catch (error: unknown) {
        if (favoriteOperationIds.current.get(pageId) !== operationId) return;
        const message =
          error instanceof Error ? error.message : 'Could not update favorite status.';
        setState((latestState) => {
          if (latestState.status !== 'ready') return latestState;
          return {
            ...latestState,
            favoriteError: message,
            pages: latestState.pages.map((candidate) =>
              candidate.id === pageId ? { ...candidate, isFavorite: page.isFavorite } : candidate,
            ),
          };
        });
      }
    },
    [state],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return { state, reload, saveCurrentPage, toggleFavorite };
}
