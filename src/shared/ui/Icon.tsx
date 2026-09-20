import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { useTheme, type ThemeColors } from '../theme';
import type { TextTone } from './Text';

export type IconName = ComponentProps<typeof Ionicons>['name'];

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

interface IconProps {
  name: IconName;
  size?: number;
  tone?: TextTone;
}

/** Decorative by default: pair it with a visible label or an accessibilityLabel on its parent. */
export function Icon({ name, size = 20, tone = 'primary' }: IconProps) {
  const { colors } = useTheme();
  return (
    <Ionicons
      name={name}
      size={size}
      color={colors[toneColor[tone]]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
