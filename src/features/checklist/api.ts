import { api, unwrap } from '@/core/api';
import type { ChecklistItem, ChecklistItemCreate, ChecklistItemPatch } from '@/core/api';
import type { ResourceApi } from '@/core/resource/hooks';

const path = (tripId: string) => ({ params: { path: { tripId } } });
const pathWithId = (tripId: string, id: string) => ({ params: { path: { tripId, id } } });
const abort = (signal?: AbortSignal) => (signal ? { signal } : {});

export const checklistApi: ResourceApi<ChecklistItem, ChecklistItemCreate, ChecklistItemPatch> = {
  list: async (tripId, signal) =>
    (
      await unwrap(
        api.GET('/api/v1/trips/{tripId}/checklist-items', { ...path(tripId), ...abort(signal) }),
      )
    ).items,
  create: (tripId, body) =>
    unwrap(api.POST('/api/v1/trips/{tripId}/checklist-items', { ...path(tripId), body })),
  update: (tripId, id, body) =>
    unwrap(
      api.PATCH('/api/v1/trips/{tripId}/checklist-items/{id}', { ...pathWithId(tripId, id), body }),
    ),
  remove: async (tripId, id) => {
    await unwrap(api.DELETE('/api/v1/trips/{tripId}/checklist-items/{id}', pathWithId(tripId, id)));
  },
};
