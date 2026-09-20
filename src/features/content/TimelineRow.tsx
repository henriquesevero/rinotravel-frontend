import { StyleSheet, View } from 'react-native';

import type { TimelineEntry } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import type { TFunction } from 'i18next';
import { zonedTime } from '@/core/datetime/zoned';
import { radius, space, useStyles, type Theme } from '@/shared/theme';
import { Badge, Icon, Text, type IconName } from '@/shared/ui';

const KIND_ICON: Record<TimelineEntry['kind'], IconName> = {
  itinerary_item: 'flag-outline',
  flight_departure: 'airplane-outline',
  flight_arrival: 'airplane-outline',
  hotel_check_in: 'bed-outline',
  hotel_check_out: 'bed-outline',
  transfer: 'swap-horizontal-outline',
  restaurant_reservation: 'restaurant-outline',
};

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
    time: { width: 48 },
    icon: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: { flex: 1, gap: 2 },
  });

export function TimelineRow({ entry }: { entry: TimelineEntry }) {
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  const time = entry.start ? zonedTime(entry.start) : '';
  const subtitle = subtitleOf(entry, t);
  const status = statusOf(entry.status);

  return (
    <View style={styles.row} testID={`timeline-${entry.kind}-${entry.id}`}>
      <View style={styles.time}>
        <Text variant="subhead" tone="secondary">
          {time}
        </Text>
      </View>
      <View style={styles.icon}>
        <Icon name={KIND_ICON[entry.kind]} size={18} tone="accent" />
      </View>
      <View style={styles.text}>
        <Text numberOfLines={2}>{entry.title}</Text>
        {subtitle ? (
          <Text variant="footnote" tone="secondary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {status ? <Badge label={t(status.key)} tone={status.tone} /> : null}
    </View>
  );
}

const PLAN_STATUSES = ['CONFIRMED', 'COMPLETED', 'SKIPPED'] as const;
const RESTAURANT_STATUSES = ['WISHLIST', 'RESERVED', 'VISITED'] as const;

/** Entries carry either a plan status or a restaurant status; PLANNED is the default and stays quiet. */
function statusOf(status: string | undefined) {
  if ((PLAN_STATUSES as readonly string[]).includes(status ?? '')) {
    const key = `enums.status.${status as (typeof PLAN_STATUSES)[number]}` as const;
    return { key, tone: status === 'SKIPPED' ? ('neutral' as const) : ('success' as const) };
  }
  if ((RESTAURANT_STATUSES as readonly string[]).includes(status ?? '')) {
    const key = `enums.restaurantStatus.${status as (typeof RESTAURANT_STATUSES)[number]}` as const;
    return { key, tone: status === 'WISHLIST' ? ('neutral' as const) : ('success' as const) };
  }
  return null;
}

const CATEGORIES = ['RESTAURANT', 'ATTRACTION', 'SHOPPING', 'FREE_TIME', 'OTHER'] as const;
type Category = (typeof CATEGORIES)[number];

/**
 * The API's subtitles are raw (`ATTRACTION`, `check-in`), so the client words them: an activity shows
 * its category, a stay only says which moment it is, and flights and transfers add the extra detail.
 */
function subtitleOf(entry: TimelineEntry, t: TFunction): string | undefined {
  if (entry.kind === 'itinerary_item') {
    return CATEGORIES.includes(entry.subtitle as Category)
      ? t(`enums.category.${entry.subtitle as Category}`)
      : undefined;
  }
  const kind = t(`timeline.kind.${entry.kind}`);
  if (entry.kind === 'hotel_check_in' || entry.kind === 'hotel_check_out') return kind;
  return [kind, entry.subtitle].filter(Boolean).join(' · ');
}
