import { useQuery } from '@tanstack/react-query';

import { api, unwrap } from '@/core/api';
import { currentLocale } from '@/core/i18n';

import { stopsSignature, toRequestStops, type Stop } from './stops';

export type DayMode = 'TRANSIT' | 'WALKING' | 'DRIVING';

/**
 * The trips between a day's stops, worked out by the server. Kept in memory for a while so flipping
 * between days does not pay again for a day already seen; the server stores nothing.
 */
export function useDayMap(
  tripId: string,
  stops: Stop[],
  mode: DayMode,
  includeImage: boolean,
  scope: 'day' | 'trip' = 'day',
) {
  return useQuery({
    enabled: stops.length >= 2,
    queryKey: ['day-map', tripId, stopsSignature(stops), mode, includeImage, scope],
    queryFn: ({ signal }) =>
      unwrap(
        api.POST('/api/v1/trips/{tripId}/maps/day', {
          params: { path: { tripId } },
          body: {
            stops: toRequestStops(stops, scope),
            mode,
            language: currentLocale(),
            includeImage,
          },
          signal,
        }),
      ),
    staleTime: 30 * 60_000,
    gcTime: 30 * 60_000,
    retry: false,
  });
}
