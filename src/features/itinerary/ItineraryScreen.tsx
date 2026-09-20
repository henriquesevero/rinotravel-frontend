import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { ItineraryItem, TimelineEntry, Trip } from '@/core/api';
import { todayIn } from '@/core/datetime/civil-date';
import { eachDay, formatDayHeading } from '@/core/datetime/zoned';
import { currentLocale, useTranslation } from '@/core/i18n';
import { TripPage } from '@/features/content/TripPage';
import { TimelineRow } from '@/features/content/TimelineRow';
import { space, useStyles, type Theme } from '@/shared/theme';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Skeleton,
  Text,
} from '@/shared/ui';

import { ItemSheet } from './ItemSheet';
import { dayHooks, itemHooks, useTimeline } from './hooks';

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    day: { gap: space.sm },
    dayHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    dayTitle: { flex: 1 },
    entries: { paddingHorizontal: space.lg },
    divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    empty: { paddingVertical: space.lg, paddingHorizontal: space.lg },
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
    <>
      {all.map((date) => {
        const entries = byDate.get(date) ?? [];
        const number = dates.indexOf(date) + 1;
        return (
          <View key={date} style={styles.day} testID={`day-${date}`}>
            <View style={styles.dayHeader}>
              <View style={styles.dayTitle}>
                <Text variant="caption" tone="secondary">
                  {number > 0 ? t('itinerary.dayN', { n: number }).toUpperCase() : ''}
                </Text>
                <Text variant="headline" heading>
                  {formatDayHeading(date, locale)}
                </Text>
              </View>
              {date === today ? <Badge label={t('common.today')} tone="accent" /> : null}
              {canWrite ? (
                <IconButton
                  icon="add-circle-outline"
                  label={t('itinerary.add')}
                  onPress={() => onAdd(date)}
                  testID={`add-item-${date}`}
                />
              ) : null}
            </View>
            <Card padded={false}>
              {entries.length === 0 ? (
                <View style={styles.empty}>
                  <Text tone="secondary">{t('itinerary.emptyDay')}</Text>
                </View>
              ) : (
                entries.map((entry, index) => (
                  <Pressable
                    key={`${entry.kind}-${entry.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={entry.title}
                    onPress={() => open(entry)}
                    style={[styles.entries, index > 0 && styles.divider]}
                  >
                    <TimelineRow entry={entry} />
                  </Pressable>
                ))
              )}
            </Card>
          </View>
        );
      })}
    </>
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
