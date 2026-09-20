import { Image, StyleSheet, View } from 'react-native';

import type { Location, TransferMode } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { currentLocale } from '@/core/i18n';
import { radius, space } from '@/shared/theme';
import { Skeleton, Text } from '@/shared/ui';

import { MapLinkCard } from './MapLinkCard';
import { useRouteMap } from './hooks';

interface RouteMapProps {
  tripId: string;
  origin: Location;
  destination: Location;
  mode?: TransferMode | undefined;
  /** Drawn when the map cannot be: no Google key on the server, an outage, or the monthly limit. */
  originLabel: string;
  destinationLabel: string;
  modes: TransferMode[];
}

/** The route from A to B on a map, drawn by the server. It works the same on every screen size. */
export function RouteMap({
  tripId,
  origin,
  destination,
  mode,
  originLabel,
  destinationLabel,
  modes,
}: RouteMapProps) {
  const { t } = useTranslation();
  const map = useRouteMap(tripId, {
    origin,
    destination,
    ...(mode ? { mode } : {}),
    language: currentLocale(),
  });

  if (map.isPending) {
    return (
      <View style={styles.frame} testID="route-map-loading">
        <Skeleton height={260} borderRadius={radius.lg} />
      </View>
    );
  }
  if (map.isError) {
    return (
      <View style={{ gap: space.sm }}>
        <MapLinkCard originLabel={originLabel} destinationLabel={destinationLabel} modes={modes} />
        <Text variant="footnote" tone="secondary" align="center">
          {t('transfers.detail.mapUnavailable')}
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.frame} testID="route-map">
      <Image
        source={{ uri: map.data }}
        accessibilityLabel={t('transfers.detail.mapTitle')}
        resizeMode="cover"
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: radius.lg, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 16 / 9 },
});
