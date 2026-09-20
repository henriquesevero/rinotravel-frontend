import { useMemo, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { DayMap } from '@/core/api';
import { env } from '@/core/config/env';
import { formatDuration } from '@/core/datetime/zoned';
import { useTranslation } from '@/core/i18n';
import { LocationMap } from '@/features/content/LocationMap';
import { radius, space, useStyles, type Theme } from '@/shared/theme';
import {
  Badge,
  Banner,
  Icon,
  IconButton,
  SegmentedControl,
  Skeleton,
  Text,
  type IconName,
} from '@/shared/ui';

import { useDayMap, type DayMode } from './hooks';
import { InteractiveMap, type MapPin } from './InteractiveMap';
import { decodePolyline, type LatLng } from './polyline';
import { stopsSignature, type Stop } from './stops';
import { formatDistance, legViews, totals, type LegView } from './timing';

const MODE_ICON: Record<DayMode, IconName> = {
  TRANSIT: 'subway-outline',
  WALKING: 'walk-outline',
  DRIVING: 'car-outline',
};

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    root: { gap: space.lg },
    summary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm },
    mapBox: { minHeight: 200, borderRadius: radius.lg, overflow: 'hidden' },
    image: { width: '100%', aspectRatio: 16 / 9 },
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
    stop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      padding: space.md,
      borderRadius: radius.md,
    },
    stopSelected: { backgroundColor: colors.accentSoft },
    number: {
      width: 30,
      height: 30,
      borderRadius: radius.pill,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    numberSelected: { backgroundColor: '#1E3A8A' },
    stopText: { flex: 1, minWidth: 0, gap: 2 },
    leg: { flexDirection: 'row', gap: space.md, paddingLeft: space.md + 14 },
    legRail: { alignItems: 'center', width: 2 },
    legLine: { width: 2, flex: 1, backgroundColor: colors.border, borderRadius: 1 },
    legBody: { flex: 1, gap: space.xs, paddingVertical: space.sm },
    legRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm },
  });

/** The label a pin carries: 1 to 9, then A, B, C (what the map service can print). */
function pinLabel(index: number): string {
  return index < 9 ? String(index + 1) : String.fromCharCode(65 + index - 9);
}

function coordsOf(stop: Stop): LatLng | null {
  const { latitude, longitude } = stop.location;
  return typeof latitude === 'number' && typeof longitude === 'number'
    ? { lat: latitude, lng: longitude }
    : null;
}

interface DayMapPanelProps {
  tripId: string;
  stops: Stop[];
  onOpenStop: (stop: Stop) => void;
  /** Keeps a long list from pushing the map out of view; the list scrolls inside. */
  listMaxHeight?: number;
}

/**
 * One day on a map: every place in order with the time to be there, the trip between each pair with
 * how long it takes and when to leave, and the whole route drawn. Pass `key={date}` so a new day
 * starts with nothing selected.
 */
export function DayMapPanel({ tripId, stops: given, onOpenStop, listMaxHeight }: DayMapPanelProps) {
  // The parent rebuilds the array on every render; the map should only react to a real change.
  const signature = stopsSignature(given);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the signature on purpose
  const stops = useMemo(() => given, [signature]);
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  const [mode, setMode] = useState<DayMode>('TRANSIT');
  const [selected, setSelected] = useState<number | null>(null);
  const [interactiveFailed, setInteractiveFailed] = useState(false);

  const interactive =
    Platform.OS === 'web' && env.googleMapsBrowserKey !== '' && !interactiveFailed;
  const map = useDayMap(tripId, stops, mode, !interactive);
  const data: DayMap | undefined = map.data;

  const views = useMemo(() => (data ? legViews(stops, data.legs) : []), [stops, data]);
  const total = totals(views);

  // Stops given only as an address have no coordinates of their own; the routes know where they start
  // and end, so the pin is put there.
  const { pins, paths } = useMemo(() => {
    const decoded = (data?.legs ?? []).map((leg) => decodePolyline(leg.polyline ?? ''));
    const pinsOut: MapPin[] = stops.map((stop, index) => ({
      key: stop.key,
      label: pinLabel(index),
      title: stop.title,
      time: stop.time,
      position: coordsOf(stop) ?? decoded[index]?.[0] ?? decoded[index - 1]?.at(-1) ?? null,
    }));
    return { pins: pinsOut, paths: decoded };
  }, [stops, data]);

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
    if (map.isPending) return <Skeleton height={300} borderRadius={radius.lg} />;
    if (map.isError) return <Banner tone="warning" message={t('dayMap.loadError')} />;
    if (interactive) {
      return (
        <InteractiveMap
          pins={pins}
          paths={paths}
          selectedIndex={selected}
          onSelect={setSelected}
          onError={() => setInteractiveFailed(true)}
        />
      );
    }
    if (data?.image) {
      return (
        <View style={styles.mapBox} testID="day-map-image">
          <Image
            source={{ uri: data.image }}
            accessibilityLabel={t('dayMap.title')}
            resizeMode="cover"
            style={styles.image}
          />
        </View>
      );
    }
    return <Banner tone="info" message={t('dayMap.mapUnavailable')} />;
  })();

  const list = (
    <View style={styles.list} testID="day-map-stops">
      {stops.map((stop, index) => {
        const isSelected = selected === index;
        const view = views[index];
        return (
          <View key={stop.key}>
            <Pressable
              testID={`day-stop-${index}`}
              accessibilityRole="button"
              accessibilityLabel={stop.title}
              onPress={() => setSelected(isSelected ? null : index)}
              style={[styles.stop, isSelected && styles.stopSelected]}
            >
              <View style={[styles.number, isSelected && styles.numberSelected]}>
                <Text variant="footnote" tone="onAccent" style={{ fontWeight: '700' }}>
                  {pinLabel(index)}
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
                {stop.subtitle ? (
                  <Text variant="footnote" tone="secondary" numberOfLines={1}>
                    {stop.subtitle}
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
            {index < stops.length - 1 && data ? <LegRow view={view} mode={mode} /> : null}
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

      {mapArea}

      {stops.length > 0 ? (
        listMaxHeight ? (
          <ScrollView style={{ maxHeight: listMaxHeight }} nestedScrollEnabled>
            {list}
          </ScrollView>
        ) : (
          list
        )
      ) : null}
    </View>
  );
}

function LegRow({ view, mode }: { view: LegView | undefined; mode: DayMode }) {
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  if (!view) return null;

  return (
    <View style={styles.leg} testID={`day-leg-${view.from}`}>
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
              {view.leaveBy ? (
                <Badge label={t('dayMap.leaveBy', { time: view.leaveBy })} tone="neutral" />
              ) : null}
            </View>
            {view.tight && view.gapMinutes !== null ? (
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
    </View>
  );
}
