import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import type { Trip } from '@/core/api';
import { todayIn } from '@/core/datetime/civil-date';
import { useTranslation } from '@/core/i18n';
import { tripProgress } from '@/features/dashboard/agenda';
import { radius, space } from '@/shared/theme';
import { Icon, Text } from '@/shared/ui';

import { useTripSummary } from './TripCard';

interface TripBannerProps {
  trip: Trip;
  /** `large` is the trip's own page; `compact` heads each of its sections. */
  size?: 'large' | 'compact';
}

function Pill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Text variant="caption" tone="onAccent">
        {label}
      </Text>
    </View>
  );
}

/** The trip's identity strip, in the brand blue, so every section says which trip you are in. */
export function TripBanner({ trip, size = 'compact' }: TripBannerProps) {
  const { t } = useTranslation();
  const summary = useTripSummary(trip);
  const progress = tripProgress(trip, todayIn(trip.timezone));
  const large = size === 'large';

  const countdown =
    progress.kind === 'before'
      ? progress.days === 0
        ? t('dashboard.startsToday')
        : t(progress.days === 1 ? 'dashboard.countdownOne' : 'dashboard.countdownOther', {
            count: progress.days,
          })
      : progress.kind === 'during'
        ? t('dashboard.dayOf', { day: progress.day, total: progress.total })
        : t('dashboard.ended');

  return (
    <View style={[styles.frame, large && styles.frameLarge]} testID={`trip-banner-${size}`}>
      <LinearGradient
        colors={['#2563EB', '#1D4ED8', '#1E3A8A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.circle, styles.circleA]} pointerEvents="none" />
      <View style={[styles.circle, styles.circleB]} pointerEvents="none" />

      <View style={styles.content}>
        <View style={styles.main}>
          <View style={styles.pills}>
            <Pill label={summary.phaseLabel} />
            {large ? <Pill label={t(`roles.${trip.myRole}`)} /> : null}
          </View>
          {large ? (
            <Text variant="largeTitle" heading tone="onAccent" numberOfLines={2}>
              {trip.name}
            </Text>
          ) : (
            <Text variant="title" tone="onAccent" numberOfLines={1} style={{ fontWeight: '700' }}>
              {trip.name}
            </Text>
          )}
          <View style={styles.meta}>
            <Icon name="location-outline" size={16} tone="onAccent" />
            <Text tone="onAccent" style={{ fontWeight: '600' }}>
              {trip.destination}
            </Text>
            <Text tone="onAccent" style={styles.dim}>
              ·
            </Text>
            <Text tone="onAccent" style={styles.dim}>
              {summary.range} · {summary.duration}
            </Text>
          </View>
          {large ? (
            <View style={styles.chips}>
              <Pill label={trip.currency} />
              <Pill label={trip.timezone.replaceAll('_', ' ')} />
            </View>
          ) : null}
        </View>
        <View style={styles.side}>
          <Text variant={large ? 'title' : 'headline'} heading tone="onAccent">
            {countdown}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: '#1D4ED8' },
  frameLarge: { borderRadius: radius.xl + 4 },
  content: {
    padding: space.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: space.lg,
  },
  main: { flex: 1, minWidth: 220, gap: space.sm },
  side: { alignItems: 'flex-end' },
  pills: { flexDirection: 'row', gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xs },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm },
  dim: { opacity: 0.85 },
  circle: {
    position: 'absolute',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  circleA: { width: 260, height: 260, right: -70, top: -110 },
  circleB: { width: 180, height: 180, right: 120, bottom: -110 },
});
