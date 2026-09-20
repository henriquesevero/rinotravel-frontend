import type { ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { space } from '@/shared/theme';
import { DIALOG_BREAKPOINT } from '@/shared/ui/Sheet';

/** True where a dialog is wide enough to put the map beside the form. */
export function useWideForm(): boolean {
  return useWindowDimensions().width >= DIALOG_BREAKPOINT;
}

interface SplitFormProps {
  wide: boolean;
  /** Shown to the right on computers, and kept in view while the form scrolls. */
  side: ReactNode;
  children: ReactNode;
}

export function SplitForm({ wide, side, children }: SplitFormProps) {
  if (!wide) return <View style={styles.stack}>{children}</View>;
  return (
    <View style={styles.split}>
      <View style={styles.left}>{children}</View>
      <View style={styles.right}>{side}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.xl },
  split: { flexDirection: 'row', gap: space.xl, alignItems: 'flex-start' },
  left: { flex: 1, minWidth: 0, gap: space.xl },
  right: { flex: 1, minWidth: 0, ...({ position: 'sticky', top: 0 } as object) },
});
