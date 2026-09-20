import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { configureApi } from '@/core/api';
import { tokenStorage } from '@/core/storage/token-storage';

export type SessionStatus = 'loading' | 'signedOut' | 'signedIn';

interface SessionContextValue {
  status: SessionStatus;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SessionStatus>('loading');
  const tokenRef = useRef<string | null>(null);

  const signOut = useCallback(async () => {
    tokenRef.current = null;
    queryClient.clear();
    await tokenStorage.clear().catch(() => undefined);
    setStatus('signedOut');
  }, [queryClient]);

  const signIn = useCallback(async (token: string) => {
    tokenRef.current = token;
    await tokenStorage.set(token).catch(() => undefined);
    setStatus('signedIn');
  }, []);

  useEffect(() => {
    configureApi({ getToken: () => tokenRef.current, onUnauthorized: () => void signOut() });

    let cancelled = false;
    tokenStorage
      .get()
      .catch(() => null)
      .then((token) => {
        if (cancelled) return;
        tokenRef.current = token;
        setStatus(token ? 'signedIn' : 'signedOut');
      });
    return () => {
      cancelled = true;
    };
  }, [signOut]);

  const value = useMemo(() => ({ status, signIn, signOut }), [status, signIn, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside <SessionProvider>');
  return session;
}
