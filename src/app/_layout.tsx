import { QueryClientProvider } from '@tanstack/react-query';
import { DefaultTheme, DarkTheme, Stack, ThemeProvider as NavigationTheme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/core/i18n';
import { createQueryClient } from '@/core/query/query-client';
import { SessionProvider, useSession } from '@/features/auth';
import { SplashOverlay } from '@/features/shell';
import { ThemeProvider, useTheme } from '@/shared/theme';
import { ConfirmProvider } from '@/shared/ui';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SessionProvider>
            <ConfirmProvider>
              <RootNavigator />
            </ConfirmProvider>
          </SessionProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { status } = useSession();
  const { scheme, colors } = useTheme();

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <NavigationTheme value={{ ...base, colors: { ...base.colors, background: colors.background } }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {status === 'loading' ? null : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={status === 'signedIn'}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
          <Stack.Protected guard={status === 'signedOut'}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
        </Stack>
      )}
      <SplashOverlay ready={status !== 'loading'} />
    </NavigationTheme>
  );
}
