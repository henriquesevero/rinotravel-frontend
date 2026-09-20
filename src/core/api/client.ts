import createClient, { type Middleware } from 'openapi-fetch';

import { env } from '../config/env';
import { NetworkError, toApiError } from './errors';
import type { paths } from './schema';

interface AuthHooks {
  getToken: () => string | null;
  onUnauthorized: () => void;
}

let hooks: AuthHooks = { getToken: () => null, onUnauthorized: () => {} };

export function configureApi(next: AuthHooks): void {
  hooks = next;
}

const middleware: Middleware = {
  onRequest({ request }) {
    const token = hooks.getToken();
    if (token) request.headers.set('Authorization', `Bearer ${token}`);
    return request;
  },
  onResponse({ request, response }) {
    // A 401 on a request that carried a token means the session is gone. Failed
    // logins have no token, so wrong credentials never trigger a sign-out.
    if (response.status === 401 && request.headers.has('Authorization')) {
      hooks.onUnauthorized();
    }
  },
  onError({ error }) {
    if (error instanceof Error && error.name === 'AbortError') return undefined;
    return new NetworkError({ cause: error });
  },
};

export const api = createClient<paths>({ baseUrl: env.apiUrl });
api.use(middleware);

interface Result<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

export async function unwrap<T>(result: Promise<Result<T>>): Promise<T> {
  const { data, error, response } = await result;
  if (!response.ok) throw toApiError(response, error);
  return data as T;
}
