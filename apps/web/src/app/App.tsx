import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './providers';
import { ErrorBoundary } from './error-boundary';
import { router } from './router';

/**
 * TerraTrust-AI — Root Application Component
 *
 * Wraps the entire app in:
 * 1. ErrorBoundary   — catches unhandled render errors at the root
 * 2. AppProviders    — QueryClient, Auth context, Scope context, Toast
 * 3. RouterProvider  — React Router v6 with createBrowserRouter
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </ErrorBoundary>
  );
};

export default App;
