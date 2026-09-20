import { StyleSheet, View } from 'react-native';

import { radius, useTheme, type ThemeColors } from '../theme';
import { Text, type TextTone } from './Text';

const tones: { background: keyof ThemeColors; text: TextTone }[] = [
  { background: 'accentSoft', text: 'accent' },
  { background: 'successSoft', text: 'success' },
  { background: 'warningSoft', text: 'warning' },
  { background: 'aiSoft', text: 'ai' },
];

export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '?';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

function toneFor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return tones[hash % tones.length]!;
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const { colors } = useTheme();
  const tone = toneFor(name);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.circle,
        { width: size, height: size, backgroundColor: colors[tone.background] },
      ]}
    >
      <Text variant="subhead" tone={tone.text} style={{ fontWeight: '700' }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
