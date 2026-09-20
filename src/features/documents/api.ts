import { api, unwrap } from '@/core/api';
import type { Document, DocumentPatch, InitDocumentRequest } from '@/core/api';

const path = (tripId: string) => ({ params: { path: { tripId } } });
const pathWithId = (tripId: string, id: string) => ({ params: { path: { tripId, id } } });

export const documentsApi = {
  list: async (tripId: string, signal?: AbortSignal): Promise<Document[]> =>
    (
      await unwrap(
        api.GET('/api/v1/trips/{tripId}/documents', {
          ...path(tripId),
          ...(signal ? { signal } : {}),
        }),
      )
    ).items,

  init: (tripId: string, body: InitDocumentRequest) =>
    unwrap(api.POST('/api/v1/trips/{tripId}/documents', { ...path(tripId), body })),

  complete: (tripId: string, id: string) =>
    unwrap(api.POST('/api/v1/trips/{tripId}/documents/{id}/complete', pathWithId(tripId, id))),

  update: (tripId: string, id: string, body: DocumentPatch) =>
    unwrap(api.PATCH('/api/v1/trips/{tripId}/documents/{id}', { ...pathWithId(tripId, id), body })),

  remove: async (tripId: string, id: string) => {
    await unwrap(api.DELETE('/api/v1/trips/{tripId}/documents/{id}', pathWithId(tripId, id)));
  },

  download: (tripId: string, id: string) =>
    unwrap(api.GET('/api/v1/trips/{tripId}/documents/{id}/download', pathWithId(tripId, id))),
};
