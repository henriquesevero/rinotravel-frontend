import { StyleSheet, View } from 'react-native';

import { radius, useStyles, useTheme, type Theme } from '@/shared/theme';

import type { BudgetLine, BudgetState } from './summary';

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      height: 10,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceMuted,
      overflow: 'hidden',
    },
  });

/** Spent in the solid colour, what is still planned on top of it in the same colour, paler. */
export function BudgetBar({ line, testID }: { line: BudgetLine; testID?: string }) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const color: Record<BudgetState, string> = {
    none: colors.accent,
    ok: colors.accent,
    close: colors.warning,
    over: colors.danger,
  };
  const fill = color[line.state];
  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(line.spentShare * 100) }}
      style={styles.track}
    >
      <View style={{ width: `${line.spentShare * 100}%`, backgroundColor: fill }} />
      <View
        style={{ width: `${line.plannedShare * 100}%`, backgroundColor: fill, opacity: 0.35 }}
      />
    </View>
  );
}
