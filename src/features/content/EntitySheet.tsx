import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { useDescribeError } from '@/core/i18n/describe-error';
import { space } from '@/shared/theme';
import type { Tint } from '@/shared/theme';
import { Banner, Button, Sheet, type IconName } from '@/shared/ui';

interface EntitySheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  icon?: IconName;
  tint?: Tint;
  size?: 'md' | 'lg';
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
  subtitle,
  icon,
  tint,
  size,
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
      {...(subtitle ? { subtitle } : {})}
      {...(icon ? { icon } : {})}
      {...(tint ? { tint } : {})}
      {...(size ? { size } : {})}
      footer={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          {onDelete ? (
            <Button
              testID={testID ? `${testID}-delete` : undefined}
              title={t('content.delete')}
              variant="ghost"
              onPress={onDelete}
            />
          ) : null}
          <View style={{ flex: 1 }} />
          <Button title={t('common.cancel')} variant="secondary" onPress={onClose} />
          <Button
            testID={testID ? `${testID}-submit` : undefined}
            title={submitLabel ?? t('common.save')}
            onPress={onSubmit}
            loading={isSubmitting}
          />
        </View>
      }
    >
      <View style={{ gap: space.xl }}>
        {error ? <Banner tone="danger" message={describe(error)} /> : null}
        {children}
      </View>
    </Sheet>
  );
}
