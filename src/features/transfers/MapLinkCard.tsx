import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { radius, space, useStyles, type Theme } from '@/shared/theme';
import { Icon, Text } from '@/shared/ui';

import type { MapsRoute } from './maps';

export interface RouteMapProps {
  route: MapsRoute;
  /** Opens the same route in the maps app; shown when the map itself cannot be embedded. */
  googleUrl: string;
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      padding: space.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.accentSoft,
    },
    text: { flex: 1, gap: 2 },
  });

/** Stands in for the map on phones and wherever no embed key is configured. */
export function MapLinkCard({ googleUrl }: RouteMapProps) {
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  return (
    <Pressable
      testID="map-link-card"
      accessibilityRole="link"
      accessibilityLabel={t('transfers.detail.fallbackTitle')}
      onPress={() => void Linking.openURL(googleUrl)}
      style={styles.card}
    >
      <Icon name="map-outline" size={28} tone="accent" />
      <View style={styles.text}>
        <Text tone="accent" style={{ fontWeight: '600' }}>
          {t('transfers.detail.fallbackTitle')}
        </Text>
        <Text variant="footnote" tone="secondary">
          {t('transfers.detail.fallbackHint')}
        </Text>
      </View>
      <Icon name="open-outline" size={20} tone="accent" />
    </Pressable>
  );
}
