import { useMutation, useQuery } from '@tanstack/react-query';

import {
  fetchImage,
  type LocationMapRequest,
  type MapRequest,
  type PlanTransferRequest,
} from '@/core/api';
import { zonedInstant } from '@/core/datetime/zoned';

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

export interface RouteEstimate {
  minutes: number;
  meters: number;
}

/**
 * How long the map says it takes to get from one place to the other. Asked with the departure time
 * when there is one, since public transport runs on a timetable; a departure already in the past is
 * left out, because the route service refuses to plan a trip that has already left.
 */
export function useRouteEstimate(tripId: string, request: PlanTransferRequest | null) {
  return useQuery({
    enabled: request !== null,
    queryKey: ['route-estimate', tripId, request],
    queryFn: async (): Promise<RouteEstimate> => {
      const { departureAt, ...rest } = request as PlanTransferRequest;
      const future = departureAt && zonedInstant(departureAt) > Date.now();
      const routes = await plannerApi.plan(tripId, future ? { ...rest, departureAt } : rest);
      const best = routes[0];
      if (!best) throw new Error('no route');
      return { minutes: best.durationMinutes, meters: best.distanceMeters };
    },
    staleTime: 10 * 60_000,
    gcTime: 10 * 60_000,
    retry: false,
  });
}
