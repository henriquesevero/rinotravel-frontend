import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import type { TransferMode } from '@/core/api';
import { MODE_VISUAL } from '@/features/content/visuals';
import { radius, space, useTheme } from '@/shared/theme';
import { IconBadge, Text } from '@/shared/ui';

export interface MapLinkCardProps {
  originLabel: string;
  destinationLabel: string;
  /** The kinds of transport along the way, drawn between the two ends. */
  modes: TransferMode[];
}

function Pin({ letter }: { letter: string }) {
  return (
    <View style={styles.pin}>
      <Text variant="headline" tone="onAccent" style={{ fontWeight: '800' }}>
        {letter}
      </Text>
    </View>
  );
}

/**
 * Stands in for the interactive map on phones and wherever no embed key is configured: the two ends
 * joined by a dotted path with the kinds of transport on it, and a button that opens the real thing.
 */
export function MapLinkCard({ originLabel, destinationLabel, modes }: MapLinkCardProps) {
  const { colors } = useTheme();
  const unique = [...new Set(modes)].slice(0, 3);

  const dots = (count: number) => (
    <View style={styles.dots}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={[styles.dot, { backgroundColor: colors.accent }]} />
      ))}
    </View>
  );

  return (
    <View style={styles.panel} testID="map-link-card">
      <LinearGradient
        colors={[colors.accentSoft, colors.surfaceMuted]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.route}>
        <View style={styles.end}>
          <Pin letter="A" />
        </View>
        {dots(unique.length > 0 ? 5 : 12)}
        {unique.map((mode) => (
          <View key={mode} style={styles.mode}>
            <IconBadge
              icon={MODE_VISUAL[mode].icon}
              tint={MODE_VISUAL[mode].tint}
              size={38}
              round
            />
          </View>
        ))}
        {unique.length > 0 ? dots(5) : null}
        <View style={styles.end}>
          <Pin letter="B" />
        </View>
      </View>
      <View style={styles.labels}>
        <Text variant="subhead" numberOfLines={2} style={[styles.label, { fontWeight: '600' }]}>
          {originLabel}
        </Text>
        <Text
          variant="subhead"
          numberOfLines={2}
          align="right"
          style={[styles.label, { fontWeight: '600' }]}
        >
          {destinationLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    minHeight: 200,
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: space.xl,
    gap: space.lg,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  route: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  end: { alignItems: 'center' },
  pin: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  dot: { width: 5, height: 5, borderRadius: 3, opacity: 0.55 },
  mode: { alignItems: 'center' },
  labels: { flexDirection: 'row', justifyContent: 'space-between', gap: space.lg },
  label: { flex: 1 },
});
