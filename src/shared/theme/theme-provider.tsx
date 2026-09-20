import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, shadows, type ThemeColors } from './tokens';

export interface Theme {
  scheme: 'light' | 'dark';
  colors: ThemeColors;
  shadow: { card: string; sheet: string };
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = useMemo<Theme>(
    () => ({
      scheme,
      colors: scheme === 'dark' ? darkColors : lightColors,
      shadow: shadows[scheme],
    }),
    [scheme],
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
