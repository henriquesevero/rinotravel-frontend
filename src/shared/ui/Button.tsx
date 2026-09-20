import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { radius, space, useStyles, useTheme, type Theme } from '../theme';
import { Icon, type IconName } from './Icon';
import { Text, type TextTone } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  fullWidth?: boolean;
  testID?: string;
}

const labelTone: Record<Variant, TextTone> = {
  primary: 'onAccent',
  secondary: 'primary',
  ghost: 'accent',
  danger: 'onAccent',
};

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    base: {
      minHeight: 50,
      borderRadius: radius.md,
      paddingHorizontal: space.xl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.sm,
    },
    fullWidth: { alignSelf: 'stretch' },
    primary: { backgroundColor: colors.accent },
    primaryPressed: { backgroundColor: colors.accentPressed },
    secondary: { backgroundColor: colors.surfaceMuted },
    secondaryPressed: { backgroundColor: colors.border },
    ghost: { backgroundColor: 'transparent' },
    ghostPressed: { backgroundColor: colors.accentSoft },
    danger: { backgroundColor: colors.danger },
    dangerPressed: { opacity: 0.85 },
    disabled: { opacity: 0.5 },
  });

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  testID,
}: ButtonProps) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const inactive = disabled || loading;
  const spinnerColor = labelTone[variant] === 'onAccent' ? colors.textOnAccent : colors.accentText;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles[`${variant}Pressed`],
        fullWidth && styles.fullWidth,
        inactive && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : icon ? (
        <View>
          <Icon name={icon} tone={labelTone[variant]} />
        </View>
      ) : null}
      <Text variant="headline" tone={labelTone[variant]} maxFontSizeMultiplier={1.3}>
        {title}
      </Text>
    </Pressable>
  );
}
