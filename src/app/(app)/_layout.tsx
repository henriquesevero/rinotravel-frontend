import { Stack } from 'expo-router';

import { AppShell } from '@/features/shell';

export default function AppLayout() {
  return (
    <AppShell>
      <Stack screenOptions={{ headerShown: false }} />
    </AppShell>
  );
}
