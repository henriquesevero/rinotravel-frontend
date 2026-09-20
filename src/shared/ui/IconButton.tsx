import { Pressable, StyleSheet } from 'react-native';

import { radius, useStyles, type Theme } from '../theme';
import { Icon, type IconName } from './Icon';
import type { TextTone } from './Text';

interface IconButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  tone?: TextTone;
  testID?: string;
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    base: {
      width: 44,
      height: 44,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { backgroundColor: colors.surfaceMuted },
  });

export function IconButton({ icon, label, onPress, tone = 'accent', testID }: IconButtonProps) {
  const styles = useStyles(createStyles);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.base, pressed && styles.pressed]}
    >
      <Icon name={icon} size={24} tone={tone} />
    </Pressable>
  );
}
