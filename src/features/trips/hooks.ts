import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { hasCode, type Trip, type UpdateTripRequest } from '@/core/api';
import { queryKeys } from '@/core/query/keys';

import { tripsApi } from './api';

export function useTrips() {
  return useQuery({
    queryKey: queryKeys.trips.list(),
    queryFn: ({ signal }) => tripsApi.list(signal),
  });
}

export function useTrip(tripId: string) {
  const queryClient = useQueryClient();
  return useQuery<Trip>({
    queryKey: queryKeys.trips.detail(tripId),
    queryFn: ({ signal }) => tripsApi.get(tripId, signal),
    // The list already carries the full trip, so the detail can render before its own request returns.
    placeholderData: () =>
      queryClient.getQueryData<Trip[]>(queryKeys.trips.list())?.find((trip) => trip.id === tripId),
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripsApi.create,
    onSuccess: (trip) => {
      queryClient.setQueryData(queryKeys.trips.detail(trip.id), trip);
      return queryClient.invalidateQueries({ queryKey: queryKeys.trips.list() });
    },
  });
}

export function useUpdateTrip(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { baseVersion: number; patch: Omit<UpdateTripRequest, 'baseVersion'> }) =>
      tripsApi.update(tripId, { ...input.patch, baseVersion: input.baseVersion }),
    onSuccess: (trip) => {
      queryClient.setQueryData(queryKeys.trips.detail(tripId), trip);
      return queryClient.invalidateQueries({ queryKey: queryKeys.trips.list() });
    },
    onError: (error) => {
      if (hasCode(error, 'version_conflict')) {
        return queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(tripId) });
      }
      return undefined;
    },
  });
}

/** Drops every cached trace of a trip the user can no longer see (deleted, or they left it). */
export function useForgetTrip() {
  const queryClient = useQueryClient();
  return (tripId: string) => {
    queryClient.removeQueries({ queryKey: queryKeys.trips.detail(tripId) });
    queryClient.removeQueries({ queryKey: queryKeys.members.list(tripId) });
    return queryClient.invalidateQueries({ queryKey: queryKeys.trips.list() });
  };
}

export function useDeleteTrip(tripId: string) {
  const forget = useForgetTrip();
  return useMutation({
    mutationFn: () => tripsApi.remove(tripId),
    onSuccess: () => forget(tripId),
  });
}

export function useTransferOwnership(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => tripsApi.transferOwnership(tripId, userId),
    onSuccess: (trip) => {
      queryClient.setQueryData(queryKeys.trips.detail(tripId), trip);
      void queryClient.invalidateQueries({ queryKey: queryKeys.members.list(tripId) });
      return queryClient.invalidateQueries({ queryKey: queryKeys.trips.list() });
    },
  });
}
