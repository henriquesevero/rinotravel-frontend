import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useWatch } from 'react-hook-form';

import type { Expense, ExpenseCategory, ExpenseLink } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { newId } from '@/core/ids';
import { EntitySheet } from '@/features/content/EntitySheet';
import { fromMoney, toMoneyInput } from '@/features/content/mappers';
import { useEntityForm } from '@/features/content/use-entity-form';
import { space } from '@/shared/theme';
import {
  Button,
  Card,
  FieldRow,
  FormDateField,
  FormSection,
  FormSelectField,
  FormTextField,
  ListRow,
  useConfirm,
} from '@/shared/ui';

import { expenseHooks } from './hooks';
import { LinkPicker } from './LinkPicker';
import { targetKey, useLinkTargets } from './link-targets';
import {
  EXPENSE_ALIASES,
  EXPENSE_FIELDS,
  EXPENSE_STATUSES,
  expenseSchema,
  type ExpenseFormValues,
} from './schemas';
import { CATEGORIES } from './summary';

interface ExpenseSheetProps {
  tripId: string;
  visible: boolean;
  onClose: () => void;
  currency: string;
  expense?: Expense | undefined;
  /** The place a new expense starts out tied to, e.g. when it is added from that place. */
  defaultLink?: ExpenseLink | undefined;
}

/** A line of the trip's money: something already spent, or something meant to be bought. */
export function ExpenseSheet({
  tripId,
  visible,
  onClose,
  currency,
  expense,
  defaultLink,
}: ExpenseSheetProps) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const create = expenseHooks.useCreate(tripId);
  const update = expenseHooks.useUpdate(tripId);
  const remove = expenseHooks.useRemove(tripId);
  const { targets, byKey } = useLinkTargets(tripId);
  // `undefined`: the expense keeps the place it has (or the one it starts with). `null`: taken off.
  const [linkChange, setLinkChange] = useState<ExpenseLink | null | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);

  const schema = useMemo(() => expenseSchema(currency), [currency]);
  const defaults = useMemo<ExpenseFormValues>(
    () => ({
      name: expense?.name ?? '',
      category: expense?.category ?? 'OTHER',
      status: expense?.status ?? 'PLANNED',
      estimate: fromMoney(expense?.estimate),
      actual: fromMoney(expense?.actual),
      date: expense?.date ?? '',
      notes: expense?.notes ?? '',
    }),
    [expense],
  );
  const { form, error, fail, close, clearError } = useEntityForm<ExpenseFormValues>({
    schema,
    defaults,
    fields: EXPENSE_FIELDS,
    aliases: EXPENSE_ALIASES,
    onClose: () => {
      setLinkChange(undefined);
      setPickerOpen(false);
      onClose();
    },
  });
  const status = useWatch({ control: form.control, name: 'status' });

  const link = linkChange !== undefined ? linkChange : (expense?.link ?? defaultLink ?? null);
  const linked = link ? byKey.get(targetKey(link.type, link.id)) : undefined;

  const submit = form.handleSubmit(async (values) => {
    clearError();
    const estimate = toMoneyInput(values.estimate, currency);
    const paid = values.status === 'PAID';
    const body = {
      name: values.name,
      category: values.category as ExpenseCategory,
      status: values.status,
      estimate,
      // Paid with the amount left blank means exactly what was estimated.
      actual: paid ? (toMoneyInput(values.actual, currency) ?? estimate) : null,
      date: values.date === '' ? null : values.date,
      link,
      notes: values.notes,
    };
    try {
      if (expense) {
        await update.mutateAsync({ id: expense.id, baseVersion: expense.version, patch: body });
      } else {
        await create.mutateAsync({ id: newId(), ...body });
      }
      close();
    } catch (cause) {
      fail(cause);
    }
  });

  const askDelete = async () => {
    if (!expense) return;
    const confirmed = await confirm({
      title: t('content.deleteTitle'),
      message: t('content.deleteMessage', { name: expense.name }),
      confirmLabel: t('content.deleteConfirm'),
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await remove.mutateAsync(expense.id);
      close();
    } catch (cause) {
      fail(cause);
    }
  };

  const { control } = form;
  return (
    <>
      <EntitySheet
        icon="wallet-outline"
        tint="green"
        testID="expense-sheet"
        visible={visible}
        title={expense ? t('expenses.edit') : t('expenses.add')}
        onClose={close}
        onSubmit={() => void submit()}
        isSubmitting={create.isPending || update.isPending}
        error={error}
        {...(expense ? { onDelete: () => void askDelete() } : {})}
      >
        <FormSection title={t('content.sec.basic')}>
          <FormTextField
            control={control}
            name="name"
            label={t('expenses.name')}
            testID="expense-name"
          />
          <FieldRow>
            <FormSelectField
              control={control}
              name="category"
              label={t('expenses.category')}
              title={t('expenses.category')}
              options={CATEGORIES.map((value) => ({
                value,
                label: t(`enums.expenseCategory.${value}`),
              }))}
              testID="expense-category"
            />
            <FormSelectField
              control={control}
              name="status"
              label={t('expenses.status')}
              title={t('expenses.status')}
              options={EXPENSE_STATUSES.map((value) => ({
                value,
                label: t(`enums.expenseStatus.${value}`),
              }))}
              testID="expense-status"
            />
          </FieldRow>
        </FormSection>
        <FormSection title={t('detail.cost')}>
          <FieldRow>
            <FormTextField
              control={control}
              name="estimate"
              label={t('expenses.estimate')}
              hint={t('content.costHint', { currency })}
              keyboardType="decimal-pad"
              testID="expense-estimate"
            />
            {status === 'PAID' ? (
              <FormTextField
                control={control}
                name="actual"
                label={t('expenses.actual')}
                hint={t('expenses.actualHint')}
                keyboardType="decimal-pad"
                testID="expense-actual"
              />
            ) : (
              <View />
            )}
          </FieldRow>
        </FormSection>
        <FormSection title={t('expenses.where')}>
          <Card padded={false}>
            <ListRow
              testID="expense-link"
              icon="location-outline"
              tone={link ? 'primary' : 'secondary'}
              title={link ? (linked?.name ?? t('expenses.linkGone')) : t('expenses.noLink')}
              subtitle={link ? t(`expenses.linkType.${link.type}`) : undefined}
            />
          </Card>
          <View style={styles.actions}>
            <Button
              testID="expense-link-pick"
              title={link ? t('expenses.changeLink') : t('expenses.linkTo')}
              variant="secondary"
              icon="link-outline"
              size="sm"
              onPress={() => setPickerOpen(true)}
            />
            {link ? (
              <Button
                testID="expense-link-clear"
                title={t('expenses.removeLink')}
                variant="ghost"
                size="sm"
                onPress={() => setLinkChange(null)}
              />
            ) : null}
          </View>
          <FormDateField
            control={control}
            name="date"
            label={t('expenses.date')}
            testID="expense-date"
          />
        </FormSection>
        <FormSection title={t('content.sec.money')}>
          <FormTextField control={control} name="notes" label={t('content.notes')} multiline />
        </FormSection>
      </EntitySheet>
      <LinkPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        targets={targets}
        selected={link ? targetKey(link.type, link.id) : null}
        onPick={(target) => setLinkChange({ type: target.type, id: target.id })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
