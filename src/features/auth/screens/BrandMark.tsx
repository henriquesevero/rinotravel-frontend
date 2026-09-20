import { StyleSheet, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { Icon } from '@/shared/ui/Icon';
import { Text } from '@/shared/ui/Text';
import { radius, space, useStyles, type Theme } from '@/shared/theme';

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.xxl },
    mark: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export function BrandMark() {
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <View style={styles.mark}>
        <Icon name="airplane" size={24} tone="onAccent" />
      </View>
      <Text variant="headline">{t('app.name')}</Text>
    </View>
  );
}
