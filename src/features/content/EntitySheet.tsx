import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { useDescribeError } from '@/core/i18n/describe-error';
import { space } from '@/shared/theme';
import { Banner, Button, Sheet } from '@/shared/ui';

interface EntitySheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel?: string;
  /** Error of the last save that no field could show. */
  error?: unknown;
  /** Present when editing: shows a destructive action under the primary one. */
  onDelete?: () => void;
  children: ReactNode;
  testID?: string;
}

export function EntitySheet({
  visible,
  title,
  onClose,
  onSubmit,
  isSubmitting,
  submitLabel,
  error,
  onDelete,
  children,
  testID,
}: EntitySheetProps) {
  const { t } = useTranslation();
  const describe = useDescribeError();

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={title}
      footer={
        <View style={{ gap: space.sm }}>
          <Button
            testID={testID ? `${testID}-submit` : undefined}
            title={submitLabel ?? t('common.save')}
            onPress={onSubmit}
            loading={isSubmitting}
            fullWidth
          />
          {onDelete ? (
            <Button
              testID={testID ? `${testID}-delete` : undefined}
              title={t('content.delete')}
              variant="ghost"
              onPress={onDelete}
              fullWidth
            />
          ) : null}
        </View>
      }
    >
      <View style={{ gap: space.lg }}>
        {error ? <Banner tone="danger" message={describe(error)} /> : null}
        {children}
      </View>
    </Sheet>
  );
}
