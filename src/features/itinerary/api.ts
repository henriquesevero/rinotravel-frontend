import { api, unwrap } from '@/core/api';
import type {
  ItineraryDay,
  ItineraryDayCreate,
  ItineraryDayPatch,
  ItineraryItem,
  ItineraryItemCreate,
  ItineraryItemPatch,
  ScheduleFromPlaceRequest,
} from '@/core/api';
import type { ResourceApi } from '@/core/resource/hooks';

const path = (tripId: string) => ({ params: { path: { tripId } } });
const pathWithId = (tripId: string, id: string) => ({ params: { path: { tripId, id } } });

export const daysApi: ResourceApi<ItineraryDay, ItineraryDayCreate, ItineraryDayPatch> = {
  list: async (tripId, signal) =>
    (
      await unwrap(
        api.GET('/api/v1/trips/{tripId}/itinerary-days', {
          ...path(tripId),
          ...(signal ? { signal } : {}),
        }),
      )
    ).items,
  create: (tripId, body) =>
    unwrap(api.POST('/api/v1/trips/{tripId}/itinerary-days', { ...path(tripId), body })),
  update: (tripId, id, body) =>
    unwrap(
      api.PATCH('/api/v1/trips/{tripId}/itinerary-days/{id}', { ...pathWithId(tripId, id), body }),
    ),
  remove: async (tripId, id) => {
    await unwrap(api.DELETE('/api/v1/trips/{tripId}/itinerary-days/{id}', pathWithId(tripId, id)));
  },
};

export const itemsApi: ResourceApi<ItineraryItem, ItineraryItemCreate, ItineraryItemPatch> = {
  list: async (tripId, signal) =>
    (
      await unwrap(
        api.GET('/api/v1/trips/{tripId}/itinerary-items', {
          ...path(tripId),
          ...(signal ? { signal } : {}),
        }),
      )
    ).items,
  create: (tripId, body) =>
    unwrap(api.POST('/api/v1/trips/{tripId}/itinerary-items', { ...path(tripId), body })),
  update: (tripId, id, body) =>
    unwrap(
      api.PATCH('/api/v1/trips/{tripId}/itinerary-items/{id}', { ...pathWithId(tripId, id), body }),
    ),
  remove: async (tripId, id) => {
    await unwrap(api.DELETE('/api/v1/trips/{tripId}/itinerary-items/{id}', pathWithId(tripId, id)));
  },
};

export const timelineApi = {
  get: (tripId: string, signal?: AbortSignal) =>
    unwrap(
      api.GET('/api/v1/trips/{tripId}/itinerary', {
        ...path(tripId),
        ...(signal ? { signal } : {}),
      }),
    ),
};

export const scheduleApi = {
  fromPlace: (tripId: string, body: ScheduleFromPlaceRequest) =>
    unwrap(
      api.POST('/api/v1/trips/{tripId}/itinerary-items/from-place', { ...path(tripId), body }),
    ),
};
