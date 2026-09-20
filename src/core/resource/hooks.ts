import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { hasCode } from '@/core/api';
import { queryKeys } from '@/core/query/keys';

/** What the API calls of one entity look like; the hooks below are generic over it. */
export interface ResourceApi<T, C, P> {
  list: (tripId: string, signal?: AbortSignal) => Promise<T[]>;
  create: (tripId: string, body: C) => Promise<T>;
  update: (tripId: string, id: string, body: P) => Promise<T>;
  remove: (tripId: string, id: string) => Promise<void>;
}

export interface UpdateInput<P> {
  id: string;
  baseVersion: number;
  patch: Omit<P, 'baseVersion'>;
}

/**
 * A change to any record can move the timeline, the dashboard and other lists (a flight adds
 * timeline entries), so every write refreshes everything cached for the trip.
 */
export function useRefreshTrip(tripId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.content.trip(tripId) });
}

export function createResourceHooks<T, C, P extends { baseVersion: number }>(
  entity: string,
  resource: ResourceApi<T, C, P>,
) {
  function useList(tripId: string) {
    return useQuery({
      enabled: tripId !== '',
      queryKey: queryKeys.content.list(tripId, entity),
      queryFn: ({ signal }) => resource.list(tripId, signal),
    });
  }

  function useCreate(tripId: string) {
    const refresh = useRefreshTrip(tripId);
    return useMutation({
      mutationFn: (body: C) => resource.create(tripId, body),
      onSuccess: refresh,
    });
  }

  function useUpdate(tripId: string) {
    const refresh = useRefreshTrip(tripId);
    return useMutation({
      mutationFn: ({ id, baseVersion, patch }: UpdateInput<P>) =>
        resource.update(tripId, id, { ...patch, baseVersion } as P),
      onSuccess: refresh,
      // A stale version means someone else saved first: show them the current record.
      onError: (error) => (hasCode(error, 'version_conflict') ? refresh() : undefined),
    });
  }

  function useRemove(tripId: string) {
    const refresh = useRefreshTrip(tripId);
    return useMutation({
      mutationFn: (id: string) => resource.remove(tripId, id),
      onSuccess: refresh,
    });
  }

  return { useList, useCreate, useUpdate, useRemove };
}
