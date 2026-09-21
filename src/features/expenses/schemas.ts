import { z } from 'zod';

import { isCivilDate } from '@/core/datetime/civil-date';
import { parseMoneyInput } from '@/core/datetime/money';
import { optionalMoney, optionalText, requiredText } from '@/features/content/schemas';

import { CATEGORIES } from './summary';

export const EXPENSE_STATUSES = ['PLANNED', 'PAID'] as const;

export function expenseSchema(currency: string) {
  const filled = (value: string) => parseMoneyInput(value, currency) !== null;
  return (
    z
      .object({
        name: requiredText(200),
        category: z.enum(CATEGORIES as [string, ...string[]]),
        status: z.enum(EXPENSE_STATUSES),
        estimate: optionalMoney(currency),
        actual: optionalMoney(currency),
        date: z.string().refine((value) => value === '' || isCivilDate(value), {
          error: 'validation.dateInvalid',
        }),
        notes: optionalText(2000),
      })
      // Something planned needs the amount it is expected to cost; something paid, the amount paid
      // (which may be left blank to mean exactly the estimate).
      .refine((e) => e.status === 'PAID' || filled(e.estimate), {
        path: ['estimate'],
        error: 'validation.amountRequired',
      })
      .refine((e) => e.status === 'PLANNED' || filled(e.actual) || filled(e.estimate), {
        path: ['actual'],
        error: 'validation.amountRequired',
      })
  );
}
export type ExpenseFormValues = z.infer<ReturnType<typeof expenseSchema>>;
export const EXPENSE_FIELDS = [
  'name',
  'category',
  'status',
  'estimate',
  'actual',
  'date',
  'notes',
] as const;
export const EXPENSE_ALIASES = { link: 'name' } as const;

/** Every category of the budget form, the whole trip first. */
export const BUDGET_KEYS = ['TOTAL', ...CATEGORIES] as const;

export function budgetSchema(currency: string) {
  return z.object(
    Object.fromEntries(BUDGET_KEYS.map((key) => [key, optionalMoney(currency)])) as Record<
      (typeof BUDGET_KEYS)[number],
      ReturnType<typeof optionalMoney>
    >,
  );
}
export type BudgetFormValues = Record<(typeof BUDGET_KEYS)[number], string>;
