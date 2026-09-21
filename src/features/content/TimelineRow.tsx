import { StyleSheet, View } from 'react-native';

import type { TicketKind, TimelineEntry } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import type { TFunction } from 'i18next';
import { zonedTime } from '@/core/datetime/zoned';
import { space, useStyles, type Theme } from '@/shared/theme';
import { Badge, IconBadge, Text } from '@/shared/ui';

import { entryVisual } from './visuals';

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingVertical: space.lg },
    time: { width: 56, gap: 2 },
    text: { flex: 1, gap: 4 },
    dim: { color: colors.textSecondary },
  });

export function TimelineRow({ entry }: { entry: TimelineEntry }) {
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  const time = entry.start ? zonedTime(entry.start) : '';
  const end = entry.end ? zonedTime(entry.end) : '';
  const subtitle = subtitleOf(entry, t);
  const status = statusOf(entry.status);
  const visual = entryVisual(entry);

  return (
    <View style={styles.row} testID={`timeline-${entry.kind}-${entry.id}`}>
      <View style={styles.time}>
        <Text variant="subhead" numeric style={{ fontWeight: '700' }}>
          {time}
        </Text>
        {end && end !== time ? (
          <Text variant="caption" tone="secondary" numeric>
            {end}
          </Text>
        ) : null}
      </View>
      <IconBadge icon={visual.icon} tint={visual.tint} />
      <View style={styles.text}>
        <Text numberOfLines={2} style={{ fontWeight: '600' }}>
          {entry.title}
        </Text>
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
  if (entry.kind === 'ticket') {
    return [kind, t(`enums.ticketKind.${entry.subtitle as TicketKind}`)].join(' · ');
  }
  if (entry.kind === 'hotel_check_in' || entry.kind === 'hotel_check_out') return kind;
  return [kind, entry.subtitle].filter(Boolean).join(' · ');
}
