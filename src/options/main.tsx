import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles.css';
import { PlaceholderCard } from '../components/PlaceholderCard';

function Options() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold text-indigo-600">PageMemory</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Settings</h1>
        <p className="mt-2 text-slate-600">Configure your reading memory experience.</p>
        <div className="mt-8">
          <PlaceholderCard
            title="No preferences yet"
            description="This page is part of the extension runtime. Settings and local page storage have not been implemented yet."
          />
        </div>
      </div>
    </main>
  );
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Options root element was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <Options />
  </StrictMode>,
);
