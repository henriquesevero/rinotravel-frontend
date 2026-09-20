import { useQuery } from '@tanstack/react-query';

import { createResourceHooks } from '@/core/resource/hooks';

import { placesApi, restaurantsApi, searchApi } from './api';

export const placeHooks = createResourceHooks('places', placesApi);
export const restaurantHooks = createResourceHooks('restaurants', restaurantsApi);

/** Google-backed search. The server only mounts it when it has a key, so a 404 means "not available". */
export function usePlaceSearch(query: string) {
  const term = query.trim();
  return useQuery({
    enabled: term.length >= 3,
    queryKey: ['places-search', term],
    queryFn: ({ signal }) => searchApi.places(term, signal),
    staleTime: 5 * 60_000,
    retry: false,
  });
}
