import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { ItineraryItem, TimelineEntry, Trip } from '@/core/api';
import { todayIn } from '@/core/datetime/civil-date';
import { dayParts, eachDay } from '@/core/datetime/zoned';
import { currentLocale, useTranslation } from '@/core/i18n';
import { TripPage } from '@/features/content/TripPage';
import { TimelineRow } from '@/features/content/TimelineRow';
import { radius, space, useStyles, type Theme } from '@/shared/theme';
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton, Text } from '@/shared/ui';

import { ItemSheet } from './ItemSheet';
import { dayHooks, itemHooks, useTimeline } from './hooks';

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    day: { flexDirection: 'row', gap: space.lg },
    rail: { width: 56, alignItems: 'center' },
    tile: {
      width: 56,
      height: 64,
      borderRadius: radius.md + 2,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileToday: { backgroundColor: colors.accent, borderColor: colors.accent },
    line: {
      flex: 1,
      width: 2,
      backgroundColor: colors.border,
      marginVertical: space.xs,
      borderRadius: 1,
    },
    dayBody: { flex: 1, minWidth: 0, paddingBottom: space.xl, gap: space.sm },
    dayHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 64 },
    dayTitle: { flex: 1 },
    entries: { paddingHorizontal: space.lg },
    divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    todayCard: { borderColor: colors.accent, borderWidth: 1.5 },
  });

interface SheetState {
  item?: ItineraryItem | undefined;
  date: string;
}

export function ItineraryScreen({ tripId }: { tripId: string }) {
  const { t } = useTranslation();
  const timeline = useTimeline(tripId);
  const days = dayHooks.useList(tripId);
  const items = itemHooks.useList(tripId);
  const [sheet, setSheet] = useState<SheetState | null>(null);

  const refresh = () => {
    void timeline.refetch();
    void days.refetch();
    void items.refetch();
  };

  return (
    <TripPage
      tripId={tripId}
      title={t('itinerary.title')}
      onRefresh={refresh}
      right={({ trip, canWrite }) =>
        canWrite ? (
          <Button
            testID="add-item"
            title={t('itinerary.add')}
            icon="add"
            size="sm"
            onPress={() => setSheet({ date: trip.startDate })}
          />
        ) : null
      }
    >
      {({ trip, canWrite }) => {
        const failed = timeline.error ?? days.error ?? items.error;
        if (failed) {
          return <ErrorState error={failed} title={t('itinerary.loadError')} onRetry={refresh} />;
        }
        if (!timeline.data || !days.data || !items.data) return <DaysSkeleton />;

        const dates = eachDay(trip.startDate, trip.endDate);
        return (
          <>
            <DayList
              trip={trip}
              tripId={tripId}
              dates={dates}
              timeline={timeline.data.days}
              items={items.data}
              canWrite={canWrite}
              onAdd={(date) => setSheet({ date })}
              onEdit={(item) => setSheet({ item, date: trip.startDate })}
            />
            <ItemSheet
              tripId={tripId}
              visible={sheet !== null}
              onClose={() => setSheet(null)}
              dates={dates}
              days={days.data}
              timezone={trip.timezone}
              currency={trip.currency}
              item={sheet?.item}
              defaultDate={sheet?.date ?? trip.startDate}
            />
          </>
        );
      }}
    </TripPage>
  );
}

interface DayListProps {
  trip: Trip;
  tripId: string;
  dates: string[];
  timeline: { date: string; entries: TimelineEntry[] }[];
  items: ItineraryItem[];
  canWrite: boolean;
  onAdd: (date: string) => void;
  onEdit: (item: ItineraryItem) => void;
}

function DayList({ trip, tripId, dates, timeline, items, canWrite, onAdd, onEdit }: DayListProps) {
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  const router = useRouter();
  const locale = currentLocale();
  const today = todayIn(trip.timezone);

  // Dates outside the trip still show when they carry an entry (a flight leaving the day before).
  const all = useMemo(() => {
    const extra = timeline.map((day) => day.date).filter((date) => !dates.includes(date));
    return [...new Set([...dates, ...extra])].sort();
  }, [dates, timeline]);
  const byDate = useMemo(() => new Map(timeline.map((day) => [day.date, day.entries])), [timeline]);
  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  if (timeline.every((day) => day.entries.length === 0)) {
    return (
      <EmptyState
        icon="calendar-outline"
        title={t('itinerary.emptyTitle')}
        message={t('itinerary.emptyMessage')}
        {...(canWrite
          ? { actionLabel: t('itinerary.add'), onAction: () => onAdd(trip.startDate) }
          : {})}
      />
    );
  }

  const open = (entry: TimelineEntry) => {
    if (entry.kind === 'itinerary_item') {
      const item = itemsById.get(entry.id);
      if (item && canWrite) onEdit(item);
      return;
    }
    router.push(destinationOf(entry.kind, tripId));
  };

  return (
    <View>
      {all.map((date, position) => {
        const entries = byDate.get(date) ?? [];
        const number = dates.indexOf(date) + 1;
        const parts = dayParts(date, locale);
        const isToday = date === today;
        const isLast = position === all.length - 1;
        return (
          <View key={date} style={styles.day} testID={`day-${date}`}>
            <View style={styles.rail}>
              <View style={[styles.tile, isToday && styles.tileToday]}>
                <Text
                  variant="caption"
                  tone={isToday ? 'onAccent' : 'secondary'}
                  style={{ fontWeight: '700' }}
                >
                  {parts.month.toUpperCase()}
                </Text>
                <Text
                  variant="title"
                  tone={isToday ? 'onAccent' : 'primary'}
                  style={{ lineHeight: 26 }}
                >
                  {parts.day}
                </Text>
              </View>
              {isLast ? null : <View style={styles.line} />}
            </View>

            <View style={styles.dayBody}>
              <View style={styles.dayHeader}>
                <View style={styles.dayTitle}>
                  <Text variant="headline" heading>
                    {parts.weekday.charAt(0).toUpperCase() + parts.weekday.slice(1)}
                  </Text>
                  <Text variant="footnote" tone="secondary">
                    {number > 0 ? `${t('itinerary.dayN', { n: number })} · ` : ''}
                    {entries.length === 0
                      ? t('itinerary.emptyDay')
                      : t(
                          entries.length === 1 ? 'itinerary.events.one' : 'itinerary.events.other',
                          {
                            count: entries.length,
                          },
                        )}
                  </Text>
                </View>
                {isToday ? <Badge label={t('common.today')} tone="accent" /> : null}
                {canWrite ? (
                  <Button
                    testID={`add-item-${date}`}
                    title={t('common.add')}
                    icon="add"
                    variant="ghost"
                    size="sm"
                    onPress={() => onAdd(date)}
                  />
                ) : null}
              </View>

              {entries.length === 0 ? null : (
                <Card padded={false} style={isToday ? styles.todayCard : undefined}>
                  {entries.map((entry, index) => (
                    <Pressable
                      key={`${entry.kind}-${entry.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={entry.title}
                      onPress={() => open(entry)}
                      style={[styles.entries, index > 0 && styles.divider]}
                    >
                      <TimelineRow entry={entry} />
                    </Pressable>
                  ))}
                </Card>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function destinationOf(kind: TimelineEntry['kind'], tripId: string): Href {
  switch (kind) {
    case 'flight_departure':
    case 'flight_arrival':
    case 'hotel_check_in':
    case 'hotel_check_out':
      return { pathname: '/trips/[id]/bookings', params: { id: tripId } };
    case 'transfer':
      return { pathname: '/trips/[id]/transfers', params: { id: tripId } };
    case 'restaurant_reservation':
      return { pathname: '/trips/[id]/places', params: { id: tripId } };
    default:
      return { pathname: '/trips/[id]/itinerary', params: { id: tripId } };
  }
}

function DaysSkeleton() {
  return (
    <View style={{ gap: space.lg }}>
      {[0, 1, 2].map((key) => (
        <View key={key} style={{ gap: space.sm }}>
          <Skeleton width="40%" height={24} />
          <Skeleton height={88} borderRadius={16} />
        </View>
      ))}
    </View>
  );
}
