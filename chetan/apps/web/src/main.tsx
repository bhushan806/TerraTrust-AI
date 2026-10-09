/**
 * TerraTrust-AI — Application Entry Point
 *
 * Bootstraps the React application with:
 * - MSW (Mock Service Worker) when VITE_ENABLE_MOCKS is enabled
 * - React 18 concurrent rendering
 * - Global styles
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './index.css';

async function prepareApp(): Promise<void> {
  const enableMocks =
    import.meta.env.VITE_ENABLE_MOCKS !== 'false' &&
    import.meta.env.MODE !== 'production';

  if (enableMocks) {
    try {
      const { worker } = await import('./mocks/browser');
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
      });
      console.info(
        '[TerraTrust-AI] MSW mock service worker started. All API calls are intercepted by mock handlers.'
      );
    } catch (e) {
      console.warn('[TerraTrust-AI] MSW failed to start — falling back to real API.', e);
    }
  }
}

prepareApp().then(() => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error(
      'TerraTrust-AI: Root element #root not found in index.html. Application cannot mount.'
    );
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
