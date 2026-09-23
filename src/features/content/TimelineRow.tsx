import type { TFunction } from 'i18next';
import { Pressable, StyleSheet, View, type PressableStateCallbackType } from 'react-native';

import type { TicketKind, TimelineEntry } from '@/core/api';
import { zonedTime } from '@/core/datetime/zoned';
import { useTranslation } from '@/core/i18n';
import { radius, space, useStyles, type Theme } from '@/shared/theme';
import { Badge, IconBadge, Text } from '@/shared/ui';

import { entryVisual } from './visuals';

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.lg,
      paddingHorizontal: space.lg,
      paddingVertical: space.md,
    },
    pressed: { backgroundColor: colors.border },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    time: { width: 52, gap: 2 },
    // Plain and neutral on purpose: the colour is spent on the pin instead, so a day of many rows
    // does not turn into a wash of blue.
    timePill: {
      alignSelf: 'flex-start',
      paddingHorizontal: space.xs + 2,
      paddingVertical: 2,
      borderRadius: radius.sm,
      backgroundColor: colors.surface,
    },
    pin: {
      width: 30,
      height: 30,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: { flex: 1, gap: 2 },
  });

function hovered(state: PressableStateCallbackType): boolean {
  return Boolean((state as PressableStateCallbackType & { hovered?: boolean }).hovered);
}

interface TimelineRowProps {
  entry: TimelineEntry;
  /**
   * A numbered pin in the day's colour, replacing the category icon: ties this row to the same
   * number the day's map draws for it. Omitted for entries that are not one of the day's stops
   * (a flight, say), which keep their plain category icon.
   */
  pin?: { number: string; color: string } | undefined;
  onPress?: () => void;
}

export function TimelineRow({ entry, pin, onPress }: TimelineRowProps) {
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  const time = entry.start ? zonedTime(entry.start) : '';
  const end = entry.end ? zonedTime(entry.end) : '';
  const subtitle = subtitleOf(entry, t);
  const status = statusOf(entry.status);
  const visual = entryVisual(entry);

  const content = (
    <View style={styles.row}>
      <View style={styles.time}>
        {time ? (
          <View style={styles.timePill}>
            <Text variant="caption" numeric style={{ fontWeight: '700' }}>
              {time}
            </Text>
          </View>
        ) : null}
        {end && end !== time ? (
          <Text variant="caption" tone="secondary" numeric>
            {end}
          </Text>
        ) : null}
      </View>
      {pin ? (
        <View style={[styles.pin, { backgroundColor: pin.color }]}>
          <Text variant="footnote" tone="onAccent" style={{ fontWeight: '700' }}>
            {pin.number}
          </Text>
        </View>
      ) : (
        <IconBadge icon={visual.icon} tint={visual.tint} size={32} />
      )}
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

  const testID = `timeline-${entry.kind}-${entry.id}`;
  if (!onPress) {
    return (
      <View testID={testID} style={styles.card}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={entry.title}
      onPress={onPress}
      style={(state) => [styles.card, (state.pressed || hovered(state)) && styles.pressed]}
    >
      {content}
    </Pressable>
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
 * its category, a stay only says which moment it is, and flights add the extra detail.
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
