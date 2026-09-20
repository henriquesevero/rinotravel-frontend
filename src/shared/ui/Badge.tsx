import { StyleSheet, View } from 'react-native';

import { radius, space, useStyles, useTheme, type Theme, type ThemeColors } from '../theme';
import { Text, type TextTone } from './Text';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'ai';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

const palette: Record<BadgeTone, { background: keyof ThemeColors; text: TextTone }> = {
  neutral: { background: 'surfaceMuted', text: 'secondary' },
  accent: { background: 'accentSoft', text: 'accent' },
  success: { background: 'successSoft', text: 'success' },
  warning: { background: 'warningSoft', text: 'warning' },
  danger: { background: 'dangerSoft', text: 'danger' },
  ai: { background: 'aiSoft', text: 'ai' },
};

const createStyles = (_theme: Theme) =>
  StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: space.sm + 2,
      paddingVertical: space.xs,
      borderRadius: radius.pill,
    },
  });

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const { background, text } = palette[tone];
  return (
    <View style={[styles.badge, { backgroundColor: colors[background] }]}>
      <Text variant="caption" tone={text} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </View>
  );
}
