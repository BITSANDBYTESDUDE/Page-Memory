import { useCallback, useEffect, useState } from 'react';
import { getCurrentPage, getPage, savePage } from '../messaging/client';
import type { PageInfo } from '../types';

export type CurrentPageState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | {
      readonly status: 'ready';
      readonly page: PageInfo;
      readonly saveStatus: 'saved' | 'unsaved' | 'saving' | 'error';
      readonly saveError?: string;
    };

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useCurrentPage() {
  const [state, setState] = useState<CurrentPageState>({ status: 'loading' });

  const reload = useCallback(async () => {
    setState({ status: 'loading' });

    try {
      const pageReply = await getCurrentPage();
      if (!pageReply.ok) {
        setState({ status: 'error', message: pageReply.error.message });
        return;
      }

      const lookupReply = await getPage(pageReply.value.canonicalUrl);
      if (!lookupReply.ok) {
        setState({ status: 'error', message: lookupReply.error.message });
        return;
      }

      setState({
        status: 'ready',
        page: pageReply.value,
        saveStatus: lookupReply.value.isSaved ? 'saved' : 'unsaved',
      });
    } catch (error: unknown) {
      setState({
        status: 'error',
        message: getErrorMessage(error, 'Could not communicate with PageMemory.'),
      });
    }
  }, []);

  const saveCurrentPage = useCallback(async () => {
    if (state.status !== 'ready' || state.saveStatus === 'saving') return;
    setState({ ...state, saveStatus: 'saving', saveError: undefined });

    try {
      const pageReply = await getCurrentPage();
      if (!pageReply.ok) {
        setState({ ...state, saveStatus: 'error', saveError: pageReply.error.message });
        return;
      }

      const saveReply = await savePage(pageReply.value);
      if (!saveReply.ok) {
        setState({ ...state, saveStatus: 'error', saveError: saveReply.error.message });
        return;
      }

      setState({ ...state, page: pageReply.value, saveStatus: 'saved' });
    } catch (error: unknown) {
      setState({
        ...state,
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
