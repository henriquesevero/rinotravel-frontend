import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import type { ItineraryItem, TimelineEntry, Trip } from '@/core/api';
import { todayIn } from '@/core/datetime/civil-date';
import { dayParts, eachDay, formatDayHeading } from '@/core/datetime/zoned';
import { currentLocale, useTranslation } from '@/core/i18n';
import { hotelHooks } from '@/features/bookings/hooks';
import { TripPage } from '@/features/content/TripPage';
import { DayMapPanel } from '@/features/daymap/DayMapPanel';
import { DayNavigator } from '@/features/daymap/DayNavigator';
import {
  MAX_TRIP_STOPS,
  buildStops,
  buildTripStops,
  buildUnlocated,
  type Stop,
  type UnlocatedItem,
} from '@/features/daymap/stops';
import { restaurantHooks } from '@/features/places/hooks';
import { TimelineRow } from '@/features/content/TimelineRow';
import { radius, space, useStyles, type Theme } from '@/shared/theme';
import {
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Sheet,
  Skeleton,
  Text,
} from '@/shared/ui';

import { ItemDetailSheet } from './ItemDetailSheet';
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
    tileSelected: { borderColor: colors.accent, borderWidth: 2 },
    // Two columns that fill the window; each scrolls on its own.
    split: { flex: 1, minHeight: 0, flexDirection: 'row', gap: space.xl },
    listSide: { flex: 1, minWidth: 0 },
    // A ScrollView grows and shrinks by default; the map column must keep its width.
    mapSide: { width: 460, flexGrow: 0, flexShrink: 0, minHeight: 0 },
    columnContent: { paddingBottom: space.xxl },
    mapTitle: { gap: 2, paddingBottom: space.md },
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
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  const timeline = useTimeline(tripId);
  const days = dayHooks.useList(tripId);
  const items = itemHooks.useList(tripId);
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const restaurants = restaurantHooks.useList(tripId);
  const hotels = hotelHooks.useList(tripId);
  const router = useRouter();
  const { width } = useWindowDimensions();
  // Beside the list there is room for the map from about a 13-inch laptop up; below that it opens on top.
  const wide = width >= 1200;
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [mapSheetDate, setMapSheetDate] = useState<string | null>(null);
  const [scope, setScope] = useState<'day' | 'trip'>('day');

  const refresh = () => {
    void timeline.refetch();
    void days.refetch();
    void items.refetch();
  };

  return (
    <TripPage
      tripId={tripId}
      fill={wide}
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
        const sources = {
          days: days.data,
          items: items.data,
          restaurants: restaurants.data ?? [],
          hotels: hotels.data ?? [],
        };
        const stopsFor = (date: string): Stop[] => buildStops({ date, ...sources });
        // Days outside the trip's dates still appear when something is scheduled on them.
        const allDates = [
          ...new Set([...dates, ...timeline.data.days.map((day) => day.date)]),
        ].sort();
        const stopCounts = new Map(allDates.map((date) => [date, stopsFor(date).length]));
        const today = todayIn(trip.timezone);
        // Open on today if the trip is under way, else on the first day that has somewhere to go.
        const effectiveDate =
          selectedDate ??
          (allDates.includes(today) && (stopCounts.get(today) ?? 0) > 0 ? today : null) ??
          allDates.find((date) => (stopCounts.get(date) ?? 0) > 0) ??
          allDates[0] ??
          trip.startDate;

        const openStop = (stop: Stop) => {
          setMapSheetDate(null);
          if (stop.kind === 'item') setViewId(stop.refId);
          else if (stop.kind === 'restaurant') {
            router.push({ pathname: '/trips/[id]/places', params: { id: tripId } });
          } else router.push({ pathname: '/trips/[id]/bookings', params: { id: tripId } });
        };
        const tripStopsAll = buildTripStops(allDates, sources);
        const tripStops = tripStopsAll.slice(0, MAX_TRIP_STOPS);
        const addLocation = (item: UnlocatedItem, date: string) => {
          const found = items.data.find((candidate) => candidate.id === item.refId);
          setMapSheetDate(null);
          if (found) setSheet({ item: found, date });
        };
        // The day navigator, the trip switch and the map with its list: one view for the side panel
        // on computers and for the sheet on phones.
        const mapPanel = (date: string, onSelect: (next: string) => void) => (
          <View style={{ gap: space.lg }}>
            <DayNavigator
              days={allDates.map((day) => ({ date: day, count: stopCounts.get(day) ?? 0 }))}
              selected={date}
              onSelect={onSelect}
              scope={scope}
              onScope={setScope}
            />
            {scope === 'trip' && tripStopsAll.length > MAX_TRIP_STOPS ? (
              <Banner tone="info" message={t('dayMap.tooMany', { count: MAX_TRIP_STOPS })} />
            ) : null}
            {wide ? (
              <View style={styles.mapTitle}>
                <Text variant="caption" tone="secondary" style={{ letterSpacing: 0.8 }}>
                  {(scope === 'trip' ? t('dayMap.tripCaption') : t('dayMap.title')).toUpperCase()}
                </Text>
                <Text variant="headline" heading>
                  {scope === 'trip'
                    ? t('dayMap.tripHeading')
                    : formatDayHeading(date, currentLocale())}
                </Text>
              </View>
            ) : null}
            <DayMapPanel
              key={scope === 'trip' ? 'trip' : date}
              tripId={tripId}
              scope={scope}
              stops={scope === 'trip' ? tripStops : stopsFor(date)}
              unlocated={
                scope === 'day' ? buildUnlocated({ date, days: days.data, items: items.data }) : []
              }
              onOpenStop={openStop}
              onAddLocation={(item) => addLocation(item, date)}
              pinMap={wide}
            />
          </View>
        );
        const dayList = (
          <DayList
            trip={trip}
            tripId={tripId}
            dates={dates}
            timeline={timeline.data.days}
            items={items.data}
            canWrite={canWrite}
            selectedDate={wide && scope === 'day' ? effectiveDate : null}
            stopCounts={stopCounts}
            onSelectDate={(date) => {
              setScope('day');
              if (wide) setSelectedDate(date);
              else setMapSheetDate(date);
            }}
            onAdd={(date) => setSheet({ date })}
            onView={(item) => setViewId(item.id)}
          />
        );
        return (
          <>
            {wide ? (
              <View style={styles.split}>
                <ScrollView
                  testID="itinerary-list"
                  style={styles.listSide}
                  contentContainerStyle={styles.columnContent}
                  showsVerticalScrollIndicator
                >
                  {dayList}
                </ScrollView>
                <ScrollView
                  testID="itinerary-map-column"
                  style={styles.mapSide}
                  contentContainerStyle={styles.columnContent}
                  showsVerticalScrollIndicator
                >
                  {mapPanel(effectiveDate, setSelectedDate)}
                </ScrollView>
              </View>
            ) : (
              dayList
            )}
            <Sheet
              visible={!wide && mapSheetDate !== null}
              onClose={() => setMapSheetDate(null)}
              title={t('dayMap.title')}
              subtitle={mapSheetDate ? formatDayHeading(mapSheetDate, currentLocale()) : undefined}
              icon="map-outline"
              tint="blue"
              size="lg"
            >
              {mapSheetDate ? mapPanel(mapSheetDate, setMapSheetDate) : null}
            </Sheet>
            <ItemDetailSheet
              tripId={tripId}
              item={items.data.find((item) => item.id === viewId)}
              date={
                days.data.find((day) => day.id === items.data.find((i) => i.id === viewId)?.dayId)
                  ?.date
              }
              currency={trip.currency}
              visible={viewId !== null}
              onClose={() => setViewId(null)}
              onEdit={
                canWrite
                  ? () => {
                      const item = items.data.find((i) => i.id === viewId);
                      setViewId(null);
                      setSheet({ item, date: trip.startDate });
                    }
                  : undefined
              }
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
  onView: (item: ItineraryItem) => void;
  selectedDate: string | null;
  stopCounts: Map<string, number>;
  onSelectDate: (date: string) => void;
}

function DayList({
  trip,
  tripId,
  dates,
  timeline,
  items,
  canWrite,
  onAdd,
  onView,
  selectedDate,
  stopCounts,
  onSelectDate,
}: DayListProps) {
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
      if (item) onView(item);
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('dayMap.viewOnMap')}
                onPress={() => onSelectDate(date)}
                style={[
                  styles.tile,
                  isToday && styles.tileToday,
                  selectedDate === date && styles.tileSelected,
                ]}
              >
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
              </Pressable>
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
                {(stopCounts.get(date) ?? 0) > 0 ? (
                  <Button
                    testID={`day-map-${date}`}
                    title={t('dayMap.viewOnMap')}
                    icon="map-outline"
                    variant={selectedDate === date ? 'secondary' : 'ghost'}
                    size="sm"
                    onPress={() => onSelectDate(date)}
                  />
                ) : null}
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
