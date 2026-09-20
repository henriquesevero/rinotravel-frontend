import { useRouter } from 'expo-router';

import { useTranslation } from '@/core/i18n';
import { Button, EmptyState, Screen } from '@/shared/ui';

export default function NotFound() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Screen>
      <EmptyState icon="compass-outline" title={t('notFound.title')} />
      <Button title={t('notFound.action')} onPress={() => router.replace('/')} fullWidth />
    </Screen>
  );
}
