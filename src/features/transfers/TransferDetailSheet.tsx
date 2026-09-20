import { Linking, View } from 'react-native';
import { useState } from 'react';

import type { Transfer } from '@/core/api';
import { formatDuration, formatZoned, zonedTime } from '@/core/datetime/zoned';
import { currentLocale, useTranslation } from '@/core/i18n';
import { shareText } from '@/shared/share';
import { isApplePlatform } from '@/shared/platform';
import { space } from '@/shared/theme';
import { Badge, Banner, Button, Card, ListRow, Sheet, Text, type IconName } from '@/shared/ui';

import { appleMapsUrl, googleMapsUrl, routeOf, shareMessage } from './maps';
import { RouteMap } from './RouteMap';

const MODE_ICON: Record<string, IconName> = {
  WALKING: 'walk-outline',
  SUBWAY: 'subway-outline',
  TRAIN: 'train-outline',
  BUS: 'bus-outline',
  TAXI: 'car-outline',
  RIDESHARE: 'car-outline',
  CAR: 'car-sport-outline',
};

interface TransferDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  transfer: Transfer | undefined;
  /** Shown only to people who may edit the trip. */
  onEdit?: (() => void) | undefined;
}

const placeName = (
  place: { name?: string | undefined; address?: string | undefined } | undefined,
) => place?.name || place?.address || '?';

/** Everything about one transfer: the map with the route, the steps, and ways to take it with you. */
export function TransferDetailSheet({
  visible,
  onClose,
  transfer,
  onEdit,
}: TransferDetailSheetProps) {
  const { t } = useTranslation();
  const [notice, setNotice] = useState<{ tone: 'info' | 'danger'; message: string } | null>(null);
  const locale = currentLocale();

  const route = transfer ? routeOf(transfer) : null;
  const title = transfer
    ? `${placeName(transfer.origin)} → ${placeName(transfer.destination)}`
    : '';

  const close = () => {
    setNotice(null);
    onClose();
  };

  const open = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      setNotice({ tone: 'danger', message: t('transfers.detail.openFailed') });
    }
  };

  const share = async () => {
    if (!transfer || !route) return;
    const when = transfer.departure ? formatZoned(transfer.departure, locale) : undefined;
    const minutes = transfer.durationMinutes ? formatDuration(transfer.durationMinutes) : undefined;
    const detail = [when, minutes].filter(Boolean).join(' · ');
    const result = await shareText(shareMessage(title, detail, googleMapsUrl(route)));
    if (result === 'copied') setNotice({ tone: 'info', message: t('transfers.detail.copied') });
    if (result === 'failed')
      setNotice({ tone: 'danger', message: t('transfers.detail.shareFailed') });
  };

  return (
    <Sheet
      visible={visible && transfer !== undefined}
      onClose={close}
      title={title}
      footer={
        onEdit ? (
          <Button
            testID="transfer-edit"
            title={t('content.edit')}
            variant="secondary"
            onPress={onEdit}
            fullWidth
          />
        ) : undefined
      }
    >
      {transfer ? (
        <View style={{ gap: space.lg }} testID="transfer-detail">
          {notice ? <Banner tone={notice.tone} message={notice.message} /> : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {transfer.status === 'PLANNED' ? null : (
              <Badge
                label={t(`enums.status.${transfer.status}`)}
                tone={transfer.status === 'SKIPPED' ? 'neutral' : 'success'}
              />
            )}
            {transfer.departure ? (
              <Badge label={formatZoned(transfer.departure, locale)} tone="neutral" />
            ) : null}
            {transfer.durationMinutes ? (
              <Badge label={formatDuration(transfer.durationMinutes)} tone="neutral" />
            ) : null}
          </View>

          {route ? (
            <>
              <RouteMap route={route} googleUrl={googleMapsUrl(route)} />
              <View style={{ gap: space.sm }}>
                <Button
                  testID="open-google-maps"
                  title={t('transfers.detail.openGoogle')}
                  icon="navigate-outline"
                  onPress={() => void open(googleMapsUrl(route))}
                  fullWidth
                />
                {isApplePlatform() ? (
                  <Button
                    testID="open-apple-maps"
                    title={t('transfers.detail.openApple')}
                    variant="secondary"
                    icon="navigate-outline"
                    onPress={() => void open(appleMapsUrl(route))}
                    fullWidth
                  />
                ) : null}
                <Button
                  testID="share-transfer"
                  title={t('transfers.detail.share')}
                  variant="secondary"
                  icon="share-outline"
                  onPress={() => void share()}
                  fullWidth
                />
              </View>
            </>
          ) : (
            <Text tone="secondary">{t('transfers.detail.noRoute')}</Text>
          )}

          {transfer.legs.length > 0 ? (
            <View style={{ gap: space.sm }}>
              <Text variant="subhead" tone="secondary">
                {t('transfers.detail.steps')}
              </Text>
              <Card padded={false}>
                {transfer.legs.map((leg, index) => {
                  const parts = [
                    leg.departure ? zonedTime(leg.departure) : undefined,
                    leg.durationMinutes ? formatDuration(leg.durationMinutes) : undefined,
                    leg.direction,
                  ].filter(Boolean);
                  return (
                    <ListRow
                      key={index}
                      divider={index > 0}
                      icon={MODE_ICON[leg.mode] ?? 'swap-horizontal-outline'}
                      title={`${t(`enums.mode.${leg.mode}`)}${leg.line ? ` ${leg.line}` : ''}`}
                      subtitle={[
                        `${placeName(leg.origin)} → ${placeName(leg.destination)}`,
                        ...parts,
                      ].join(' · ')}
                    />
                  );
                })}
              </Card>
            </View>
          ) : null}

          {transfer.notes ? (
            <Text variant="footnote" tone="secondary">
              {transfer.notes}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Sheet>
  );
}
