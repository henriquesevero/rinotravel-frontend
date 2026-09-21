import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { themeStorage } from '@/core/storage/theme-storage';

import { darkColors, lightColors, shadows, type ThemeColors } from './tokens';

/** What the person picked; `system` follows the device. */
export type ThemePreference = 'light' | 'dark' | 'system';

export interface Theme {
  scheme: 'light' | 'dark';
  colors: ThemeColors;
  shadow: { card: string; raised: string; sheet: string };
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<Theme | null>(null);

function parsePreference(value: string | null): ThemePreference | null {
  return value === 'light' || value === 'dark' || value === 'system' ? value : null;
}

// Light is the default on purpose: a travel planner is read in daylight, and following a computer that
// happens to be in dark mode made the whole app look heavy. Dark and "follow the device" are one tap away.
const DEFAULT_PREFERENCE: ThemePreference = 'light';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(
    () => parsePreference(themeStorage.initial()) ?? DEFAULT_PREFERENCE,
  );

  // Native storage cannot be read synchronously, so the saved choice arrives a moment after the first paint.
  useEffect(() => {
    let cancelled = false;
    void themeStorage
      .get()
      .then((saved) => {
        const parsed = parsePreference(saved);
        if (!cancelled && parsed) setPreferenceState(parsed);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void themeStorage.set(next).catch(() => undefined);
  }, []);

  const scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const theme = useMemo<Theme>(
    () => ({
      scheme,
      colors: scheme === 'dark' ? darkColors : lightColors,
      shadow: shadows[scheme],
      preference,
      setPreference,
    }),
    [scheme, preference, setPreference],
  );
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside <ThemeProvider>');
  return theme;
}

/** Builds styles from the current theme. Pass a module-level factory so the result stays memoized. */
export function useStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
