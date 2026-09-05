import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { HashRouter } from 'react-router-dom';

import { ErrorBoundary } from './ErrorBoundary';
import { createQueryClient } from './queryClient';

/**
 * Hash routing, not browser routing: GitHub Pages serves static files with no
 * SPA rewrite, so `#/l/123/2025/awards` is the only deep link that survives a
 * cold load without a `404.html` copy hack.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HashRouter>{children}</HashRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
