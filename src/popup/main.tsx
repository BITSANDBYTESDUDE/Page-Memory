import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles.css';
import { PlaceholderCard } from '../components/PlaceholderCard';

function Popup() {
  return (
    <main className="min-h-[360px] w-[360px] bg-slate-50 p-5">
      <header className="mb-5">
        <p className="text-sm font-semibold text-indigo-600">PageMemory</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
          Remember where you left off.
        </h1>
      </header>
      <PlaceholderCard
        title="Your reading memory is coming soon"
        description="This foundation is ready for the reading-position experience in a future milestone."
      />
    </main>
  );
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Popup root element was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <Popup />
  </StrictMode>,
);
