import * as SecureStore from 'expo-secure-store';

const KEY = 'rinotravel.theme';

export interface ThemeStorage {
  /** What is known without waiting; only the web can answer this early. */
  initial(): string | null;
  get(): Promise<string | null>;
  set(value: string): Promise<void>;
}

export const themeStorage: ThemeStorage = {
  initial: () => null,
  get: () => SecureStore.getItemAsync(KEY),
  set: (value) => SecureStore.setItemAsync(KEY, value),
};
