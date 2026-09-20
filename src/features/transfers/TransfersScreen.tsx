import { useState } from 'react';
import { View } from 'react-native';

import type { Transfer, TransferMode } from '@/core/api';
import { formatDuration, formatZoned, zonedKey } from '@/core/datetime/zoned';
import { currentLocale, useTranslation } from '@/core/i18n';
import { TripPage } from '@/features/content/TripPage';
import { space } from '@/shared/theme';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  ListRow,
  Skeleton,
  type IconName,
} from '@/shared/ui';

import { TransferSheet } from './TransferSheet';
import { transferHooks } from './hooks';

const MODE_ICON: Record<TransferMode, IconName> = {
  WALKING: 'walk-outline',
  SUBWAY: 'subway-outline',
  TRAIN: 'train-outline',
  BUS: 'bus-outline',
  TAXI: 'car-outline',
  RIDESHARE: 'car-outline',
  CAR: 'car-sport-outline',
  OTHER: 'swap-horizontal-outline',
};

export function TransfersScreen({ tripId }: { tripId: string }) {
  const { t } = useTranslation();
  const transfers = transferHooks.useList(tripId);
  const [sheet, setSheet] = useState<{ transfer?: Transfer | undefined } | null>(null);

  return (
    <TripPage
      tripId={tripId}
      title={t('transfers.title')}
      onRefresh={() => void transfers.refetch()}
      right={({ canWrite }) =>
        canWrite ? (
          <Button
            testID="add-transfer"
            title={t('transfers.add')}
            icon="add"
            size="sm"
            onPress={() => setSheet({})}
          />
        ) : null
      }
    >
      {({ trip, canWrite }) => {
        const locale = currentLocale();
        return (
          <>
            {transfers.error ? (
              <ErrorState
                error={transfers.error}
                title={t('transfers.loadError')}
                onRetry={() => void transfers.refetch()}
              />
            ) : !transfers.data ? (
              <View style={{ gap: space.sm }}>
                <Skeleton height={72} borderRadius={16} />
                <Skeleton height={72} borderRadius={16} />
              </View>
            ) : transfers.data.length === 0 ? (
              <EmptyState
                icon="swap-horizontal-outline"
                title={t('transfers.emptyTitle')}
                message={t('transfers.emptyMessage')}
                {...(canWrite
                  ? { actionLabel: t('transfers.add'), onAction: () => setSheet({}) }
                  : {})}
              />
            ) : (
              <Card padded={false}>
                {[...transfers.data]
                  .sort((a, b) => zonedKey(a.departure).localeCompare(zonedKey(b.departure)))
                  .map((transfer, index) => {
                    const first = transfer.legs[0];
                    const parts = [
                      transfer.legs.length > 1
                        ? t('transfers.steps.other', { count: transfer.legs.length })
                        : first
                          ? t(`enums.mode.${first.mode}`)
                          : undefined,
                      transfer.departure && formatZoned(transfer.departure, locale),
                      transfer.durationMinutes
                        ? formatDuration(transfer.durationMinutes)
                        : undefined,
                    ].filter(Boolean);
                    return (
                      <ListRow
                        key={transfer.id}
                        testID={`transfer-${transfer.id}`}
                        divider={index > 0}
                        icon={first ? MODE_ICON[first.mode] : 'swap-horizontal-outline'}
                        title={`${transfer.origin?.name ?? transfer.origin?.address ?? '?'} → ${transfer.destination?.name ?? transfer.destination?.address ?? '?'}`}
                        subtitle={parts.join(' · ')}
                        right={
                          transfer.status === 'PLANNED' ? undefined : (
                            <Badge
                              label={t(`enums.status.${transfer.status}`)}
                              tone={transfer.status === 'SKIPPED' ? 'neutral' : 'success'}
                            />
                          )
                        }
                        {...(canWrite ? { onPress: () => setSheet({ transfer }) } : {})}
                      />
                    );
                  })}
              </Card>
            )}
            <TransferSheet
              tripId={tripId}
              visible={sheet !== null}
              onClose={() => setSheet(null)}
              currency={trip.currency}
              timezone={trip.timezone}
              defaultDate={trip.startDate}
              transfer={sheet?.transfer}
            />
          </>
        );
      }}
    </TripPage>
  );
}
