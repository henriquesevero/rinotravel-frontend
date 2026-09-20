import { StyleSheet, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { space, useTheme } from '../theme';
import { Icon } from './Icon';
import { Text } from './Text';

interface BrandMarkProps {
  /** Only the mark, for the collapsed sidebar. */
  compact?: boolean;
  /** White on the accent background, for the splash and the login brand panel. */
  inverted?: boolean;
  size?: number;
}

export function BrandMark({ compact = false, inverted = false, size = 40 }: BrandMarkProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.mark,
          { width: size, height: size, borderRadius: size * 0.3 },
          { backgroundColor: inverted ? 'rgba(255,255,255,0.18)' : colors.accent },
        ]}
      >
        <Icon name="airplane" size={size * 0.55} tone="onAccent" />
      </View>
      {compact ? null : (
        <Text
          variant="headline"
          tone={inverted ? 'onAccent' : 'primary'}
          style={{ fontSize: size * 0.45 }}
        >
          {t('app.name')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  mark: { alignItems: 'center', justifyContent: 'center' },
});
