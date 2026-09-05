import { QueryClient } from '@tanstack/react-query';

import { NotFoundError } from '@/lib/sleeper/client';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Sleeper data is immutable history for the most part; refetching on every
        // window focus would burn requests for no new information.
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: (failureCount, error) => !(error instanceof NotFoundError) && failureCount < 2,
      },
    },
  });
}
