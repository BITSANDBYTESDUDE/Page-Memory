import { useCallback, useEffect, useState } from 'react';
import { getCurrentPage } from '../messaging/client';
import type { PageInfo } from '../types';

export type CurrentPageState =
  | { readonly status: 'loading' }
  | { readonly status: 'loaded'; readonly page: PageInfo }
  | { readonly status: 'error'; readonly message: string };

export function useCurrentPage() {
  const [state, setState] = useState<CurrentPageState>({ status: 'loading' });

  const reload = useCallback(async () => {
    setState({ status: 'loading' });

    try {
      const reply = await getCurrentPage();
      if (reply.ok) {
        setState({ status: 'loaded', page: reply.value });
      } else {
        setState({ status: 'error', message: reply.error.message });
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Could not communicate with PageMemory.';
      setState({ status: 'error', message });
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { state, reload };
}
