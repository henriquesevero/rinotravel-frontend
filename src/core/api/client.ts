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

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the image'));
    reader.readAsDataURL(blob);
  });
}

/**
 * POSTs JSON and returns the image the server drew, as a data URI an <Image> can show on every
 * platform. Images cannot carry the bearer token themselves, so they are fetched here.
 */
export async function fetchImage(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<string> {
  const token = hooks.getToken();
  let response: Response;
  try {
    response = await fetch(env.apiUrl + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      ...(signal ? { signal } : {}),
    });
  } catch (cause) {
    if (cause instanceof Error && cause.name === 'AbortError') throw cause;
    throw new NetworkError({ cause });
  }
  if (!response.ok) throw toApiError(response, await response.json().catch(() => null));
  return blobToDataUri(await response.blob());
}
