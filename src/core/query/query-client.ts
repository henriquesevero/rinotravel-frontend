import { QueryClient } from '@tanstack/react-query';

import { isApiError, isNetworkError } from '../api';

const MAX_NETWORK_RETRIES = 2;

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isApiError(error)) return error.status >= 500 && failureCount < 1;
  return isNetworkError(error) && failureCount < MAX_NETWORK_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        staleTime: 30_000,
        // A query still tries and fails fast while offline (as before) rather than pausing: a
        // failed background refetch never clears data already in the cache, and that cache is
        // now also restored from disk (see `createPersister`), so a screen already seen keeps
        // reading from it regardless — with no change to when a fetch is triggered, which is
        // what actually matters for staying correct once the connection is back.
        networkMode: 'always',
      },
      mutations: { networkMode: 'always', retry: false },
    },
  });
}
