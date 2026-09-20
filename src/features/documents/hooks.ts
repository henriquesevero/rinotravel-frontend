import { useMutation, useQuery } from '@tanstack/react-query';

import { hasCode, type DocumentPatch } from '@/core/api';
import { queryKeys } from '@/core/query/keys';
import { useRefreshTrip, type UpdateInput } from '@/core/resource/hooks';

import { documentsApi } from './api';
import { openDocument, uploadDocument, type UploadInput } from './upload';

export function useDocuments(tripId: string) {
  return useQuery({
    enabled: tripId !== '',
    queryKey: queryKeys.content.list(tripId, 'documents'),
    queryFn: ({ signal }) => documentsApi.list(tripId, signal),
  });
}

export function useUploadDocument(tripId: string) {
  const refresh = useRefreshTrip(tripId);
  return useMutation({
    mutationFn: (input: Omit<UploadInput, 'tripId'>) => uploadDocument({ ...input, tripId }),
    // A failed upload can still leave a PENDING record behind: show it so it can be removed.
    onSettled: refresh,
  });
}

export function useUpdateDocument(tripId: string) {
  const refresh = useRefreshTrip(tripId);
  return useMutation({
    mutationFn: ({ id, baseVersion, patch }: UpdateInput<DocumentPatch>) =>
      documentsApi.update(tripId, id, { ...patch, baseVersion }),
    onSuccess: refresh,
    onError: (error) => (hasCode(error, 'version_conflict') ? refresh() : undefined),
  });
}

export function useRemoveDocument(tripId: string) {
  const refresh = useRefreshTrip(tripId);
  return useMutation({
    mutationFn: (id: string) => documentsApi.remove(tripId, id),
    onSuccess: refresh,
  });
}

export function useOpenDocument(tripId: string) {
  return useMutation({ mutationFn: (id: string) => openDocument(tripId, id) });
}
