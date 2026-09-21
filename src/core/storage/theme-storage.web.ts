import type { ThemeStorage } from './theme-storage';

const KEY = 'rinotravel.theme';

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function read(): string | null {
  try {
    return storage()?.getItem(KEY) ?? null;
  } catch {
    return null;
  }
}

export const themeStorage: ThemeStorage = {
  initial: read,
  get: async () => read(),
  set: async (value) => {
    try {
      storage()?.setItem(KEY, value);
    } catch {
      // Private windows can refuse storage; the choice then lasts until the page closes.
    }
  },
};
