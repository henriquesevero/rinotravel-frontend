import type { BudgetLimit, Expense, ExpenseCategory } from '@/core/api';

export const CATEGORIES: readonly ExpenseCategory[] = [
  'FOOD',
  'LODGING',
  'TRANSPORT',
  'ACTIVITIES',
  'SOUVENIRS',
  'CLOTHES',
  'ELECTRONICS',
  'OTHER',
];

export interface Totals {
  /** Money already paid. */
  spent: number;
  /** Estimates of what is still to be bought or paid. */
  planned: number;
  /** What the trip is expected to cost in the end: spent plus planned. */
  forecast: number;
  /** Lines counted. */
  count: number;
  /** Lines in another currency than the trip's, left out of the sums above. */
  foreign: number;
}

const empty = (): Totals => ({ spent: 0, planned: 0, forecast: 0, count: 0, foreign: 0 });

/** What a line counts for: the amount paid once it is paid, the estimate until then. */
export function amountOf(expense: Expense): { amount: number; currency: string } | null {
  const money = expense.status === 'PAID' ? (expense.actual ?? expense.estimate) : expense.estimate;
  return money ? { amount: money.amount, currency: money.currency } : null;
}

/** Sums lines in the trip's currency; a line in another currency is counted apart, never mixed in. */
export function totalsOf(expenses: Expense[], currency: string): Totals {
  const totals = empty();
  for (const expense of expenses) {
    const value = amountOf(expense);
    if (!value) continue;
    if (value.currency !== currency) {
      totals.foreign += 1;
      continue;
    }
    totals.count += 1;
    if (expense.status === 'PAID') totals.spent += value.amount;
    else totals.planned += value.amount;
  }
  totals.forecast = totals.spent + totals.planned;
  return totals;
}

export function byCategory(expenses: Expense[], currency: string): Map<ExpenseCategory, Totals> {
  const groups = new Map<ExpenseCategory, Expense[]>();
  for (const expense of expenses) {
    groups.set(expense.category, [...(groups.get(expense.category) ?? []), expense]);
  }
  return new Map([...groups].map(([category, list]) => [category, totalsOf(list, currency)]));
}

/** The key a line hangs under: the record it is tied to, or `none`. */
export function linkKey(expense: Expense): string {
  return expense.link ? `${expense.link.type}:${expense.link.id}` : 'none';
}

export function groupByLink(expenses: Expense[]): Map<string, Expense[]> {
  const groups = new Map<string, Expense[]>();
  for (const expense of expenses) {
    const key = linkKey(expense);
    groups.set(key, [...(groups.get(key) ?? []), expense]);
  }
  return groups;
}

export type BudgetState = 'none' | 'ok' | 'close' | 'over';

export interface BudgetLine {
  limit: number;
  totals: Totals;
  /** What is left once everything planned is paid; negative when the plan already goes over. */
  remaining: number;
  /** Share of the limit already spent and share planned on top of it, each between 0 and 1. */
  spentShare: number;
  plannedShare: number;
  state: BudgetState;
}

/**
 * Where a limit stands. `close` is when the forecast reaches 90% of it, early enough to change the plan;
 * `over` is when the forecast already passes it.
 */
export function budgetLine(limit: number, totals: Totals): BudgetLine {
  const spentShare = limit > 0 ? Math.min(1, totals.spent / limit) : 0;
  const forecastShare = limit > 0 ? Math.min(1, totals.forecast / limit) : 0;
  const state: BudgetState =
    limit <= 0
      ? 'none'
      : totals.forecast > limit
        ? 'over'
        : totals.forecast >= limit * 0.9
          ? 'close'
          : 'ok';
  return {
    limit,
    totals,
    remaining: limit - totals.forecast,
    spentShare,
    plannedShare: Math.max(0, forecastShare - spentShare),
    state,
  };
}

/** The limits by category (`TOTAL` for the whole trip), in the trip's currency only. */
export function limitsByCategory(
  limits: BudgetLimit[],
  currency: string,
): Map<string, BudgetLimit> {
  return new Map(
    limits.filter((limit) => limit.amount.currency === currency).map((l) => [l.category, l]),
  );
}
