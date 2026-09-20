import { useState } from 'react';
import { View } from 'react-native';

import type { Transfer } from '@/core/api';
import { formatDuration, formatZoned, zonedKey } from '@/core/datetime/zoned';
import { currentLocale, useTranslation } from '@/core/i18n';
import { TripPage } from '@/features/content/TripPage';
import { MODE_VISUAL } from '@/features/content/visuals';
import { space } from '@/shared/theme';
import { Badge, Button, Card, EmptyState, ErrorState, ListRow, Skeleton } from '@/shared/ui';

import { TransferDetailSheet } from './TransferDetailSheet';
import { TransferSheet } from './TransferSheet';
import { transferHooks } from './hooks';

export function TransfersScreen({ tripId }: { tripId: string }) {
  const { t } = useTranslation();
  const transfers = transferHooks.useList(tripId);
  const [sheet, setSheet] = useState<{ transfer?: Transfer | undefined } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = transfers.data?.find((transfer) => transfer.id === detailId);

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
                        icon={first ? MODE_VISUAL[first.mode].icon : 'swap-horizontal-outline'}
                        tint={first ? MODE_VISUAL[first.mode].tint : 'green'}
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
                        onPress={() => setDetailId(transfer.id)}
                      />
                    );
                  })}
              </Card>
            )}
            <TransferDetailSheet
              tripId={tripId}
              visible={detailId !== null}
              onClose={() => setDetailId(null)}
              transfer={detail}
              onEdit={
                canWrite
                  ? () => {
                      setDetailId(null);
                      setSheet({ transfer: detail });
                    }
                  : undefined
              }
            />
            <TransferSheet
              onSaved={(saved) => setDetailId(saved.id)}
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
