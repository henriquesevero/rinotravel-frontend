import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { todayIn } from '@/core/datetime/civil-date';
import { useTranslation } from '@/core/i18n';
import { useMe } from '@/features/auth';
import { TripCard } from '@/features/trips/components/TripCard';
import { useTrips } from '@/features/trips/hooks';
import { space, useBreakpoint } from '@/shared/theme';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Screen,
  ScreenHeader,
  SectionHeader,
  Skeleton,
  Text,
} from '@/shared/ui';

import { entriesOn, pickFocusTrip, upcomingAgenda } from './agenda';
import { AgendaList } from './AgendaList';
import { FocusTripCard } from './FocusTripCard';
import { useTripSnapshot } from './hooks';
import { TripOverview } from './TripOverview';

const styles = StyleSheet.create({
  stack: { gap: space.xl },
  columns: { flexDirection: 'row', gap: space.xl, alignItems: 'flex-start' },
  main: { flex: 3, gap: space.xl, minWidth: 0 },
  side: { flex: 2, gap: space.xl, minWidth: 0 },
});

export function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const me = useMe();
  const trips = useTrips();
  const breakpoint = useBreakpoint();
  const firstName = me.data?.name.split(' ')[0] ?? '';

  const header = (
    <ScreenHeader
      title={t('dashboard.greeting', { name: firstName })}
      subtitle={t('dashboard.subtitle')}
    />
  );

  if (trips.isPending) {
    return (
      <Screen>
        {header}
        <View style={styles.stack}>
          <Skeleton height={200} borderRadius={16} />
          <Skeleton height={120} borderRadius={16} />
        </View>
      </Screen>
    );
  }
  if (trips.isError) {
    return (
      <Screen>
        {header}
        <ErrorState
          error={trips.error}
          title={t('dashboard.loadError')}
          onRetry={() => void trips.refetch()}
        />
      </Screen>
    );
  }
  if (trips.data.length === 0) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="map-outline"
          title={t('trips.empty.title')}
          message={t('trips.empty.message')}
          actionLabel={t('trips.empty.cta')}
          onAction={() => router.push('/trips/new')}
        />
      </Screen>
    );
  }

  const focus = pickFocusTrip(trips.data, todayIn);
  const others = trips.data.filter((trip) => trip.id !== focus?.trip.id).slice(0, 3);
  const expanded = breakpoint === 'expanded';

  const focusLabel =
    focus?.phase === 'ongoing'
      ? t('dashboard.currentTrip')
      : focus?.phase === 'upcoming'
        ? t('dashboard.nextTrip')
        : t('dashboard.lastTrip');

  const main = focus ? (
    <View style={styles.main}>
      <FocusTripCard trip={focus.trip} label={focusLabel} />
      <FocusAgenda tripId={focus.trip.id} timezone={focus.trip.timezone} phase={focus.phase} />
    </View>
  ) : null;

  const side = (
    <View style={styles.side}>
      {focus ? <TripOverview trip={focus.trip} showAgenda={false} /> : null}
      <View style={{ gap: space.sm }}>
        <SectionHeader
          title={t('dashboard.yourTrips')}
          right={
            <Button
              testID="all-trips"
              title={t('dashboard.viewAll')}
              variant="ghost"
              size="sm"
              onPress={() => router.push('/trips')}
            />
          }
        />
        {others.length === 0 ? (
          <Card>
            <Text tone="secondary">
              {t('dashboard.tripsCount.one', { count: trips.data.length })}
            </Text>
          </Card>
        ) : (
          others.map((trip) => <TripCard key={trip.id} trip={trip} />)
        )}
      </View>
    </View>
  );

  return (
    <Screen refreshing={trips.isRefetching} onRefresh={() => void trips.refetch()}>
      {header}
      {expanded ? (
        <View style={styles.columns}>
          {main}
          {side}
        </View>
      ) : (
        <View style={styles.stack}>
          {main}
          {side}
        </View>
      )}
    </Screen>
  );
}

/** "Today" while a trip is under way, "Coming up" before it; both read the same timeline. */
function FocusAgenda({
  tripId,
  timezone,
  phase,
}: {
  tripId: string;
  timezone: string;
  phase: 'upcoming' | 'ongoing' | 'past';
}) {
  const { t } = useTranslation();
  const snapshot = useTripSnapshot(tripId);
  const today = todayIn(timezone);
  const days = snapshot.timeline.data?.days ?? [];

  if (phase === 'past') return null;
  const ongoing = phase === 'ongoing';
  const todayEntries = entriesOn(days, today);
  const agenda = ongoing
    ? todayEntries.length > 0
      ? [{ date: today, entries: todayEntries }]
      : []
    : upcomingAgenda(days, today, 6);

  return (
    <View style={{ gap: space.sm }}>
      <SectionHeader title={ongoing ? t('dashboard.today') : t('dashboard.upcoming')} />
      {snapshot.isPending ? (
        <Skeleton height={120} borderRadius={16} />
      ) : agenda.length === 0 ? (
        <Card>
          <Text tone="secondary">
            {ongoing ? t('dashboard.todayEmpty') : t('dashboard.upcomingEmpty')}
          </Text>
        </Card>
      ) : (
        <AgendaList days={agenda} today={today} showDayLabels={!ongoing} />
      )}
    </View>
  );
}
