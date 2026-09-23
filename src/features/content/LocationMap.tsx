import { useQuery } from '@tanstack/react-query';
import { Image, StyleSheet, View } from 'react-native';

import { fetchImage, type Location, type LocationMapRequest } from '@/core/api';
import { currentLocale, useTranslation } from '@/core/i18n';
import { radius, space, useTheme } from '@/shared/theme';
import { IconBadge, Skeleton, Text } from '@/shared/ui';
import { LinearGradient } from 'expo-linear-gradient';

interface LocationMapProps {
  tripId: string;
  location: Location;
}

/** The picture of one place, drawn by the server on request; kept in memory so reopening a record or
 * editing a field does not pay for the same picture twice. */
function useLocationMap(tripId: string, request: LocationMapRequest | null) {
  return useQuery({
    enabled: request !== null,
    queryKey: ['location-map', tripId, request],
    queryFn: ({ signal }) => fetchImage(`/api/v1/trips/${tripId}/maps/location`, request, signal),
    staleTime: 10 * 60_000,
    gcTime: 10 * 60_000,
    retry: false,
  });
}

/** One place on a map, drawn by the server. If it cannot be drawn, a card names the place instead. */
export function LocationMap({ tripId, location }: LocationMapProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const map = useLocationMap(tripId, { location, language: currentLocale() });

  if (map.isPending) {
    return (
      <View style={styles.frame} testID="location-map-loading">
        <Skeleton height={240} borderRadius={radius.lg} />
      </View>
    );
  }
  if (map.isError) {
    return (
      <View style={[styles.frame, styles.fallback]} testID="location-map-fallback">
        <LinearGradient
          colors={[colors.accentSoft, colors.surfaceMuted]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <IconBadge icon="location-outline" tint="blue" size={52} round />
        <Text variant="headline" heading align="center">
          {location.name || location.address || ''}
        </Text>
        {location.name && location.address ? (
          <Text variant="footnote" tone="secondary" align="center">
            {location.address}
          </Text>
        ) : null}
        <Text variant="footnote" tone="secondary" align="center">
          {t('content.mapUnavailable')}
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.frame} testID="location-map">
      <Image
        source={{ uri: map.data }}
        accessibilityLabel={t('content.mapTitle')}
        resizeMode="cover"
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: radius.lg, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 16 / 9 },
  fallback: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.xl,
  },
});
