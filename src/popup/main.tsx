import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles.css';
import { Popup } from './Popup';
import { useCurrentPage } from '../hooks/useCurrentPage';

function PopupRoot() {
  const { state, reload, saveCurrentPage, toggleFavorite } = useCurrentPage();
  return (
    <Popup
      state={state}
      onRetry={() => void reload()}
      onSave={() => void saveCurrentPage()}
      onFavorite={(pageId) => void toggleFavorite(pageId)}
    />
  );
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Popup root element was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <PopupRoot />
  </StrictMode>,
);
