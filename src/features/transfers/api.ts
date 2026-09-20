import { api, unwrap } from '@/core/api';
import type { PlanTransferRequest, Transfer, TransferCreate, TransferPatch } from '@/core/api';
import type { ResourceApi } from '@/core/resource/hooks';

const path = (tripId: string) => ({ params: { path: { tripId } } });
const pathWithId = (tripId: string, id: string) => ({ params: { path: { tripId, id } } });
const abort = (signal?: AbortSignal) => (signal ? { signal } : {});

export const transfersApi: ResourceApi<Transfer, TransferCreate, TransferPatch> = {
  list: async (tripId, signal) =>
    (
      await unwrap(
        api.GET('/api/v1/trips/{tripId}/transfers', { ...path(tripId), ...abort(signal) }),
      )
    ).items,
  create: (tripId, body) =>
    unwrap(api.POST('/api/v1/trips/{tripId}/transfers', { ...path(tripId), body })),
  update: (tripId, id, body) =>
    unwrap(api.PATCH('/api/v1/trips/{tripId}/transfers/{id}', { ...pathWithId(tripId, id), body })),
  remove: async (tripId, id) => {
    await unwrap(api.DELETE('/api/v1/trips/{tripId}/transfers/{id}', pathWithId(tripId, id)));
  },
};

export const plannerApi = {
  plan: async (tripId: string, body: PlanTransferRequest) =>
    (await unwrap(api.POST('/api/v1/trips/{tripId}/transfers/plan', { ...path(tripId), body })))
      .routes,
};
