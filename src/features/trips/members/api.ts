import { api, unwrap } from '@/core/api';
import type { AssignableRole } from '@/core/api';

export const membersApi = {
  list: async (tripId: string, signal?: AbortSignal) =>
    (
      await unwrap(
        api.GET('/api/v1/trips/{tripId}/members', {
          params: { path: { tripId } },
          ...(signal ? { signal } : {}),
        }),
      )
    ).items,

  add: (tripId: string, body: { email: string; role: AssignableRole }) =>
    unwrap(api.POST('/api/v1/trips/{tripId}/members', { params: { path: { tripId } }, body })),

  changeRole: (tripId: string, userId: string, role: AssignableRole) =>
    unwrap(
      api.PATCH('/api/v1/trips/{tripId}/members/{userId}', {
        params: { path: { tripId, userId } },
        body: { role },
      }),
    ),

  remove: (tripId: string, userId: string) =>
    unwrap(
      api.DELETE('/api/v1/trips/{tripId}/members/{userId}', {
        params: { path: { tripId, userId } },
      }),
    ),
};
