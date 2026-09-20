import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { hasCode, type Trip } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { space, useContentMaxWidth } from '@/shared/theme';
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
  /**
   * Fills the window instead of scrolling as one page: the banner and title stay put and the content
   * below is given all the remaining height, for screens that scroll in several parts of their own.
   */
  fill?: boolean;
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
  fill = false,
  children,
}: TripPageProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const maxWidth = useContentMaxWidth();
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
  if (fill) {
    return (
      <Screen scroll={false}>
        <View style={[styles.fill, { maxWidth }]}>
          <View style={styles.banner}>
            <TripBanner trip={trip} />
          </View>
          <ScreenHeader
            title={title}
            {...(subtitle ? { subtitle } : {})}
            {...(right ? { right: right(access) } : {})}
          />
          {canWrite ? null : (
            <View style={styles.notice}>
              <Banner tone="info" message={t('content.readOnly')} />
            </View>
          )}
          <View style={styles.fillBody}>{children(access)}</View>
        </View>
      </Screen>
    );
  }
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
  fill: { flex: 1, width: '100%', alignSelf: 'center', paddingHorizontal: space.lg },
  fillBody: { flex: 1, minHeight: 0 },
  notice: { paddingBottom: space.md },
  stack: { gap: space.lg },
  banner: { paddingTop: space.lg, paddingBottom: space.md },
});
