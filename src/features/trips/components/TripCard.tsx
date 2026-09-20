import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { Trip } from '@/core/api';
import { daysInclusive, formatCivilRange, todayIn, tripPhase } from '@/core/datetime/civil-date';
import { currentLocale, useTranslation } from '@/core/i18n';
import { RoleBadge } from '../members/components/RoleBadge';
import { space } from '@/shared/theme';
import { Badge, Card, Icon, Text, type BadgeTone } from '@/shared/ui';

const phaseTone: Record<'upcoming' | 'ongoing' | 'past', BadgeTone> = {
  upcoming: 'accent',
  ongoing: 'success',
  past: 'neutral',
};

export function useTripSummary(trip: Trip) {
  const { t } = useTranslation();
  const phase = tripPhase(trip.startDate, trip.endDate, todayIn(trip.timezone));
  const days = daysInclusive(trip.startDate, trip.endDate);
  return {
    phase,
    phaseLabel: t(`trips.phase.${phase}`),
    phaseTone: phaseTone[phase],
    range: formatCivilRange(trip.startDate, trip.endDate, currentLocale()),
    duration: t(days === 1 ? 'trips.duration.one' : 'trips.duration.other', { count: days }),
  };
}

export function TripCard({ trip }: { trip: Trip }) {
  const router = useRouter();
  const summary = useTripSummary(trip);

  return (
    <Card
      testID={`trip-${trip.id}`}
      accessibilityLabel={`${trip.name}, ${trip.destination}, ${summary.range}`}
      onPress={() => router.push({ pathname: '/trips/[id]', params: { id: trip.id } })}
    >
      <View style={styles.top}>
        <Badge label={summary.phaseLabel} tone={summary.phaseTone} />
        {trip.myRole !== 'OWNER' ? <RoleBadge role={trip.myRole} /> : null}
      </View>
      <Text variant="title" heading style={styles.title}>
        {trip.name}
      </Text>
      <View style={styles.row}>
        <Icon name="location-outline" size={16} tone="secondary" />
        <Text variant="subhead" tone="secondary">
          {trip.destination}
        </Text>
      </View>
      <View style={styles.row}>
        <Icon name="calendar-outline" size={16} tone="secondary" />
        <Text variant="subhead" tone="secondary">
          {summary.range} · {summary.duration}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  title: { marginBottom: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 2, marginTop: space.xs },
});
