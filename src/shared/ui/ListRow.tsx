import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { space, useStyles, type Theme } from '../theme';
import { Icon, type IconName } from './Icon';
import { Text, type TextTone } from './Text';

interface ListRowProps {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  icon?: IconName;
  right?: ReactNode;
  onPress?: () => void;
  tone?: TextTone;
  /** Draws a separator above the row; use it on every row except the first. */
  divider?: boolean;
  testID?: string;
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    row: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      paddingHorizontal: space.lg,
      paddingVertical: space.md,
    },
    divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    pressed: { backgroundColor: colors.surfaceMuted },
    text: { flex: 1, gap: 2 },
  });

export function ListRow({
  title,
  subtitle,
  left,
  icon,
  right,
  onPress,
  tone = 'primary',
  divider = false,
  testID,
}: ListRowProps) {
  const styles = useStyles(createStyles);
  const content = (
    <>
      {left ??
        (icon ? <Icon name={icon} size={22} tone={tone === 'primary' ? 'accent' : tone} /> : null)}
      <View style={styles.text}>
        <Text tone={tone}>{title}</Text>
        {subtitle ? (
          <Text variant="footnote" tone="secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {onPress ? <Icon name="chevron-forward" size={18} tone="secondary" /> : null}
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, divider && styles.divider]}>{content}</View>;
  }
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}
