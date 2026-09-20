import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authApi } from './api';
import { useSession } from './session';

export const authKeys = { me: ['me'] as const };

export function useMe() {
  const { status } = useSession();
  return useQuery({
    queryKey: authKeys.me,
    queryFn: ({ signal }) => authApi.me(signal),
    enabled: status === 'signedIn',
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const session = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async ({ token, user }) => {
      queryClient.setQueryData(authKeys.me, user);
      await session.signIn(token);
    },
  });
}

export function useRegister() {
  const session = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: async ({ token, user }) => {
      queryClient.setQueryData(authKeys.me, user);
      await session.signIn(token);
    },
  });
}

/** Signs out locally even when the server cannot be reached, so the user is never stuck. */
export function useLogout() {
  const session = useSession();
  return useMutation({
    mutationFn: async () => {
      await authApi.logout().catch(() => undefined);
      await session.signOut();
    },
  });
}
