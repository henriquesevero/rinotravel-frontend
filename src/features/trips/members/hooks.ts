import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AssignableRole } from '@/core/api';
import { queryKeys } from '@/core/query/keys';

import { membersApi } from './api';

export function useMembers(tripId: string) {
  return useQuery({
    queryKey: queryKeys.members.list(tripId),
    queryFn: ({ signal }) => membersApi.list(tripId, signal),
  });
}

/** Membership changes bump the trip's version and change what the user may do, so the trip is refetched too. */
function useRefreshTrip(tripId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.members.list(tripId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(tripId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.list() }),
    ]);
}

export function useAddMember(tripId: string) {
  const refresh = useRefreshTrip(tripId);
  return useMutation({
    mutationFn: (input: { email: string; role: AssignableRole }) => membersApi.add(tripId, input),
    onSuccess: refresh,
  });
}

export function useChangeMemberRole(tripId: string) {
  const refresh = useRefreshTrip(tripId);
  return useMutation({
    mutationFn: (input: { userId: string; role: AssignableRole }) =>
      membersApi.changeRole(tripId, input.userId, input.role),
    onSuccess: refresh,
  });
}

export function useRemoveMember(tripId: string) {
  const refresh = useRefreshTrip(tripId);
  return useMutation({
    mutationFn: (userId: string) => membersApi.remove(tripId, userId),
    onSuccess: refresh,
  });
}
