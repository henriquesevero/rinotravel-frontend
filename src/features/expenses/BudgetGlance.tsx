import { useRouter } from 'expo-router';
import { View } from 'react-native';

import type { Trip } from '@/core/api';
import { formatMoney } from '@/core/datetime/money';
import { currentLocale, useTranslation } from '@/core/i18n';
import { space } from '@/shared/theme';
import { Card, Text } from '@/shared/ui';

import { BudgetBar } from './BudgetBar';
import { expenseHooks, limitHooks } from './hooks';
import { budgetLine, limitsByCategory, totalsOf } from './summary';

/** The trip's money at a glance for the overview: what it is set to cost and how far it has come. */
export function BudgetGlance({ trip }: { trip: Trip }) {
  const { t } = useTranslation();
  const router = useRouter();
  const expenses = expenseHooks.useList(trip.id);
  const limits = limitHooks.useList(trip.id);
  if (!expenses.data || !limits.data) return null;

  const locale = currentLocale();
  const totals = totalsOf(expenses.data, trip.currency);
  const limit = limitsByCategory(limits.data, trip.currency).get('TOTAL');
  // Nothing to say until there is a budget or a first expense.
  if (!limit && expenses.data.length === 0) return null;
  const line = limit ? budgetLine(limit.amount.amount, totals) : null;
  const money = (amount: number) => formatMoney(amount, trip.currency, locale);

  return (
    <Card
      testID="budget-glance"
      accessibilityLabel={t('expenses.title')}
      onPress={() => router.push({ pathname: '/trips/[id]/expenses', params: { id: trip.id } })}
    >
      <View style={{ gap: space.md }}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}
        >
          <Text variant="headline">{t('expenses.title')}</Text>
          <Text numeric variant="headline">
            {money(totals.forecast)}
            {limit ? (
              <Text tone="secondary" variant="callout">
                {`  ${t('expenses.of', { value: money(limit.amount.amount) })}`}
              </Text>
            ) : null}
          </Text>
        </View>
        {line ? <BudgetBar line={line} /> : null}
        <Text variant="footnote" tone={line?.state === 'over' ? 'danger' : 'secondary'} numeric>
          {`${t('expenses.spent')} ${money(totals.spent)} · ${t('expenses.planned')} ${money(totals.planned)}`}
          {line && line.remaining < 0
            ? ` · ${t('expenses.overBy', { value: money(-line.remaining) })}`
            : ''}
        </Text>
      </View>
    </Card>
  );
}
