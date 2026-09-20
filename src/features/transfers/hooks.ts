import { useMutation, useQuery } from '@tanstack/react-query';

import { fetchImage, type LocationMapRequest, type MapRequest } from '@/core/api';

import { createResourceHooks } from '@/core/resource/hooks';

import { plannerApi, transfersApi } from './api';

export const transferHooks = createResourceHooks('transfers', transfersApi);

export function usePlanTransfer(tripId: string) {
  return useMutation({
    mutationFn: (body: Parameters<typeof plannerApi.plan>[1]) => plannerApi.plan(tripId, body),
  });
}

/**
 * The picture of a route, drawn by the server on request. It is kept in memory for a while so
 * reopening a transfer or editing a field does not pay for the same picture twice.
 */
export function useRouteMap(tripId: string, request: MapRequest | null) {
  return useQuery({
    enabled: request !== null,
    queryKey: ['route-map', tripId, request],
    queryFn: ({ signal }) => fetchImage(`/api/v1/trips/${tripId}/transfers/map`, request, signal),
    staleTime: 10 * 60_000,
    gcTime: 10 * 60_000,
    retry: false,
  });
}

/** The picture of one place, drawn by the server on request (see `useRouteMap`). */
export function useLocationMap(tripId: string, request: LocationMapRequest | null) {
  return useQuery({
    enabled: request !== null,
    queryKey: ['location-map', tripId, request],
    queryFn: ({ signal }) => fetchImage(`/api/v1/trips/${tripId}/maps/location`, request, signal),
    staleTime: 10 * 60_000,
    gcTime: 10 * 60_000,
    retry: false,
  });
}
