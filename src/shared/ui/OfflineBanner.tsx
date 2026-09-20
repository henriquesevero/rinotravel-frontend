import { StyleSheet, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { useNetworkStatus } from '@/core/network/use-network-status';

import { contentMaxWidth, space } from '../theme';
import { Banner } from './Banner';

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const { t } = useTranslation();
  if (isOnline) return null;

  return (
    <View style={styles.wrap}>
      <Banner tone="warning" message={t('offline.banner')} testID="offline-banner" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
  },
});
