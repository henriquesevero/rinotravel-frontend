import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { todayIn } from '@/core/datetime/civil-date';
import { useTranslation } from '@/core/i18n';
import { space, useTheme } from '@/shared/theme';
import { Button, Card, Icon, Text } from '@/shared/ui';

import { useTripSummary } from '@/features/trips/components/TripCard';
import type { Trip } from '@/core/api';
import { tripProgress } from './agenda';

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xs },
  footer: {
    marginTop: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
});

/** The headline of the dashboard: which trip, how far away, and a way in. */
export function FocusTripCard({ trip, label }: { trip: Trip; label: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const summary = useTripSummary(trip);
  const progress = tripProgress(trip, todayIn(trip.timezone));

  const headline =
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
    <Card
      testID="focus-trip"
      style={{ backgroundColor: colors.accent, borderColor: colors.accent }}
    >
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text variant="caption" tone="onAccent" style={{ opacity: 0.85 }}>
            {label.toUpperCase()}
          </Text>
          <Text variant="largeTitle" heading tone="onAccent" numberOfLines={2}>
            {trip.name}
          </Text>
        </View>
      </View>
      <View style={styles.row}>
        <Icon name="location-outline" size={16} tone="onAccent" />
        <Text tone="onAccent">{trip.destination}</Text>
      </View>
      <View style={styles.row}>
        <Icon name="calendar-outline" size={16} tone="onAccent" />
        <Text tone="onAccent">
          {summary.range} · {summary.duration}
        </Text>
      </View>
      <View style={styles.footer}>
        <Text variant="title" heading tone="onAccent" style={{ flex: 1 }}>
          {headline}
        </Text>
        <Button
          testID="open-focus-trip"
          title={t('dashboard.open')}
          variant="secondary"
          size="sm"
          onPress={() => router.push({ pathname: '/trips/[id]', params: { id: trip.id } })}
        />
      </View>
    </Card>
  );
}
