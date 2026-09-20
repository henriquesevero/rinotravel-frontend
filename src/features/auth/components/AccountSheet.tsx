import { StyleSheet, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { space } from '@/shared/theme';
import { Avatar, Button, Sheet, Skeleton, Text } from '@/shared/ui';

import { useLogout, useMe } from '../hooks';

interface AccountSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function AccountSheet({ visible, onClose }: AccountSheetProps) {
  const { t } = useTranslation();
  const me = useMe();
  const logout = useLogout();

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
    </Sheet>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  text: { flex: 1, gap: 2 },
});
