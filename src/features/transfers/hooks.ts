import { useMutation } from '@tanstack/react-query';

import { createResourceHooks } from '@/core/resource/hooks';

import { plannerApi, transfersApi } from './api';

export const transferHooks = createResourceHooks('transfers', transfersApi);

export function usePlanTransfer(tripId: string) {
  return useMutation({
    mutationFn: (body: Parameters<typeof plannerApi.plan>[1]) => plannerApi.plan(tripId, body),
  });
}
