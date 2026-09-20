import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AccountSheet } from '@/features/auth';
import { useBreakpoint, useStyles, type Theme } from '@/shared/theme';

import { BottomBar } from './BottomBar';
import { Sidebar } from './Sidebar';

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    row: { flexDirection: 'row' },
    content: { flex: 1, minWidth: 0 },
  });

/**
 * The application frame. Computers get a sidebar (an icon rail on narrow windows); phones get a
 * bottom tab bar. The screens themselves are the same everywhere.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const styles = useStyles(createStyles);
  const breakpoint = useBreakpoint();
  const [accountOpen, setAccountOpen] = useState(false);
  const open = () => setAccountOpen(true);

  return (
    <View style={[styles.root, breakpoint !== 'compact' && styles.row]}>
      {breakpoint === 'compact' ? null : (
        <Sidebar collapsed={breakpoint === 'medium'} onOpenAccount={open} />
      )}
      <View style={styles.content}>{children}</View>
      {breakpoint === 'compact' ? (
        <BottomBar onOpenAccount={open} accountOpen={accountOpen} />
      ) : null}
      <AccountSheet visible={accountOpen} onClose={() => setAccountOpen(false)} />
    </View>
  );
}
