import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { hasCode } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { useDescribeError } from '@/core/i18n/describe-error';
import { useMe } from '@/features/auth';
import { TripOverview } from '@/features/dashboard/TripOverview';
import { space, useStyles, type Theme } from '@/shared/theme';
import {
  Banner,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  ListRow,
  Screen,
  ScreenHeader,
  Skeleton,
  useConfirm,
} from '@/shared/ui';

import { TripBanner } from '../components/TripBanner';
import { useDeleteTrip, useForgetTrip, useTrip } from '../hooks';
import { TransferOwnershipSheet } from '../members/components/TransferOwnershipSheet';
import { useRemoveMember } from '../members/hooks';

const createStyles = (_theme: Theme) =>
  StyleSheet.create({
    stack: { gap: space.lg },
  });

export function TripScreen({ tripId }: { tripId: string }) {
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  const router = useRouter();
  const describe = useDescribeError();
  const confirm = useConfirm();
  const trip = useTrip(tripId);
  const me = useMe();
  const deleteTrip = useDeleteTrip(tripId);
  const removeMember = useRemoveMember(tripId);
  const forgetTrip = useForgetTrip();
  const [transferOpen, setTransferOpen] = useState(false);

  if (trip.isPending) {
    return (
      <Screen>
        <ScreenHeader title="" backFallback="/" />
        <View style={styles.stack}>
          <Skeleton height={32} width="70%" />
          <Skeleton height={160} borderRadius={16} />
        </View>
      </Screen>
    );
  }

  if (trip.isError) {
    return (
      <Screen>
        <ScreenHeader title="" backFallback="/" />
        {hasCode(trip.error, 'trip_not_found') ? (
          <EmptyState
            icon="map-outline"
            title={t('errors.trip_not_found')}
            actionLabel={t('notFound.action')}
            onAction={() => router.dismissTo('/')}
          />
        ) : (
          <ErrorState
            error={trip.error}
            title={t('trips.detail.loadError')}
            onRetry={() => void trip.refetch()}
          />
        )}
      </Screen>
    );
  }

  const { data } = trip;
  const caps = data.capabilities;
  const error = deleteTrip.error ?? removeMember.error;

  const remove = async () => {
    const confirmed = await confirm({
      title: t('trips.delete.title'),
      message: t('trips.delete.message', { name: data.name }),
      confirmLabel: t('trips.delete.confirm'),
      destructive: true,
    });
    if (confirmed) deleteTrip.mutate(undefined, { onSuccess: () => router.dismissTo('/') });
  };

  const leave = async () => {
    if (!me.data) return;
    const confirmed = await confirm({
      title: t('trips.leave.title'),
      message: t('trips.leave.message', { name: data.name }),
      confirmLabel: t('trips.leave.confirm'),
      destructive: true,
    });
    if (!confirmed) return;
    removeMember.mutate(me.data.id, {
      onSuccess: () => {
        void forgetTrip(tripId);
        router.dismissTo('/');
      },
    });
  };

  return (
    <Screen refreshing={trip.isRefetching} onRefresh={() => void trip.refetch()}>
      <ScreenHeader title="" backFallback="/" />
      <View style={styles.stack}>
        {error ? <Banner tone="danger" message={describe(error)} /> : null}
        <TripBanner trip={data} size="large" />
        <TripOverview trip={data} />

        <Card padded={false}>
          <ListRow
            testID="open-members"
            icon="people-outline"
            title={t('trips.detail.members')}
            onPress={() => router.push({ pathname: '/trips/[id]/members', params: { id: tripId } })}
          />
          {caps.updateTrip ? (
            <ListRow
              divider
              testID="edit-trip"
              icon="create-outline"
              title={t('trips.detail.edit')}
              onPress={() => router.push({ pathname: '/trips/[id]/edit', params: { id: tripId } })}
            />
          ) : null}
          {caps.transferOwnership ? (
            <ListRow
              divider
              testID="transfer-ownership"
              icon="swap-horizontal-outline"
              title={t('trips.detail.transfer')}
              onPress={() => setTransferOpen(true)}
            />
          ) : null}
        </Card>

        {caps.leave || caps.deleteTrip ? (
          <Card padded={false}>
            {caps.leave ? (
              <ListRow
                testID="leave-trip"
                left={<Icon name="exit-outline" size={22} tone="danger" />}
                title={t('trips.detail.leave')}
                tone="danger"
                onPress={() => void leave()}
              />
            ) : null}
            {caps.deleteTrip ? (
              <ListRow
                divider={caps.leave}
                testID="delete-trip"
                left={<Icon name="trash-outline" size={22} tone="danger" />}
                title={t('trips.detail.delete')}
                tone="danger"
                onPress={() => void remove()}
              />
            ) : null}
          </Card>
        ) : null}
      </View>

      <TransferOwnershipSheet
        tripId={tripId}
        currentUserId={me.data?.id}
        visible={transferOpen}
        onClose={() => setTransferOpen(false)}
      />
    </Screen>
  );
}
