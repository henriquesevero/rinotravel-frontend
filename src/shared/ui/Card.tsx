import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, space, useStyles, type Theme } from '../theme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const createStyles = ({ colors, shadow }: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      boxShadow: shadow.card,
      overflow: 'hidden',
    },
    padded: { padding: space.lg },
    pressed: { backgroundColor: colors.surfaceMuted },
  });

export function Card({
  children,
  onPress,
  accessibilityLabel,
  padded = true,
  style,
  testID,
}: CardProps) {
  const styles = useStyles(createStyles);
  if (!onPress) {
    return (
      <View testID={testID} style={[styles.card, padded && styles.padded, style]}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        padded && styles.padded,
        pressed && styles.pressed,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}
