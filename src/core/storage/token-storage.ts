import * as SecureStore from 'expo-secure-store';

const KEY = 'rinotravel.session-token';

export interface TokenStorage {
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
  clear(): Promise<void>;
}

export const tokenStorage: TokenStorage = {
  get: () => SecureStore.getItemAsync(KEY),
  set: (token) => SecureStore.setItemAsync(KEY, token),
  clear: () => SecureStore.deleteItemAsync(KEY),
};
