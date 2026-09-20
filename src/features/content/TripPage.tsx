import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { hasCode, type Trip } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { space } from '@/shared/theme';
import { Banner, EmptyState, ErrorState, Screen, ScreenHeader, Skeleton } from '@/shared/ui';

import { TripBanner } from '@/features/trips/components/TripBanner';

import { useTripAccess } from './access';

interface TripPageProps {
  tripId: string;
  title: string;
  subtitle?: string;
  right?: (access: { trip: Trip; canWrite: boolean }) => ReactNode;
  /** Pull to refresh; also refetches the trip itself. */
  onRefresh?: () => void;
  refreshing?: boolean;
  children: (access: { trip: Trip; canWrite: boolean }) => ReactNode;
}

/** The frame every trip section shares: header, loading and error states, read-only notice. */
export function TripPage({
  tripId,
  title,
  subtitle,
  right,
  onRefresh,
  refreshing,
  children,
}: TripPageProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { query, trip, canWrite } = useTripAccess(tripId);

  const refresh = () => {
    void query.refetch();
    onRefresh?.();
  };

  if (query.isPending || !trip) {
    if (query.isError) {
      return (
        <Screen>
          <ScreenHeader title={title} />
          {hasCode(query.error, 'trip_not_found') ? (
            <EmptyState
              icon="map-outline"
              title={t('errors.trip_not_found')}
              actionLabel={t('notFound.action')}
              onAction={() => router.dismissTo('/')}
            />
          ) : (
            <ErrorState
              error={query.error}
              title={t('trips.detail.loadError')}
              onRetry={() => void query.refetch()}
            />
          )}
        </Screen>
      );
    }
    return (
      <Screen>
        <ScreenHeader title={title} />
        <View style={styles.stack}>
          <Skeleton height={56} borderRadius={12} />
          <Skeleton height={120} borderRadius={16} />
        </View>
      </Screen>
    );
  }

  const access = { trip, canWrite };
  return (
    <Screen refreshing={(refreshing ?? false) || query.isRefetching} onRefresh={refresh}>
      <View style={styles.banner}>
        <TripBanner trip={trip} />
      </View>
      <ScreenHeader
        title={title}
        {...(subtitle ? { subtitle } : {})}
        {...(right ? { right: right(access) } : {})}
      />
      <View style={styles.stack}>
        {canWrite ? null : <Banner tone="info" message={t('content.readOnly')} />}
        {children(access)}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.lg },
  banner: { paddingTop: space.lg, paddingBottom: space.md },
});
