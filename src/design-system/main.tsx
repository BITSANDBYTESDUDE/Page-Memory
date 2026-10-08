import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DesignSystemPreview } from './preview';
import '../styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Design system preview root element was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <DesignSystemPreview />
  </StrictMode>,
);
