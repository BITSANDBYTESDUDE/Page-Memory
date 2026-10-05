import type { CurrentPageState } from '../hooks/useCurrentPage';

interface PopupProps {
  readonly state: CurrentPageState;
  readonly onRetry: () => void;
  readonly onSave: () => void;
}

export function Popup({ state, onRetry, onSave }: PopupProps) {
  return (
    <main className="min-h-[360px] w-[360px] bg-slate-50 p-5">
      <header className="mb-5">
        <p className="text-sm font-semibold text-indigo-600">PageMemory</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
          Remember where you left off.
        </h1>
      </header>

      <section
        aria-live="polite"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-base font-semibold text-slate-900">Current page</h2>
        {state.status === 'loading' && (
          <p className="mt-2 text-sm text-slate-600">Connecting to the active tab…</p>
        )}
        {state.status === 'ready' && (
          <div className="mt-2">
            <p className="break-words text-sm text-slate-800">
              {state.page.title || state.page.url}
            </p>
            <p className="mt-1 break-all text-xs text-slate-500">{state.page.url}</p>
            <button
              aria-live="polite"
              className="mt-4 w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={state.saveStatus === 'saving' || state.saveStatus === 'saved'}
              onClick={onSave}
              type="button"
            >
              {state.saveStatus === 'saving'
                ? 'Saving…'
                : state.saveStatus === 'saved'
                  ? 'Saved'
                  : state.saveStatus === 'error'
                    ? 'Try saving again'
                    : 'Save page'}
            </button>
            {state.saveStatus === 'saved' && (
              <p className="mt-2 text-sm text-emerald-700">This page is saved.</p>
            )}
            {state.saveStatus === 'unsaved' && (
              <p className="mt-2 text-sm text-slate-600">This page is not saved yet.</p>
            )}
            {state.saveStatus === 'error' && (
              <p className="mt-2 text-sm text-rose-700" role="alert">
                {state.saveError}
              </p>
            )}
          </div>
        )}
        {state.status === 'error' && (
          <div className="mt-2">
            <p className="text-sm text-rose-700">{state.message}</p>
            <button
              className="mt-4 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              onClick={onRetry}
              type="button"
            >
              Try again
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
