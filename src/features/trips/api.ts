import { api, unwrap } from '@/core/api';
import type { CreateTripRequest, UpdateTripRequest } from '@/core/api';

export const tripsApi = {
  list: async (signal?: AbortSignal) =>
    (await unwrap(api.GET('/api/v1/trips', signal ? { signal } : {}))).items,

  get: (tripId: string, signal?: AbortSignal) =>
    unwrap(
      api.GET('/api/v1/trips/{tripId}', {
        params: { path: { tripId } },
        ...(signal ? { signal } : {}),
      }),
    ),

  create: (body: CreateTripRequest) => unwrap(api.POST('/api/v1/trips', { body })),

  update: (tripId: string, body: UpdateTripRequest) =>
    unwrap(api.PATCH('/api/v1/trips/{tripId}', { params: { path: { tripId } }, body })),

  remove: (tripId: string) =>
    unwrap(api.DELETE('/api/v1/trips/{tripId}', { params: { path: { tripId } } })),

  transferOwnership: (tripId: string, userId: string) =>
    unwrap(
      api.POST('/api/v1/trips/{tripId}/transfer-ownership', {
        params: { path: { tripId } },
        body: { userId },
      }),
    ),
};
