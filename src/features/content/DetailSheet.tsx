import { useState, type ReactNode } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import type { Location } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { applePlaceUrl, placeUrl, shareMessage } from '@/features/transfers/maps';
import { isApplePlatform } from '@/shared/platform';
import { shareText } from '@/shared/share';
import { space, type Tint } from '@/shared/theme';
import { Badge, Banner, Button, Sheet, Text, type BadgeTone, type IconName } from '@/shared/ui';

import { LocationMap } from './LocationMap';
import { useWideForm } from './SplitForm';

export interface DetailRow {
  label: string;
  /** Empty values are left out, so callers can pass every field without checking. */
  value: string | undefined;
}

interface DetailSheetProps {
  tripId: string;
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string | undefined;
  icon: IconName;
  tint: Tint;
  badges?: { label: string; tone?: BadgeTone }[];
  rows: DetailRow[];
  notes?: string | undefined;
  /** When set, the sheet shows this place on a map with buttons to open and share it. */
  location?: Location | null | undefined;
  /** Anything else worth a button, such as opening a document. */
  actions?: ReactNode;
  /** Only people who may edit the trip get this; it leaves the view for the form. */
  onEdit?: (() => void) | undefined;
  testID?: string;
}

/**
 * Looking at a record comes before changing it: every list opens this, and editing is one tap away
 * for the people allowed to do it.
 */
export function DetailSheet({
  tripId,
  visible,
  onClose,
  title,
  subtitle,
  icon,
  tint,
  badges = [],
  rows,
  notes,
  location,
  actions,
  onEdit,
  testID = 'detail-sheet',
}: DetailSheetProps) {
  const { t } = useTranslation();
  const wide = useWideForm();
  const [notice, setNotice] = useState<{ tone: 'info' | 'danger'; message: string } | null>(null);

  const google = location ? placeUrl(location) : null;
  const apple = location ? applePlaceUrl(location) : null;
  const shown = rows.filter((row) => row.value !== undefined && row.value !== '');

  const close = () => {
    setNotice(null);
    onClose();
  };

  const open = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      setNotice({ tone: 'danger', message: t('content.openFailed') });
    }
  };

  const share = async () => {
    if (!google) return;
    const where = location?.address || location?.name;
    const result = await shareText(shareMessage(title, where, google));
    if (result === 'copied') setNotice({ tone: 'info', message: t('content.copied') });
    if (result === 'failed') setNotice({ tone: 'danger', message: t('content.shareFailed') });
  };

  const map =
    location && google ? (
      <View style={styles.column}>
        <LocationMap tripId={tripId} location={location} />
        <View style={[styles.actions, !wide && styles.actionsNarrow]}>
          <Button
            testID="open-google-maps"
            title={t('content.openMaps')}
            icon="navigate-outline"
            onPress={() => void open(google)}
            fullWidth={!wide}
          />
          {apple && isApplePlatform() ? (
            <Button
              testID="open-apple-maps"
              title={t('content.openApple')}
              variant="secondary"
              icon="navigate-outline"
              onPress={() => void open(apple)}
              fullWidth={!wide}
            />
          ) : null}
          <Button
            testID="share-place"
            title={t('content.share')}
            variant="secondary"
            icon="share-outline"
            onPress={() => void share()}
            fullWidth={!wide}
          />
        </View>
      </View>
    ) : null;

  const info = (
    <View style={styles.column}>
      {badges.length > 0 ? (
        <View style={styles.badges}>
          {badges.map((badge) => (
            <Badge key={badge.label} label={badge.label} tone={badge.tone ?? 'neutral'} />
          ))}
        </View>
      ) : null}
      {shown.length > 0 ? (
        <View style={styles.rows}>
          {shown.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text variant="caption" tone="secondary" style={{ letterSpacing: 0.6 }}>
                {row.label.toUpperCase()}
              </Text>
              <Text>{row.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {notes ? (
        <View style={styles.row}>
          <Text variant="caption" tone="secondary" style={{ letterSpacing: 0.6 }}>
            {t('content.notes').toUpperCase()}
          </Text>
          <Text tone="secondary">{notes}</Text>
        </View>
      ) : null}
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );

  return (
    <Sheet
      visible={visible}
      onClose={close}
      title={title}
      {...(subtitle ? { subtitle } : {})}
      icon={icon}
      tint={tint}
      size={map ? 'lg' : 'md'}
      footer={
        onEdit ? (
          <View style={styles.footer}>
            <Button
              testID={`${testID}-edit`}
              title={t('content.edit')}
              variant="secondary"
              icon="create-outline"
              onPress={onEdit}
            />
          </View>
        ) : undefined
      }
    >
      <View style={{ gap: space.lg }} testID={testID}>
        {notice ? <Banner tone={notice.tone} message={notice.message} /> : null}
        {map ? (
          <View style={wide ? styles.twoColumns : styles.oneColumn}>
            <View style={wide ? styles.wideMap : undefined}>{map}</View>
            <View style={wide ? styles.wideInfo : undefined}>{info}</View>
          </View>
        ) : (
          info
        )}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  twoColumns: { flexDirection: 'row', gap: space.xl, alignItems: 'flex-start' },
  oneColumn: { gap: space.xl },
  wideMap: { flex: 3, minWidth: 0 },
  wideInfo: { flex: 2, minWidth: 0 },
  column: { gap: space.lg },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  rows: { gap: space.lg },
  row: { gap: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  actionsNarrow: { flexDirection: 'column', alignItems: 'stretch' },
  footer: { flexDirection: 'row', justifyContent: 'flex-end' },
});
