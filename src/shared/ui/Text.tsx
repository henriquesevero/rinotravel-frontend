import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { typography, useTheme, type TextVariant, type ThemeColors } from '../theme';

export type TextTone =
  'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'warning' | 'ai' | 'onAccent';

const toneColor: Record<TextTone, keyof ThemeColors> = {
  primary: 'text',
  secondary: 'textSecondary',
  accent: 'accentText',
  danger: 'dangerText',
  success: 'successText',
  warning: 'warningText',
  ai: 'aiText',
  onAccent: 'textOnAccent',
};

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  heading?: boolean;
  align?: TextStyle['textAlign'];
}

export function Text({
  variant = 'body',
  tone = 'primary',
  heading = false,
  align,
  style,
  ...rest
}: TextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      accessibilityRole={heading ? 'header' : undefined}
      style={[typography[variant], { color: colors[toneColor[tone]], textAlign: align }, style]}
      {...rest}
    />
  );
}
