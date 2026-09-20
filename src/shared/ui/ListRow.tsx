import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type PressableStateCallbackType } from 'react-native';

import { space, useStyles, type Theme, type Tint } from '../theme';
import { Icon, type IconName } from './Icon';
import { IconBadge } from './IconBadge';
import { Text, type TextTone } from './Text';

interface ListRowProps {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  icon?: IconName;
  /** Colour of the icon tile; rows of the same kind share one so lists scan at a glance. */
  tint?: Tint;
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
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      paddingHorizontal: space.lg,
      paddingVertical: space.md,
    },
    divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    pressed: { backgroundColor: colors.surfaceMuted },
    hovered: { backgroundColor: colors.surfaceMuted },
    text: { flex: 1, gap: 2 },
  });

export function ListRow({
  title,
  subtitle,
  left,
  icon,
  tint = 'blue',
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
        (icon ? (
          tone === 'primary' ? (
            <IconBadge icon={icon} tint={tint} />
          ) : (
            <Icon name={icon} size={22} tone={tone} />
          )
        ) : null)}
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
      style={(state) => [
        styles.row,
        divider && styles.divider,
        state.pressed && styles.pressed,
        (state as PressableStateCallbackType & { hovered?: boolean }).hovered && styles.hovered,
      ]}
    >
      {content}
    </Pressable>
  );
}
