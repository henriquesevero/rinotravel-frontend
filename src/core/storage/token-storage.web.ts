import type { TokenStorage } from './token-storage';

const KEY = 'rinotravel.session-token';

// The web has no secure enclave: the token lives in localStorage, so the app
// must ship a strict Content-Security-Policy to limit the impact of XSS.
function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const tokenStorage: TokenStorage = {
  get: async () => storage()?.getItem(KEY) ?? null,
  set: async (token) => storage()?.setItem(KEY, token),
  clear: async () => storage()?.removeItem(KEY),
};
