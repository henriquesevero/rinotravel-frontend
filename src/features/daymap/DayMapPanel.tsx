import type { TFunction } from 'i18next';
import { useMemo, useState } from 'react';
import { Image, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import type { DayMap } from '@/core/api';
import { env } from '@/core/config/env';
import { formatDayHeading, formatDuration } from '@/core/datetime/zoned';
import { currentLocale, useTranslation } from '@/core/i18n';
import { LocationMap } from '@/features/content/LocationMap';
import { isMobileDevice } from '@/shared/platform';
import { radius, space, useStyles, type Theme } from '@/shared/theme';
import {
  Badge,
  Banner,
  Button,
  Icon,
  IconButton,
  ListRow,
  SegmentedControl,
  Sheet,
  Skeleton,
  Text,
  type IconName,
} from '@/shared/ui';

import { dayColor } from './colors';
import { useDayMap, type DayMode } from './hooks';
import { InteractiveMap, type MapPath, type MapPin } from './InteractiveMap';
import { MAX_POINTS_DESKTOP, MAX_POINTS_MOBILE, legUrl, routeLinks, type RouteLink } from './links';
import { decodePolyline, type LatLng } from './polyline';
import { dayLabel, stopOrderLabel, stopsSignature, type Stop, type UnlocatedItem } from './stops';
import { formatDistance, legViews, totals, type LegView } from './timing';

const MODE_ICON: Record<DayMode, IconName> = {
  TRANSIT: 'subway-outline',
  WALKING: 'walk-outline',
  DRIVING: 'car-outline',
};

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    root: { gap: space.xl },
    pinned: {
      backgroundColor: colors.background,
      paddingBottom: space.sm,
      zIndex: 2,
      ...({ position: 'sticky', top: 0 } as object),
    },
    summary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm },
    mapBox: { minHeight: 200, borderRadius: radius.lg, overflow: 'hidden' },
    openChip: {
      position: 'absolute',
      top: space.sm,
      left: space.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      zIndex: 3,
    },
    image: { width: '100%', aspectRatio: 16 / 9 },
    imagePinned: { aspectRatio: 2 },
    empty: {
      alignItems: 'center',
      gap: space.sm,
      padding: space.xl,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: 'rgba(37, 99, 235, 0.35)',
    },
    list: { gap: 0 },
    dayHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      paddingHorizontal: space.md,
      paddingTop: space.lg,
      paddingBottom: space.xs,
    },
    dayDot: { width: 12, height: 12, borderRadius: radius.pill },
    stop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.lg,
      padding: space.lg,
      borderRadius: radius.md,
    },
    stopSelected: { backgroundColor: colors.accentSoft },
    number: {
      width: 30,
      height: 30,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stopText: { flex: 1, minWidth: 0, gap: 4 },
    leg: { flexDirection: 'row', gap: space.md, paddingLeft: space.lg + 14 },
    legRail: { alignItems: 'center', width: 2 },
    legLine: { width: 2, flex: 1, backgroundColor: colors.border, borderRadius: 1 },
    legBody: { flex: 1, gap: space.xs, paddingVertical: space.md },
    legRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm },
    unlocated: { gap: space.xs, paddingTop: space.lg },
    unlocatedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
    },
  });

function coordsOf(stop: Stop): LatLng | null {
  const { latitude, longitude } = stop.location;
  return typeof latitude === 'number' && typeof longitude === 'number'
    ? { lat: latitude, lng: longitude }
    : null;
}

interface DayMapPanelProps {
  tripId: string;
  stops: Stop[];
  /** `day` numbers the stops in order; `trip` shows every day, one colour and one number per day. */
  scope?: 'day' | 'trip';
  /** Scheduled things of this day the map cannot place yet; the day view lists them. */
  unlocated?: UnlocatedItem[];
  onOpenStop: (stop: Stop) => void;
  onAddLocation?: (item: UnlocatedItem) => void;
  /**
   * For a panel that sits in a column of its own that scrolls: the map stays pinned at the top of
   * that column while the stops and trips scroll underneath.
   */
  pinMap?: boolean;
}

/**
 * A day, or the whole trip, on a map: every place in order with the time to be there, the trip
 * between each pair with how long it takes and when to leave, and the whole route drawn. Pass a
 * `key` that changes with the day or scope so the panel starts with nothing selected.
 */
export function DayMapPanel({
  tripId,
  stops: given,
  scope = 'day',
  unlocated = [],
  onOpenStop,
  onAddLocation,
  pinMap = false,
}: DayMapPanelProps) {
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  // The parent rebuilds the array on every render; the map should only react to a real change.
  const signature = stopsSignature(given);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the signature on purpose
  const stops = useMemo(() => given, [signature]);
  const [mode, setMode] = useState<DayMode>('TRANSIT');
  const [selected, setSelected] = useState<number | null>(null);
  const [interactiveFailed, setInteractiveFailed] = useState(false);
  const [chooser, setChooser] = useState(false);
  const trip = scope === 'trip';

  const interactive =
    Platform.OS === 'web' && env.googleMapsBrowserKey !== '' && !interactiveFailed;
  const map = useDayMap(tripId, stops, mode, !interactive, scope);
  const data: DayMap | undefined = map.data;

  const views = useMemo(() => (data ? legViews(stops, data.legs) : []), [stops, data]);
  const total = totals(views);
  const maxPoints = isMobileDevice() ? MAX_POINTS_MOBILE : MAX_POINTS_DESKTOP;
  const links = useMemo(
    () => routeLinks(stops, { mode, maxPoints, scope }),
    [stops, mode, maxPoints, scope],
  );
  const openUrl = (url: string) => void Linking.openURL(url);
  // One link opens straight away; a route too long for one link asks which part.
  const openMaps = () => {
    if (links.length === 1 && links[0]) openUrl(links[0].url);
    else if (links.length > 1) setChooser(true);
  };
  const label = (stop: Stop, index: number) =>
    trip ? dayLabel(stop.dayIndex) : stopOrderLabel(index);
  const colorOf = (stop: Stop) => (trip ? dayColor(stop.dayIndex) : dayColor(0));

  // Stops given only as an address have no coordinates of their own; the routes know where they start
  // and end, so the pin is put there.
  const { pins, paths } = useMemo(() => {
    const decoded = (data?.legs ?? []).map((leg) => decodePolyline(leg.polyline ?? ''));
    const pinsOut: MapPin[] = stops.map((stop, index) => ({
      key: stop.key,
      label: trip ? dayLabel(stop.dayIndex) : stopOrderLabel(index),
      title: trip ? `${stop.title} · ${stop.date}` : stop.title,
      time: stop.time,
      color: trip ? dayColor(stop.dayIndex) : dayColor(0),
      position: coordsOf(stop) ?? decoded[index]?.[0] ?? decoded[index - 1]?.at(-1) ?? null,
    }));
    // A trip belongs to the day it arrives in, like the picture the server draws.
    const pathsOut: MapPath[] = decoded.map((points, index) => ({
      points,
      color: trip ? dayColor(stops[index + 1]?.dayIndex ?? 0) : dayColor(0),
    }));
    return { pins: pinsOut, paths: pathsOut };
  }, [stops, data, trip]);

  const mapArea = (() => {
    if (stops.length === 0) {
      return (
        <View style={styles.empty} testID="day-map-empty">
          <Icon name="map-outline" size={32} tone="accent" />
          <Text heading variant="headline" align="center">
            {t('dayMap.empty')}
          </Text>
          <Text variant="footnote" tone="secondary" align="center">
            {t('dayMap.emptyHint')}
          </Text>
        </View>
      );
    }
    const only = stops[0];
    if (stops.length === 1 && only) return <LocationMap tripId={tripId} location={only.location} />;
    if (map.isPending) return <Skeleton height={pinMap ? 240 : 300} borderRadius={radius.lg} />;
    if (map.isError) return <Banner tone="warning" message={t('dayMap.loadError')} />;
    if (interactive) {
      return (
        <InteractiveMap
          pins={pins}
          paths={paths}
          selectedIndex={selected}
          onSelect={setSelected}
          onError={() => setInteractiveFailed(true)}
          height={pinMap ? 240 : 300}
        />
      );
    }
    if (data?.image) {
      return (
        <Pressable
          style={styles.mapBox}
          testID="day-map-image"
          accessibilityRole="link"
          accessibilityLabel={t('dayMap.openMaps')}
          onPress={openMaps}
        >
          <Image
            source={{ uri: data.image }}
            accessibilityLabel={t('dayMap.title')}
            resizeMode="cover"
            style={[styles.image, pinMap && styles.imagePinned]}
          />
        </Pressable>
      );
    }
    return <Banner tone="info" message={t('dayMap.mapUnavailable')} />;
  })();

  const list = (
    <View style={styles.list} testID="day-map-stops">
      {stops.map((stop, index) => {
        const isSelected = selected === index;
        const previous = stops[index - 1];
        const startsDay = trip && (!previous || previous.date !== stop.date);
        return (
          <View key={stop.key}>
            {startsDay ? (
              <View style={styles.dayHeader} testID={`day-group-${stop.dayIndex}`}>
                <View style={[styles.dayDot, { backgroundColor: dayColor(stop.dayIndex) }]} />
                <Text variant="subhead" heading style={{ fontWeight: '700' }}>
                  {t('dayMap.dayHeader', { n: stop.dayIndex + 1 })}
                </Text>
                <Text variant="footnote" tone="secondary">
                  {formatDayHeading(stop.date, currentLocale())}
                </Text>
              </View>
            ) : null}
            <Pressable
              testID={`day-stop-${index}`}
              accessibilityRole="button"
              accessibilityLabel={stop.title}
              onPress={() => setSelected(isSelected ? null : index)}
              style={[styles.stop, isSelected && styles.stopSelected]}
            >
              <View style={[styles.number, { backgroundColor: colorOf(stop) }]}>
                <Text variant="footnote" tone="onAccent" style={{ fontWeight: '700' }}>
                  {label(stop, index)}
                </Text>
              </View>
              <View style={styles.stopText}>
                <Text numberOfLines={2} style={{ fontWeight: '600' }}>
                  {stop.time ? (
                    <Text numeric tone="accent" style={{ fontWeight: '700' }}>
                      {`${stop.time}  `}
                    </Text>
                  ) : null}
                  {stop.title}
                </Text>
                {stop.kind !== 'item' || stop.subtitle ? (
                  <Text variant="footnote" tone="secondary" numberOfLines={1}>
                    {[stop.kind === 'item' ? '' : t(`dayMap.kind.${stop.kind}`), stop.subtitle]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                ) : null}
              </View>
              <IconButton
                icon="chevron-forward"
                tone="secondary"
                label={t('dayMap.details')}
                onPress={() => onOpenStop(stop)}
                testID={`day-stop-open-${index}`}
              />
            </Pressable>
            {index < stops.length - 1 && data ? (
              <LegRow
                view={views[index]}
                mode={mode}
                overnight={trip && stops[index + 1]?.date !== stop.date}
                url={stops[index + 1] ? legUrl(stop, stops[index + 1] as Stop, mode) : null}
                onOpen={openUrl}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.root} testID="day-map-panel">
      {stops.length > 0 ? (
        <View style={styles.summary}>
          <Badge
            label={t(stops.length === 1 ? 'dayMap.stopsCount.one' : 'dayMap.stopsCount.other', {
              count: stops.length,
            })}
            tone="accent"
          />
          {total.minutes > 0 ? (
            <Badge
              label={t('dayMap.travelTotal', { time: formatDuration(total.minutes) })}
              tone="neutral"
            />
          ) : null}
          {total.meters > 0 ? <Badge label={formatDistance(total.meters)} tone="neutral" /> : null}
        </View>
      ) : null}

      {stops.length >= 2 ? (
        <SegmentedControl
          testID="day-mode"
          value={mode}
          onChange={setMode}
          segments={(['TRANSIT', 'WALKING', 'DRIVING'] as const).map((value) => ({
            value,
            label: t(`dayMap.modes.${value}`),
          }))}
        />
      ) : null}

      <View style={pinMap ? styles.pinned : undefined}>
        <View>
          {mapArea}
          {stops.length >= 1 && links.length > 0 && !map.isPending && !map.isError ? (
            <Pressable
              testID="day-map-open"
              accessibilityRole="link"
              accessibilityLabel={t('dayMap.openMaps')}
              onPress={openMaps}
              style={styles.openChip}
            >
              <Icon name="open-outline" size={14} tone="accent" />
              <Text variant="caption" tone="accent" style={{ fontWeight: '700' }}>
                {t('dayMap.openMaps')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {stops.length > 0 ? list : null}

      {stops.length >= 2 && mode === 'TRANSIT' && links.length > 0 ? (
        <Text variant="footnote" tone="secondary" testID="day-map-transit-note">
          {t('dayMap.transitNote')}
        </Text>
      ) : null}

      <Sheet
        visible={chooser}
        onClose={() => setChooser(false)}
        title={t('dayMap.chooserTitle')}
        subtitle={t('dayMap.chooserHint')}
        icon="map-outline"
        tint="blue"
      >
        <View testID="day-map-chooser">
          {links.map((link, index) => (
            <ListRow
              key={link.key}
              testID={`day-map-open-part-${index}`}
              divider={index > 0}
              icon="navigate-outline"
              title={partTitle(link, index, trip, t)}
              subtitle={
                link.date
                  ? formatDayHeading(link.date, currentLocale())
                  : t('dayMap.openRange', { from: link.first, to: link.last })
              }
              onPress={() => {
                setChooser(false);
                openUrl(link.url);
              }}
            />
          ))}
        </View>
      </Sheet>

      {!trip && unlocated.length > 0 ? (
        <View style={styles.unlocated} testID="day-map-unlocated">
          <Text variant="caption" tone="secondary" style={{ letterSpacing: 0.8 }}>
            {t('dayMap.unlocated').toUpperCase()}
          </Text>
          <Text variant="footnote" tone="secondary">
            {t('dayMap.unlocatedHint')}
          </Text>
          {unlocated.map((item) => (
            <View key={item.key} style={styles.unlocatedRow} testID={`day-unlocated-${item.refId}`}>
              <Icon name="location-outline" size={18} tone="secondary" />
              <View style={styles.stopText}>
                <Text numberOfLines={1}>
                  {item.time ? (
                    <Text numeric tone="secondary" style={{ fontWeight: '600' }}>
                      {`${item.time}  `}
                    </Text>
                  ) : null}
                  {item.title}
                </Text>
              </View>
              {onAddLocation ? (
                <Button
                  testID={`day-add-location-${item.refId}`}
                  title={t('dayMap.addLocation')}
                  variant="ghost"
                  size="sm"
                  onPress={() => onAddLocation(item)}
                />
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function LegRow({
  view,
  mode,
  overnight,
  url,
  onOpen,
}: {
  view: LegView | undefined;
  mode: DayMode;
  /** The trip from one day's last place to the next day's first. */
  overnight: boolean;
  /** This hop in Google Maps, with the real transit of that stretch. */
  url: string | null;
  onOpen: (url: string) => void;
}) {
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  if (!view) return null;

  return (
    <Pressable
      style={styles.leg}
      testID={`day-leg-${view.from}`}
      accessibilityRole={url ? 'link' : undefined}
      accessibilityLabel={url ? t('dayMap.openLeg') : undefined}
      disabled={!url}
      onPress={() => url && onOpen(url)}
    >
      <View style={styles.legRail}>
        <View style={styles.legLine} />
      </View>
      <View style={styles.legBody}>
        {view.available && view.minutes !== null ? (
          <>
            <View style={styles.legRow}>
              <Icon name={MODE_ICON[mode]} size={16} tone="accent" />
              <Text variant="subhead" numeric style={{ fontWeight: '600' }}>
                {formatDuration(view.minutes)}
                {view.meters ? ` · ${formatDistance(view.meters)}` : ''}
              </Text>
              {overnight ? (
                <Badge label={t('dayMap.nextMorning')} tone="neutral" />
              ) : view.leaveBy ? (
                <Badge label={t('dayMap.leaveBy', { time: view.leaveBy })} tone="neutral" />
              ) : null}
            </View>
            {!overnight && view.tight && view.gapMinutes !== null ? (
              <Badge
                label={t('dayMap.tight', {
                  trip: formatDuration(view.minutes),
                  gap: formatDuration(Math.max(view.gapMinutes, 0)),
                })}
                tone="warning"
              />
            ) : null}
          </>
        ) : view.available ? null : (
          <Text variant="footnote" tone="secondary">
            {t('dayMap.noRoute')}
          </Text>
        )}
      </View>
      {url ? <Icon name="open-outline" size={16} tone="secondary" /> : null}
    </Pressable>
  );
}

function partTitle(link: RouteLink, index: number, trip: boolean, t: TFunction): string {
  return trip && link.dayIndex !== undefined
    ? t('dayMap.openDay', { n: link.dayIndex + 1 })
    : t('dayMap.openPart', { n: index + 1 });
}
