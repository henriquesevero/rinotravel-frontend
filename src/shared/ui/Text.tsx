import {
  StyleSheet,
  Text as RNText,
  type TextProps as RNTextProps,
  type TextStyle,
} from 'react-native';

import { fontFamilyFor, typography, useTheme, type TextVariant, type ThemeColors } from '../theme';

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
  /** Digits of equal width, so times and counts line up in a column. */
  numeric?: boolean;
}

export function Text({
  variant = 'body',
  tone = 'primary',
  heading = false,
  align,
  numeric = false,
  style,
  ...rest
}: TextProps) {
  const { colors } = useTheme();
  // The weight can come from the variant or from the caller's style; either way it picks the family.
  const merged = StyleSheet.flatten([typography[variant], style]);
  return (
    <RNText
      accessibilityRole={heading ? 'header' : undefined}
      style={[
        typography[variant],
        { color: colors[toneColor[tone]], textAlign: align },
        style,
        {
          fontFamily: fontFamilyFor(merged?.fontWeight),
          fontWeight: 'normal',
          ...(numeric ? { fontVariant: ['tabular-nums'] as TextStyle['fontVariant'] } : {}),
        },
      ]}
      {...rest}
    />
  );
}
