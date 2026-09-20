import { StyleSheet, View } from 'react-native';

import { env } from '@/core/config/env';
import { currentLocale, useTranslation } from '@/core/i18n';
import { radius } from '@/shared/theme';

import { MapLinkCard, type RouteMapProps } from './MapLinkCard';
import { embedUrl } from './maps';

/** An interactive Google map with the route drawn, free and unlimited through the Embed API. */
export function RouteMap(props: RouteMapProps) {
  const { t } = useTranslation();
  if (env.googleEmbedKey === '') return <MapLinkCard {...props} />;

  return (
    <View style={styles.frame} testID="route-map">
      <iframe
        title={t('transfers.detail.mapTitle')}
        src={embedUrl(env.googleEmbedKey, props.route, currentLocale())}
        loading="lazy"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        style={{ border: 0, width: '100%', height: '100%' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: 340, borderRadius: radius.lg, overflow: 'hidden' },
});
