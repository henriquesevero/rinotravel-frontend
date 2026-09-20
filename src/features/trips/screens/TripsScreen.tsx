import { useRouter } from 'expo-router';
import { FlatList, View } from 'react-native';

import type { Trip } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { space, useBreakpoint } from '@/shared/theme';
import {
  Card,
  Button,
  EmptyState,
  ErrorState,
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
  const breakpoint = useBreakpoint();
  const columns = breakpoint === 'expanded' ? 2 : 1;

  const header = (
    <ScreenHeader
      title={t('trips.title')}
      right={
        // Phones have the raised action in the tab bar; larger screens get it in the header.
        breakpoint === 'compact' ? undefined : (
          <Button
            title={t('trips.new')}
            icon="add"
            size="sm"
            onPress={() => router.push('/trips/new')}
            testID="new-trip"
          />
        )
      }
    />
  );

  return (
    <Screen scroll={false}>
      <FlatList<Trip>
        key={columns}
        numColumns={columns}
        {...(columns > 1 ? { columnWrapperStyle: { justifyContent: 'space-between' } } : {})}
        data={trips.data ?? []}
        keyExtractor={(trip) => trip.id}
        renderItem={({ item }) => (
          <View style={{ width: columns > 1 ? '49%' : '100%' }}>
            <TripCard trip={item} />
          </View>
        )}
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
