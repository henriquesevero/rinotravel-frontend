import { useRouter, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { Trip } from '@/core/api';
import { todayIn } from '@/core/datetime/civil-date';
import { useTranslation } from '@/core/i18n';
import { space } from '@/shared/theme';
import { Card, SectionHeader, Skeleton, StatTile, Text } from '@/shared/ui';

import { BudgetGlance } from '@/features/expenses/BudgetGlance';

import { upcomingAgenda } from './agenda';
import { AgendaList } from './AgendaList';
import { useTripSnapshot } from './hooks';

const styles = StyleSheet.create({
  stack: { gap: space.lg },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
});

/** Numbers and what is coming next for one trip; the trip screen and the dashboard both use it. */
export function TripOverview({
  trip,
  showAgenda = true,
  showBudget = true,
}: {
  trip: Trip;
  showAgenda?: boolean;
  showBudget?: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const snapshot = useTripSnapshot(trip.id);
  const today = todayIn(trip.timezone);
  const days = snapshot.timeline.data?.days ?? [];
  const agenda = upcomingAgenda(days, today, 5);
  const planned = days.filter((day) => day.entries.length > 0).length;

  const go =
    (path: string): (() => void) =>
    () =>
      router.push({ pathname: path, params: { id: trip.id } } as Href);

  return (
    <View style={styles.stack}>
      <View style={styles.tiles}>
        <StatTile
          testID="stat-days"
          icon="calendar-outline"
          value={String(planned)}
          label={t('dashboard.stats.days')}
          onPress={go('/trips/[id]/itinerary')}
        />
        <StatTile
          testID="stat-places"
          icon="location-outline"
          value={String(snapshot.counts.places)}
          label={t('dashboard.stats.places')}
          onPress={go('/trips/[id]/places')}
        />
        <StatTile
          testID="stat-bookings"
          icon="ticket-outline"
          value={String(snapshot.counts.bookings)}
          label={t('dashboard.stats.bookings')}
          onPress={go('/trips/[id]/bookings')}
        />
        <StatTile
          testID="stat-documents"
          icon="folder-open-outline"
          value={String(snapshot.counts.documents)}
          label={t('dashboard.stats.documents')}
          onPress={go('/trips/[id]/documents')}
        />
      </View>

      {showBudget ? <BudgetGlance trip={trip} /> : null}

      {showAgenda ? (
        <View style={{ gap: space.sm }}>
          <SectionHeader title={t('tripHome.nextUp')} />
          {snapshot.isPending ? (
            <Skeleton height={120} borderRadius={16} />
          ) : agenda.length === 0 ? (
            <Card>
              <Text tone="secondary">{t('tripHome.nextUpEmpty')}</Text>
            </Card>
          ) : (
            <AgendaList days={agenda} today={today} />
          )}
        </View>
      ) : null}
    </View>
  );
}
