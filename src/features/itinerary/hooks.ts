import { useMutation, useQuery } from '@tanstack/react-query';

import type { ItineraryDay } from '@/core/api';
import { newId } from '@/core/ids';

import { queryKeys } from '@/core/query/keys';
import { createResourceHooks, useRefreshTrip } from '@/core/resource/hooks';

import { daysApi, itemsApi, scheduleApi, timelineApi } from './api';

export const dayHooks = createResourceHooks('days', daysApi);
export const itemHooks = createResourceHooks('items', itemsApi);

export function useTimeline(tripId: string) {
  return useQuery({
    enabled: tripId !== '',
    queryKey: queryKeys.content.list(tripId, 'timeline'),
    queryFn: ({ signal }) => timelineApi.get(tripId, signal),
  });
}

export function useScheduleFromPlace(tripId: string) {
  const refresh = useRefreshTrip(tripId);
  return useMutation({
    mutationFn: (body: Parameters<typeof scheduleApi.fromPlace>[1]) =>
      scheduleApi.fromPlace(tripId, body),
    onSuccess: refresh,
  });
}

/** Days are created lazily: a date only becomes a record once something is scheduled on it. */
export function useEnsureDay(tripId: string, days: ItineraryDay[]) {
  const create = dayHooks.useCreate(tripId);
  const ensure = async (date: string): Promise<string> => {
    const existing = days.find((day) => day.date === date);
    if (existing) return existing.id;
    const id = newId();
    await create.mutateAsync({ id, date });
    return id;
  };
  return { ensure, isPending: create.isPending };
}
