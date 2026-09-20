import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, View } from 'react-native';

import type { Trip } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { AccountSheet } from '@/features/auth';
import { space } from '@/shared/theme';
import {
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Screen,
  ScreenHeader,
  Skeleton,
  useContentStyle,
} from '@/shared/ui';

import { TripCard } from '../components/TripCard';
import { useTrips } from '../hooks';

export function TripsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const trips = useTrips();
  const contentStyle = useContentStyle();
  const [accountOpen, setAccountOpen] = useState(false);

  const header = (
    <ScreenHeader
      title={t('trips.title')}
      right={
        <>
          <IconButton
            icon="add-circle"
            label={t('trips.new')}
            onPress={() => router.push('/trips/new')}
            testID="new-trip"
          />
          <IconButton
            icon="person-circle-outline"
            label={t('auth.account.open')}
            tone="secondary"
            onPress={() => setAccountOpen(true)}
            testID="open-account"
          />
        </>
      }
    />
  );

  return (
    <Screen scroll={false}>
      <FlatList<Trip>
        data={trips.data ?? []}
        keyExtractor={(trip) => trip.id}
        renderItem={({ item }) => <TripCard trip={item} />}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={header}
        ListEmptyComponent={
          trips.isPending ? (
            <TripsSkeleton />
          ) : trips.isError ? (
            <ErrorState
              error={trips.error}
              title={t('trips.loadError')}
              onRetry={() => void trips.refetch()}
            />
          ) : (
            <EmptyState
              icon="map-outline"
              title={t('trips.empty.title')}
              message={t('trips.empty.message')}
              actionLabel={t('trips.empty.cta')}
              onAction={() => router.push('/trips/new')}
            />
          )
        }
        contentContainerStyle={contentStyle}
        refreshing={trips.isRefetching}
        onRefresh={() => void trips.refetch()}
        keyboardShouldPersistTaps="handled"
      />
      <AccountSheet visible={accountOpen} onClose={() => setAccountOpen(false)} />
    </Screen>
  );
}

function Separator() {
  return <View style={{ height: space.md }} />;
}

function TripsSkeleton() {
  return (
    <View style={{ gap: space.md }}>
      {[0, 1].map((key) => (
        <Card key={key}>
          <View style={{ gap: space.sm }}>
            <Skeleton width={90} height={22} borderRadius={11} />
            <Skeleton width="60%" height={26} />
            <Skeleton width="40%" height={14} />
            <Skeleton width="55%" height={14} />
          </View>
        </Card>
      ))}
    </View>
  );
}
