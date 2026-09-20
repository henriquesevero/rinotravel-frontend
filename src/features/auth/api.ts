import { api, unwrap } from '@/core/api';
import type { components } from '@/core/api/schema';

type RegisterBody = components['schemas']['RegisterRequest'];
type LoginBody = components['schemas']['LoginRequest'];

export const authApi = {
  register: (body: RegisterBody) => unwrap(api.POST('/api/v1/auth/register', { body })),
  login: (body: LoginBody) => unwrap(api.POST('/api/v1/auth/login', { body })),
  logout: () => unwrap(api.POST('/api/v1/auth/logout')),
  me: (signal?: AbortSignal) => unwrap(api.GET('/api/v1/me', signal ? { signal } : {})),
};
