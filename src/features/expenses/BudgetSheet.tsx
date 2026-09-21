import { useMemo } from 'react';

import type { BudgetLimit } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { newId } from '@/core/ids';
import { EntitySheet } from '@/features/content/EntitySheet';
import { fromMoney, toMoneyInput } from '@/features/content/mappers';
import { useEntityForm } from '@/features/content/use-entity-form';
import { FieldRow, FormSection, FormTextField } from '@/shared/ui';

import { limitHooks } from './hooks';
import { BUDGET_KEYS, budgetSchema, type BudgetFormValues } from './schemas';
import { CATEGORIES, limitsByCategory } from './summary';

interface BudgetSheetProps {
  tripId: string;
  visible: boolean;
  onClose: () => void;
  currency: string;
  limits: BudgetLimit[];
}

/** The most the whole trip, and optionally each kind of spending, should cost. Blank means no limit. */
export function BudgetSheet({ tripId, visible, onClose, currency, limits }: BudgetSheetProps) {
  const { t } = useTranslation();
  const create = limitHooks.useCreate(tripId);
  const update = limitHooks.useUpdate(tripId);
  const remove = limitHooks.useRemove(tripId);
  const current = useMemo(() => limitsByCategory(limits, currency), [limits, currency]);

  const schema = useMemo(() => budgetSchema(currency), [currency]);
  const defaults = useMemo<BudgetFormValues>(
    () =>
      Object.fromEntries(
        BUDGET_KEYS.map((key) => [key, fromMoney(current.get(key)?.amount)]),
      ) as BudgetFormValues,
    [current],
  );
  const { form, error, fail, close, clearError } = useEntityForm<BudgetFormValues>({
    schema,
    defaults,
    fields: BUDGET_KEYS,
    onClose,
  });

  const submit = form.handleSubmit(async (values) => {
    clearError();
    try {
      // One limit per category: set the ones that were filled, change the ones that moved, drop the cleared.
      for (const key of BUDGET_KEYS) {
        const money = toMoneyInput(values[key], currency);
        const existing = current.get(key);
        if (money && !existing) {
          await create.mutateAsync({ id: newId(), category: key, amount: money });
        } else if (money && existing && existing.amount.amount !== money.amount) {
          await update.mutateAsync({
            id: existing.id,
            baseVersion: existing.version,
            patch: { amount: money },
          });
        } else if (!money && existing) {
          await remove.mutateAsync(existing.id);
        }
      }
      close();
    } catch (cause) {
      fail(cause);
    }
  });

  const { control } = form;
  const pairs = CATEGORIES.reduce<(typeof CATEGORIES)[number][][]>((rows, category, index) => {
    if (index % 2 === 0) rows.push([category]);
    else rows[rows.length - 1]?.push(category);
    return rows;
  }, []);

  return (
    <EntitySheet
      icon="wallet-outline"
      tint="green"
      testID="budget-sheet"
      visible={visible}
      title={t('expenses.editBudget')}
      onClose={close}
      onSubmit={() => void submit()}
      isSubmitting={create.isPending || update.isPending || remove.isPending}
      error={error}
    >
      <FormSection title={t('expenses.budgetTotal')} description={t('expenses.budgetHint')}>
        <FormTextField
          control={control}
          name="TOTAL"
          label={t('expenses.budgetTotal')}
          hint={t('content.costHint', { currency })}
          keyboardType="decimal-pad"
          testID="budget-total"
        />
      </FormSection>
      <FormSection title={t('expenses.budgetCategories')}>
        {pairs.map((pair) => (
          <FieldRow key={pair.join()}>
            {pair.map((category) => (
              <FormTextField
                key={category}
                control={control}
                name={category}
                label={t(`enums.expenseCategory.${category}`)}
                keyboardType="decimal-pad"
                testID={`budget-${category}`}
              />
            ))}
          </FieldRow>
        ))}
      </FormSection>
    </EntitySheet>
  );
}
