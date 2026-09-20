import { useState } from 'react';
import { Linking, StyleSheet, View, useWindowDimensions } from 'react-native';

import type { Transfer } from '@/core/api';
import { formatDuration, formatZoned, zonedTime } from '@/core/datetime/zoned';
import { currentLocale, useTranslation } from '@/core/i18n';
import { MODE_VISUAL } from '@/features/content/visuals';
import { isApplePlatform } from '@/shared/platform';
import { shareText } from '@/shared/share';
import { space, useTheme } from '@/shared/theme';
import { Badge, Banner, Button, IconBadge, Sheet, Text } from '@/shared/ui';
import { DIALOG_BREAKPOINT } from '@/shared/ui/Sheet';

import { appleMapsUrl, googleMapsUrl, routeOf, shareMessage } from './maps';
import { RouteMap } from './RouteMap';

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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="caption" tone="secondary">
        {label.toUpperCase()}
      </Text>
      <Text variant="headline" heading>
        {value}
      </Text>
    </View>
  );
}

/** Everything about one transfer: the map with the route, the steps, and ways to take it with you. */
export function TransferDetailSheet({
  visible,
  onClose,
  transfer,
  onEdit,
}: TransferDetailSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= DIALOG_BREAKPOINT;
  const [notice, setNotice] = useState<{ tone: 'info' | 'danger'; message: string } | null>(null);
  const locale = currentLocale();

  const route = transfer ? routeOf(transfer) : null;
  const originName = placeName(transfer?.origin);
  const destinationName = placeName(transfer?.destination);
  const title = transfer ? `${originName} → ${destinationName}` : '';

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
    if (result === 'failed') {
      setNotice({ tone: 'danger', message: t('transfers.detail.shareFailed') });
    }
  };

  const mapColumn = route ? (
    <View style={styles.column}>
      <RouteMap
        route={route}
        googleUrl={googleMapsUrl(route)}
        originLabel={originName}
        destinationLabel={destinationName}
        modes={transfer?.legs.map((leg) => leg.mode) ?? []}
      />
      <View style={[styles.actions, !wide && styles.actionsNarrow]}>
        <Button
          testID="open-google-maps"
          title={t('transfers.detail.openGoogle')}
          icon="navigate-outline"
          onPress={() => void open(googleMapsUrl(route))}
          fullWidth={!wide}
        />
        {isApplePlatform() ? (
          <Button
            testID="open-apple-maps"
            title={t('transfers.detail.openApple')}
            variant="secondary"
            icon="navigate-outline"
            onPress={() => void open(appleMapsUrl(route))}
            fullWidth={!wide}
          />
        ) : null}
        <Button
          testID="share-transfer"
          title={t('transfers.detail.share')}
          variant="secondary"
          icon="share-outline"
          onPress={() => void share()}
          fullWidth={!wide}
        />
      </View>
    </View>
  ) : (
    <Text tone="secondary">{t('transfers.detail.noRoute')}</Text>
  );

  const stepsColumn = transfer ? (
    <View style={styles.column}>
      <View style={styles.stats}>
        {transfer.departure ? (
          <Stat label={t('transfers.departTime')} value={formatZoned(transfer.departure, locale)} />
        ) : null}
        {transfer.durationMinutes ? (
          <Stat
            label={t('transfers.detail.duration')}
            value={formatDuration(transfer.durationMinutes)}
          />
        ) : null}
        {transfer.status === 'PLANNED' ? null : (
          <Badge
            label={t(`enums.status.${transfer.status}`)}
            tone={transfer.status === 'SKIPPED' ? 'neutral' : 'success'}
          />
        )}
      </View>

      {transfer.legs.length > 0 ? (
        <View style={{ gap: space.md }}>
          <Text variant="caption" tone="secondary" heading style={{ letterSpacing: 0.8 }}>
            {t('transfers.detail.steps').toUpperCase()}
          </Text>
          <View>
            {transfer.legs.map((leg, index) => {
              const visual = MODE_VISUAL[leg.mode];
              const last = index === transfer.legs.length - 1;
              const parts = [
                leg.departure ? zonedTime(leg.departure) : undefined,
                leg.durationMinutes ? formatDuration(leg.durationMinutes) : undefined,
                leg.direction,
              ].filter(Boolean);
              return (
                <View key={index} style={styles.step}>
                  <View style={styles.stepRail}>
                    <IconBadge icon={visual.icon} tint={visual.tint} size={38} round />
                    {last ? null : (
                      <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
                    )}
                  </View>
                  <View style={styles.stepBody}>
                    <Text style={{ fontWeight: '600' }}>
                      {t(`enums.mode.${leg.mode}`)}
                      {leg.line ? ` ${leg.line}` : ''}
                    </Text>
                    <Text variant="footnote" tone="secondary">
                      {`${placeName(leg.origin)} → ${placeName(leg.destination)}`}
                    </Text>
                    {parts.length > 0 ? (
                      <Text variant="footnote" tone="secondary">
                        {parts.join(' · ')}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {transfer.notes ? (
        <Text variant="footnote" tone="secondary">
          {transfer.notes}
        </Text>
      ) : null}
    </View>
  ) : null;

  return (
    <Sheet
      visible={visible && transfer !== undefined}
      onClose={close}
      title={title}
      subtitle={transfer?.departure ? formatZoned(transfer.departure, locale) : undefined}
      icon="navigate-outline"
      tint="green"
      size="lg"
      footer={
        onEdit ? (
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Button
              testID="transfer-edit"
              title={t('content.edit')}
              variant="secondary"
              onPress={onEdit}
            />
          </View>
        ) : undefined
      }
    >
      {transfer ? (
        <View style={{ gap: space.lg }} testID="transfer-detail">
          {notice ? <Banner tone={notice.tone} message={notice.message} /> : null}
          <View style={wide ? styles.twoColumns : styles.oneColumn}>
            <View style={wide ? styles.wideMap : undefined}>{mapColumn}</View>
            <View style={wide ? styles.wideSteps : undefined}>{stepsColumn}</View>
          </View>
        </View>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  twoColumns: { flexDirection: 'row', gap: space.xl, alignItems: 'flex-start' },
  oneColumn: { gap: space.xl },
  wideMap: { flex: 3, minWidth: 0 },
  wideSteps: { flex: 2, minWidth: 0 },
  column: { gap: space.lg },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  actionsNarrow: { flexDirection: 'column', alignItems: 'stretch' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.xl },
  stat: { gap: 2 },
  step: { flexDirection: 'row', gap: space.md },
  stepRail: { alignItems: 'center', width: 38 },
  stepLine: { flex: 1, width: 2, borderRadius: 1, marginVertical: 2, minHeight: 16 },
  stepBody: { flex: 1, gap: 2, paddingBottom: space.lg },
});
