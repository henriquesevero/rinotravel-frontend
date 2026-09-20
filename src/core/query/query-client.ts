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
        // Fail fast while offline instead of pausing forever; screens show an
        // error state with a retry action.
        networkMode: 'always',
      },
      mutations: { networkMode: 'always', retry: false },
    },
  });
}
