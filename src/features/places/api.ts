import { api, unwrap } from '@/core/api';
import type {
  Place,
  PlaceCreate,
  PlacePatch,
  Restaurant,
  RestaurantCreate,
  RestaurantPatch,
} from '@/core/api';
import type { ResourceApi } from '@/core/resource/hooks';

const path = (tripId: string) => ({ params: { path: { tripId } } });
const pathWithId = (tripId: string, id: string) => ({ params: { path: { tripId, id } } });
const abort = (signal?: AbortSignal) => (signal ? { signal } : {});

export const placesApi: ResourceApi<Place, PlaceCreate, PlacePatch> = {
  list: async (tripId, signal) =>
    (await unwrap(api.GET('/api/v1/trips/{tripId}/places', { ...path(tripId), ...abort(signal) })))
      .items,
  create: (tripId, body) =>
    unwrap(api.POST('/api/v1/trips/{tripId}/places', { ...path(tripId), body })),
  update: (tripId, id, body) =>
    unwrap(api.PATCH('/api/v1/trips/{tripId}/places/{id}', { ...pathWithId(tripId, id), body })),
  remove: async (tripId, id) => {
    await unwrap(api.DELETE('/api/v1/trips/{tripId}/places/{id}', pathWithId(tripId, id)));
  },
};

export const restaurantsApi: ResourceApi<Restaurant, RestaurantCreate, RestaurantPatch> = {
  list: async (tripId, signal) =>
    (
      await unwrap(
        api.GET('/api/v1/trips/{tripId}/restaurants', { ...path(tripId), ...abort(signal) }),
      )
    ).items,
  create: (tripId, body) =>
    unwrap(api.POST('/api/v1/trips/{tripId}/restaurants', { ...path(tripId), body })),
  update: (tripId, id, body) =>
    unwrap(
      api.PATCH('/api/v1/trips/{tripId}/restaurants/{id}', { ...pathWithId(tripId, id), body }),
    ),
  remove: async (tripId, id) => {
    await unwrap(api.DELETE('/api/v1/trips/{tripId}/restaurants/{id}', pathWithId(tripId, id)));
  },
};

export const searchApi = {
  places: async (query: string, signal?: AbortSignal) =>
    (
      await unwrap(
        api.GET('/api/v1/places/search', {
          params: { query: { q: query } },
          ...abort(signal),
        }),
      )
    ).items,
};
