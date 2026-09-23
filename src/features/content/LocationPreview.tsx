import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Location } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { radius, space } from '@/shared/theme';
import { Button, IconBadge, Text } from '@/shared/ui';

import { LocationMap } from './LocationMap';

interface LocationPreviewProps {
  tripId: string;
  /** What the form holds so far, or null while there is nothing worth mapping. */
  location: Location | null;
  /** True when the place came from Google's suggestions: exact, so the map can appear at once. */
  exact: boolean;
  /** Computers show a placeholder beside the form; phones show nothing until there is a place. */
  wide: boolean;
}

/**
 * The map of the place being filled in. A place picked from Google's suggestions is drawn at once;
 * typed-in text may be half-written, so it waits for a tap instead of spending a lookup per key.
 */
export function LocationPreview({ tripId, location, exact, wide }: LocationPreviewProps) {
  const { t } = useTranslation();
  const [requested, setRequested] = useState(false);

  if (location && (exact || requested)) return <LocationMap tripId={tripId} location={location} />;
  if (location) {
    return (
      <Button
        testID="show-map"
        title={t('content.showMap')}
        variant="secondary"
        icon="map-outline"
        onPress={() => setRequested(true)}
      />
    );
  }
  if (!wide) return null;
  return (
    <View style={styles.placeholder} testID="map-placeholder">
      <IconBadge icon="map-outline" tint="blue" size={48} round />
      <Text variant="subhead" tone="secondary" align="center">
        {t('content.mapPlaceholder')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    padding: space.xl,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(37, 99, 235, 0.35)',
  },
});
