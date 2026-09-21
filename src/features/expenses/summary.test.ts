import type { BudgetLimit, Expense } from '@/core/api';

import { budgetLine, byCategory, groupByLink, limitsByCategory, totalsOf } from './summary';

const base = {
  tripId: 't',
  version: 1,
  createdAt: '2027-01-01T00:00:00Z',
  updatedAt: '2027-01-01T00:00:00Z',
};
const expense = (over: Partial<Expense> & Pick<Expense, 'id' | 'category' | 'status'>): Expense =>
  ({ ...base, name: over.id, ...over }) as Expense;
const usd = (amount: number) => ({ amount, currency: 'USD' });

describe('totalsOf', () => {
  const list = [
    expense({ id: 'a', category: 'FOOD', status: 'PAID', actual: usd(2500), estimate: usd(3000) }),
    expense({ id: 'b', category: 'ELECTRONICS', status: 'PLANNED', estimate: usd(34999) }),
    expense({ id: 'c', category: 'CLOTHES', status: 'PLANNED', estimate: usd(8000) }),
  ];

  it('counts what was paid at what was paid and the rest at its estimate', () => {
    expect(totalsOf(list, 'USD')).toEqual({
      spent: 2500,
      planned: 42999,
      forecast: 45499,
      count: 3,
      foreign: 0,
    });
  });

  it('keeps another currency out of the sums and says how many were left out', () => {
    const mixed = [
      ...list,
      expense({
        id: 'd',
        category: 'FOOD',
        status: 'PAID',
        actual: { amount: 9000, currency: 'BRL' },
      }),
    ];
    const totals = totalsOf(mixed, 'USD');
    expect(totals.spent).toBe(2500);
    expect(totals.foreign).toBe(1);
  });

  it('is empty for nothing', () => {
    expect(totalsOf([], 'USD')).toEqual({
      spent: 0,
      planned: 0,
      forecast: 0,
      count: 0,
      foreign: 0,
    });
  });
});

describe('grouping', () => {
  const store = { type: 'place', id: '0190a1b2-0000-7000-8000-000000000001' } as const;
  const list = [
    expense({
      id: 'a',
      category: 'ELECTRONICS',
      status: 'PLANNED',
      estimate: usd(100),
      link: store,
    }),
    expense({ id: 'b', category: 'SOUVENIRS', status: 'PLANNED', estimate: usd(50), link: store }),
    expense({ id: 'c', category: 'FOOD', status: 'PAID', actual: usd(20) }),
  ];

  it('gathers what is bought at one place, and what is tied to none', () => {
    const groups = groupByLink(list);
    expect(groups.get(`place:${store.id}`)?.map((e) => e.id)).toEqual(['a', 'b']);
    expect(groups.get('none')?.map((e) => e.id)).toEqual(['c']);
  });

  it('totals each category apart', () => {
    const categories = byCategory(list, 'USD');
    expect(categories.get('ELECTRONICS')?.planned).toBe(100);
    expect(categories.get('FOOD')?.spent).toBe(20);
    expect(categories.has('CLOTHES')).toBe(false);
  });
});

describe('budgetLine', () => {
  const totals = (spent: number, planned: number) => ({
    spent,
    planned,
    forecast: spent + planned,
    count: 1,
    foreign: 0,
  });

  it('shows how much is spent, how much is planned on top, and what is left', () => {
    const line = budgetLine(100000, totals(20000, 30000));
    expect(line).toMatchObject({ remaining: 50000, spentShare: 0.2, state: 'ok' });
    expect(line.plannedShare).toBeCloseTo(0.3);
  });

  it('warns when the forecast nears the limit and when it passes it', () => {
    expect(budgetLine(100000, totals(20000, 70000)).state).toBe('close');
    expect(budgetLine(100000, totals(20000, 80001)).state).toBe('over');
    expect(budgetLine(100000, totals(120000, 0))).toMatchObject({ state: 'over', spentShare: 1 });
    expect(budgetLine(100000, totals(120000, 0)).remaining).toBe(-20000);
  });

  it('has no state without a limit', () => {
    expect(budgetLine(0, totals(100, 0)).state).toBe('none');
  });
});

describe('limitsByCategory', () => {
  it('reads limits by category and ignores those in another currency', () => {
    const limits = [
      { ...base, id: 'x', category: 'TOTAL', amount: usd(500000) },
      { ...base, id: 'y', category: 'FOOD', amount: { amount: 1, currency: 'BRL' } },
    ] as BudgetLimit[];
    const map = limitsByCategory(limits, 'USD');
    expect(map.get('TOTAL')?.amount.amount).toBe(500000);
    expect(map.has('FOOD')).toBe(false);
  });
});
