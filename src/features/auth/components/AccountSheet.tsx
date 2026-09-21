import { StyleSheet, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { space, useTheme, type ThemePreference } from '@/shared/theme';
import { Avatar, Button, SegmentedControl, Sheet, Skeleton, Text } from '@/shared/ui';

import { useLogout, useMe } from '../hooks';

interface AccountSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function AccountSheet({ visible, onClose }: AccountSheetProps) {
  const { t } = useTranslation();
  const me = useMe();
  const logout = useLogout();
  const { preference, setPreference } = useTheme();

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t('auth.account.title')}
      footer={
        <Button
          title={t('auth.account.logout')}
          variant="secondary"
          onPress={() => logout.mutate()}
          loading={logout.isPending}
          fullWidth
          testID="logout"
        />
      }
    >
      {me.data ? (
        <View style={styles.identity}>
          <Avatar name={me.data.name} size={56} />
          <View style={styles.text}>
            <Text variant="headline">{me.data.name}</Text>
            <Text tone="secondary">{me.data.email}</Text>
          </View>
        </View>
      ) : (
        <Skeleton height={56} borderRadius={12} />
      )}
      <View style={styles.appearance}>
        <Text variant="footnote" tone="secondary" style={styles.appearanceLabel}>
          {t('auth.account.appearance')}
        </Text>
        <SegmentedControl<ThemePreference>
          testID="theme-preference"
          segments={[
            { value: 'light', label: t('auth.account.themeLight') },
            { value: 'dark', label: t('auth.account.themeDark') },
            { value: 'system', label: t('auth.account.themeSystem') },
          ]}
          value={preference}
          onChange={setPreference}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  text: { flex: 1, gap: 2 },
  appearance: { gap: space.sm, marginTop: space.xl },
  appearanceLabel: { fontWeight: '500' },
});
