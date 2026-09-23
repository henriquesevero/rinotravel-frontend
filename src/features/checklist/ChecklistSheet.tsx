import { useMemo } from 'react';

import type { ChecklistItem } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { newId } from '@/core/ids';
import { EntitySheet } from '@/features/content/EntitySheet';
import { useEntityForm } from '@/features/content/use-entity-form';
import { FieldRow, FormSection, FormSelectField, FormTextField, useConfirm } from '@/shared/ui';

import { checklistHooks } from './hooks';
import {
  CATEGORIES,
  checklistItemSchema,
  CHECKLIST_ITEM_FIELDS,
  type ChecklistItemFormValues,
} from './schemas';

interface ChecklistSheetProps {
  tripId: string;
  visible: boolean;
  onClose: () => void;
  item?: ChecklistItem | undefined;
}

/** One thing to pack or do before the trip: a title, a category to group it and how many. Typed in
 * by a person; nothing here is suggested automatically. */
export function ChecklistSheet({ tripId, visible, onClose, item }: ChecklistSheetProps) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const create = checklistHooks.useCreate(tripId);
  const update = checklistHooks.useUpdate(tripId);
  const remove = checklistHooks.useRemove(tripId);

  const defaults = useMemo<ChecklistItemFormValues>(
    () => ({
      title: item?.title ?? '',
      category: item?.category ?? 'OTHER',
      quantity: String(item?.quantity ?? 1),
      notes: item?.notes ?? '',
    }),
    [item],
  );
  const { form, error, fail, close, clearError } = useEntityForm<ChecklistItemFormValues>({
    schema: checklistItemSchema,
    defaults,
    fields: CHECKLIST_ITEM_FIELDS,
    onClose,
  });

  const submit = form.handleSubmit(async (values) => {
    clearError();
    const body = {
      title: values.title,
      category: values.category,
      quantity: Number(values.quantity),
      notes: values.notes,
    };
    try {
      if (item) {
        await update.mutateAsync({ id: item.id, baseVersion: item.version, patch: body });
      } else {
        await create.mutateAsync({ id: newId(), ...body });
      }
      close();
    } catch (cause) {
      fail(cause);
    }
  });

  const askDelete = async () => {
    if (!item) return;
    const confirmed = await confirm({
      title: t('content.deleteTitle'),
      message: t('content.deleteMessage', { name: item.title }),
      confirmLabel: t('content.deleteConfirm'),
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await remove.mutateAsync(item.id);
      close();
    } catch (cause) {
      fail(cause);
    }
  };

  const { control } = form;
  return (
    <EntitySheet
      icon="checkbox-outline"
      tint="teal"
      testID="checklist-sheet"
      visible={visible}
      title={item ? t('checklist.edit') : t('checklist.add')}
      onClose={close}
      onSubmit={() => void submit()}
      isSubmitting={create.isPending || update.isPending}
      error={error}
      {...(item ? { onDelete: () => void askDelete() } : {})}
    >
      <FormSection title={t('content.sec.basic')}>
        <FormTextField
          control={control}
          name="title"
          label={t('checklist.itemTitle')}
          testID="checklist-title"
        />
        <FieldRow>
          <FormSelectField
            control={control}
            name="category"
            label={t('checklist.category')}
            title={t('checklist.category')}
            options={CATEGORIES.map((value) => ({
              value,
              label: t(`enums.checklistCategory.${value}`),
            }))}
            testID="checklist-category"
          />
          <FormTextField
            control={control}
            name="quantity"
            label={t('checklist.quantity')}
            keyboardType="number-pad"
            testID="checklist-quantity"
          />
        </FieldRow>
      </FormSection>
      <FormSection title={t('content.notes')}>
        <FormTextField control={control} name="notes" label={t('content.notes')} multiline />
      </FormSection>
    </EntitySheet>
  );
}
